/**
 * Helpers for the user-level Saved Messages surface (§6.4).
 *
 * The interesting part is `sourceLabelFor`. The design doc's recipe assumed rows
 * might arrive without conversation context, and prescribed a lazy hydrate showing
 * a raw id in the meantime. Verified against staging 2026-07-30: saved rows DO
 * carry `conversationId`, `receiver`, `receiverType` and `sender`, so the label is
 * derivable synchronously and no hydration call is needed. That deletes the whole
 * placeholder-then-refresh path the doc called for.
 *
 * @module SavedMessagesHelper
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";

/** What a saved row needs to render its "where did this come from" line. */
export interface SavedMessageSource {
  /** `group` | `user` — drives the sigil and the open-conversation call. */
  receiverType: string;
  /** guid, or the uid of the OTHER party in a 1-1. */
  receiverId: string;
  /** Display text, e.g. `#engineering` or `@alice`. */
  label: string;
  /** Plain display name with no sigil — what the row TITLE shows. */
  name: string;
  /** Group icon or user avatar URL, when the payload carries a hydrated party. */
  avatar?: string;
}

const RECEIVER_TYPE = { user: "user", group: "group" };

/**
 * Best display name for a User/Group, falling back to its id.
 *
 * A parsed message hands back a hydrated object, but a degenerate payload can
 * leave `receiver` as a bare string id — hence the typeof branch rather than
 * assuming the object shape.
 */
const nameOf = (party: any, fallbackId: string): string => {
  try {
    if (!party) return fallbackId;
    if (typeof party === "string") return party;
    if (typeof party.getName === "function" && party.getName()) return party.getName();
    if (typeof party.getUid === "function" && party.getUid()) return party.getUid();
    if (typeof party.getGuid === "function" && party.getGuid()) return party.getGuid();
    return fallbackId;
  } catch {
    return fallbackId;
  }
};

/**
 * Avatar/icon URL for a User or Group, or undefined.
 *
 * Same defensive shape as nameOf: a degenerate payload can leave the party as a
 * bare id string, which has neither accessor.
 */
const avatarOf = (party: any): string | undefined => {
  try {
    if (!party || typeof party === "string") return undefined;
    if (typeof party.getAvatar === "function" && party.getAvatar()) return party.getAvatar();
    if (typeof party.getIcon === "function" && party.getIcon()) return party.getIcon();
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Icon + label for a message type, for the row's subtitle.
 *
 * Mirrors the conversation list's preview vocabulary so a saved row reads the same
 * as the chat it came from. `label` is a LOCALE KEY, not display text — the caller
 * translates, because this module has no theme or translator of its own.
 *
 * A caption, when present, replaces the generic label: the design shows
 * "🖼 Check this out from yesterday!" rather than "🖼 Image".
 */
export const PREVIEW_BY_TYPE: Record<string, { icon: string; labelKey: string }> = {
  image: { icon: "photo-fill", labelKey: "MESSAGE_IMAGE" },
  video: { icon: "videocam-fill", labelKey: "MESSAGE_VIDEO" },
  audio: { icon: "mic-fill", labelKey: "MESSAGE_AUDIO" },
  file: { icon: "description-fill", labelKey: "MESSAGE_FILE" },
  extension_sticker: { icon: "sticker-fill", labelKey: "CUSTOM_MESSAGE_STICKER" },
  extension_poll: { icon: "poll-fill", labelKey: "CUSTOM_MESSAGE_POLL" },
  extension_document: { icon: "description-fill", labelKey: "CUSTOM_MESSAGE_DOCUMENT" },
  extension_whiteboard: { icon: "description-fill", labelKey: "CUSTOM_MESSAGE_DOCUMENT" },
};

/** What a saved row's subtitle should render. */
export interface SavedMessagePreview {
  /** Icon name, or null for a plain-text row which shows no glyph. */
  icon: string | null;
  /** Locale key to translate, or null when `text` is already display-ready. */
  labelKey: string | null;
  /** Literal text — a text message's body, or a media caption. */
  text: string | null;
}

/**
 * The subtitle content for a saved row. Never throws; an unrecognised type falls
 * back to the generic document glyph rather than rendering an empty line.
 */
export const previewFor = (message?: CometChat.BaseMessage | null): SavedMessagePreview => {
  const empty: SavedMessagePreview = { icon: "description-fill", labelKey: null, text: null };
  try {
    if (!message) return empty;

    if (message instanceof CometChat.TextMessage) {
      return { icon: null, labelKey: null, text: message.getText() ?? "" };
    }

    const entry = PREVIEW_BY_TYPE[message.getType()];
    const caption =
      message instanceof CometChat.MediaMessage ? (message.getCaption() ?? "").trim() : "";

    if (caption) return { icon: entry?.icon ?? empty.icon, labelKey: null, text: caption };
    if (entry) return { icon: entry.icon, labelKey: entry.labelKey, text: null };

    // Unknown custom type: show the glyph and let the caller fall back to the type
    // string, which is more useful than a blank subtitle.
    return { icon: empty.icon, labelKey: null, text: message.getType() ?? null };
  } catch {
    return empty;
  }
};

/**
 * The source conversation for a saved row, or null when the payload is unusable.
 *
 * Pass `loggedInUserUid` for correct 1-1 labelling. On an INCOMING 1-1 message the
 * receiver is the logged-in user, so labelling purely by receiver would render
 * every received row as "@me"; when the receiver is us, the counterparty is the
 * sender. Groups need no such flip.
 *
 * Never throws, and never returns a half-built label: a row whose source cannot be
 * determined still renders — the caller just omits the source line — rather than
 * being dropped, per the design doc's first rule.
 */
/**
 * Who wrote this saved row, as the subtitle prefix — `"You"`, a sender name, or null
 * for no prefix at all.
 *
 * Returns the NAME, not the punctuation: the component owns the `": "` so a
 * localisation that separates differently has one place to change.
 *
 * Three outcomes, and the asymmetry is the point:
 *  - **You wrote it** → `"You"`, in a 1-1 as much as in a group. Without this a DM row
 *    you sent and a DM row you received render identically — same avatar, same title,
 *    same date — and only the preview text tells them apart.
 *  - **Someone else, in a group** → their name. There are many possible authors, so
 *    the row is ambiguous without it.
 *  - **Someone else, in a 1-1** → null. There is exactly one other author and the row
 *    TITLE already names them; repeating it in the subtitle is noise.
 */
export const subtitlePrefixNameFor = (
  message?: CometChat.BaseMessage | null,
  loggedInUserUid?: string | null,
  youLabel: string = "You"
): string | null => {
  try {
    if (!message) return null;
    const senderUid = message.getSender?.()?.getUid?.();
    if (senderUid && loggedInUserUid && senderUid === loggedInUserUid) return youLabel;
    if (message.getReceiverType?.() !== RECEIVER_TYPE.group) return null;
    return message.getSender?.()?.getName?.() || null;
  } catch {
    return null;
  }
};

export const sourceLabelFor = (
  message?: CometChat.BaseMessage | null,
  loggedInUserUid?: string | null
): SavedMessageSource | null => {
  try {
    if (!message) return null;

    const receiverType = message.getReceiverType?.();
    if (receiverType !== RECEIVER_TYPE.user && receiverType !== RECEIVER_TYPE.group) return null;

    const receiver = message.getReceiver?.();
    const receiverId = message.getReceiverId?.() ?? "";

    if (receiverType === RECEIVER_TYPE.group) {
      const name = nameOf(receiver, receiverId);
      return { receiverType, receiverId, label: `#${name}`, name, avatar: avatarOf(receiver) };
    }

    // 1-1: flip to the sender when the row was addressed to us.
    if (loggedInUserUid && receiverId === loggedInUserUid) {
      const sender = message.getSender?.();
      const senderUid = sender && typeof sender.getUid === "function" ? sender.getUid() : "";
      if (senderUid) {
        const name = nameOf(sender, senderUid);
        return {
          receiverType,
          receiverId: senderUid,
          label: `@${name}`,
          name,
          avatar: avatarOf(sender),
        };
      }
    }

    const name = nameOf(receiver, receiverId);
    return { receiverType, receiverId, label: `@${name}`, name, avatar: avatarOf(receiver) };
  } catch {
    return null;
  }
};

/**
 * A fresh request for the logged-in user's saved messages, newest save first.
 *
 * The ordinary messages request, filtered to saved rows. Deliberately carries NO
 * uid/guid: `saved=1` is account-wide, and scoping it to a conversation would turn
 * this cross-conversation inbox into a per-chat list. Paging is the ordinary sentAt
 * cursor walk — setSavedOnly() changes what the list contains, not how it pages.
 *
 * Single-use by design — build a new one to refresh. The server caps the whole set
 * at 100.
 */
export const buildSavedMessagesRequest = (limit?: number) => {
  const builder = new CometChat.MessagesRequestBuilder().setSavedOnly(true);
  // ALWAYS set. The SDK has no default: MessagesRequestBuilder.limit stays undefined
  // unless setLimit() is called, and makeAPICall() then rejects with
  // SET_LIMIT_IS_COMPULSORY *before* any request goes out — an error screen with an
  // empty network log. 30 matches the SDK's own DEFAULT_VALUES.MSGS_LIMIT.
  builder.setLimit(limit ?? 30);
  return builder.build();
};
