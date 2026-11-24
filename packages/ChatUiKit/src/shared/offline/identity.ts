/**
 * Row identity and send state for the offline (ON) path (README §3.2).
 *
 * With offline off none of these helpers decides anything: the OFF path keeps today's id/muid
 * matching and keys exactly. Every SDK accessor is feature-detected, because the kit runs against
 * SDKs that predate the offline release. On RN the derived offline status is
 * `getMessageStatus()`; `getStatus()` is the pre-existing call status and is never read here.
 *
 * @internal
 */
import { isOfflineOn } from "./gate";

/** Message states the offline SDK reports through `getMessageStatus()`. */
export const OfflineMessageStatus = Object.freeze({
  pending: "PENDING",
  sending: "SENDING",
  sent: "SENT",
  delivered: "DELIVERED",
  read: "READ",
  failed: "FAILED",
});

/** Why a send failed (`MessageFailureReason`); identical on every SDK. */
export const OfflineFailureReason = Object.freeze({
  transient: "TRANSIENT",
  permanent: "PERMANENT",
  queueOverflow: "QUEUE_OVERFLOW",
  queueFull: "QUEUE_FULL",
  byteOverflow: "BYTE_OVERFLOW",
  discarded: "DISCARDED",
});

const NON_SENDABLE_CATEGORIES = new Set(["action", "call", "stream"]);

function callIfFunction(target: any, name: string): any {
  try {
    const fn = target?.[name];
    return typeof fn === "function" ? fn.call(target) : undefined;
  } catch {
    return undefined;
  }
}

/** The message's server id as a number; `0` until the server has acked it. */
export function serverIdOf(message: any): number {
  if (!message) return 0;
  const raw = callIfFunction(message, "getId") ?? message.id;
  const id = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

/**
 * The SDK's own local handle, from `getLocalMessageId()` only. Used for render keys, so a message
 * that an older offline session stamped (`data.localMessageId`) keeps today's key with offline off.
 */
export function sdkLocalIdOf(message: any): string {
  const local = callIfFunction(message, "getLocalMessageId");
  return typeof local === "string" ? local : "";
}

/**
 * The SDK's local handle for an own message. RN parses `localMessageId` only on messages it
 * created; a server-parsed copy carries it in `data.localMessageId` (SDK ask A4), so fall back.
 */
export function localIdOf(message: any): string {
  if (!message) return "";
  const local = sdkLocalIdOf(message);
  if (local) return local;
  const data = callIfFunction(message, "getData") ?? message.data;
  const fromData = data && typeof data === "object" ? data.localMessageId : undefined;
  return typeof fromData === "string" && fromData ? fromData : "";
}

export function muidOf(message: any): string {
  if (!message) return "";
  const muid = message.muid ?? callIfFunction(message, "getMuid");
  return typeof muid === "string" || typeof muid === "number" ? String(muid) : "";
}

export function categoryOf(message: any): string {
  const category = callIfFunction(message, "getCategory") ?? message?.category;
  return typeof category === "string" ? category : "";
}

/** The offline send state (`getMessageStatus()`), or `""`. Never read for calls. */
export function statusOf(message: any): string {
  if (!message || categoryOf(message) === "call") return "";
  const status = callIfFunction(message, "getMessageStatus");
  return typeof status === "string" ? status : "";
}

/** The `MessageFailureReason` stamped on a FAILED message, or `""`. */
export function failureReasonOf(message: any): string {
  const reason = callIfFunction(message, "getFailureReason");
  return typeof reason === "string" ? reason : "";
}

/** Delivered by the SDK's catch-up sweep (`getSource() === "SYNC"`). */
export function isSyncDelivered(message: any): boolean {
  return callIfFunction(message, "getSource") === "SYNC";
}

/** PENDING or SENDING: on its way, shown with the clock. */
export function isSending(message: any): boolean {
  const status = statusOf(message);
  return status === OfflineMessageStatus.pending || status === OfflineMessageStatus.sending;
}

/** FAILED in the outbox (derived from status, so it survives a restart). */
export function isOutboxFailed(message: any): boolean {
  return statusOf(message) === OfflineMessageStatus.failed;
}

/**
 * An own message the server has not acked that the offline SDK knows about: PENDING, SENDING or
 * FAILED, or a local id without a server id. Action, call and stream rows never are. With offline
 * off nothing has a local id or an offline status, so this is always false there.
 */
export function isOfflineUnsent(message: any): boolean {
  if (!message || NON_SENDABLE_CATEGORIES.has(categoryOf(message)) || message.isStreamMessage) return false;
  const status = statusOf(message);
  if (status === OfflineMessageStatus.pending || status === OfflineMessageStatus.sending || status === OfflineMessageStatus.failed) {
    return true;
  }
  return serverIdOf(message) === 0 && localIdOf(message) !== "";
}

/** The list key on the ON path: server id once there is one, then the local handle, then the muid. */
export function rowKey(message: any): string {
  const id = serverIdOf(message);
  if (id > 0) return `s:${id}`;
  const local = localIdOf(message);
  if (local) return `l:${local}`;
  return `m:${muidOf(message)}`;
}

/**
 * A render key that stays the same from compose to ack for an own message on the offline path, or
 * `null` to keep today's key. The composer's optimistic row is keyed `muid_<muid>` today, and every
 * later copy keeps it: the pending one the SDK stamps, and the sent one, which is server-parsed and
 * carries its local id only in `data.localMessageId` (SDK ask A4). So the bubble does not remount
 * on ack (UIK-SEND-08). Other senders keep today's key: their muids can collide, and the server
 * echoes their `data.localMessageId` too. With offline off nothing changes: only the offline SDK
 * stamps `getLocalMessageId()`, and an own row stamped by an older session keeps today's key.
 */
export function offlineRenderKey(message: any, loggedInUid?: string): string | null {
  if (!message || message.isStreamMessage) return null;
  const muid = muidOf(message);
  const sdkLocal = sdkLocalIdOf(message);
  if (sdkLocal) return muid ? `muid_${muid}` : `local_${sdkLocal}`;
  if (!loggedInUid || callIfFunction(callIfFunction(message, "getSender"), "getUid") !== loggedInUid) return null;
  if (!isOfflineOn()) return null;
  if (muid) return `muid_${muid}`;
  const local = localIdOf(message);
  return local ? `local_${local}` : null;
}

/** The conversation id a message belongs to, when the SDK has stamped it. */
export function conversationIdOf(message: any): string {
  const id = callIfFunction(message, "getConversationId");
  return typeof id === "string" ? id : "";
}
