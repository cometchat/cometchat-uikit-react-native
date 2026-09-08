/**
 * The kit's single seam onto the SDK's pin/save surface.
 *
 * Front-end Design Doc §4.1/§6.1/§6.5. Everything the kit needs to know about
 * pin and save lives here: how to read the state off a message, who is allowed
 * to pin, what the SDK calls are, and where the server-owned cap comes from.
 * Components import from this file and never reach for `getPinnedAt()` directly
 * — when the SDK contract shifts, this is the only edit.
 *
 * @module PinSaveHelper
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { getModerationStatus } from "./MessageUtils";

/**
 * The pin/save options stay hidden until an integrator opts in.
 *
 * Same shape as the other kit-side feature gates: a module-level switch rather
 * than a prop, because the DataSource that builds the option list has no props.
 */
export const PinSaveConfig = {
  _pinEnabled: false,
  _saveEnabled: false,

  /** Enable the Pin/Unpin options. Call once at app start. */
  enablePin(enabled: boolean = true) {
    this._pinEnabled = enabled;
  },
  /** Enable the Save/Unsave options. Call once at app start. */
  enableSave(enabled: boolean = true) {
    this._saveEnabled = enabled;
  },
  isPinEnabled(): boolean {
    return this._pinEnabled;
  },
  isSaveEnabled(): boolean {
    return this._saveEnabled;
  },
};

/** An admin/global pin arrives under this uid instead of a real member's. */
export const SYSTEM_PINNER = "app_system";

/**
 * Whether an action asks before it runs.
 *
 * The REMOVING half of each pair confirms; the adding half runs straight away.
 * Cross-platform decision (Jitvar, 2026-08-04) — all five kits follow it, so this is
 * not a per-kit preference to tune.
 *
 * The asymmetry is deliberate: pinning or saving is additive and its own undo sits
 * one tap away in the same menu, whereas unpinning or unsaving discards something
 * deliberately put there — on a conversation-wide pin, possibly by someone else —
 * and nothing on screen offers it back.
 *
 * Conversations follow the same rule: unpin asks, pin does not.
 */
export const pinSaveNeedsConfirm = (
  action: "pin" | "unpin" | "save" | "unsave"
): boolean => action === "unpin" || action === "unsave";

/**
 * True when the message is pinned to its conversation.
 *
 * The PRESENCE of the timestamp is the flag — the SDK deletes the attribute
 * rather than zeroing it, so this must never be written as `getPinnedAt() > 0`
 * or, worse, `!!getPinnedAt()` against a value that might legitimately be 0.
 */
/**
 * Deleting a message unpins and unsaves it SERVER-SIDE — verified on staging 2026-08-17: the
 * row leaves the pinned list and a fresh fetch carries neither `pinnedAt` nor `savedAt`.
 *
 * The client can still be holding an object that predates the delete, because the delete
 * response carries no pin/save fields at all — their absence is not a signal, so nothing
 * downstream clears them. That left "This message was deleted" rendering with a pin glyph
 * beside the timestamp (ENG-38181).
 *
 * Answering the question here rather than at each render site means every surface agrees, and
 * a new one cannot forget: the two indicator rows (MessageUtils and CometChatMessageList's own
 * copy) both read these, as does the option list.
 */
const isGone = (message?: CometChat.BaseMessage | null): boolean => {
  try {
    const deletedAt = message?.getDeletedAt?.();
    return deletedAt !== undefined && deletedAt !== null;
  } catch {
    return false;
  }
};

export const isPinned = (message?: CometChat.BaseMessage | null): boolean => {
  try {
    if (isGone(message)) return false;
    return message?.getPinnedAt?.() !== undefined && message?.getPinnedAt?.() !== null;
  } catch {
    return false;
  }
};

/** True when the logged-in user has saved the message. Per-viewer and private. */
export const isSaved = (message?: CometChat.BaseMessage | null): boolean => {
  try {
    if (isGone(message)) return false;
    return message?.getSavedAt?.() !== undefined && message?.getSavedAt?.() !== null;
  } catch {
    return false;
  }
};

/**
 * Carry the fields a pin/save/edit response forgets onto the fresher copy of the message
 * (ENG-38183, ENG-38176).
 *
 * Three endpoints return a DIFFERENT, smaller message than the one you already hold, and the
 * kit replaces the held object with what came back. Whatever the response omits disappears
 * from the UI until the next fetch. Verified on staging 2026-08-17:
 *
 *  - **PUT /messages/{id}** (edit) drops `pinnedAt`, `pinnedBy`, `savedAt` — the pin and save
 *    indicators vanish off an edited message (ENG-38183).
 *  - **POST /messages/{id}/pin** drops `quotedMessage` — pinning a reply erases the quote it
 *    was replying to, leaving bare text (ENG-38176). Send and fetch both carry it, so this
 *    is an omission on the pin response specifically.
 *
 * Absence in the fresher copy means "not mentioned", NOT "removed": a real unpin, unsave or
 * quote removal arrives as its own event, never as a silent omission. So this only ever
 * fills gaps — a value present on `fresh` always wins, which keeps it correct the day these
 * endpoints start returning complete messages.
 */
const carryFields = <T>(fresh: T, previous: any, keys: readonly string[]): T => {
  try {
    if (!fresh || !previous) return fresh;
    const target = fresh as any;
    // Copied straight off the object rather than via setters: the SDK exposes no
    // setPinnedAt/setSavedAt, and these are the field names the parser writes.
    keys.forEach((key) => {
      if (target[key] === undefined || target[key] === null) {
        if (previous[key] !== undefined && previous[key] !== null) target[key] = previous[key];
      }
    });
    return fresh;
  } catch {
    return fresh;
  }
};


/**
 * Never let a NON-FETCH payload downgrade a known subscription to `false`.
 *
 * The generic carry above cannot do this job, because it fills only what is `undefined` —
 * and `threadSubscribed` is never undefined. The SDK normalises the wire value at the single
 * parse site, so a payload that simply does not mention the field arrives as an explicit
 * `false`. Absent and "genuinely unsubscribed" are therefore indistinguishable by presence,
 * and the generic rule silently did nothing.
 *
 * What DOES distinguish them is the payload. Edit, pin, save and send responses never carry
 * the flag at all (the API populates it on FETCHED messages only), so a `false` arriving on
 * one of those paths is silence, not an answer — and silence must not clear a known `true`.
 * This is the "never write false off a frame" rule, enforced where the object is replaced
 * rather than merely stated in a comment.
 *
 * A fetched message never goes through here: fetch results replace the list wholesale, so a
 * real unsubscribe still lands normally on the next load.
 */
const preserveThreadSubscribed = <T>(fresh: T, previous: any): T => {
  try {
    if (!fresh || !previous) return fresh;
    if ((previous as any).threadSubscribed === true && (fresh as any).threadSubscribed !== true) {
      (fresh as any).threadSubscribed = true;
    }
    return fresh;
  } catch {
    return fresh;
  }
};

/**
 * For the EDIT path. The edit response says nothing about pin/save state, so carry it.
 *
 * ⚠️ NOT for the pin/save path — see carryQuotedMessage. On an UNPIN the response omits
 * `pinnedAt` because the message is no longer pinned, and copying the old value back leaves
 * the glyph on screen forever. The e2e "a lingering one is the bug" exists for that.
 */
/**
 * The replacement to use when a pin/save ACTION or frame is the answer — pin, unpin, save, unsave.
 *
 * Do NOT swap the response into the list. It is a PARTIAL message: it carries the pin attrs but
 * no muid, and the list keys its rows `${id}_${muid}`. Swapping it in changed that key from
 * `123_abc` to `id_123`, so React unmounted the row and mounted a fresh one instead of updating
 * it — remounting the media bubble and reloading every image. Pinning visibly rebuilt the bubble.
 *
 * So we keep the copy we already hold (complete: attachments, quote, muid, reactions) and take
 * ONLY the three pin/save fields off the response. The copy is SHALLOW and keeps the prototype,
 * so getId()/getSender() still work and every nested object — attachments above all — keeps its
 * identity. Only the top-level identity changes, which is precisely what MessageListItem's
 * `prevProps.item === nextProps.item` memo needs to redraw the row for the new indicator.
 */
export const applyPinSaveAnswer = <T>(held: T, response?: CometChat.BaseMessage | null): T => {
  try {
    if (!held) return held;
    const next: any = Object.create(
      Object.getPrototypeOf(held as any),
      Object.getOwnPropertyDescriptors(held as any)
    );
    if (!response) return next;
    (["pinnedAt", "pinnedBy", "savedAt"] as const).forEach((key) => {
      const value = (response as any)[key];
      // Absence IS the answer here: a response silent on pinnedAt means "no longer pinned".
      if (value === undefined || value === null) delete next[key];
      else next[key] = value;
    });
    return next;
  } catch {
    return held;
  }
};

export const carryPinSaveAttrs = <T>(fresh: T, previous?: CometChat.BaseMessage | null): T =>
  preserveThreadSubscribed(
  carryFields(
    fresh,
    previous,
    // A DELETE arrives through the same messageEdited path as an edit, and deleting unpins
    // and unsaves server-side. Carrying the attributes there would copy a pin onto a message
    // the server has just unpinned, which is how "This message was deleted" ended up wearing
    // a pin glyph. The quote still rides along — a deleted bubble no longer renders it, and
    // dropping it here would lose it on any other path that reuses this.
    // threadSubscribed rides along on EVERY branch. No edit, pin, save or socket payload
    // carries it — the API populates it on FETCHED messages only — so dropping it here would
    // silently unsubscribe the user in the UI every time any message in the thread was
    // edited, pinned or saved. It is the same omission class as quotedMessage.
    isGone(fresh as any)
      ? ["quotedMessage", "quotedMessageId"]
      : ["pinnedAt", "pinnedBy", "savedAt", "quotedMessage", "quotedMessageId"]
  ), previous);

/**
 * For the PIN/SAVE path (ENG-38176). Carries the quote and nothing else.
 *
 * `POST /messages/{id}/pin` returns a message with the pin attributes set but `quotedMessage`
 * dropped (verified on staging 2026-08-17 — send and fetch both carry it). So pinning a reply
 * replaced the held message with one that had no quote, and the bubble rendered as bare text.
 *
 * Pin/save attributes are deliberately NOT carried here: on this path the response IS the
 * answer about pin/save state, including the absence that means "no longer pinned".
 */
export const carryQuotedMessage = <T>(fresh: T, previous?: CometChat.BaseMessage | null): T =>
  preserveThreadSubscribed(carryFields(fresh, previous, ["quotedMessage", "quotedMessageId"]), previous);

/**
 * True for an admin/global pin, which renders without a "pinned by" attribution.
 * Only meaningful when isPinned() is already true.
 */
export const isSystemPin = (message?: CometChat.BaseMessage | null): boolean => {
  try {
    return isPinned(message) && message?.getPinnedBy?.() === SYSTEM_PINNER;
  } catch {
    return false;
  }
};

/**
 * Whether a message can be pinned or saved AT ALL, before any role question.
 *
 * The backend API reference (ENG-37690) is explicit: "Moderation
 * pending/disapproved messages cannot be pinned" and a missing/deleted message
 * returns ERR_MESSAGE_ID_NOT_FOUND. Offering the option anyway means the user
 * taps through a confirm modal to earn an error toast, so the gate belongs here
 * rather than being left to the server to refuse.
 *
 * Three exclusions:
 *  - no server id yet. An in-flight message is keyed by muid until it reconciles;
 *    pinning it would address an id the server has never seen.
 *  - deleted.
 *  - a moderation verdict other than clean-or-pending. Checked as an explicit
 *    allow-list rather than "not disapproved", so a status nobody has seen yet
 *    still fails CLOSED instead of silently becoming pinnable.
 *
 * PENDING IS ALLOWED THROUGH, deliberately (ENG-38901). The server does refuse a
 * pin or save while moderation is pending — measured 2026-09-04, both return
 * `403 ERR_MESSAGE_NO_ACCESS` — so hiding the options was defensible and is what
 * the React kit does. It is still the wrong trade here, for two reasons:
 *
 *  - The window is ~2 seconds and it runs from SEND, not from the long-press. By
 *    the time someone opens the sheet, reads it and taps, moderation has usually
 *    already approved, so the action simply succeeds. Hiding the option optimised
 *    for the rarer case.
 *  - The failure it avoided was invisible; the one it caused was not. Pin and Save
 *    were missing from your own message, then present after reopening the
 *    conversation, with nothing on screen explaining why. That reads as broken —
 *    it was filed as a bug twice.
 *
 * So the options stay put and a genuinely early tap earns a real explanation from
 * the server, which isPermissionError() already turns into a specific toast. This
 * is the same rule canPin() settled on for role permissions: offer the option, let
 * the server decide, render the refusal.
 */
export const isPinSaveEligible = (message?: CometChat.BaseMessage | null): boolean => {
  try {
    if (!message) return false;

    const id = message.getId?.();
    if (id === undefined || id === null || Number(id) <= 0) return false;

    if (message.getDeletedAt?.()) return false;

    const status = getModerationStatus(message);
    if (status !== "unmoderated" && status !== "approved" && status !== "pending") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Whether to OFFER pin/unpin to the logged-in user. The server is the authority (ENG-38197).
 *
 * This used to hard-code the §6.5 rule — owner/admin/moderator in a group, nobody else — on
 * the reasoning that "until RBAC ships, hiding the option IS the enforcement". That reasoning
 * was wrong on both halves, measured on staging 2026-08-17:
 *
 *  - a plain **participant** can pin AND unpin a group message over the API, so the client
 *    was hiding an action the server grants; and
 *  - permission is not client-readable anyway. It is not in `/settings` (no per-role pin key
 *    among the 305 parameters), `/roles` is admin-key-only and carries no policy, and the SDK
 *    exposes no capability surface. There is nothing to feature-detect against.
 *
 * So the honest gate is no gate: offer the option, let the server decide, and render the
 * refusal. `isPermissionError()` already recognises ERR_PERMISSION_DENIED and the message list
 * already toasts "You don't have permission to pin messages here" — that path was written and
 * then made unreachable by this function.
 *
 * This also makes groups consistent with 1-1, which has always taken exactly this line:
 * guessing "no" hides the option from someone entitled to it, and an over-optimistic option
 * is corrected by the server.
 *
 * The function stays as the seam. When RBAC ships a readable policy, it goes back in HERE and
 * nowhere else.
 */
export const canPin = (
  loggedInUser?: CometChat.User | null,
  _group?: CometChat.Group | null
): boolean => {
  try {
    // The one thing still worth asserting locally: there is somebody to act as.
    return !!loggedInUser;
  } catch {
    return false;
  }
};

/**
 * Server error codes, as they ACTUALLY exist in the backend.
 *
 * The design doc named `ERR_ACTION_NOT_ALLOWED`, `ERR_MESSAGE_NOT_FOUND` and
 * `ERR_MESSAGE_NOT_ACCESSIBLE`. The backend team confirmed (ENG-37690,
 * 2026-07-29) that none of those exist. These are the real ones — matching on
 * the doc's names would have silently fallen through to generic copy forever.
 */
export const PinSaveErrors = {
  PIN_LIMIT: "ERR_PINNED_MESSAGES_LIMIT_EXCEEDED",
  SAVE_LIMIT: "ERR_SAVED_MESSAGES_LIMIT_EXCEEDED",
  /** RBAC denial. Carries params {action, role, restrictionSource, guid, scope}. */
  PERMISSION_DENIED: "ERR_PERMISSION_DENIED",
  /** Caller cannot access the message at all. */
  NO_ACCESS: "ERR_MESSAGE_NO_ACCESS",
  /** Moderation pending/disapproved — NOT a role problem. */
  MODERATION: "ERR_MESSAGE_ACTION_NOT_ALLOWED",
  /** The app's feature flag is off. */
  FEATURE_OFF: "ERR_FEATURE_NOT_ACCESSIBLE",
  NOT_FOUND: "ERR_MESSAGE_ID_NOT_FOUND",
} as const;

/**
 * True when the message is GONE for this viewer — cleared conversation, deleted message,
 * or a row that outlived the thing it points at.
 *
 * This one must not be treated like an ordinary failure. The generic catch reinstates the
 * row it optimistically removed, on the assumption that the write did not take. Here the
 * write did not need to take: there is nothing left to unpin. Restoring the row leaves the
 * user tapping Unpin forever on a message the server will never accept.
 *
 * Reproduced on staging 2026-08-10: clear a chat that has pinned messages, then unpin one
 * from the panel — ERR_MESSAGE_ID_NOT_FOUND, and the row comes straight back.
 */
export const isMessageGoneError = (error: any): boolean => {
  try {
    return error?.code === PinSaveErrors.NOT_FOUND;
  } catch {
    return false;
  }
};

/** True when the rejection is a cap breach, whichever of the two caps it was. */
export const isCapError = (error: any): boolean => {
  try {
    return error?.code === PinSaveErrors.PIN_LIMIT || error?.code === PinSaveErrors.SAVE_LIMIT;
  } catch {
    return false;
  }
};

/**
 * The server-owned cap from a rejected pin/save, or null when the error does not
 * carry one — which is the COMMON case: the backend documents the caps as
 * tenant-overridable settings (`limits.messages.pinnedPerConversation`) and never
 * promises them on the error payload. Only RBAC denials are documented as
 * carrying params.
 *
 * So callers must handle null by showing copy WITHOUT a number rather than
 * printing a guess. Read off `errorParams` when present; never scraped out of the
 * message string, because the cap is the server's to change, not ours to parse.
 */

/**
 * The server-owned cap for a pin/save action, or null when it is unknown.
 *
 * Two sources, in order of trust:
 *   1. `errorParams.limit` on the rejection — documented, but rarely present;
 *   2. app settings, via the SDK's typed getters (ENG-37790).
 *
 * (2) replaced a regex that scraped the number out of the error PROSE — the only place
 * it appeared before settings carried it. That was fragile by construction: the server
 * owns that sentence and could reword it in any release, silently reverting every caller
 * to the no-count copy. Do not bring it back.
 *
 * Still returns null rather than 0 when the cap is genuinely unknown. The SDK is careful
 * about the same distinction: an absent setting resolves false, and Number(false) is 0,
 * which would read as "0 pins allowed" and hide the feature outright.
 */
export const resolveCapLimit = async (
  error: any,
  action: "pin" | "save"
): Promise<number | null> => {
  const fromError = readCapLimit(error);
  if (fromError !== null) return fromError;
  try {
    // Reads the CACHED app settings, deliberately (ENG-38180).
    //
    // Still no refresh on THIS path: it runs with a rejected tap already on screen, and a
    // network round trip here would sit between the user's action and the toast explaining
    // it. The staleness that made this print an out-of-date cap is fixed a level up instead
    // — refreshPinSaveFeatures() now re-fetches the app settings on every reconnection, so
    // the cache these getters read is current by the time anything needs to print it.
    //
    // What remains unfixable from here: a limit changed in the dashboard while the socket
    // stays connected is not seen until the next reconnect. That is the same contract the
    // feature flags have, and it is a bounded, self-correcting staleness rather than one
    // that lasts until logout.
    const limit =
      action === "pin"
        ? await CometChat.getPinMessageLimit()
        : await CometChat.getSaveMessageLimit();
    return typeof limit === "number" && isFinite(limit) && limit > 0 ? limit : null;
  } catch {
    return null;
  }
};

/** The cap as carried ON the rejection, or null. Usually absent — see resolveCapLimit. */
export const readCapLimit = (error: any): number | null => {
  try {
    const raw = error?.errorParams?.limit;
    if (typeof raw !== "number" && typeof raw !== "string") return null;
    const limit = Number(raw);
    return isFinite(limit) && limit > 0 ? limit : null;
  } catch {
    return null;
  }
};

/**
 * True when the rejection is the server refusing on role or access, as opposed to
 * a cap breach or a moderation verdict. Moderation is deliberately excluded — it
 * is not a permission problem and telling the user "you don't have permission"
 * when their message is awaiting moderation would be simply wrong.
 */
export const isPermissionError = (error: any): boolean => {
  try {
    return (
      error?.code === PinSaveErrors.PERMISSION_DENIED ||
      error?.code === PinSaveErrors.NO_ACCESS
    );
  } catch {
    return false;
  }
};

/**
 * Do these two ids refer to the same message?
 *
 * Compared as STRINGS, because a message id does not have one type in this codebase
 * (ENG-38891). A row read off a fetch and the same message arriving on a socket frame or
 * an action response can carry `123` and `"123"`, and `===` calls those different messages.
 * CometChatMessageList has always compared ids with a loose `==` for exactly this reason;
 * the panels used `===` and so were the surfaces where it bit.
 *
 * A silently failed comparison is worse than a wrong one here: in a DEDUPE it lets the same
 * pin be listed twice, which is how the pinned panel came to show six rows for a five-pin
 * cap. In a removal it makes an unpin do nothing at all.
 */
export const sameMessageId = (a: unknown, b: unknown): boolean => {
  if (a === undefined || a === null || b === undefined || b === null) return false;
  return String(a) === String(b);
};

/**
 * Is this message still waiting on moderation?
 *
 * The server refuses a pin or save with `403 ERR_MESSAGE_NO_ACCESS` while a message is
 * pending, which is the SAME code it uses for a genuine permission refusal. Without this
 * the user is told "you don't have permission", which is both wrong and unactionable —
 * they have permission, the message simply is not cleared yet, and it will be in a moment.
 */
export const isModerationPending = (message?: CometChat.BaseMessage | null): boolean => {
  try {
    return getModerationStatus(message) === "pending";
  } catch {
    return false;
  }
};

/** True when the app has the feature flag switched off server-side. */
export const isFeatureOffError = (error: any): boolean => {
  try {
    return error?.code === PinSaveErrors.FEATURE_OFF;
  } catch {
    return false;
  }
};

/** Pins a message to its conversation. Resolves the full updated message. */
export const pinMessage = (messageId: number | string): Promise<CometChat.BaseMessage> =>
  CometChat.pinMessage(String(messageId));

/** Unpins a message. Resolves the full updated message, pin attrs cleared. */
export const unpinMessage = (messageId: number | string): Promise<CometChat.BaseMessage> =>
  CometChat.unpinMessage(String(messageId));

/** Saves a message for the logged-in user. */
export const saveMessage = (messageId: number | string): Promise<CometChat.BaseMessage> =>
  CometChat.saveMessage(String(messageId));

/** Unsaves a message for the logged-in user. */
export const unsaveMessage = (messageId: number | string): Promise<CometChat.BaseMessage> =>
  CometChat.unsaveMessage(String(messageId));
