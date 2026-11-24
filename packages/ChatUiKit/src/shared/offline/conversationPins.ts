/**
 * Remote conversation pins on the conversation list's offline (ON) path (UIK-CONV-01,
 * BEH-CPIN-09): a pin or unpin made on the user's other device or by an admin, delivered by the
 * SDK's `ConversationListener` through the hub.
 *
 * - Matched to a row by (conversation type, uid/guid), case-insensitive.
 * - A 1:1 event whose peer is the logged-in user is ignored (it names no chat on this list).
 * - A row on screen keeps everything it has (the payload may be compact: no last message, no
 *   unread count) and takes only the pin attributes, then moves to its ordered place.
 * - A pinned chat not on screen is fetched (`getConversation`) and inserted; a failed fetch is
 *   ignored. A filtered, searched or `pinnedBy` list only updates the rows it shows.
 * - Own pins never come here: the acting device learns from the pin call's `onSuccess`.
 *
 * Nothing here runs with offline off: the caller reads the gate per event.
 *
 * @internal
 */
import { isOfflineOn } from "./gate";
import { OfflineHub } from "./OfflineHub";

export interface RemotePinTarget {
  type: string;
  with: string;
}

export interface RemotePinOps {
  /** The rows the list shows now. */
  rows(): readonly any[];
  /** Put a row at its ordered place (insert, move or update in place). */
  place(row: any): void;
  /** A copy of a row that keeps its prototype (the kit's `CommonUtils.clone`). */
  clone(row: any): any;
  loggedInUid(): string | undefined;
  /** A filtered, searched or `pinnedBy` list: never inserts a chat it did not fetch itself. */
  filtered(): boolean;
  fetchConversation(withId: string, type: string): Promise<any>;
  /** The session or list changed since the event arrived: drop a late fetch. */
  stale(): boolean;
}

function call(target: any, name: string): any {
  try {
    const fn = target?.[name];
    return typeof fn === "function" ? fn.call(target) : undefined;
  } catch {
    return undefined;
  }
}

/** (type, uid/guid) of a conversation, both lower-cased; `null` when it names no chat. */
export function remotePinTargetOf(conversation: any): RemotePinTarget | null {
  const type = call(conversation, "getConversationType") ?? conversation?.conversationType;
  const other = call(conversation, "getConversationWith") ?? conversation?.conversationWith;
  if (typeof type !== "string" || !type || !other) return null;
  const lowerType = type.toLowerCase();
  const raw = lowerType === "group" ? call(other, "getGuid") ?? other.guid : call(other, "getUid") ?? other.uid;
  if (raw === undefined || raw === null || raw === "") return null;
  return { type: lowerType, with: String(raw).toLowerCase() };
}

function sameChat(a: RemotePinTarget | null, b: RemotePinTarget | null): boolean {
  return !!a && !!b && a.type === b.type && a.with === b.with;
}

function findRow(rows: readonly any[], target: RemotePinTarget): any {
  return rows.find((row) => sameChat(remotePinTargetOf(row), target));
}

/** Copy the event's pin attributes onto `row` (a clone). */
function withPin(row: any, event: any, pinned: boolean): any {
  if (pinned) {
    const pinnedAt = call(event, "getPinnedAt") ?? Math.floor(Date.now() / 1000);
    row.setPinnedAt?.(pinnedAt);
    row.setPinnedBy?.(call(event, "getPinnedBy"));
  } else {
    row.setPinnedAt?.(undefined);
    row.setPinnedBy?.(undefined);
  }
  return row;
}

/**
 * Apply one remote pin / unpin. Returns the fetch's Promise when a chat not on screen is fetched
 * (it never rejects), else `undefined`.
 */
export function applyRemoteConversationPin(event: any, pinned: boolean, ops: RemotePinOps): Promise<void> | undefined {
  const target = remotePinTargetOf(event);
  if (!target) return undefined;
  const me = ops.loggedInUid();
  if (target.type === "user" && me && target.with === String(me).toLowerCase()) return undefined;

  const shown = findRow(ops.rows(), target);
  if (shown) {
    ops.place(withPin(ops.clone(shown), event, pinned));
    return undefined;
  }
  // Not on screen. An unpinned chat that is not shown has nowhere it must appear; a filtered
  // list only updates rows it shows.
  if (!pinned || ops.filtered()) return undefined;
  const original = call(call(event, "getConversationWith"), target.type === "group" ? "getGuid" : "getUid");
  let fetched: Promise<any>;
  try {
    fetched = ops.fetchConversation(String(original ?? target.with), target.type);
  } catch {
    return undefined;
  }
  if (!fetched || typeof fetched.then !== "function") return undefined;
  return fetched.then(
    (conversation: any) => {
      if (ops.stale() || !conversation) return;
      // It may have arrived on screen meanwhile (a message, a sync page): merge into that row.
      // Otherwise the server's copy is authoritative (it may have been unpinned since).
      const nowShown = findRow(ops.rows(), target);
      ops.place(nowShown ? withPin(ops.clone(nowShown), event, true) : conversation);
    },
    () => undefined
  );
}

/**
 * The conversation list's handler for one hub `conversationPin$` event: drops an event of an
 * older session, reads the gate once for it (offline off: ignored, as the release before it did)
 * and applies it. Returns what {@link applyRemoteConversationPin} returns.
 */
export function onRemotePinEvent(
  event: { gen: number; pinned: boolean; conversation: any },
  ops: Omit<RemotePinOps, "stale">
): Promise<void> | undefined {
  const hub = OfflineHub.getInstance();
  if (event.gen !== hub.gen) return undefined;
  if (!isOfflineOn()) return undefined;
  const startGen = hub.gen;
  return applyRemoteConversationPin(event.conversation, event.pinned, {
    ...ops,
    stale: () => OfflineHub.getInstance().gen !== startGen,
  });
}
