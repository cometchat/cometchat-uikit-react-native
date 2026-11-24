/**
 * Localized text for offline notices (README §4 strings). Keys with a count have `_ONE` and
 * `_OTHER` variants, picked with `Intl.PluralRules` for the current language (falling back to
 * one/other when Intl is unavailable); `{count}` is replaced with the count. Languages whose
 * plural rules have more forms phrase `_OTHER` so it reads correctly for every count.
 *
 * @internal
 */
import { getCurrentLanguage } from "../resources/CometChatLocalizeNew/LocalizationManager";
import { OfflineNotice } from "./OfflineHub";

export type Translate = (key: string) => string;

export const OFFLINE_STRING_KEYS = Object.freeze({
  notSentYet: "OFFLINE_MESSAGE_NOT_SENT_YET",
  notSentTapToRetry: "OFFLINE_MESSAGE_NOT_SENT_TAP_TO_RETRY",
  unsentMessageRemoved: "OFFLINE_UNSENT_MESSAGE_REMOVED",
  messagesNotSent: "OFFLINE_MESSAGES_NOT_SENT",
  unsentMessagesLost: "OFFLINE_UNSENT_MESSAGES_LOST",
  unsentMessagesMaybeLost: "OFFLINE_UNSENT_MESSAGES_MAYBE_LOST",
  queueFull: "OFFLINE_QUEUE_FULL",
  fileTooLarge: "OFFLINE_FILE_TOO_LARGE",
  connectToLoadMore: "OFFLINE_CONNECT_TO_LOAD_MORE",
  connectToSearch: "OFFLINE_CONNECT_TO_SEARCH",
  connectToSearchMessages: "OFFLINE_CONNECT_TO_SEARCH_MESSAGES",
  connectToSearchSubtitle: "OFFLINE_CONNECT_TO_SEARCH_SUBTITLE",
  connectToLoadUsers: "OFFLINE_CONNECT_TO_LOAD_USERS",
  connectToLoadGroups: "OFFLINE_CONNECT_TO_LOAD_GROUPS",
  connectToLoadChats: "OFFLINE_CONNECT_TO_LOAD_CHATS",
  connectToLoadMembers: "OFFLINE_CONNECT_TO_LOAD_MEMBERS",
  connectToLoadMessages: "OFFLINE_CONNECT_TO_LOAD_MESSAGES",
  connectToLoadReactions: "OFFLINE_CONNECT_TO_LOAD_REACTIONS",
  connectToLoadNotifications: "OFFLINE_CONNECT_TO_LOAD_NOTIFICATIONS",
  mediaAvailableWhenOnline: "OFFLINE_MEDIA_AVAILABLE_WHEN_ONLINE",
  sendInFlight: "OFFLINE_SEND_IN_FLIGHT",
});

function pluralCategory(count: number): "one" | "other" {
  try {
    const rules = new Intl.PluralRules(getCurrentLanguage() || "en");
    return rules.select(count) === "one" ? "one" : "other";
  } catch {
    return count === 1 ? "one" : "other";
  }
}

/** `key` for `count`, from `key_ONE` / `key_OTHER`. */
export function localizedPlural(t: Translate, key: string, count: number): string {
  const text = t(`${key}_${pluralCategory(count) === "one" ? "ONE" : "OTHER"}`);
  return String(text ?? "").replace(/\{count\}/g, String(count));
}

export function offlineNoticeText(notice: OfflineNotice, t: Translate): string {
  switch (notice.kind) {
    case "unsent_message_removed":
      return t(OFFLINE_STRING_KEYS.unsentMessageRemoved);
    case "queue_full":
      return t(OFFLINE_STRING_KEYS.queueFull);
    case "file_too_large_offline":
      return t(OFFLINE_STRING_KEYS.fileTooLarge);
    case "messages_not_sent":
      return localizedPlural(t, OFFLINE_STRING_KEYS.messagesNotSent, notice.count ?? 1);
    case "unsent_messages_lost":
      return localizedPlural(t, OFFLINE_STRING_KEYS.unsentMessagesLost, notice.count ?? 1);
    case "unsent_messages_maybe_lost":
      return t(OFFLINE_STRING_KEYS.unsentMessagesMaybeLost);
    case "send_in_flight":
      return t(OFFLINE_STRING_KEYS.sendInFlight);
    case "media_available_when_online":
      return t(OFFLINE_STRING_KEYS.mediaAvailableWhenOnline);
    default:
      return "";
  }
}

/** Whether a notice offers Copy: a removed unsent TEXT message. */
export function noticeCopyText(notice: OfflineNotice): string | null {
  if (notice.kind !== "unsent_message_removed") return null;
  const text = notice.message?.getText?.() ?? notice.message?.text;
  return typeof text === "string" && text.length > 0 ? text : null;
}

/**
 * ENG-41199 (plan §3.10): an edit, delete or reaction on a sent message that failed on the offline
 * (ON) path shows today's error notice, the kit's existing "Something went wrong" text. `null` with
 * offline off: that failure stays today's (`onError` only).
 */
export function offlineMutationErrorText(offlineOn: boolean, t: Translate): string | null {
  return offlineOn ? t("SOMETHING_WRONG") : null;
}
