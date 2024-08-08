import React from "react";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageTypeConstants } from "../constants/UIKitConstants";
import { CometChatMessageBubble } from "../views/CometChatMessageBubble";
import { CometChatTheme, localize } from "../resources";
import { ChatConfigurator } from "../framework";
import { CometChatMessageTemplate } from "../modals";
import { BaseStyle, MessageBubbleAlignmentType } from "../base";
import { CometChatUiKitConstants } from "..";

type MessageViewType = {
    message: CometChat.BaseMessage,
    template?: CometChatMessageTemplate,
    alignment?: MessageBubbleAlignmentType,
    theme?: CometChatTheme,
}
//TODO: Need to restructure
const MessageContentView = (props: { message: CometChat.BaseMessage, alignment?: MessageBubbleAlignmentType, theme?: CometChatTheme }):JSX.Element | any => {
    const {
        message,
        alignment,
        theme
    } = props;

    switch (message.getType()) {
        case MessageTypeConstants.audio:
            return ChatConfigurator.dataSource.getAudioMessageContentView(message, alignment, theme);
        case MessageTypeConstants.video:
            return ChatConfigurator.dataSource.getVideoMessageContentView(message, alignment, theme);
        case MessageTypeConstants.file:
            return ChatConfigurator.dataSource.getFileMessageContentView(message, alignment, theme);
        case MessageTypeConstants.text:
            return ChatConfigurator.dataSource.getTextMessageContentView(message, alignment, theme);
        case MessageTypeConstants.image:
            return ChatConfigurator.dataSource.getImageMessageContentView(message, alignment, theme);
        default:
            return null
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
            ContentView={template?.ContentView ? () => template?.ContentView ? template?.ContentView(message, alignment) : null : () => MessageContentView({message,alignment,theme})}
            BottomView={template?.BottomView && template?.BottomView?.bind(this, message, alignment)}
            style={getStyle(message)}
        />;
    },


    getActionMessage: (message: any): string  => {
        let actionMessage = "";
        if (
          message.hasOwnProperty("actionBy") === false ||
          message.hasOwnProperty("actionOn") === false
        ) {
          return actionMessage;
        }
        if (
          message.action !== CometChatUiKitConstants.groupMemberAction.JOINED &&
          message.action !== CometChatUiKitConstants.groupMemberAction.LEFT &&
          (message.actionBy.hasOwnProperty("name") === false ||
            message.actionOn.hasOwnProperty("name") === false)
        ) {
          return actionMessage;
        }
        if (
          message.action === CometChatUiKitConstants.groupMemberAction.SCOPE_CHANGE
        ) {
          if (
            message.hasOwnProperty("data") &&
            message.data.hasOwnProperty("extras")
          ) {
            if (message.data.extras.hasOwnProperty("scope")) {
              if (message.data.extras.scope.hasOwnProperty("new") === false) {
                return actionMessage;
              }
            } else {
              return actionMessage;
            }
          } else {
            return actionMessage;
          }
        }
        if (
          message.action ===
          CometChatUiKitConstants.groupMemberAction.SCOPE_CHANGE &&
          message.data.extras.hasOwnProperty("scope") === false
        ) {
          return actionMessage;
        }
        if (
          message.action ===
          CometChatUiKitConstants.groupMemberAction.SCOPE_CHANGE &&
          message.data.extras.scope.hasOwnProperty("new") === false
        ) {
          return actionMessage;
        }
        const byEntity = message.actionBy;
        const onEntity = message.actionOn;
        const byString = byEntity.name.trim();
        const forString =
          message.action !== CometChatUiKitConstants.groupMemberAction.JOINED &&
            message.action !== CometChatUiKitConstants.groupMemberAction.LEFT
            ? onEntity.name.trim()
            : "";
        switch (message.action) {
          case CometChatUiKitConstants.groupMemberAction.ADDED:
            actionMessage = `${byString} ${localize("ADDED")} ${forString}`;
            break;
          case CometChatUiKitConstants.groupMemberAction.JOINED:
            actionMessage = `${byString} ${localize("JOINED")}`;
            break;
          case CometChatUiKitConstants.groupMemberAction.LEFT:
            actionMessage = `${byString} ${localize("LEFT")}`;
            break;
          case CometChatUiKitConstants.groupMemberAction.KICKED:
            actionMessage = `${byString} ${localize("KICKED")} ${forString}`;
            break;
          case CometChatUiKitConstants.groupMemberAction.BANNED:
            actionMessage = `${byString} ${localize("BANNED")} ${forString}`;
            break;
          case CometChatUiKitConstants.groupMemberAction.UNBANNED:
            actionMessage = `${byString} ${localize("UNBANNED")} ${forString}`;
            break;
          case CometChatUiKitConstants.groupMemberAction.SCOPE_CHANGE: {
            const newScope = message["data"]["extras"]["scope"]["new"];
            actionMessage = `${byString} ${localize(
              "MADE"
            )} ${forString} ${newScope}`;
            break;
          }
          default:
            break;
        }
        return actionMessage;
      }
}