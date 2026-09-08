let __listenerIdCounter = 0;
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageTypeConstants } from "../constants/UIKitConstants";
import { CometChatUIEventHandler } from "./CometChatUIEventHandler/CometChatUIEventHandler";
import { MessageEvents } from "./messages";
import * as CometChatUIKitConstants from '../constants/UIKitConstants';

export class ListenerInitializer {
  private static messageListenerId = `ListenerInitializer_listener`;
    static streamListenerId: string = "agent_" + Date.now() + "_" + (++__listenerIdCounter);

  public static attachListeners(user?: CometChat.User) {
    CometChat.addMessageListener(this.messageListenerId, this.getMessageListenerObject());
  }

  public static detachListeners() {
    CometChat.removeMessageListener(this.messageListenerId);
  }

  private static getMessageListenerObject() {
    return new CometChat.MessageListener({
      onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onTextMessageReceived, textMessage);
      },
      onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
        CometChatUIEventHandler.emitMessageEvent(
          MessageEvents.onMediaMessageReceived,
          mediaMessage
        );
      },
      onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
        CometChatUIEventHandler.emitMessageEvent(
          MessageEvents.onCustomMessageReceived,
          customMessage
        );
      },
      onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onTypingStarted, typingIndicator);
      },
      onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onTypingEnded, typingIndicator);
      },
      onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessagesDelivered, messageReceipt);
      },
      onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessagesRead, messageReceipt);
      },
      onMessageEdited: (message: CometChat.BaseMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessageEdited, message);
      },
      onMessageDeleted: (message: CometChat.BaseMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessageDeleted, message);
      },
      onTransientMessageReceived: (message: CometChat.TransientMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onTransientMessageReceived, message);
      },
      onInteractiveMessageReceived: (message: CometChat.InteractiveMessage) => {
        switch (message.getType()) {
          case MessageTypeConstants.form:
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.onFormMessageReceived, message);
            break;
          case MessageTypeConstants.card:
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.onCardMessageReceived, message);
            break;
          case MessageTypeConstants.scheduler:
            CometChatUIEventHandler.emitMessageEvent(
              MessageEvents.onSchedulerMessageReceived,
              message
            );
            break;
          default:
            CometChatUIEventHandler.emitMessageEvent(
              MessageEvents.onCustomInteractiveMessageReceived,
              message
            );
            break;
        }
      },
      onInteractionGoalCompleted: (reciept: CometChat.InteractionReceipt) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onInteractionGoalCompleted, reciept);
      },
      onMessageReactionAdded: (message: CometChat.ReactionEvent) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessageReactionAdded, message);
      },
      onMessageReactionRemoved: (message: CometChat.ReactionEvent) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessageReactionRemoved, message);
      },
      onAIAssistantMessageReceived: (message: CometChat.AIAssistantMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onAIAssistantMessageReceived, message);
      },
      onMessageModerated: (message: CometChat.BaseMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessageModerated, message);
      },
      onMessagesDeliveredToAll: (messageReceipt: CometChat.MessageReceipt) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessagesDeliveredToAll, messageReceipt);
      },
      onMessagesReadByAll: (messageReceipt: CometChat.MessageReceipt) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessagesReadByAll, messageReceipt);
      },
      onCardMessageReceived: (cardMessage: any) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onCardMessageReceived, cardMessage);
      },
      // Pin & Save realtime (§5.5/§6.6). Each carries a FULL BaseMessage with the
      // pin/save attrs already on it, so a consumer replaces its copy and is done
      // — no getMessageDetails round-trip.
      //
      // Pin/unpin is broadcast to the conversation. Save/unsave is private and
      // reaches only this user's own devices, INCLUDING the one that made the
      // call, which is why the SDK exempts it from the self-session guard.
      onMessagePinned: (message: CometChat.BaseMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessagePinned, message);
      },
      onMessageUnpinned: (message: CometChat.BaseMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessageUnpinned, message);
      },
      onMessageSaved: (message: CometChat.BaseMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessageSaved, message);
      },
      onMessageUnsaved: (message: CometChat.BaseMessage) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMessageUnsaved, message);
      },
    });
  }
}
