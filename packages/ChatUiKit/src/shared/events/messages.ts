export enum MessageEvents {
  /**
   * The logged-in user's subscription to a thread changed. Emitted optimistically
   * on tap and again on the server's answer (or on revert), so the thread header
   * and the message action sheet never disagree without a refetch.
   * Also the channel an integrator's own thread list should listen on.
   */
  ccThreadSubscriptionChanged = "ccThreadSubscriptionChanged",
  ccMessageSent = "ccMessageSent",
  ccMessageDelivered = "ccMessageDelivered",
  ccMessageRead = "ccMessageRead",
  ccMessageDeleted = "ccMessageDeleted",
  ccMessageEdited = "ccMessageEdited",
  ccMarkMessageAsRead = "ccMarkMessageAsRead",
  ccMessageError = "ccMessageError",
  ccActiveChatChanged = "ccActiveChatChanged",
  onTextMessageReceived = "onTextMessageReceived",
  onMediaMessageReceived = "onMediaMessageReceived",
  onCustomMessageReceived = "onCustomMessageReceived",
  onTypingStarted = "onTypingStarted",
  onTypingEnded = "onTypingEnded",
  onMessagesDelivered = "onMessagesDelivered",
  onMessagesRead = "onMessagesRead",
  onMessageEdited = "onMessageEdited",
  onMessageDeleted = "onMessageDeleted",
  onTransientMessageReceived = "onTransientMessageReceived",
  onFormMessageReceived = "onFormMessageReceived",
  onCardMessageReceived = "onCardMessageReceived",
  onSchedulerMessageReceived = "onSchedulerMessageReceived",
  onInteractionGoalCompleted = "onInteractionGoalCompleted",
  onCustomInteractiveMessageReceived = "onCustomInteractiveMessageReceived",
  onMessageReactionAdded = "onMessageReactionAdded",
  onMessageReactionRemoved = "onMessageReactionRemoved",
  onMessageModerated = "onMessageModerated",
  onAIAssistantMessageReceived = "onAIAssistantMessageReceived",
  onMessagesDeliveredToAll = "onMessagesDeliveredToAll",
  onMessagesReadByAll = "onMessagesReadByAll",
  // Pin & Save (§6.6). The `on*` pair is realtime off the socket; `cc*` is the
  // kit's own optimistic emit, so a consumer can tell "the server said so" from
  // "this device just did it and may still revert".
  onMessagePinned = "onMessagePinned",
  onMessageUnpinned = "onMessageUnpinned",
  onMessageSaved = "onMessageSaved",
  onMessageUnsaved = "onMessageUnsaved",
  ccMessagePinned = "ccMessagePinned",
  ccMessageUnpinned = "ccMessageUnpinned",
  ccMessageSaved = "ccMessageSaved",
  ccMessageUnsaved = "ccMessageUnsaved",
}
