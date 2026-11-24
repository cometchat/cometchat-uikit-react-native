/**
 * Reconnect catch-up paging for the message list (plan D3).
 *
 * `getNewMessages` fetched forward from `lastID` and recursed only when a page held exactly 30
 * messages, without ever moving the cursor: a full page re-fetched the same page forever, and a
 * request with a different limit never paged at all. The next page now starts after the newest
 * server id of the page just fetched, and paging stops on a page shorter than the request's own
 * limit (or one that did not move the cursor).
 */

function numericId(message: any): number {
  const raw = typeof message?.getId === "function" ? message.getId() : message?.id;
  const id = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

/** Newest server id in `messages` (0 when none has one). */
export function newestServerIdIn(messages: readonly any[] | null | undefined): number {
  let newest = 0;
  for (const message of messages ?? []) newest = Math.max(newest, numericId(message));
  return newest;
}

/**
 * The cursor for the next catch-up page, or `null` when catch-up is complete.
 * @param page the page just fetched (any order)
 * @param cursor the message id that page was fetched after
 * @param limit the request's own page size
 */
export function nextCatchUpCursor(page: readonly any[] | null | undefined, cursor: number, limit: number): number | null {
  const size = page?.length ?? 0;
  const pageLimit = Number(limit) > 0 ? Number(limit) : 30;
  if (size < pageLimit) return null;
  const newest = newestServerIdIn(page);
  return newest > (Number(cursor) || 0) ? newest : null;
}
