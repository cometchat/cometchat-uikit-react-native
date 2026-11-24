/**
 * What the offline (ON) search screen shows when a search ended with nothing on screen and at least one
 * request failed (D84). Mirrors Android's `CometChatSearchViewModel.updateFinalStateIfCompleted`
 * (CometChatSearchViewModel.kt:569-603) and its failure bookkeeping (:880-905):
 *
 * - "Connect to search" when offline is on, nothing is shown, no request failed with a real error
 *   (an error other than not-connected), AND (a keyword request failed not-connected, OR both the
 *   conversation and the message requests failed).
 * - A filter-only search where only one scope failed is the plain empty state (Android:
 *   `SearchUIState.Empty` with `showConnectToSearch` false): no "Connect to search", no `onError`, and
 *   no read again on reconnect.
 * - A real failure of ONE scope only (nothing on screen) is the same plain empty state: Android's
 *   `bothFailed` is false, so it ends in `SearchUIState.Empty` with no `onError`. Both scopes failing
 *   (at least one with a real error) is the error view plus `onError` (the kit's `rule 4`).
 *
 * A request "failed" with not-connected when it ended not-connected past the cache AND (it carried a
 * keyword, which has no cache, OR the SDK gave no cached phase before the error). A filter-only read that
 * got its cached phase first was answered from the device: nothing found, not a failure.
 *
 * @internal
 */

/** One scope of the current search (conversations or messages). */
export interface SearchRead {
  /** The scope took part in this search (it is rendered for the current keyword/filters). */
  ran: boolean;
  /** How its request failed; `null` when it did not fail. */
  failure: null | "notConnected" | "error";
  /** The request carried a keyword (a keyword has no cache). */
  keyword: boolean;
}

export type SearchOfflineOutcome =
  /** The screen's usual states apply (rows, results, loading, no results). */
  | "none"
  /** "Connect to search" (the app's own empty view wins), no `onError`. */
  | "connectToSearch"
  /** The plain empty state (the app's own empty view wins), no `onError`. */
  | "empty"
  /** The error view (the app's own error view wins). */
  | "error";

export function searchOfflineOutcome(input: {
  offlineOn: boolean;
  nothingShown: boolean;
  conversations: SearchRead;
  messages: SearchRead;
}): SearchOfflineOutcome {
  const { offlineOn, nothingShown, conversations, messages } = input;
  if (!offlineOn || !nothingShown) return "none";
  const ran = [conversations, messages].filter((read) => read.ran);
  const failed = ran.filter((read) => read.failure !== null);
  if (failed.length === 0) return "none";
  const bothFailed = conversations.ran && messages.ran && failed.length === 2;
  if (failed.some((read) => read.failure === "error")) {
    // Android: a real failure of one scope only leaves `bothFailed` false and nothing shown: the plain
    // empty state (no onError). Both scopes failing is the error view.
    return bothFailed ? "error" : "empty";
  }
  const keywordFailed = failed.some((read) => read.keyword);
  return keywordFailed || bothFailed ? "connectToSearch" : "empty";
}
