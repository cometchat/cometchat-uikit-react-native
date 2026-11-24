/**
 * What an own UNSENT row offers, and what Delete does (BEH-SEND-36; ruling R162 / S73, frozen
 * 2026-11-03, which rewrote BEH-SEND-37 and supersedes UIK-SEND-05's "Copy, no Delete" and the
 * earlier "Delete only after a permanent failure" and "nothing while SENDING" rules).
 *
 * On the sender's own row that has no server id (offline ON path only), a UI kit offers Retry and
 * Delete on every PENDING, SENDING and FAILED (any reason) message, and on a failed row kept in
 * memory that never entered the outbox:
 *
 * | Row                                                   | Menu            |
 * |-------------------------------------------------------|-----------------|
 * | PENDING                                               | Retry, Delete   |
 * | SENDING (on the wire)                                 | Retry, Delete   |
 * | FAILED, any reason (TRANSIENT, PERMANENT, unknown, …) | Retry, Delete   |
 * | failed (direct), kept in memory, never in the outbox  | Retry, Delete   |
 *
 * The SDK decides whether it can act: on a message whose send is under way it answers
 * `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` to Retry and to Delete and changes nothing, and the kit shows
 * the short "Sending… try again in a moment" notice (`OfflineHub.raiseSendInFlightNotice`). The
 * kit keeps no in-flight state of its own to hide the menu.
 *
 * Nothing else: no Copy, reply, thread, react, edit, pin, save, mark unread, info, translate,
 * report or forward (they need a server id). With offline off nothing here is reached and the
 * menu is today's.
 *
 * @internal
 */
import { offlineSdk, sdkConnected } from "./gate";
import {
  failureReasonOf,
  isOfflineUnsent,
  localIdOf,
  OfflineMessageStatus,
  serverIdOf,
  statusOf,
} from "./identity";
import { OfflineHub } from "./OfflineHub";

export type UnsentRowState = "pending" | "sending" | "failed";
export type UnsentAction = "retry" | "delete";

export interface UnsentRowInfo {
  state: UnsentRowState;
  /** `MessageFailureReason` of a failed row, `""` when unknown. */
  reason: string;
  /** Failed without entering the outbox: Retry is a fresh send, Delete removes it from the screen. */
  direct: boolean;
}

/** The SDK's offline error codes a Delete can be refused with (R160). */
export const DISCARD_ERROR = Object.freeze({
  inFlight: "ERROR_OFFLINE_MESSAGE_IN_FLIGHT",
  notFound: "ERROR_OFFLINE_MESSAGE_NOT_FOUND",
  disabled: "ERROR_OFFLINE_DISABLED",
  /** A queued send ended without being sent: the session ended or the cache was reset (Android `ERROR_DISCARDED`). */
  discarded: "ERROR_OFFLINE_MESSAGE_DISCARDED",
  /** The SDK's error for a send made with nobody logged in (Android `ERROR_NOT_LOGGED_IN`). */
  notLoggedIn: "ERROR_USER_NOT_LOGGED_IN",
});

/**
 * The unsent state of an own row, or `null` when it is not an unsent row (it has a server id, or
 * the offline path never touched it). The hub's last reported state wins over the row's status,
 * because a per-send callback can hand over a message object whose status was not updated.
 */
export function unsentRowInfo(message: any, hub: OfflineHub = OfflineHub.getInstance()): UnsentRowInfo | null {
  if (!message || serverIdOf(message) > 0) return null;
  const directReason = hub.directFailureOf(message);
  if (directReason !== undefined) return { state: "failed", reason: directReason, direct: true };
  if (!isOfflineUnsent(message)) return null;
  const localMessageId = localIdOf(message);
  const status = statusOf(message);
  const reported = hub.stateOf(localMessageId);
  const reasonOf = () => failureReasonOf(message) || hub.failureReasonFor(localMessageId);
  if (reported === "failed") return { state: "failed", reason: reasonOf(), direct: false };
  if (reported === "sending") {
    return { state: status === OfflineMessageStatus.sending ? "sending" : "pending", reason: "", direct: false };
  }
  if (status === OfflineMessageStatus.failed) return { state: "failed", reason: reasonOf(), direct: false };
  if (status === OfflineMessageStatus.sending) return { state: "sending", reason: "", direct: false };
  return { state: "pending", reason: "", direct: false };
}

/**
 * The menu for an unsent row (R162 / S73): Retry and Delete on every unsent row, whatever its
 * state or failure reason. Empty = not an unsent row, today's menu.
 */
export function unsentActionsOf(info: UnsentRowInfo | null): UnsentAction[] {
  return info ? ["retry", "delete"] : [];
}

/** Whether the row offers Retry right now. */
export function canRetryUnsent(message: any, hub: OfflineHub = OfflineHub.getInstance()): boolean {
  return unsentActionsOf(unsentRowInfo(message, hub)).includes("retry");
}

export type DeleteUnsentOutcome =
  /** Gone from the device (or the screen, for a direct failure); the row is removed. */
  | { kind: "removed" }
  /** The send is on the wire: the row stays; the "Sending… try again in a moment" notice is up (R162). */
  | { kind: "in_flight"; error: unknown }
  /** The message was sent: delete it on the server through today's path. */
  | { kind: "sent"; serverId: number }
  /** The message was sent but the device is offline: today's not-connected error. */
  | { kind: "not_connected"; error: unknown }
  /** Offline was switched off (kill switch): the row is failed (direct) now. */
  | { kind: "disabled"; error: unknown }
  /** Any other refusal (store blip): the row stays; show today's error. */
  | { kind: "error"; error: unknown };

/** The SDK error code of a refusal (`code`, else `name`), or `""`. */
export function errorCodeOf(error: unknown): string {
  const code = (error as any)?.code ?? (error as any)?.name;
  return typeof code === "string" ? code : "";
}

/**
 * Delete an unsent row (BEH-SEND-36, R162). An outbox row is discarded on the device with
 * `discardLocalMessage(localMessageId)` (works offline, durable; the SDK moves the conversation
 * preview itself and fires no outbox event), then removed from the screen. A direct failure has
 * no outbox row and is removed from the screen only. Never the server delete for a row with no
 * server id. A row whose send is under way is refused by the SDK (`ERROR_OFFLINE_MESSAGE_IN_FLIGHT`,
 * nothing changes) and raises the "Sending… try again in a moment" notice. Never rejects.
 */
export async function deleteUnsentMessage(message: any, hub: OfflineHub = OfflineHub.getInstance()): Promise<DeleteUnsentOutcome> {
  const localMessageId = localIdOf(message);
  const info = unsentRowInfo(message, hub);
  if (info?.direct || !localMessageId) {
    hub.reportDiscardedByUser(message);
    return { kind: "removed" };
  }
  const sdk = offlineSdk();
  if (typeof sdk?.discardLocalMessage !== "function") {
    return { kind: "error", error: new Error("discardLocalMessage is not available") };
  }
  try {
    await sdk.discardLocalMessage(localMessageId);
  } catch (error) {
    switch (errorCodeOf(error)) {
      case DISCARD_ERROR.inFlight:
        hub.raiseSendInFlightNotice(message);
        return { kind: "in_flight", error };
      case DISCARD_ERROR.notFound: {
        // The SDK no longer holds it: it was sent, or purged with its chat. A row with a server id
        // is a sent message: today's server delete (offline, today's not-connected error). Any
        // other row is removed at once, online or offline, as on Android; if its sent copy still
        // arrives, it is deleted on the server then.
        const serverId = serverIdOf(message) || hub.sentIdFor(localMessageId);
        if (serverId) return sdkConnected() === false ? { kind: "not_connected", error } : { kind: "sent", serverId };
        hub.reportDiscardedByUser(message);
        hub.deleteWhenSent(localMessageId);
        return { kind: "removed" };
      }
      case DISCARD_ERROR.disabled:
        return { kind: "disabled", error };
      default:
        return { kind: "error", error };
    }
  }
  hub.reportDiscardedByUser(message);
  return { kind: "removed" };
}

/** Option ids of the unsent-row menu (stable for integrators' tests and the state contract). */
export const OFFLINE_OPTION_IDS = Object.freeze({
  retry: "offlineRetryMessage",
  delete: "offlineDeleteMessage",
});
