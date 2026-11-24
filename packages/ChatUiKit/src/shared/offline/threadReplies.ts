/**
 * The thread header's reply count on the offline (ON) path (README §3.9, UIT-SEND-21,
 * BEH-MUT-10).
 *
 * The header shows the parent's `replyCount` as last delivered by the SDK (a cached parent already
 * includes the user's own unsent replies). On top of it:
 * - +1 per own reply `localMessageId` when this device sends it (its pending), once;
 * - -1 when that reply is DISCARDED (or refused as failed direct) before it was sent;
 * - nothing at the ack: the reply was counted at pending, and a reply that was already unsent when
 *   the header opened is in the parent's count. Today's +1 on the public success therefore runs
 *   only for a send the offline path did not handle (offline off: every send);
 * - a fresher parent from the SDK (`onMessagesSynced`) replaces the value.
 * So the count never goes up twice for one reply.
 *
 * Offline off nothing here fires: the hub's subjects are inert and no OFF message has a local id.
 *
 * @internal
 */
import { localIdOf, muidOf, serverIdOf } from "./identity";
import type { MessagesUpdatedEvent, SendStateEvent } from "./OfflineHub";

export interface ThreadReplyTracker {
  /** A hub `sendState$` event. */
  onSendState(event: SendStateEvent): void;
  /**
   * Today's handling of the public `ccMessageSent` event: for `inprogress` it notes a reply
   * composed on this device; for `success` it runs `todayIncrement` unless the offline path
   * already counted (or the parent already includes) this reply.
   */
  onPublicSent(message: any, status: string, todayIncrement: () => void): void;
  /** A hub `messagesUpdated$` event: a fresher parent replaces the count. */
  onMessagesUpdated(event: MessagesUpdatedEvent): void;
}

function parentIdOf(message: any): string {
  try {
    const id = typeof message?.getParentMessageId === "function" ? message.getParentMessageId() : message?.parentMessageId;
    return id === undefined || id === null || id === 0 || id === "" ? "" : String(id);
  } catch {
    return "";
  }
}

/**
 * @param parentId the thread's parent message id (read at each event)
 * @param currentGen the hub's session `gen` (events of an older session are dropped)
 * @param adjust add `delta` to the shown count
 * @param replace show `count` (a fresher parent)
 */
export function createThreadReplyTracker(
  parentId: () => string | number | undefined,
  currentGen: () => number,
  adjust: (delta: number) => void,
  replace: (count: number) => void
): ThreadReplyTracker {
  /** Own replies counted at pending and not sent yet: a discard takes the +1 back. */
  const counted = new Set<string>();
  /** Own replies the offline path reported sent: their public success adds nothing. */
  const acked = new Set<string>();
  /**
   * muids of replies composed on this device while the header is open (the composer's
   * `inprogress`). Only those are counted at pending: a retry keeps its first count, and an
   * outbox replay after a relaunch is already in the parent's count.
   */
  const composedHere = new Set<string>();
  const cap = (set: Set<string>) => {
    if (set.size > 500) set.delete(set.values().next().value as string);
  };
  const inThread = (message: any) => {
    const parent = parentId();
    return parent !== undefined && parent !== null && parentIdOf(message) !== "" && parentIdOf(message) === String(parent);
  };

  return {
    onSendState(event) {
      if (event.gen !== currentGen()) return;
      const localMessageId = event.localMessageId;
      if (!localMessageId || !inThread(event.message)) return;
      switch (event.state) {
        case "sending":
          // Only a reply composed here; a retry or an outbox replay is already counted.
          if (composedHere.has(muidOf(event.message)) && !counted.has(localMessageId) && !acked.has(localMessageId)) {
            counted.add(localMessageId);
            adjust(1);
          }
          return;
        case "sent":
          counted.delete(localMessageId);
          acked.add(localMessageId);
          cap(acked);
          return;
        case "discarded":
          if (counted.delete(localMessageId)) adjust(-1);
          return;
        case "failed":
          // Refused (queue full / too large): never in the outbox, so not a reply after all.
          if (event.direct && counted.delete(localMessageId)) adjust(-1);
          return;
      }
    },
    onPublicSent(message, status, todayIncrement) {
      if (status === "inprogress") {
        const muid = muidOf(message);
        if (muid && inThread(message)) {
          composedHere.add(muid);
          cap(composedHere);
        }
        return;
      }
      if (status !== "success") return;
      const localMessageId = localIdOf(message);
      if (localMessageId && (acked.has(localMessageId) || counted.has(localMessageId))) return;
      todayIncrement();
    },
    onMessagesUpdated(event) {
      if (event.gen !== currentGen()) return;
      const parent = parentId();
      if (parent === undefined || parent === null) return;
      const fresher = event.messages.find((m) => serverIdOf(m) !== 0 && String(serverIdOf(m)) === String(parent));
      if (!fresher || typeof fresher.getReplyCount !== "function") return;
      const count = Number(fresher.getReplyCount());
      if (Number.isFinite(count) && count >= 0) replace(count);
    },
  };
}
