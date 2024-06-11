import React from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageTypeConstants } from "../constants/UIKitConstants";
import { CometChatMessageBubble } from "../views/CometChatMessageBubble";
import { CometChatTheme } from "../resources";
import { ChatConfigurator } from "../framework";
import { CometChatMessageTemplate } from "../modals";
import { BaseStyle, MessageBubbleAlignmentType } from "../base";

type MessageViewType = {
    message: CometChat.BaseMessage,
    template?: CometChatMessageTemplate,
    alignment?: MessageBubbleAlignmentType,
    theme?: CometChatTheme,
}

const MessageContentView = (props: { message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme }) => {
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

        const getStyle = (item: CometChat.BaseMessage) => {
            let _style: BaseStyle = {};

            _style.backgroundColor = (alignment !== "left" && (item.getType() === MessageTypeConstants.text || item.getType() === MessageTypeConstants.meeting)) ? theme?.palette.getPrimary() : theme?.palette.getAccent50();

            return _style;
        };

        return <CometChatMessageBubble
            id={`${message.getId()}`}
            alignment={alignment}
            ContentView={template?.ContentView?.bind(this, message, alignment) || MessageContentView.bind(this, message, alignment, theme)}
            BottomView={template?.BottomView && template?.BottomView?.bind(this, message, alignment)}
            style={getStyle(message)}
        />;
    }
}