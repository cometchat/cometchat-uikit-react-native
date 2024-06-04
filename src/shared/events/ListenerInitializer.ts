import { CometChat } from "@cometchat/chat-sdk-react-native";
import { Platform } from 'react-native'
import { MessageTypeConstants } from "../constants/UIKitConstants";
import { CometChatUIEventHandler } from "./CometChatUIEventHandler/CometChatUIEventHandler";
import { MessageEvents } from "./messages";

export class ListenerInitializer {
    private static messageListenerId = `ListenerInitializer_listener`;

    public static attachListeners() {
        CometChat.addMessageListener(
            this.messageListenerId,
            this.getMessageListenerObject()
        );
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
                CometChatUIEventHandler.emitMessageEvent(MessageEvents.onMediaMessageReceived, mediaMessage);
            },
            onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
                CometChatUIEventHandler.emitMessageEvent(MessageEvents.onCustomMessageReceived, customMessage);
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
            onInteractiveMessageReceived: (
                message: CometChat.InteractiveMessage
            ) => {
                switch (message.getType()) {
                    case MessageTypeConstants.form:
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onFormMessageReceived, message);
                        break;
                    case MessageTypeConstants.card:
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onCardMessageReceived, message);
                        break;
                    default:
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.onCustomInteractiveMessageReceived, message);
                        break;
                }
            },
            onInteractionGoalCompleted: (reciept: CometChat.InteractionReceipt) => {
                CometChatUIEventHandler.emitMessageEvent(MessageEvents.onInteractionGoalCompleted, reciept);
            }
        });
    }
}