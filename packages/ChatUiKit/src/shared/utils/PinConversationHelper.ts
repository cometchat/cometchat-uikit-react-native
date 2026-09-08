/**
 * The kit's seam onto the SDK's conversation-pin surface.
 *
 * Separate from PinSaveHelper on purpose: pinning a CONVERSATION and pinning a
 * MESSAGE share a name and nothing else. Different endpoints, a different cap
 * (5, not 100), a different feature flag, no role gate, and a different failure
 * mode. Folding them together would invite carrying one's rules onto the other.
 *
 * @module PinConversationHelper
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";

/** Off until an integrator opts in — same shape as PinSaveConfig. */
export const PinConversationConfig = {
  _enabled: false,
  enable(enabled: boolean = true) {
    this._enabled = enabled;
  },
  isEnabled(): boolean {
    return this._enabled;
  },
};

/** An admin/global conversation pin. Users may not unpin these. */
export const SYSTEM_PINNER = "app_system";

/** Server error codes specific to conversation pinning. */
export const PinConversationErrors = {
  LIMIT: "ERR_PINNED_CONVERSATIONS_LIMIT_EXCEEDED",
  /** Never-messaged or hidden conversation — cannot be newly pinned. */
  NOT_ACCESSIBLE: "ERR_CONVERSATION_NOT_ACCESSIBLE",
  FEATURE_OFF: "ERR_FEATURE_NOT_ACCESSIBLE",
} as const;

/**
 * True when the conversation is pinned. PRESENCE of the timestamp is the flag —
 * the SDK deletes rather than zeroes, so never write this as `!!getPinnedAt()`.
 */
export const isConversationPinned = (conversation?: CometChat.Conversation | null): boolean => {
  try {
    return (
      conversation?.getPinnedAt?.() !== undefined && conversation?.getPinnedAt?.() !== null
    );
  } catch {
    return false;
  }
};

/**
 * True for an admin/global pin. A user cannot unpin one, so the affordance is
 * hidden rather than shown and then refused by the server.
 */
export const isSystemPinnedConversation = (
  conversation?: CometChat.Conversation | null
): boolean => {
  try {
    return isConversationPinned(conversation) && conversation?.getPinnedBy?.() === SYSTEM_PINNER;
  } catch {
    return false;
  }
};

/** The uid/guid and type a pin call needs, or null when the row is unusable. */
export const targetOf = (
  conversation?: CometChat.Conversation | null
): { id: string; type: string } | null => {
  try {
    if (!conversation) return null;
    const type = conversation.getConversationType?.();
    const other: any = conversation.getConversationWith?.();
    if (!type || !other) return null;
    const id =
      type === "group"
        ? typeof other.getGuid === "function" && other.getGuid()
        : typeof other.getUid === "function" && other.getUid();
    return id ? { id: String(id), type } : null;
  } catch {
    return null;
  }
};

/** Last-message time for ordering, 0 when the conversation has never had one. */
const recencyOf = (conversation: any): number => {
  try {
    return conversation?.getLastMessage?.()?.getSentAt?.() ?? 0;
  } catch {
    return 0;
  }
};

/** Pin time, or -1 when not pinned. Newest pin sorts first within a tier. */
const pinnedAtOf = (conversation: any): number => {
  try {
    const v = conversation?.getPinnedAt?.();
    return v === undefined || v === null ? -1 : Number(v);
  } catch {
    return -1;
  }
};

/**
 * Which of the three ordering tiers a conversation belongs to. Lower wins.
 *
 *   0  SYSTEM pin  — set from the dashboard (`pinnedBy: app_system`). Highest
 *                    priority: it outranks a user's own pin no matter how much
 *                    more recently the user pinned theirs. A user cannot unpin one.
 *   1  USER pin    — this user pinned it themselves.
 *   2  unpinned    — ordinary recency ordering.
 */
export const TIER = { SYSTEM_PIN: 0, USER_PIN: 1, UNPINNED: 2 };

export const tierOf = (conversation: any): number => {
  try {
    if (!isConversationPinned(conversation)) return TIER.UNPINNED;
    return isSystemPinnedConversation(conversation) ? TIER.SYSTEM_PIN : TIER.USER_PIN;
  } catch {
    return TIER.UNPINNED;
  }
};

/**
 * Where a conversation belongs in the list — the single ordering rule used by pin,
 * unpin, an incoming message, AND a conversation appearing for the first time.
 *
 * Three blocks, in this order:
 *   1. dashboard/system pins, newest pin first
 *   2. the user's own pins, newest pin first
 *   3. everything else, most recent message first
 *
 * Consequences worth stating, because each was a bug at some point:
 *  - a pinned row KEEPS its slot when a message arrives. Pinned order is by when it
 *    was pinned, not by who messaged last, so a busy pinned chat must not climb.
 *  - a brand-new or previously-deleted conversation goes into tier 3, NOT to index
 *    0. A message in a deleted chat must not surface above the user's pins.
 *  - a user pin never outranks a dashboard pin, whatever the timestamps say.
 *
 * @param conversation the row being placed
 * @param all the current list INCLUDING it — filtered out here
 * @returns the index to insert at
 */
export const conversationInsertIndex = (conversation: any, all: Array<any>): number => {
  try {
    if (!conversation || !Array.isArray(all)) return 0;
    const id = String(conversation.getConversationId?.() ?? "");
    const others = all.filter(o => String(o?.getConversationId?.() ?? "") !== id);

    const myTier = tierOf(conversation);
    const myPin = pinnedAtOf(conversation);
    const myRecency = recencyOf(conversation);

    let index = 0;
    for (let i = 0; i < others.length; i++) {
      const other = others[i];
      const otherTier = tierOf(other);

      // A higher tier always sits above, regardless of timestamps.
      if (otherTier < myTier) {
        index = i + 1;
        continue;
      }
      if (otherTier > myTier) break;

      // Same tier: pins compare by pinnedAt, unpinned rows by message recency.
      const mine = myTier === TIER.UNPINNED ? myRecency : myPin;
      const theirs = otherTier === TIER.UNPINNED ? recencyOf(other) : pinnedAtOf(other);
      if (theirs > mine) {
        index = i + 1;
        continue;
      }
      break;
    }
    return index;
  } catch {
    return 0;
  }
};

export const isConversationCapError = (error: any): boolean => {
  try {
    return error?.code === PinConversationErrors.LIMIT;
  } catch {
    return false;
  }
};

export const isConversationNotPinnable = (error: any): boolean => {
  try {
    return error?.code === PinConversationErrors.NOT_ACCESSIBLE;
  } catch {
    return false;
  }
};

export const isConversationFeatureOff = (error: any): boolean => {
  try {
    return error?.code === PinConversationErrors.FEATURE_OFF;
  } catch {
    return false;
  }
};

/**
 * The server-owned cap, when the error carries it. Usually absent — the backend
 * documents caps as tenant settings and does not promise them on the payload — so
 * callers must render copy without a number rather than printing a guess.
 */

/**
 * The conversation cap, or null when unknown. Same two sources as the message-level
 * resolveCapLimit: `errorParams.limit` first, then app settings via the SDK getter
 * (ENG-37790). This replaced a regex over the server's error prose — see the note there.
 */
export const resolveConversationCapLimit = async (error: any): Promise<number | null> => {
  const fromError = readConversationCapLimit(error);
  if (fromError !== null) return fromError;
  try {
    const limit = await CometChat.getPinConversationLimit();
    return typeof limit === "number" && isFinite(limit) && limit > 0 ? limit : null;
  } catch {
    return null;
  }
};

/** The cap as carried ON the rejection, or null. See resolveConversationCapLimit. */
export const readConversationCapLimit = (error: any): number | null => {
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
 * Both resolve the FULL updated Conversation, verified on staging 2026-07-30 — not
 * an ack string, which is what these were originally typed as. A caller can apply
 * the resolved row straight into its list instead of trusting its optimistic guess.
 */
export const pinConversation = (id: string, type: string): Promise<CometChat.Conversation> =>
  CometChat.pinConversation(id, type);

export const unpinConversation = (id: string, type: string): Promise<CometChat.Conversation> =>
  CometChat.unpinConversation(id, type);
