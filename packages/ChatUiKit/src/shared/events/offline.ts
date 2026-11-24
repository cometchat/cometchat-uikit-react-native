/**
 * Public offline events (README §4, additive). Emitted on the existing message event bus
 * (`CometChatUIEventHandler.addMessageListener`) next to `ccMessageSent`, which keeps its meaning
 * and fires once per transition. Never emitted with offline off. `MessageEvents` is not extended,
 * so an exhaustive switch over it keeps compiling.
 */
export const OfflineMessageEvents = Object.freeze({
  ccMessageSendStateChanged: "ccMessageSendStateChanged",
  ccOfflineCacheReset: "ccOfflineCacheReset",
} as const);

/** An own message's send state on the offline path. */
export type MessageSendState = "sending" | "sent" | "failed" | "discarded";

export interface MessageSendStateChangedEvent {
  /** The SDK message (read `getMessageStatus()` / `getLocalMessageId()` on it for details). */
  message: object;
  state: MessageSendState;
  /** The SDK's `MessageFailureReason` for "failed" / "discarded". */
  reason?: string;
}

export interface OfflineCacheResetEvent {
  /** The SDK's `OfflineCacheResetReason`. */
  reason: string;
  /** Unsent messages lost, or `null` when the SDK could not count them. */
  pendingMessagesLost: number | null;
}
