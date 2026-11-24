/**
 * Two-phase reads for the offline (ON) path (README §3.3): the cached page first, then the
 * server page, then exactly one terminal. Never used with offline off, where every list keeps
 * today's single Promise-form fetch.
 *
 * One listener object carries every per-entity callback name the SDK may call
 * (`onCachedUsers` / `onServerGroups` / …), so the same reader serves messages, conversations,
 * users, groups, group members and banned members. The SDK still returns its Promise alongside
 * the listener and rejects it offline; it is caught and ignored, because the listener is the
 * channel.
 *
 * @internal
 */
import { isNotConnectedError } from "./reconcile";
import { isOfflineOn } from "./gate";

export interface TwoPhaseHandlers<T> {
  onCached(page: T[]): void;
  onServer(page: T[]): void;
  /** `notConnected` = an offline read past the cache: keep what is shown. */
  onError(error: unknown, notConnected: boolean): void;
}

const ENTITY_SUFFIXES = [
  "Messages",
  "Conversations",
  "Users",
  "Groups",
  "GroupMembers",
  "BannedGroupMembers",
  "Reactions",
  "FeedItems",
  "NotificationFeedItems",
  "Threads",
];

/**
 * Run `request.fetchNext(listener)` (or `fetchPrevious`) two-phase. Resolves once the terminal
 * phase (server page or error) has been handled; never rejects. A `stale()` check, evaluated at
 * each phase, drops callbacks of an operation that a newer one (or a logout) superseded.
 */
export function fetchTwoPhase<T>(
  request: any,
  direction: "next" | "previous",
  handlers: TwoPhaseHandlers<T>,
  stale: () => boolean = () => false
): Promise<void> {
  return new Promise<void>((resolve) => {
    let ended = false;
    const end = () => {
      if (!ended) {
        ended = true;
        resolve();
      }
    };
    const onCached = (page: T[]) => {
      if (ended || stale()) return;
      handlers.onCached(Array.isArray(page) ? page : []);
    };
    const onServer = (page: T[]) => {
      if (ended) return;
      if (!stale()) handlers.onServer(Array.isArray(page) ? page : []);
      end();
    };
    const onError = (error: unknown) => {
      if (ended) return;
      if (!stale()) handlers.onError(error, isNotConnectedError(error));
      end();
    };
    const listener: Record<string, Function> = { onError };
    for (const suffix of ENTITY_SUFFIXES) {
      listener[`onCached${suffix}`] = onCached;
      listener[`onServer${suffix}`] = onServer;
    }
    try {
      const run = direction === "previous" ? request?.fetchPrevious : request?.fetchNext;
      if (typeof run !== "function") {
        onError(new Error("request has no fetch method"));
        return;
      }
      const result: any = run.call(request, listener);
      if (result && typeof result.then === "function") result.then(undefined, (error: unknown) => onError(error));
    } catch (error) {
      onError(error);
    }
  });
}

/**
 * Apply a snapshot list's server page over what its cached page showed: server copies replace
 * cached ones in place, cached rows the server no longer returns are dropped, new rows are
 * appended. Rows of other pages stay.
 */
export function mergeSnapshotPage<T>(current: readonly T[], cachedKeys: ReadonlySet<string>, page: readonly T[], keyOf: (item: T) => string): T[] {
  const serverByKey = new Map(page.map((item) => [keyOf(item), item] as const));
  const next: T[] = [];
  const seen = new Set<string>();
  for (const item of current) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    const fresh = serverByKey.get(key);
    if (fresh !== undefined) {
      next.push(fresh);
      seen.add(key);
      continue;
    }
    if (cachedKeys.has(key)) continue;
    next.push(item);
    seen.add(key);
  }
  for (const item of page) {
    const key = keyOf(item);
    if (!seen.has(key)) {
      next.push(item);
      seen.add(key);
    }
  }
  return next;
}

/** Append `page` to `current`, skipping keys already shown (cached page of a later page). */
export function appendUnique<T>(current: readonly T[], page: readonly T[], keyOf: (item: T) => string): T[] {
  const seen = new Set(current.map(keyOf));
  const next = current.slice();
  for (const item of page) {
    const key = keyOf(item);
    if (!seen.has(key)) {
      next.push(item);
      seen.add(key);
    }
  }
  return next;
}

export interface SingleTwoPhaseHandlers<T> {
  /** Fires only on a cache hit. */
  onCached?(item: T): void;
  onServer(item: T): void;
  onError(error: unknown, notConnected: boolean): void;
}

/**
 * A two-phase single read (`getMessageDetails(id, listener)`, `getConversation(with, type,
 * listener)`; BEH-READ-28/32/35): the cached copy on a hit, then the server copy, then exactly
 * one terminal. `run` calls the SDK with the listener; its returned Promise is caught and only
 * used as a terminal when the listener gave none. Never rejects.
 */
export function getTwoPhase<T>(
  run: (listener: Record<string, Function>) => unknown,
  entity: "Message" | "Conversation",
  handlers: SingleTwoPhaseHandlers<T>,
  stale: () => boolean = () => false
): Promise<void> {
  return new Promise<void>((resolve) => {
    let ended = false;
    const end = () => {
      if (!ended) {
        ended = true;
        resolve();
      }
    };
    const onServer = (item: T) => {
      if (ended) return;
      if (!stale()) handlers.onServer(item);
      end();
    };
    const onError = (error: unknown) => {
      if (ended) return;
      if (!stale()) handlers.onError(error, isNotConnectedError(error));
      end();
    };
    const listener: Record<string, Function> = {
      [`onCached${entity}`]: (item: T | undefined) => {
        if (ended || stale() || item === undefined || item === null) return;
        handlers.onCached?.(item);
      },
      [`onServer${entity}`]: onServer,
      onError,
    };
    try {
      const result: any = run(listener);
      if (result && typeof result.then === "function") {
        result.then(
          (value: T) => {
            // An SDK that ignored the listener still answers through its Promise.
            if (!ended) onServer(value);
          },
          (error: unknown) => onError(error)
        );
      }
    } catch (error) {
      onError(error);
    }
  });
}

export interface AroundReadHandlers<M> {
  /**
   * Show the anchored window: the target and the page after it. `phase` is "cached" for the
   * first paint from the device, "server" for the server's copy (which replaces it).
   */
  onPaint(target: M, next: M[], phase: "cached" | "server"): void;
  /** Nothing could be shown: `notConnected` = offline with the target not cached. */
  onError(error: unknown, notConnected: boolean): void;
  /**
   * The cached window is on screen (painted) and the server's answer failed: the rows stay, and
   * the caller reports the error once (D83 rule 2).
   */
  onKeptRowsError?(error: unknown): void;
}

/**
 * Jump to a message / start from the first unread on the offline (ON) path (BEH-READ-29,
 * UIT-READ-08/09): the target (`getMessageDetails`) and the page after it (`fetchNext` anchored
 * on it), both two-phase. The cached pair paints first when both are on the device; the server
 * pair replaces it. Offline, a cached pair stays on screen with no error; a target that was never
 * cached ends with `onError(..., true)`. Resolves when both reads ended; never rejects.
 */
export function readAroundTwoPhase<M>(
  getTarget: (listener: Record<string, Function>) => unknown,
  nextRequest: any,
  handlers: AroundReadHandlers<M>,
  stale: () => boolean = () => false
): Promise<void> {
  let cachedTarget: M | undefined;
  let serverTarget: M | undefined;
  let targetError: unknown;
  let nextError: unknown;
  let cachedNext: M[] | undefined;
  let serverNext: M[] | undefined;
  let targetDone = false;
  let nextDone = false;
  let paintedCached = false;
  let finished = false;

  const step = () => {
    if (finished || stale()) return;
    if (!paintedCached && cachedTarget !== undefined && (cachedNext !== undefined || nextDone)) {
      paintedCached = true;
      handlers.onPaint(cachedTarget, cachedNext ?? serverNext ?? [], "cached");
    }
    if (!targetDone || !nextDone) return;
    finished = true;
    if (serverTarget !== undefined && serverNext !== undefined) {
      handlers.onPaint(serverTarget, serverNext, "server");
      return;
    }
    if (paintedCached) {
      // Past the server: keep the cached window, and say the server read failed.
      handlers.onKeptRowsError?.(targetError ?? nextError);
      return;
    }
    const target = serverTarget ?? cachedTarget;
    if (target === undefined) {
      handlers.onError(targetError, isNotConnectedError(targetError));
      return;
    }
    handlers.onPaint(target, serverNext ?? cachedNext ?? [], serverTarget !== undefined && serverNext !== undefined ? "server" : "cached");
  };

  const target = getTwoPhase<M>(
    getTarget,
    "Message",
    {
      onCached: (m) => {
        cachedTarget = m;
        step();
      },
      onServer: (m) => {
        if (m === undefined || m === null) targetError = new Error("message not found");
        else serverTarget = m;
      },
      onError: (error) => {
        targetError = error;
      },
    },
    stale
  ).then(() => {
    targetDone = true;
    step();
  });
  const next = fetchTwoPhase<M>(
    nextRequest,
    "next",
    {
      onCached: (page) => {
        cachedNext = page;
        step();
      },
      onServer: (page) => {
        serverNext = page;
      },
      onError: (error) => {
        // the cached page (if any) stays; the target decides what is shown
        nextError = error;
      },
    },
    stale
  ).then(() => {
    nextDone = true;
    step();
  });
  return Promise.all([target, next]).then(() => undefined);
}

/**
 * A two-phase single read for a caller that needs one value (an anchor id, an unread count): the
 * server copy when the server answers; offline (not-connected), the cached copy when there was a
 * hit; otherwise the error, as the Promise form would give it (UIT-LIFE-11: a chat opened by id
 * offline opens from the cache, or shows today's error when it was never cached).
 */
export function resolveTwoPhase<T>(run: (listener: Record<string, Function>) => unknown, entity: "Message" | "Conversation"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let cached: T | undefined;
    getTwoPhase<T>(run, entity, {
      onCached: (item) => {
        cached = item;
      },
      onServer: (item) => resolve(item),
      onError: (error, notConnected) => {
        if (notConnected && cached !== undefined) resolve(cached);
        else reject(error);
      },
    });
  });
}

export interface ListPage<T> {
  rows: T[];
  /** Offline past the cache: the rows (possibly none) are the device's; more needs a connection. */
  offline: boolean;
  /** With `offline`: the not-connected error the server read ended with (D83: reported to `onError`). */
  error?: unknown;
  /** With `offline`: the SDK gave a cached phase (possibly empty) before the error. */
  cachedDelivered?: boolean;
}

/**
 * One page of a panel list (pinned, saved, reactions, notification feed; README §3.9 U6). The gate
 * is read once for the read. Offline OFF: today's Promise-form fetch, unchanged. Offline ON: the
 * SDK's two-phase read: the server page when it answers, otherwise (not connected) the cached
 * page with `offline: true`, so the panel shows what the device has instead of an error. Any
 * other error rejects as today. `onCached` lets a panel paint the cached page first.
 */
export function readListPage<T>(
  request: any,
  direction: "next" | "previous",
  options: { onCached?(rows: T[]): void } = {}
): Promise<ListPage<T>> {
  if (!isOfflineOn()) {
    const run = direction === "previous" ? request?.fetchPrevious : request?.fetchNext;
    return Promise.resolve(run.call(request)).then((rows: T[]) => ({ rows: Array.isArray(rows) ? rows : [], offline: false }));
  }
  return new Promise<ListPage<T>>((resolve, reject) => {
    let cached: T[] | null = null;
    fetchTwoPhase<T>(request, direction, {
      onCached: (rows) => {
        cached = rows;
        try {
          options.onCached?.(rows);
        } catch {
          /* a paint error must not break the read */
        }
      },
      onServer: (rows) => resolve({ rows, offline: false }),
      onError: (error, notConnected) => {
        if (notConnected) resolve({ rows: cached ?? [], offline: true, error, cachedDelivered: cached !== null });
        else reject(error);
      },
    });
  });
}
