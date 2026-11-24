/**
 * Retry of a failed own message on the offline-OFF path (plan D1).
 *
 * The bubble's "Retry" used to call a media-only resend that returned early for text and custom
 * messages, so tapping Retry on a failed text did nothing. It also showed on moderation-
 * disapproved rows (which have a server id and must not be re-sent) and re-sent them if media.
 *
 * Rules: Retry is offered only for a row the server never accepted (no server id) that was not
 * rejected by moderation. It clears the kit's error marks and re-sends through the same public
 * `CometChatUIKit.send*` path a first send uses, which re-emits ccMessageSent
 * inprogress -> success/error; the list reconciles by muid in place.
 */

export interface FailedMessageSenders {
  sendText(message: any): Promise<unknown>;
  sendMedia(message: any): Promise<unknown>;
  sendCustom(message: any): Promise<unknown>;
}

function serverId(message: any): unknown {
  return typeof message?.getId === "function" ? message.getId() : message?.id;
}

/** Whether the failed row may offer Retry (no server id, not rejected by moderation). */
export function isRetryableFailedRow(message: any, moderationStatus?: string): boolean {
  if (!message) return false;
  if (moderationStatus === "disapproved") return false;
  const id = serverId(message);
  return id === undefined || id === null || id === "" || id === 0 || id === "0";
}

/** Remove the error marks the send paths stamp (data.metaData.error, metadata.error, .error). */
export function clearSendErrorMarks(message: any): void {
  const data: any = message?.getData?.() || {};
  if (data?.metaData?.error) {
    delete data.metaData.error;
    message?.setData?.(data);
  }
  const metadata: any = message?.getMetadata?.();
  if (metadata?.error) {
    delete metadata.error;
    message?.setMetadata?.(metadata);
  }
  if (message && "error" in message) message.error = undefined;
}

/** Which send a message goes through: "media", "custom" or "text"; `null` for anything else. */
export function resendKindOf(message: any): "text" | "media" | "custom" | null {
  const category = message?.getCategory?.();
  const type = message?.getType?.();
  if (category === "custom") return "custom";
  if (category === "message") {
    if (type === "text") return "text";
    if (type === "image" || type === "video" || type === "audio" || type === "file") return "media";
  }
  return null;
}

/** Re-send a failed row. Returns false when the row may not be retried. Never throws. */
export function resendFailedMessage(message: any, senders: FailedMessageSenders, moderationStatus?: string): boolean {
  try {
    if (!isRetryableFailedRow(message, moderationStatus)) return false;
    const kind = resendKindOf(message);
    if (!kind) return false;
    clearSendErrorMarks(message);
    const send = kind === "media" ? senders.sendMedia : kind === "custom" ? senders.sendCustom : senders.sendText;
    // On failure the send path re-applies the error mark and emits ccMessageSent(error).
    send(message).catch(() => {});
    return true;
  } catch {
    return false;
  }
}
