import React from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageBubbleAlignmentType, MessageTypeConstants } from "../constants/UIKitConstants";
import { CometChatMessageBubble } from "../views/CometChatMessageBubble";
import { CometChatTheme } from "../resources";
import { ChatConfigurator } from "../framework";
import { CometChatMessageTemplate } from "../modals";

type MessageViewType = {
    message: CometChat.BaseMessage,
    template?: CometChatMessageTemplate,
    alignment?: MessageBubbleAlignmentType,
    theme?: CometChatTheme,
}

const MessageContentView = (props:{message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme}) => {
    const {
        message, 
        alignment,
        theme
    } = props;

    switch (message.getType()) {
        case MessageTypeConstants.audio:
            ChatConfigurator.dataSource.getAudioMessageContentView(message, alignment, theme);
            break;
        case MessageTypeConstants.video:
            ChatConfigurator.dataSource.getVideoMessageContentView(message, alignment, theme);
            break;
        case MessageTypeConstants.file:
            ChatConfigurator.dataSource.getFileMessageContentView(message, alignment, theme);
            break;
        case MessageTypeConstants.text:
            ChatConfigurator.dataSource.getTextMessageContentView(message, alignment, theme);
            break;
        case MessageTypeConstants.image:
            ChatConfigurator.dataSource.getImageMessageContentView(message, alignment, theme);
            break;
    }
}

export const MessageUtils = {
    getMessageView: (params: MessageViewType) => {
        const {
            message,
            template,
            alignment,
            theme,
        } = params
        return <CometChatMessageBubble
            id={`${message.getId()}`}
            alignment={alignment}
            ContentView={template?.ContentView?.bind(this, message, alignment) || MessageContentView.bind(this, message, alignment, theme)}
            style={{backgroundColor: theme?.palette?.getPrimary()}}
    />;
    }
}