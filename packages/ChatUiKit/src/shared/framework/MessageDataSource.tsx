import React, { JSX } from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import {
  CometChatMentionsFormatter,
  CometChatTextFormatter,
  CometChatUIKit,
  CometChatUrlsFormatter,
} from "../..";
import { CometChatTheme } from "../../theme/type";
import {
  AdditionalAttachmentOptionsParams,
  AdditionalAuxiliaryHeaderOptionsParams,
  AdditionalAuxiliaryOptionsParams,
  AdditionalParams,
  MessageBubbleAlignmentType,
} from "../base/Types";
import {
  CometChatMessageTypes,
  GroupMemberScope,
  MentionsTargetElement,
  MessageCategoryConstants,
  MessageOptionConstants,
  MessageTypeConstants,
} from "../constants/UIKitConstants";
import { CometChatUiKitConstants } from "../index";
import { CometChatMessageComposerAction } from "../helper/types";
import { Icon } from "../icons/Icon";
import { CometChatMessageOption } from "../modals/CometChatMessageOption";
import { CometChatMessageTemplate } from "../modals/CometChatMessageTemplate";
import { CometChatConversationUtils } from "../utils/conversationUtils";
import { CometChatAudioBubble } from "../views/CometChatAudioBubble";
import { CometChatDeletedBubble } from "../views/CometChatDeletedBubble";
import { CometChatFileBubble } from "../views/CometChatFileBubble";
import { CometChatImageBubble } from "../views/CometChatImageBubble";
import { CometChatMessagePreview } from "../utils/CometChatMessagePreview";
import { CometChatTextBubble } from "../views/CometChatTextBubble";
import { CometChatVideoBubble } from "../views/CometChatVideoBubble";
import CometChatAIAssistantMessageBubble from '../views/CometChatAIAssistantMessageBubble/CometChatAIAssistantMessageBubble';
import CometChatStreamMessageBubble from '../views/CometChatStreamMessageBubble/CometChatStreamMessageBubble';
import { ChatConfigurator } from "./ChatConfigurator";
import { DataSource } from "./DataSource";
import { CommonUtils } from "../utils/CommonUtils";
import { DimensionValue, TouchableOpacity, ViewStyle, View, Text } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { getCometChatTranslation } from "../resources/CometChatLocalizeNew/LocalizationManager";
import { CometChatMessageEvents } from "../events/CometChatMessageEvents";

const t = getCometChatTranslation();

export enum MentionContext {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}

function isAudioMessage(message: CometChat.BaseMessage): message is CometChat.MediaMessage {
  return (
    message.getCategory() == CometChat.CATEGORY_MESSAGE &&
    message.getType() == CometChat.MESSAGE_TYPE.AUDIO
  );
}

function isVideoMessage(message: CometChat.BaseMessage): message is CometChat.MediaMessage {
  return (
    message.getCategory() == CometChat.CATEGORY_MESSAGE &&
    message.getType() == CometChat.MESSAGE_TYPE.VIDEO
  );
}

function isFileMessage(message: CometChat.BaseMessage): message is CometChat.MediaMessage {
  return (
    message.getCategory() == CometChat.CATEGORY_MESSAGE &&
    message.getType() == CometChat.MESSAGE_TYPE.FILE
  );
}

function isActionMessage(message: CometChat.BaseMessage): message is CometChat.Action {
  return message.getCategory() == CometChat.CATEGORY_ACTION;
}

function isTextMessage(message: CometChat.BaseMessage): message is CometChat.TextMessage {
  return (
    message.getCategory() == CometChat.CATEGORY_MESSAGE &&
    message.getType() == CometChat.MESSAGE_TYPE.TEXT
  );
}

function isImageMessage(message: CometChat.BaseMessage): message is CometChat.MediaMessage {
  return (
    message.getCategory() == CometChat.CATEGORY_MESSAGE &&
    message.getType() == CometChat.MESSAGE_TYPE.IMAGE
  );
}

function isDeletedMessage(message: CometChat.BaseMessage): boolean {
  return message.getDeletedBy() != null;
}

export class MessageDataSource implements DataSource {

  // --- AI/Tool/Stream Bubble Implementations ---
  getAgentAssistantMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element {
    return <CometChatAIAssistantMessageBubble message={message} theme={theme} />;
  }

  getStreamMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element {
    return <CometChatStreamMessageBubble key={message.getId() + message.getType()} message={message} theme={theme} />;
  }

  handleCopy = (message: CometChat.BaseMessage) => {
    try {
      let textToCopy = "";

      if (isTextMessage(message)) {
        textToCopy = message.getText();
      } else {
        const messageData = message as any;
        textToCopy = messageData.data?.text ||
          messageData.data?.content ||
          messageData.text ||
          messageData.content || "";
      }

      if (textToCopy?.trim()) {
        Clipboard.setString(textToCopy);
      }
    } catch (err) {
      console.error(err);
    }
  };


  getAgentAssistantMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: 'assistant',
      category: 'agentic',
      ContentView: (message: CometChat.BaseMessage) => 
        this.getAgentAssistantMessageBubble(message, theme),

      options: undefined,

      FooterView: (message: CometChat.BaseMessage) => (
        <TouchableOpacity onPress={() => this.handleCopy(message as CometChat.AIAssistantMessage)}>
          <Icon name="ai-copy-option" width={24} height={24} containerStyle={{marginLeft: 10, marginBottom: -20}} color={theme.color.textSecondary} />
        </TouchableOpacity>
      ),
    });
  }

  getStreamMessageTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUiKitConstants.streamMessageTypes.run_started,
      category: MessageCategoryConstants.stream,
      ContentView: (message: CometChat.BaseMessage) => this.getStreamMessageBubble(message, theme),
      options: undefined,
      FooterView: undefined,
    });
  }
  getEditOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.editMessage,
      title: t("EDIT"),
      icon: (
        <Icon
          name='edit'
          color={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.tintColor
          }
          height={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height}
          width={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
    };
  }

  getDeleteOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.deleteMessage,
      title: t("DELETE"),
      icon: (
        <Icon
          name='delete'
          color={theme.color.error}
          height={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height}
          width={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
      style: {
        titleStyle: {
          color: theme.color.error,
        },
      },
    };
  }
  getReplyOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.replyMessage,
      title: t("REPLY"),
      icon: (
        <Icon
          name='reply'
          color={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.tintColor
          }
          height={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height}
          width={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
    };
  }
  getReplyInThreadOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.replyInThread,
      title: t("REPLY_IN_THREAD"),
      icon: (
        <Icon
          name='subdirectory-arrow-right'
          color={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.tintColor
          }
          height={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height}
          width={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
    };
  }

  getReportOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.reportMessage,
      title: t("Message_List_Option_Flag_Message"),
      icon: (
        <Icon
          name='info'
          color={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.tintColor
          }
          height={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height}
          width={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
    };
  }

  getShareOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.shareMessage,
      title: t("SHARE"),
      icon: (
        <Icon
          name='share'
          color={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.tintColor
          }
          height={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height}
          width={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
    };
  }
  getCopyOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.copyMessage,
      title: t("COPY"),
      icon: (
        <Icon
          name='content-copy'
          color={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.tintColor
          }
          height={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height}
          width={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
    };
  }

  getMarkAsUnreadOption(theme: CometChatTheme): CometChatMessageOption {
      return {
      id: MessageOptionConstants.markAsUnread,
      title: t("MARK_AS_UNREAD"),
      icon: (
        <Icon
          name='unread'
          color={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.tintColor
          }
          height={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height}
          width={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
    };
  }
  // getForwardOption(): CometChatMessageOption {
  //     return {
  //         id: MessageOptionConstants.forwardMessage,
  //         title: t("FORWARD"),
  //         icon: ICONS.FORWARD
  //     }
  // }
  getInformationOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.messageInformation,
      title: t("INFO"),
      icon: (
        <Icon
          name='info'
          color={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.tintColor
          }
          height={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height}
          width={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
    };
  }

  getPrivateMessageOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.sendMessagePrivately,
      title: t("MESSAGE_PRIVATELY"),
      icon: (
        <Icon
          name='reply'
          imageStyle={theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconStyle}
          containerStyle={
            theme.messageListStyles.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
    };
  }

  isSentByMe(loggedInUser: CometChat.User, message: CometChat.BaseMessage) {
    if (!loggedInUser) return false;
    return loggedInUser.getUid() == message?.getSender()?.getUid();
  }

  getTextMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): CometChatMessageOption[] {
    let messageOptionList: CometChatMessageOption[] = [];

    if (isDeletedMessage(messageObject)) return messageOptionList;

    // reply in thread
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.replyInThread,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getReplyInThreadOption(theme));
    }

    // reply
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.replyMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getReplyOption(theme));
    }

    // share
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.shareMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getShareOption(theme));
    }

    // copy
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.copyMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getCopyOption(theme));
    }

    // mark as unread
    if(
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.markAsUnread,
        group,
        additionalParams,

      )
    ) {
      messageOptionList.push(this.getMarkAsUnreadOption(theme));
    }

    // report
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.reportMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getReportOption(theme));
    }

    // message privately
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.sendMessagePrivately,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getPrivateMessageOption(theme));
    }
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.editMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getEditOption(theme));
    }

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.messageInformation,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getInformationOption(theme));
    }

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.deleteMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getDeleteOption(theme));
    }

    return messageOptionList;
  }

  getAudioMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): CometChatMessageOption[] {
    let optionsList: Array<CometChatMessageOption> = [];
    if (!isDeletedMessage(messageObject))
      optionsList.push(
        ...ChatConfigurator.dataSource.getCommonOptions(
          loggedInUser,
          messageObject,
          theme,
          group,
          additionalParams
        )
      );
    return optionsList;
  }
  getVideoMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): CometChatMessageOption[] {
    let optionsList: Array<CometChatMessageOption> = [];
    if (!isDeletedMessage(messageObject))
      optionsList.push(
        ...ChatConfigurator.dataSource.getCommonOptions(
          loggedInUser,
          messageObject,
          theme,
          group,
          additionalParams
        )
      );
    return optionsList;
  }
  getImageMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): CometChatMessageOption[] {
    let optionsList: Array<CometChatMessageOption> = [];
    if (!isDeletedMessage(messageObject))
      optionsList.push(
        ...ChatConfigurator.dataSource.getCommonOptions(
          loggedInUser,
          messageObject,
          theme,
          group,
          additionalParams
        )
      );
    return optionsList;
  }
  getFileMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): CometChatMessageOption[] {
    let optionsList: Array<CometChatMessageOption> = [];
    if (!isDeletedMessage(messageObject))
      optionsList.push(
        ...ChatConfigurator.dataSource.getCommonOptions(
          loggedInUser,
          messageObject,
          theme,
          group,
          additionalParams
        )
      );
    return optionsList;
  }
  getMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): CometChatMessageOption[] {
    let optionsList: Array<CometChatMessageOption> = [];
    if (isDeletedMessage(messageObject)) return optionsList;
    if (messageObject.getCategory() == MessageCategoryConstants.message) {
      let type: string = messageObject.getType();
      switch (type) {
        case MessageTypeConstants.audio:
          optionsList.push(
            ...ChatConfigurator.dataSource.getAudioMessageOptions(
              loggedInUser,
              messageObject,
              theme,
              group,
              additionalParams
            )
          );
          break;
        case MessageTypeConstants.video:
          optionsList.push(
            ...ChatConfigurator.dataSource.getVideoMessageOptions(
              loggedInUser,
              messageObject,
              theme,
              group,
              additionalParams
            )
          );
          break;
        case MessageTypeConstants.image:
          optionsList.push(
            ...ChatConfigurator.dataSource.getImageMessageOptions(
              loggedInUser,
              messageObject,
              theme,
              group,
              additionalParams
            )
          );
          break;
        case MessageTypeConstants.text:
          optionsList.push(
            ...ChatConfigurator.dataSource.getTextMessageOptions(
              loggedInUser,
              messageObject,
              theme,
              group,
              additionalParams
            )
          );
          break;
        case MessageTypeConstants.file:
          optionsList.push(
            ...ChatConfigurator.dataSource.getFileMessageOptions(
              loggedInUser,
              messageObject,
              theme,
              group,
              additionalParams
            )
          );
          break;
      }
    } else if (messageObject.getCategory() == MessageCategoryConstants.custom) {
      optionsList.push(
        ...ChatConfigurator.dataSource.getCommonOptions(
          loggedInUser,
          messageObject,
          theme,
          group,
          additionalParams
        )
      );
    } else if (messageObject.getCategory() == MessageCategoryConstants.interactive) {
      let type: string = messageObject.getType();
      //todo: unsupportedBubble
    }
    return optionsList;
  }

  private validateOption(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    optionId: string,
    group?: CometChat.Group | null,
    additionalParams?: AdditionalParams
  ): boolean {
    if (
      MessageOptionConstants.replyMessage === optionId &&
      !additionalParams?.hideReplyOption
    ) {
      return true;
    }

    if (
      MessageOptionConstants.replyInThread === optionId &&
      (!messageObject.getParentMessageId() || messageObject.getParentMessageId() === 0) &&
      !additionalParams?.hideReplyInThreadOption
    ) {
      return true;
    }

    if (
      MessageOptionConstants.shareMessage === optionId &&
      (messageObject instanceof CometChat.TextMessage ||
        messageObject instanceof CometChat.MediaMessage) &&
      !additionalParams?.hideShareMessageOption
    ) {
      return true;
    }

    if (
      MessageOptionConstants.copyMessage === optionId &&
      messageObject instanceof CometChat.TextMessage &&
      !additionalParams?.hideCopyMessageOption
    ) {
      return true;
    }

    let isSentByMe: boolean = this.isSentByMe(loggedInUser, messageObject);

    if (
      MessageOptionConstants.messageInformation === optionId &&
      isSentByMe &&
      !additionalParams?.hideMessageInfoOption
    ) {
      return true;
    }

    let memberIsNotParticipant: boolean = !!(
      group &&
      (group.getOwner() === loggedInUser.getUid() ||
        group.getScope() !== GroupMemberScope.participant)
    );

    if (
      MessageOptionConstants.deleteMessage === optionId &&
      (isSentByMe || memberIsNotParticipant) &&
      !additionalParams?.hideDeleteMessageOption
    ) {
      return true;
    }

    if (
      MessageOptionConstants.editMessage === optionId &&
      (isSentByMe || memberIsNotParticipant) &&
      !additionalParams?.hideEditMessageOption
    ) {
      return true;
    }

    if (
      MessageOptionConstants.sendMessagePrivately === optionId &&
      group &&
      loggedInUser.getUid() != messageObject.getSender()?.getUid() &&
      !additionalParams?.hideMessagePrivatelyOption
    ) {
      return true;
    }

    if (
      MessageOptionConstants.reportMessage === optionId &&
      !isSentByMe &&
      !additionalParams?.hideReportMessageOption
    ) {
      return true;
    }
   

    if (
      MessageOptionConstants.markAsUnread === optionId &&
      !isSentByMe &&
      !additionalParams?.hideMarkAsUnreadOption
    ) {
      return true;
    }

    return false;
  }

  getCommonOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): CometChatMessageOption[] {
    let messageOptionList: CometChatMessageOption[] = [];

    if (isDeletedMessage(messageObject)) return messageOptionList;
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.replyMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getReplyOption(theme));
    }

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.replyInThread,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getReplyInThreadOption(theme));
    }

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.shareMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getShareOption(theme));
    }

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.messageInformation,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getInformationOption(theme));
    }

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.deleteMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getDeleteOption(theme));
    }

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.reportMessage,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getReportOption(theme));
    }

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.sendMessagePrivately,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getPrivateMessageOption(theme));
    }

    if(
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.markAsUnread,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getMarkAsUnreadOption(theme));
    }

    return messageOptionList;
  }

  /**
 * Returns a localized group action message string for group events (added, kicked, banned, etc.)
 */
  getActionMessage(message: any): string {

    let actionMessage = "";

    if (!message || typeof message !== "object") {
      return "";
    }

    const action =
      message.action ||
      message.data?.action ||
      message.rawMessage?.action;

    const actionBy = message.actionBy || message.rawMessage?.actionBy;
    const actionOn = message.actionOn || message.rawMessage?.actionOn;

    // Do NOT require actionOn for JOINED/LEFT.
    const requiresActionOn = action !== "joined" && action !== "left";

    if (!actionBy || (requiresActionOn && !actionOn)) {
      return message.message || "";
    }

    // Names (JOINED/LEFT only need byName)
    const byName = actionBy?.name || "User";
    const onName = requiresActionOn ? (actionOn?.name || "User") : "";

    const GroupMemberAction = {
      ADDED: "added",
      JOINED: "joined",
      LEFT: "left",
      KICKED: "kicked",
      BANNED: "banned",
      UNBANNED: "unbanned",
      SCOPE_CHANGE: "scopeChanged",
    } as const;

    switch (action) {
      case GroupMemberAction.ADDED:
        // Use template string with placeholders for names
        actionMessage = t("MESSAGE_LIST_ACTION_ADDED").replace("${byName}", byName).replace("${onName}", onName);
        // Fallback to simpler format if template is missing
        if (actionMessage === "MESSAGE_LIST_ACTION_ADDED") {
          actionMessage = `${byName} ${t("ADDED")} ${onName}`;
        }
        break;

      case GroupMemberAction.JOINED:
        // No onName needed
        actionMessage = t("MESSAGE_LIST_ACTION_JOINED").replace("${byName}", byName);
        if (actionMessage === "MESSAGE_LIST_ACTION_JOINED") {
          actionMessage = `${byName} ${t("JOINED")}`;
        }
        break;

      case GroupMemberAction.LEFT:
        // No onName needed
        actionMessage = t("MESSAGE_LIST_ACTION_LEFT").replace("${byName}", byName);
        if (actionMessage === "MESSAGE_LIST_ACTION_LEFT") {
          actionMessage = `${byName} ${t("LEFT")}`;
        }
        break;

      case GroupMemberAction.KICKED:
        actionMessage = t("MESSAGE_LIST_ACTION_KICKED").replace("${byName}", byName).replace("${onName}", onName);
        if (actionMessage === "MESSAGE_LIST_ACTION_KICKED") {
          actionMessage = `${byName} ${t("KICKED")} ${onName}`;
        }
        break;

      case GroupMemberAction.BANNED:
        actionMessage = t("MESSAGE_LIST_ACTION_BANNED").replace("${byName}", byName).replace("${onName}", onName);
        if (actionMessage === "MESSAGE_LIST_ACTION_BANNED") {
          actionMessage = `${byName} ${t("BANNED")} ${onName}`;
        }
        break;

      case GroupMemberAction.UNBANNED:
        actionMessage = t("MESSAGE_LIST_ACTION_UNBANNED").replace("${byName}", byName).replace("${onName}", onName);
        if (actionMessage === "MESSAGE_LIST_ACTION_UNBANNED") {
          actionMessage = `${byName} ${t("UNBANNED")} ${onName}`;
        }
        break;

      case GroupMemberAction.SCOPE_CHANGE: {
        const newScope =
          message.newScope ||
          message.data?.extras?.scope?.new ||
          message.rawMessage?.data?.extras?.scope?.new ||
          "";

        const translatedRole = newScope ? t(newScope.toUpperCase()) : "";

        // Template with three placeholders
        actionMessage = t("MESSAGE_LIST_ACTION_SCOPE_CHANGED")
          .replace("${byName}", byName)
          .replace("${onName}", onName)
          .replace("${role}", translatedRole);

        if (actionMessage === "MESSAGE_LIST_ACTION_SCOPE_CHANGED") {
          actionMessage = `${byName} ${t("MADE")} ${onName} ${translatedRole}`.trim();
        }
        break;
      }

      default:
        actionMessage = message.message || "";
        break;
    }

    return actionMessage;
  }

  getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element | null {
    if (isActionMessage(message)) {
      const messageText = this.getActionMessage(message)
      return (
        <CometChatTextBubble
          text={messageText}
          textContainerStyle={theme.messageListStyles?.groupActionBubbleStyles?.textContainerStyle}
          textStyle={theme?.messageListStyles?.groupActionBubbleStyles?.textStyle}
        />
      );
    }
    return null;
  }

  getBottomView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType
  ): JSX.Element | null {
    return null;
  }

  getReplyView(
    message: CometChat.BaseMessage,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element | null {
    const hasQuotedMessage = message.getQuotedMessage();
    
    if (!hasQuotedMessage || 
        message instanceof CometChat.Action || 
        message.getDeletedAt()) {
      return null;
    }

    // Check if the original message is outgoing to determine styling
    const loggedInUser = CometChatUIKit.loggedInUser;
    const isOutgoingMessage = loggedInUser && message.getSender().getUid() === loggedInUser.getUid();
    
    const isQuotedMessageDeleted = hasQuotedMessage.getDeletedBy() != null;
    
    // Create custom theme with overridden colors for reply view
    const replyTheme = {
      ...theme,
      color: {
        ...theme.color,
        textPrimary: isOutgoingMessage ? theme.color.staticWhite : theme.color.textHighlight,
        textSecondary: isOutgoingMessage ? theme.color.staticWhite : theme.color.textSecondary,
      }
    };

    // Handle click to navigate to quoted message
    const handleReplyClick = () => {
      if (!isQuotedMessageDeleted) {
        const messageId = String(hasQuotedMessage.getId());
        if (additionalParams?.onReplyClick) {
          additionalParams.onReplyClick(messageId);
        }
      }
    };

    const previewComponent = (
      <CometChatMessagePreview
        message={hasQuotedMessage}
        theme={replyTheme}
        style={{
          backgroundColor: isOutgoingMessage ? theme.color.extendedPrimary800 : theme.color.neutral400,
          borderRadius: 8,
          borderWidth: 0,
          borderLeftWidth: 3,
          borderLeftColor: isOutgoingMessage ? theme.color.staticWhite : theme.color.borderHighlight,
          margin:2,
          width:"98%"
        }}
        showCloseIcon={false}
        isDeletedMessage={isQuotedMessageDeleted}
      />
    );

    // Wrap with TouchableOpacity for click handling
    if (additionalParams?.onReplyClick && !isQuotedMessageDeleted) {
      const replyTouchableStyle = { padding: theme.spacing.padding.p0_5 };
      return (
        <TouchableOpacity onPress={handleReplyClick} activeOpacity={0.7} style={replyTouchableStyle}>
          {previewComponent}
        </TouchableOpacity>
      );
    }

    return previewComponent;
  }

  getDeleteMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element {
    let loggedInUser = CometChatUIKit.loggedInUser;

    const _style =
      loggedInUser && message.getSender().getUid() === loggedInUser.getUid()
        ? theme.messageListStyles.outgoingMessageBubbleStyles
        : theme.messageListStyles.incomingMessageBubbleStyles;
    return <CometChatDeletedBubble style={_style?.deletedBubbleStyles} />;
  }

  getVideoMessageBubble(
    videoUrl: string,
    thumbnailUrl: string,
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element | null {
    let loggedInUser = CometChatUIKit.loggedInUser;
    if (isVideoMessage(message)) {
      const _style =
        message.getSender().getUid() === loggedInUser!.getUid()
          ? theme.messageListStyles.outgoingMessageBubbleStyles?.videoBubbleStyles
          : theme.messageListStyles.incomingMessageBubbleStyles?.videoBubbleStyles;
      return (
        <CometChatVideoBubble
          videoUrl={videoUrl}
          thumbnailUrl={{ uri: thumbnailUrl }}
          imageStyle={_style?.imageStyle}
          playIcon={_style?.playIcon}
          playIconStyle={_style?.playIconStyle}
          playIconContainerStyle={_style?.playIconContainerStyle}
          placeholderImage={_style?.placeholderImage}
        />
      );
    }
    return null;
  }

  getTextMessageBubble(
    messageText: string,
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element {
    let loggedInUser = CometChatUIKit.loggedInUser;
    let mentionedUsers = message.getMentionedUsers();
    let textFormatters = [...(additionalParams?.textFormatters || [])];
    const isMessageSentByLoggedInUser = message.getSender().getUid() === loggedInUser!.getUid();
    const _style: Partial<CometChatTheme["textBubbleStyles"]> = isMessageSentByLoggedInUser
      ? (theme.messageListStyles.outgoingMessageBubbleStyles
          .textBubbleStyles as CometChatTheme["textBubbleStyles"])
      : (theme.messageListStyles.incomingMessageBubbleStyles
          .textBubbleStyles as CometChatTheme["textBubbleStyles"]);

    let linksTextFormatter = ChatConfigurator.getDataSource().getUrlsFormatter(loggedInUser!);
    let mentionsTextFormatter = ChatConfigurator.getDataSource().getMentionsFormatter(
      loggedInUser!,
      theme
    );
    mentionsTextFormatter.setContext(isMessageSentByLoggedInUser ? MentionContext.Outgoing : MentionContext.Incoming);
    linksTextFormatter.setMessage(message);
    linksTextFormatter.setId("ccDefaultUrlsFormatterId");
    linksTextFormatter.setStyle({ linkTextColor: theme.color.receiveBubbleLink });
    if (isMessageSentByLoggedInUser) {
      linksTextFormatter.setStyle({ linkTextColor: theme.color.sendBubbleText });
    }

    if (!additionalParams?.disableMentions && mentionedUsers && mentionedUsers.length) {
      mentionsTextFormatter.setLoggedInUser(loggedInUser!);
      mentionsTextFormatter.setMessage(message);
      mentionsTextFormatter.setId("ccDefaultMentionFormatterId");
    }

    let finalFormatters: CometChatTextFormatter[] = [];

    let urlFormatterExists = false;
    let mentionsFormatterExists = false;

    for (const formatter of textFormatters) {
      if (formatter instanceof CometChatUrlsFormatter) {
        urlFormatterExists = true;
      }

      if (formatter instanceof CometChatMentionsFormatter) {
        mentionsFormatterExists = true;
        formatter.setMessage(message);
        formatter.setTargetElement(MentionsTargetElement.textbubble);
        formatter.setLoggedInUser(CometChatUIKit.loggedInUser!);
        formatter.setContext(isMessageSentByLoggedInUser ? "outgoing" : "incoming");
      }

      formatter.setMessage(message);
      finalFormatters.push(CommonUtils.clone(formatter));
      if (urlFormatterExists && mentionsFormatterExists) {
        break;
      }
    }

    if (!urlFormatterExists) {
      finalFormatters.push(linksTextFormatter);
    }
    if (!mentionsFormatterExists) {
      finalFormatters.push(mentionsTextFormatter);
    }
    return (
      <CometChatTextBubble
        text={messageText}
        textStyle={_style?.textStyle}
        textFormatters={finalFormatters}
      />
    );
  }

  getImageMessageBubble(
    imageUrl: string,
    caption: string,
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element {
    let loggedInUser = CometChatUIKit.loggedInUser;
    if (isImageMessage(message)) {
      const _style =
        message.getSender().getUid() === loggedInUser!.getUid()
          ? theme.messageListStyles.outgoingMessageBubbleStyles?.imageBubbleStyles
          : theme.messageListStyles.incomingMessageBubbleStyles?.imageBubbleStyles;

      return <CometChatImageBubble imageUrl={{ uri: imageUrl }} style={_style?.imageStyle} />;
    }
    return <></>;
  }

  getAudioMessageBubble(
    audioUrl: string,
    title: string,
    style: any, //ToDoM: remove any
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element {
    let loggedInUser = CometChatUIKit.loggedInUser;
    if (isAudioMessage(message)) {
      const _style =
        message.getSender().getUid() === loggedInUser!.getUid()
          ? theme.messageListStyles.outgoingMessageBubbleStyles?.audioBubbleStyles
          : theme.messageListStyles.incomingMessageBubbleStyles?.audioBubbleStyles;
      return (
        <CometChatAudioBubble
          audioUrl={audioUrl}
          //title={title}
          playViewContainerStyle={_style?.playViewContainerStyle}
          playIconStyle={_style?.playIconStyle}
          playIconContainerStyle={_style?.playIconContainerStyle}
          waveStyle={_style?.waveStyle}
          waveContainerStyle={_style?.waveContainerStyle}
          playProgressTextStyle={_style?.playProgressTextStyle}
        />
      );
    }
    return <></>;
  }

  getFileMessageBubble(
    fileUrl: string,
    title: string,
    style: any, //ToDoM: remove any
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element {
    let loggedInUser = CometChatUIKit.loggedInUser;
    if (isFileMessage(message)) {
      const metaData = {
        attachmentObject: message.getAttachment(),
        timeStamp: message.getSentAt(),
      };

      let subtitle: string = "";

      if (
        metaData.attachmentObject &&
        Object.keys(metaData.attachmentObject).length &&
        metaData.timeStamp
      ) {
        const timestamp = metaData.timeStamp * 1000;
        const date = new Date(timestamp);

        // Format the date as "15 Oct, 2024"
        const formattedDate = date
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/(\w{3}) (\d{4})/, "$1, $2");

        const attachmentObject = metaData.attachmentObject;
        let fileSizeInKB, extension, fileType;
        if (attachmentObject && Object.keys(attachmentObject).length) {
          fileSizeInKB = Math.round(attachmentObject.getSize() / 1024);
          extension =
            attachmentObject.getExtension() && attachmentObject.getExtension().toUpperCase();
          fileType = extension === "PDF" ? "PDF" : extension;
        }
        subtitle = `${formattedDate} • ${fileSizeInKB ? fileSizeInKB + " KB" : "----"} • ${
          fileType ? fileType : "----"
        }`;
      }

      const _style =
        message.getSender().getUid() === loggedInUser!.getUid()
          ? theme.messageListStyles.outgoingMessageBubbleStyles?.fileBubbleStyles
          : theme.messageListStyles.incomingMessageBubbleStyles?.fileBubbleStyles;
      return (
        <CometChatFileBubble
          fileUrl={fileUrl}
          title={title}
          titleStyle={_style?.titleStyle}
          subtitleStyle={_style?.subtitleStyle}
          downloadIcon={_style?.downloadIcon}
          downloadIconStyle={_style?.downloadIconStyle}
          subtitle={subtitle}
        />
      );
    }
    return <></>;
  }
  getTextMessageContentView(
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element {
    return ChatConfigurator.dataSource.getTextMessageBubble(
      message.getText(),
      message,
      alignment,
      theme,
      additionalParams
    );
  }
  getAudioMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ): JSX.Element {
    let attachment = message.getAttachment();
    return ChatConfigurator.dataSource.getAudioMessageBubble(
      attachment.getUrl(),
      attachment.getName(),
      {},
      message,
      theme
    );
  }
  getVideoMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ): JSX.Element | null {
    let attachment = message.getAttachment();
    return ChatConfigurator.dataSource.getVideoMessageBubble(
      attachment.getUrl(),
      "",
      message,
      theme
    );
  }
  getImageMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ): JSX.Element | null {
    let attachment = message.getAttachment();
    let url: string = attachment.getUrl();
    if (url == undefined) url = message["data"]["url"];

    return ChatConfigurator.dataSource.getImageMessageBubble(
      url,
      attachment.getName(),
      message,
      theme
    );
  }
  getFileMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ): JSX.Element {
    let attachment = message.getAttachment();
    return ChatConfigurator.dataSource.getFileMessageBubble(
      attachment.getUrl(),
      attachment.getName(),
      {},
      message,
      theme
    );
  }

  getTextMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: MessageTypeConstants.text,
      category: MessageCategoryConstants.message,
      ContentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignmentType) => {
        if (isDeletedMessage(message)) {
          return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
        } else {
          return ChatConfigurator.dataSource.getTextMessageContentView(
            message,
            _alignment,
            theme,
            additionalParams
          );
        }
      },
      options: (loggedInuser, message, theme, group) =>
        ChatConfigurator.dataSource.getTextMessageOptions(
          loggedInuser,
          message,
          theme,
          group,
          additionalParams
        ),
      ReplyView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        const replyView = ChatConfigurator.dataSource.getReplyView?.(message, theme, additionalParams) || null;
        return replyView;
      },
      BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getBottomView(message, alignment);
      },
    });
  }

  getAudioMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: MessageTypeConstants.audio,
      category: MessageCategoryConstants.message,
      ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        if (isDeletedMessage(message)) {
          return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
        } else
          return ChatConfigurator.dataSource.getAudioMessageContentView(message, alignment, theme);
      },
      options: (loggedInuser, message, theme, group) =>
        ChatConfigurator.dataSource.getAudioMessageOptions(
          loggedInuser,
          message,
          theme,
          group,
          additionalParams
        ),
      ReplyView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getReplyView?.(message, theme, additionalParams) || null;
      },
      BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getBottomView(message, alignment);
      },
    });
  }
  getVideoMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: MessageTypeConstants.video,
      category: MessageCategoryConstants.message,
      ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        if (isDeletedMessage(message)) {
          return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
        } else
          return ChatConfigurator.dataSource.getVideoMessageContentView(message, alignment, theme);
      },
      options: (loggedInuser, message, theme, group) =>
        ChatConfigurator.dataSource.getVideoMessageOptions(
          loggedInuser,
          message,
          theme,
          group,
          additionalParams
        ),
      ReplyView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getReplyView?.(message, theme, additionalParams) || null;
      },
      BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getBottomView(message, alignment);
      },
    });
  }
  getImageMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: MessageTypeConstants.image,
      category: MessageCategoryConstants.message,
      ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        if (isDeletedMessage(message)) {
          return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
        } else
          return ChatConfigurator.dataSource.getImageMessageContentView(message, alignment, theme);
      },
      options: (loggedInuser, message, theme, group) =>
        ChatConfigurator.dataSource.getImageMessageOptions(
          loggedInuser,
          message,
          theme,
          group,
          additionalParams
        ),
      ReplyView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getReplyView?.(message, theme, additionalParams) || null;
      },
      BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getBottomView(message, alignment);
      },
    });
  }
  getFileMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: MessageTypeConstants.file,
      category: MessageCategoryConstants.message,
      ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        if (isDeletedMessage(message)) {
          return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
        } else
          return ChatConfigurator.dataSource.getFileMessageContentView(message, alignment, theme);
      },
      options: (loggedInuser, message, theme, group) =>
        ChatConfigurator.dataSource.getFileMessageOptions(
          loggedInuser,
          message,
          theme,
          group,
          additionalParams
        ),
      ReplyView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getReplyView?.(message, theme, additionalParams) || null;
      },
      BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getBottomView(message, alignment);
      },
    });
  }

  getFormMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: MessageTypeConstants.form,
      category: MessageCategoryConstants.interactive,
      ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        const loggedInUser = CometChatUIKit.loggedInUser;
        const _style =
          loggedInUser && message.getSender().getUid() === loggedInUser.getUid()
            ? theme.messageListStyles.outgoingMessageBubbleStyles
            : theme.messageListStyles.incomingMessageBubbleStyles;
        return (
          <CometChatDeletedBubble
            text={t("NOT_SUPPORTED") ?? "This message type is not supported"}
            style={_style?.deletedBubbleStyles}
          />
        );
      },
      options: (loggedInuser, message, theme, group) => [],
      BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return <></>;
      },
    });
  }

  getSchedulerMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: MessageTypeConstants.scheduler,
      category: MessageCategoryConstants.interactive,
      ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        const loggedInUser = CometChatUIKit.loggedInUser;
        const _style =
          loggedInUser && message.getSender().getUid() === loggedInUser.getUid()
            ? theme.messageListStyles.outgoingMessageBubbleStyles
            : theme.messageListStyles.incomingMessageBubbleStyles;
        return (
          <CometChatDeletedBubble
            text={t("NOT_SUPPORTED") ?? "This message type is not supported"}
            style={_style?.deletedBubbleStyles}
          />
        );
      },
      options: (loggedInuser, message, theme, group) => [],
      BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return <></>;
      },
    });
  }

  getCardMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: MessageTypeConstants.card,
      category: MessageCategoryConstants.interactive,
      ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        const loggedInUser = CometChatUIKit.loggedInUser;
        const _style =
          loggedInUser && message.getSender().getUid() === loggedInUser.getUid()
            ? theme.messageListStyles.outgoingMessageBubbleStyles
            : theme.messageListStyles.incomingMessageBubbleStyles;
        return (
          <CometChatDeletedBubble
            text={t("NOT_SUPPORTED") ?? "This message type is not supported"}
            style={_style?.deletedBubbleStyles}
          />
        );
      },
      options: (loggedInuser, message, theme, group) => [],
      BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return <></>;
      },
    });
  }

  getGroupActionTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: MessageTypeConstants.groupMember,
      category: MessageCategoryConstants.action,
      ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getGroupActionBubble(message, theme);
      },
    });
  }

  getAllMessageTemplates(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate[] {
    return [
      ChatConfigurator.dataSource.getTextMessageTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getAudioMessageTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getVideoMessageTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getFileMessageTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getImageMessageTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getGroupActionTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getGroupActionTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getFormMessageTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getSchedulerMessageTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getCardMessageTemplate(theme, additionalParams),
      ChatConfigurator.dataSource.getAgentAssistantMessageTemplate(theme, additionalParams),
    ];
  }

  getMessageTemplate(
    messageType: string,
    MessageCategory: string,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate | null {
    // let _theme: CometChatTheme = useContext("theme")         ???
    let template: CometChatMessageTemplate;

    //in case of call message return undefined
    if (MessageCategory == MessageCategoryConstants.call) return null;

    switch (messageType) {
      case MessageTypeConstants.text:
        template = ChatConfigurator.dataSource.getTextMessageTemplate(theme, additionalParams);
        break;
      case MessageTypeConstants.audio:
        template = ChatConfigurator.dataSource.getAudioMessageTemplate(theme, additionalParams);
        break;
      case MessageTypeConstants.video:
        template = ChatConfigurator.dataSource.getVideoMessageTemplate(theme, additionalParams);
        break;
      case MessageTypeConstants.groupActions:
      case MessageTypeConstants.groupMember:
        template = ChatConfigurator.dataSource.getGroupActionTemplate(theme, additionalParams);
        break;
      case MessageTypeConstants.file:
        template = ChatConfigurator.dataSource.getFileMessageTemplate(theme, additionalParams);
        break;
      case MessageTypeConstants.form:
        template = ChatConfigurator.dataSource.getFormMessageTemplate(theme, additionalParams);
        break;
      case MessageTypeConstants.scheduler:
        template = ChatConfigurator.dataSource.getSchedulerMessageTemplate(theme, additionalParams);
        break;
      case MessageTypeConstants.card:
        template = ChatConfigurator.dataSource.getCardMessageTemplate(theme, additionalParams);
        break;
      case MessageTypeConstants.assistant:
        template = ChatConfigurator.dataSource.getAgentAssistantMessageTemplate(theme, additionalParams);
        break;
      default:
        return null;
    }
    return template;
  }

  getAllMessageTypes(): string[] {
    return [
      CometChatMessageTypes.text,
      CometChatMessageTypes.image,
      CometChatMessageTypes.audio,
      CometChatMessageTypes.video,
      CometChatMessageTypes.file,
      MessageTypeConstants.groupActions,
      MessageTypeConstants.groupMember,
      MessageTypeConstants.form,
      MessageTypeConstants.card,
      MessageTypeConstants.scheduler,
      MessageTypeConstants.assistant
    ];
  }
  getAllMessageCategories(): string[] {
    return [
      MessageCategoryConstants.message,
      MessageCategoryConstants.action,
      MessageCategoryConstants.interactive,
      MessageCategoryConstants.agentic
    ];
  }
  getAuxiliaryOptions(
    user: CometChat.User,
    group: CometChat.Group,
    id: Map<string, any>,
    additionalAuxiliaryParams?: AdditionalAuxiliaryOptionsParams
  ): JSX.Element[] {
    return [];
  }
  getAuxiliaryHeaderAppbarOptions(
    user?: CometChat.User,
    group?: CometChat.Group,
    additionalAuxiliaryHeaderOptionsParams?: AdditionalAuxiliaryHeaderOptionsParams
  ): JSX.Element | null {
    return null;
  }
  getId(): string {
    return "messageUtils";
  }
  getMessageTypeToSubtitle(messageType: string): string {
    let subtitle: string = messageType;
    switch (messageType) {
      case MessageTypeConstants.text:
        subtitle = t("TEXT");
        break;
      case MessageTypeConstants.image:
        subtitle = t("MESSAGE_IMAGE");
        break;
      case MessageTypeConstants.video:
        subtitle = t("MESSAGE_VIDEO");
        break;
      case MessageTypeConstants.file:
        subtitle = t("MESSAGE_FILE");
        break;
      case MessageTypeConstants.audio:
        subtitle = t("MESSAGE_AUDIO");
        break;
      default:
        subtitle = messageType;
        break;
    }
    return subtitle;
  }
  usersActionList = (
    theme: CometChatTheme,
    additionalAttachmentOptionsParams?: AdditionalAttachmentOptionsParams
  ) => {
    const attachmentOptions: CometChatMessageComposerAction[] = [];
    if (!additionalAttachmentOptionsParams?.hideCameraOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.takePhoto,
        title: t("CAMERA"),
        icon: (
          <Icon
            name='photo-camera-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height as DimensionValue
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width as DimensionValue
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle as ViewStyle
            }
          />
        ),
      });
    }
    if (!additionalAttachmentOptionsParams?.hideImageAttachmentOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.image,
        title: t("ATTACH_IMAGE"),
        icon: (
          <Icon
            name='photo-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height as DimensionValue
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width as DimensionValue
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle as ViewStyle
            }
          />
        ),
      });
    }

    if (!additionalAttachmentOptionsParams?.hideVideoAttachmentOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.video,
        title: t("ATTACH_VIDEO"),
        icon: (
          <Icon
            name='videocam-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height as DimensionValue
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width as DimensionValue
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle as ViewStyle
            }
          />
        ),
      });
    }

    if (!additionalAttachmentOptionsParams?.hideAudioAttachmentOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.audio,
        title: t("ATTACH_AUDIO"),
        icon: (
          <Icon
            name='play-circle-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height as DimensionValue
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width as DimensionValue
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle as ViewStyle
            }
          />
        ),
      });
    }
    if (!additionalAttachmentOptionsParams?.hideFileAttachmentOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.file,
        title: t("ATTACH_DOCUMENT"),
        icon: (
          <Icon
            name='description-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height as DimensionValue
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width as DimensionValue
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle as ViewStyle
            }
          />
        ),
      });
    }
    return attachmentOptions;
  };
  groupActionList = (
    theme: CometChatTheme,
    additionalAttachmentOptionsParams?: AdditionalAttachmentOptionsParams
  ) => {
    const attachmentOptions: CometChatMessageComposerAction[] = [];
    if (!additionalAttachmentOptionsParams?.hideCameraOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.takePhoto,
        title: t("CAMERA"),
        icon: (
          <Icon
            name='photo-camera-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle
            }
          />
        ),
      });
    }
    if (!additionalAttachmentOptionsParams?.hideImageAttachmentOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.image,
        title: t("ATTACH_IMAGE"),
        icon: (
          <Icon
            name='photo-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle
            }
          />
        ),
      });
    }

    if (!additionalAttachmentOptionsParams?.hideVideoAttachmentOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.video,
        title: t("ATTACH_VIDEO"),
        icon: (
          <Icon
            name='videocam-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle
            }
          />
        ),
      });
    }

    if (!additionalAttachmentOptionsParams?.hideAudioAttachmentOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.audio,
        title: t("ATTACH_AUDIO"),
        icon: (
          <Icon
            name='play-circle-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle
            }
          />
        ),
      });
    }
    if (!additionalAttachmentOptionsParams?.hideFileAttachmentOption) {
      attachmentOptions.push({
        id: MessageTypeConstants.file,
        title: t("ATTACH_DOCUMENT"),
        icon: (
          <Icon
            name='description-fill'
            color={theme.color.primary}
            height={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.height
            }
            width={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle?.iconStyle
                ?.width
            }
            containerStyle={
              theme.messageComposerStyles?.attachmentOptionsStyles?.optionsItemStyle
                ?.iconContainerStyle
            }
          />
        ),
      });
    }

    return attachmentOptions;
  };

  getAttachmentOptions(
    theme: CometChatTheme,
    user?: any,
    group?: any,
    composerId?: any,
    additionalAttachmentOptionsParams?: AdditionalAttachmentOptionsParams
  ): CometChatMessageComposerAction[] {
    if (user) {
      return this.usersActionList(theme, additionalAttachmentOptionsParams);
    } else if (group) {
      return this.groupActionList(theme, additionalAttachmentOptionsParams);
    } else {
      return this.usersActionList(theme, additionalAttachmentOptionsParams);
    }
  }
  getAuxiliaryButtonOptions() {
    return null;
  }

  getLastConversationMessage(
    conversation: CometChat.Conversation,
    theme?: CometChatTheme
  ): string | JSX.Element {
    const lastMessage = conversation.getLastMessage();
    if (lastMessage && lastMessage.category === 'action') {
      const actionMsg = this.getActionMessage(lastMessage);
      if (actionMsg) return actionMsg;
    }
    return CometChatConversationUtils.getMessagePreview(lastMessage, theme);
  }

  getAllTextFormatters(
    loggedInUser?: CometChat.User,
    theme?: CometChatTheme
  ): CometChatTextFormatter[] {
    return [
      ChatConfigurator.getDataSource().getMentionsFormatter(loggedInUser, theme),
      ChatConfigurator.getDataSource().getUrlsFormatter(loggedInUser),
    ];
  }

  getMentionsFormatter(
    loggedInUser?: CometChat.User,
    theme?: CometChatTheme
  ): CometChatMentionsFormatter {
    return new CometChatMentionsFormatter(theme!, loggedInUser);
  }

  getUrlsFormatter(loggedInUser?: CometChat.User): CometChatUrlsFormatter {
    return new CometChatUrlsFormatter(loggedInUser);
  }

  getMessagePreviewSubtitle(message: CometChat.BaseMessage): string {
    if (message instanceof CometChat.TextMessage) {
      return message.getText() || "";
    } else if (message instanceof CometChat.MediaMessage) {
      const data = message.getData() as any;
      return data?.name || message.getType() || "";
    } else if (message.getType() === "groupMember") {
      return "Group action";
    }
    return message.getType() || "";
  }
}
//for internal use only
export const internalMessageDataSource = new MessageDataSource();