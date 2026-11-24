/**
 * Pure list operations for the offline (ON) path (README §3.3): sorted upsert by identity, the
 * windowed reconcile of a server page against the cached page it replaces, and the held-receipt
 * map. Nothing here runs with offline off.
 *
 * Order (ascending): sent rows by `(sentAt, id)`; own rows without a server id last, by compose
 * order (BEH-READ-10). A row without a server id is never removed by a read (BEH-READ-30). The RN
 * message list keeps its rows newest-first; the `*Desc` wrappers adapt to that orientation.
 *
 * Stream rows (agent replies being streamed) borrow their user message's id, so they are never
 * matched, moved or removed by these operations.
 *
 * @internal
 */
import { categoryOf, localIdOf, muidOf, rowKey, serverIdOf } from "./identity";

/** The not-connected terminal of an offline read or send (RN: `FAILED_TO_FETCH`). */
export function isNotConnectedError(error: unknown): boolean {
  const code = (error as any)?.code ?? (error as any)?.name;
  return (
    code === "FAILED_TO_FETCH" ||
    code === "ERROR_INTERNET_UNAVAILABLE" ||
    code === "NO_WEBSOCKET_CONNECTION" ||
    code === "NOT_CONNECTED"
  );
}

function isStream(message: any): boolean {
  return !!message?.isStreamMessage || categoryOf(message) === "stream";
}

function numberOf(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sentAtOf(message: any): number {
  return numberOf(message?.getSentAt?.() ?? message?.sentAt);
}

function updatedAtOf(message: any): number {
  return numberOf(message?.getUpdatedAt?.() ?? message?.updatedAt);
}

/** Rows that sort after every sent row: own messages the server has not acked. */
function inUnsentBucket(message: any): boolean {
  if (serverIdOf(message) > 0 || isStream(message)) return false;
  const category = categoryOf(message);
  return category !== "action" && category !== "call";
}

/** Ascending comparator: sent rows by (sentAt, id), then unsent rows by compose time. */
export function compareRows(a: any, b: any): number {
  const aUnsent = inUnsentBucket(a);
  const bUnsent = inUnsentBucket(b);
  if (aUnsent !== bUnsent) return aUnsent ? 1 : -1;
  const bySentAt = sentAtOf(a) - sentAtOf(b);
  if (bySentAt !== 0) return bySentAt;
  return serverIdOf(a) - serverIdOf(b);
}

/** Index of the row that is the same message: server id, then local handle, then own muid. */
export function findRowIndex(rows: readonly any[], message: any): number {
  if (!message || isStream(message)) return -1;
  const id = serverIdOf(message);
  if (id > 0) {
    const byId = rows.findIndex((row) => !isStream(row) && serverIdOf(row) === id);
    if (byId !== -1) return byId;
  }
  const local = localIdOf(message);
  if (local) {
    const byLocal = rows.findIndex((row) => !isStream(row) && localIdOf(row) === local);
    if (byLocal !== -1) return byLocal;
  }
  const muid = muidOf(message);
  if (muid) {
    const byMuid = rows.findIndex(
      (row) =>
        !isStream(row) &&
        muidOf(row) === muid &&
        (serverIdOf(row) === 0 || id === 0 || serverIdOf(row) === id)
    );
    if (byMuid !== -1) return byMuid;
  }
  return -1;
}

function sortedIndex(rows: readonly any[], message: any): number {
  let low = 0;
  let high = rows.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (compareRows(rows[mid], message) <= 0) low = mid + 1;
    else high = mid;
  }
  return low;
}

export interface UpsertResult {
  rows: any[];
  changed: boolean;
}

/**
 * Upsert `incoming` into ascending `rows` by identity, each into its sorted place. For the same
 * server id the copy with the newer `updatedAt` wins, so a read never reverts a live edit.
 * Returns a new array when anything changed; untouched rows keep their objects.
 */
export function upsertSorted(rows: readonly any[], incoming: readonly any[]): UpsertResult {
  const next = rows.slice();
  let changed = false;
  for (const message of incoming) {
    if (!message || isStream(message)) continue;
    const index = findRowIndex(next, message);
    if (index !== -1) {
      const existing = next[index];
      if (existing === message) continue;
      const sameServerRow = serverIdOf(existing) > 0 && serverIdOf(existing) === serverIdOf(message);
      if (sameServerRow && updatedAtOf(existing) > updatedAtOf(message)) continue;
      next.splice(index, 1);
      next.splice(sortedIndex(next, message), 0, message);
      changed = true;
      continue;
    }
    next.splice(sortedIndex(next, message), 0, message);
    changed = true;
  }
  return { rows: changed ? next : (rows as any[]), changed };
}

/**
 * The part of `incoming` that is already a row of `rows`. A window anchored on an older message
 * (a jump, start-from-unread) must take a sweep's copies of the rows it shows and nothing else:
 * a newer message inserted past the window's end would leave a hole, and the "load newer" read
 * anchors on the newest row shown, so it would skip everything inside the hole.
 */
export function onlyShownRows(rows: readonly any[], incoming: readonly any[]): any[] {
  return incoming.filter((message) => findRowIndex(rows, message) !== -1);
}

/** Server-id keys of the rows a cached page showed. */
export function cachedKeysOf(messages: readonly any[]): Set<string> {
  const keys = new Set<string>();
  for (const message of messages) if (serverIdOf(message) > 0) keys.add(rowKey(message));
  return keys;
}

/**
 * Apply a server page: upsert it, then remove rows its cached page showed that the server no
 * longer has, but only inside the server page's id range (a proven omission). Rows without a
 * server id, and stream rows, are never removed.
 */
export function reconcileServerPage(rows: readonly any[], cachedKeys: ReadonlySet<string>, serverPage: readonly any[]): UpsertResult {
  const upserted = upsertSorted(rows, serverPage);
  const serverIds = serverPage.map(serverIdOf).filter((id) => id > 0);
  if (serverIds.length === 0 || cachedKeys.size === 0) return upserted;
  const minId = Math.min(...serverIds);
  const maxId = Math.max(...serverIds);
  const serverKeys = new Set(serverPage.map(rowKey));
  const kept = upserted.rows.filter((row) => {
    const id = serverIdOf(row);
    if (id === 0 || isStream(row)) return true;
    const key = rowKey(row);
    if (!cachedKeys.has(key) || serverKeys.has(key)) return true;
    return id < minId || id > maxId;
  });
  if (kept.length === upserted.rows.length) return upserted;
  return { rows: kept, changed: true };
}

/**
 * D13-R2: a cached page is kept only when it joins the server page that answered the same read
 * (the two share a server id). One that does not join is stale: more arrived than one page holds.
 * The rows it painted beyond the server page's far end (older for `previous`, newer for `next`)
 * are dropped, not stitched to it over a hidden gap; the next page reads them again from the
 * server page's edge. Rows listed before the cached page, rows without a server id, stream rows,
 * and everything when the server page is empty, are never removed. Order-agnostic; returns `rows`
 * itself when nothing is dropped.
 */
export function dropUnjoinedCachedPage(
  rows: readonly any[],
  paintedKeys: readonly string[],
  rawCachedKeys: readonly string[],
  serverPage: readonly any[],
  direction: "previous" | "next"
): any[] {
  const serverIds = serverPage.map(serverIdOf).filter((id) => id > 0);
  if (serverIds.length === 0 || paintedKeys.length === 0) return rows as any[];
  const serverKeys = cachedKeysOf(serverPage);
  if (rawCachedKeys.some((key) => serverKeys.has(key))) return rows as any[];
  const edge = direction === "previous" ? Math.min(...serverIds) : Math.max(...serverIds);
  const painted = new Set(paintedKeys);
  const kept = rows.filter((row) => {
    const id = serverIdOf(row);
    if (id < 1 || isStream(row) || !painted.has(rowKey(row))) return true;
    return direction === "previous" ? id > edge : id < edge;
  });
  return kept.length === rows.length ? (rows as any[]) : kept;
}

/** Remove the row that is `message`, by identity. */
export function removeRow(rows: readonly any[], message: any): UpsertResult {
  const index = findRowIndex(rows, message);
  if (index === -1) return { rows: rows as any[], changed: false };
  const next = rows.slice();
  next.splice(index, 1);
  return { rows: next, changed: true };
}

/** Newest server id among `rows` (any order): the newer-direction cursor anchor. */
export function newestServerId(rows: readonly any[]): number {
  let newest = 0;
  for (const row of rows) if (!isStream(row)) newest = Math.max(newest, serverIdOf(row));
  return newest;
}

/** Oldest server id among `rows` (any order): the older-direction cursor anchor. */
export function oldestServerId(rows: readonly any[]): number {
  let oldest = 0;
  for (const row of rows) {
    if (isStream(row)) continue;
    const id = serverIdOf(row);
    if (id > 0 && (oldest === 0 || id < oldest)) oldest = id;
  }
  return oldest;
}

// ── Newest-first adapters for the RN message list ───────────────────────────

function reversed(rows: readonly any[]): any[] {
  return rows.slice().reverse();
}

function adaptDesc(result: UpsertResult, original: readonly any[]): UpsertResult {
  return result.changed ? { rows: reversed(result.rows), changed: true } : { rows: original as any[], changed: false };
}

export function upsertSortedDesc(rowsDesc: readonly any[], incoming: readonly any[]): UpsertResult {
  return adaptDesc(upsertSorted(reversed(rowsDesc), incoming), rowsDesc);
}

export function reconcileServerPageDesc(rowsDesc: readonly any[], cachedKeys: ReadonlySet<string>, serverPage: readonly any[]): UpsertResult {
  return adaptDesc(reconcileServerPage(reversed(rowsDesc), cachedKeys, serverPage), rowsDesc);
}

/** `dropUnjoinedCachedPage` over a reconcile result (either orientation; the order is kept). */
export function dropUnjoinedCachedPageDesc(
  result: UpsertResult,
  paintedKeys: readonly string[],
  rawCachedKeys: readonly string[],
  serverPage: readonly any[],
  direction: "previous" | "next"
): UpsertResult {
  const rows = dropUnjoinedCachedPage(result.rows, paintedKeys, rawCachedKeys, serverPage, direction);
  return rows === result.rows ? result : { rows, changed: true };
}

export function removeRowDesc(rowsDesc: readonly any[], message: any): UpsertResult {
  return removeRow(rowsDesc, message);
}

// ── Held receipts (README §3.6) ─────────────────────────────────────────────

const MAX_HELD_RECEIPTS = 200;

/**
 * Receipts for server ids the list does not show yet (their ack has not landed) are held here and
 * applied when a row acquires that id (BEH-SEND-32). Cleared on `gen` change and after a sweep.
 */
export class HeldReceipts {
  private readonly held = new Map<number, any>();

  hold(messageId: number, receipt: any): void {
    if (!(messageId > 0)) return;
    this.held.delete(messageId);
    this.held.set(messageId, receipt);
    if (this.held.size > MAX_HELD_RECEIPTS) {
      const oldest = this.held.keys().next().value;
      if (oldest !== undefined) this.held.delete(oldest);
    }
  }

  take(messageId: number): any {
    const receipt = this.held.get(messageId);
    if (receipt) this.held.delete(messageId);
    return receipt;
  }

  clear(): void {
    this.held.clear();
  }

  get size(): number {
    return this.held.size;
  }
}
