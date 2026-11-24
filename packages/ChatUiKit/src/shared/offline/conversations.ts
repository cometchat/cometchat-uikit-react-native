/**
 * The conversation list's offline (ON) path (README §3.7, UIK-SYNC-04): the reconcile of the
 * SDK's catch-up sync page instead of a refetch on reconnect, and the rows a read never drops.
 * Nothing here runs with offline off.
 *
 * @internal
 */
import { isOfflineUnsent, isSyncDelivered, localIdOf, muidOf } from "./identity";
import { isConversationPinned, tierOf, TIER } from "../utils/PinConversationHelper";
import { OfflineHub } from "./OfflineHub";
import { unsentRowInfo } from "./unsentActions";

function conversationKey(conversation: any): string {
  const id = conversation?.getConversationId?.() ?? conversation?.conversationId;
  return typeof id === "string" ? id : String(id ?? "");
}

/** A row whose preview is an own message the server has not acked (BEH-CONV-06). */
export function hasUnsentPreview(conversation: any): boolean {
  const last = conversation?.getLastMessage?.();
  return !!last && isOfflineUnsent(last);
}

function updatedAtOf(conversation: any): number {
  const value = Number(
    conversation?.getUpdatedAt?.() ?? conversation?.getLastMessage?.()?.getSentAt?.() ?? 0
  );
  return Number.isFinite(value) ? value : 0;
}

function previewSentAt(conversation: any): number {
  const value = Number(conversation?.getLastMessage?.()?.getSentAt?.() ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function pinnedAtOf(conversation: any): number {
  const value = Number(conversation?.getPinnedAt?.());
  return Number.isFinite(value) ? value : -1;
}

/**
 * The list's one ordering rule (the same as `conversationInsertIndex`): system pins, then the
 * user's pins, newest pin first, then every other chat by recency. A sync page carries the pins
 * the sweep learned (another device, an admin), so its reconcile must keep the pinned block on top.
 */
function compareRows(a: any, b: any): number {
  const tierA = tierOf(a);
  const tierB = tierOf(b);
  if (tierA !== tierB) return tierA - tierB;
  if (tierA !== TIER.UNPINNED) return pinnedAtOf(b) - pinnedAtOf(a);
  return updatedAtOf(b) - updatedAtOf(a);
}

function dedupe(list: any[]): any[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    const key = conversationKey(c);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Nothing moves backwards: a server copy older than the row's own unsent preview does not replace
 * it. The row's own timestamp does not move for a pending preview, so the messages decide too.
 */
function keepsUnsentPreview(existing: any, incoming: any): boolean {
  if (!hasUnsentPreview(existing)) return false;
  // A preview restored from the store has no sent time until its ack: it is the newest there is.
  const sentAt = previewSentAt(existing);
  return !sentAt || updatedAtOf(existing) >= updatedAtOf(incoming) || sentAt >= previewSentAt(incoming);
}

/**
 * Reconcile the slice one sync page covers on the plain, unfiltered list: rows in the page are
 * replaced or added; rows inside the page's range that the page no longer has are removed, unless
 * their preview is an own unsent message; rows below the page are kept; nothing moves backwards
 * (an own unsent preview newer than the server's copy wins).
 */
export function reconcileSyncPage(current: readonly any[], page: readonly any[]): any[] {
  if (page.length === 0) return current as any[];
  const pageIds = new Set(page.map(conversationKey));
  // The server floats pinned rows to the top of the page whatever their age, so they never set
  // the page's floor (BEH-SYNC-15); a page of pins only reconciles nothing below them.
  const ranked = page.filter((c) => !isConversationPinned(c));
  const oldestInPage = ranked.length > 0 ? Math.min(...ranked.map(updatedAtOf)) : Infinity;
  const byId = new Map(current.map((c) => [conversationKey(c), c] as const));
  const merged = page.map((incoming) => {
    const existing = byId.get(conversationKey(incoming));
    return existing && keepsUnsentPreview(existing, incoming) ? existing : incoming;
  });
  const rest = current.filter((c) => {
    if (pageIds.has(conversationKey(c))) return false;
    if (hasUnsentPreview(c)) return true;
    return updatedAtOf(c) < oldestInPage;
  });
  return dedupe([...merged, ...rest].sort(compareRows));
}

/**
 * The first server page of a two-phase conversation read replaces the cached first page; a row
 * the page no longer has is dropped, except one whose preview is an own unsent message, and such a
 * preview is not replaced by an older server copy.
 */
export function applyFirstServerPage(current: readonly any[], page: readonly any[]): any[] {
  const pageIds = new Set(page.map(conversationKey));
  const keptUnsent = current.filter((c) => !pageIds.has(conversationKey(c)) && hasUnsentPreview(c));
  const byId = new Map(current.map((c) => [conversationKey(c), c] as const));
  const merged = page.map((incoming) => {
    const existing = byId.get(conversationKey(incoming));
    return existing && keepsUnsentPreview(existing, incoming) ? existing : incoming;
  });
  return dedupe([...keptUnsent, ...merged]);
}

/** Oldest-to-newest order of two rows by (when it last changed, id). */
function compareByRange(a: any, b: any): number {
  const byTime = updatedAtOf(a) - updatedAtOf(b);
  if (byTime !== 0) return byTime;
  const x = conversationKey(a);
  const y = conversationKey(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** The cached page of a merging first-page read: new rows join the rows shown, shown copies stay. */
export function mergeCachedFirstPage(current: readonly any[], page: readonly any[]): any[] {
  return dedupe([...current, ...page].sort(compareRows));
}

/**
 * The server page of a narrowed list's re-read (the kit's own resync after a sync page), merged
 * into the rows shown: the page's rows are upserted; a row is dropped only if this read's cached
 * phase delivered it, it lies inside the page's (last change, id) range and the page lacks it
 * (and its preview is not an own unsent message). Rows the user paged in below stay. A page with
 * no rows proves nothing gone and changes nothing (D17).
 */
export function mergeFirstServerPage(
  current: readonly any[],
  cachedIds: ReadonlySet<string>,
  page: readonly any[]
): any[] {
  if (page.length === 0) return current as any[];
  const pageIds = new Set(page.map(conversationKey));
  // Pinned rows float to the top of the page whatever their age: they never set its range.
  const ranked = page.filter((c) => !isConversationPinned(c));
  let low: any = ranked[0];
  let high: any = ranked[0];
  for (const row of ranked) {
    if (compareByRange(row, low) < 0) low = row;
    if (compareByRange(row, high) > 0) high = row;
  }
  const byId = new Map(current.map((c) => [conversationKey(c), c] as const));
  const upserted = page.map((incoming) => {
    const existing = byId.get(conversationKey(incoming));
    return existing && keepsUnsentPreview(existing, incoming) ? existing : incoming;
  });
  const kept = current.filter((row) => {
    if (pageIds.has(conversationKey(row))) return false;
    if (!cachedIds.has(conversationKey(row)) || hasUnsentPreview(row)) return true;
    // A page of pins only has no range: nothing is proven gone.
    if (!low) return true;
    return compareByRange(row, low) < 0 || compareByRange(row, high) > 0;
  });
  return dedupe([...upserted, ...kept].sort(compareRows));
}

/** A later page, merged by key: as above, an older server copy does not replace an unsent preview. */
export function keepUnsentPreviews(current: readonly any[], next: any[]): any[] {
  const byId = new Map(current.map((c) => [conversationKey(c), c] as const));
  return next.map((row) => {
    const existing = byId.get(conversationKey(row));
    return existing && keepsUnsentPreview(existing, row) ? existing : row;
  });
}

export { conversationKey };

const FILTER_FIELDS = [
  "conversationType",
  "searchKeyword",
  "tags",
  "groupTags",
  "userTags",
  "unreadOnly",
  "unread",
  "pinnedBy",
  "onlyAgentic",
  "hideAgentic",
];

/**
 * Whether a conversations request (or its builder) narrows the list (type, tags, search,
 * unread-only, pinnedBy, agentic). Such a list does not reconcile the sync page, which covers the
 * plain list (Android finding F2); it re-runs its own request once instead.
 */
export function isFilteredConversationRequest(requestOrBuilder: any): boolean {
  if (!requestOrBuilder) return false;
  for (const field of FILTER_FIELDS) {
    const value = requestOrBuilder[field];
    if (Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== false && value !== "") {
      return true;
    }
  }
  return false;
}

export interface IncomingMessageRoute {
  /** The list's own filter (`shouldUpdateLastMessageAndUnreadCount`). */
  accepts(message: any): boolean;
  /** Swept (SYNC) message: preview only, no sound, no unread +1, no delivered receipt. */
  previewOnly(message: any): void;
  /** Live message: today's handling (receipt, preview, unread +1, sound). */
  live(message: any): void;
}

/**
 * One incoming message on the conversation list, whatever its category (text, media, custom,
 * form, card, scheduler, custom-interactive, AI assistant). A message the SDK's catch-up sweep
 * delivered (`getSource() === "SYNC"`, offline ON only) is already counted in the synced
 * conversation's unread count, so it updates the preview only (UIK-SYNC-02, UIT-CONV-09). With
 * offline off no message is SYNC, so every message takes today's live path.
 */
export function routeIncomingMessage(message: any, route: IncomingMessageRoute): void {
  if (!route.accepts(message)) return;
  if (isSyncDelivered(message)) {
    route.previewOnly(message);
    return;
  }
  route.live(message);
}

export interface DiscardPreviewDeps {
  rows(): readonly any[];
  /** Two-phase single read (cached copy offline). Resolves `null` when the chat is gone. */
  fetchConversation(conversationWith: string, type: string): Promise<any | null>;
  update(row: any): void;
  remove(conversationId: string): void;
}

function sameOwnMessage(a: any, b: any): boolean {
  const localA = localIdOf(a);
  if (localA && localA === localIdOf(b)) return true;
  const muidA = muidOf(a);
  return !!muidA && muidA === muidOf(b);
}

function withOf(conversation: any): { id: string; type: string } | null {
  const type = conversation?.getConversationType?.() ?? conversation?.conversationType;
  const entity = conversation?.getConversationWith?.();
  const id = type === "group" ? entity?.getGuid?.() : entity?.getUid?.();
  return typeof id === "string" && id && typeof type === "string" ? { id, type } : null;
}

/**
 * A user deleted an unsent message (BEH-SEND-36): the SDK moved that chat's preview back to its
 * newest remaining message, or removed a chat that only existed because of local sends. When the
 * row on screen shows the deleted message as its preview, re-read the chat (two-phase, so it works
 * offline) and show the SDK's answer; a chat that is gone is removed. Other rows are untouched.
 */
export async function refreshPreviewAfterDiscard(message: any, deps: DiscardPreviewDeps): Promise<void> {
  if (!message) return;
  const row = deps.rows().find((c) => {
    const last = c?.getLastMessage?.();
    return !!last && sameOwnMessage(last, message);
  });
  if (!row) return;
  const target = withOf(row);
  if (!target) return;
  let fresh: any | null = null;
  try {
    fresh = await deps.fetchConversation(target.id, target.type);
  } catch {
    return; // not answerable now: keep the row; the next sync heals it
  }
  if (fresh) deps.update(fresh);
  else deps.remove(conversationKey(row));
}

/**
 * Kill switch (UIK-LIFE-03): offline turned off with own unsent previews on the chat list, and no
 * open chat may be there to find them. They turn failed (direct), as the open chat's rows do, and
 * are remembered in `stranded`: a reconnect with offline off refetches the list, and the server has
 * never heard of them. Returns how many this call turned failed; a preview an open chat already
 * reported is not counted again.
 */
export function failStrandedPreviews(rows: readonly any[], stranded: Map<string, any>, hub: OfflineHub = OfflineHub.getInstance()): number {
  let count = 0;
  for (const row of rows) {
    const last = row?.getLastMessage?.();
    const info = last ? unsentRowInfo(last, hub) : null;
    if (!info) continue;
    const key = conversationKey(row);
    if (info.direct || info.state === "failed") {
      if (info.direct) stranded.set(key, last);
      continue;
    }
    stranded.set(key, last);
    if (hub.reportFailure(last, "", { direct: true })) count++;
  }
  return count;
}

/** Forget a stranded preview once it was sent or deleted. */
export function forgetStrandedPreview(stranded: Map<string, any>, message: any): void {
  for (const [key, last] of stranded) {
    if (sameOwnMessage(last, message)) stranded.delete(key);
  }
}

/**
 * The stranded previews a fresh list page no longer shows: a chat the page has with an older last
 * message, or does not have at all (a chat started offline). Newer messages keep their row.
 */
export function strandedPreviewsToRestore(rows: readonly any[], stranded: Map<string, any>): any[] {
  const out: any[] = [];
  for (const [key, message] of stranded) {
    const row = rows.find((c) => conversationKey(c) === key);
    const last = row?.getLastMessage?.();
    if (last && sameOwnMessage(last, message)) continue;
    if (last && Number(last.getSentAt?.() ?? 0) > Number(message?.getSentAt?.() ?? 0)) continue;
    out.push(message);
  }
  return out;
}
