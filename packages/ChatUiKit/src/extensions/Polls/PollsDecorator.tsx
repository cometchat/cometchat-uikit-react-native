import { DataSource, DataSourceDecorator } from "../../shared/framework";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageCategoryConstants, MetadataConstants } from "../../shared/constants/UIKitConstants";
import { ChatConfigurator } from "../../shared/framework";
import { CometChatMessageComposerAction } from "../../shared/helper/types";
import { CometChatMessageTemplate } from "../../shared/modals";
import { ExtensionTypeConstants } from "../ExtensionConstants";
import { getExtensionData } from "../ExtensionModerator";
import { PollsConfigurationInterface } from "./PollsConfigurations";
import React, { JSX } from "react";
import { View } from "react-native";
import { CometChatUIKit } from "../../shared";
import {
  AdditionalAttachmentOptionsParams,
  AdditionalParams,
  MessageBubbleAlignmentType,
} from "../../shared/base/Types";
import { Icon } from "../../shared/icons/Icon";
import { getMessagePreviewInternal } from "../../shared/utils/MessageUtils";
import { CometChatTheme } from "../../theme/type";
import { CometChatCreatePoll } from "./Polls";
import { PollsBubble } from "./PollsBubble";
import { getCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew/LocalizationManager";
import { CometChatMessageEvents } from "../../shared/events/CometChatMessageEvents";
import { messageStatus } from "../../shared/utils/CometChatMessageHelper";

const t = getCometChatTranslation();

/**
 *
 *
 * @type {PollsConfigurationInterface}
 * @description Optional configuration for polls.
 */
export class PollsExtensionDecorator extends DataSourceDecorator {
  pollsConfiguration?: PollsConfigurationInterface;

  /**
   *
   *
   * @param {DataSource} dataSource - The data source to decorate.
   * @param {PollsConfigurationInterface} [pollsConfiguration] - Optional polls configuration.
   */
  constructor(dataSource: DataSource, pollsConfiguration?: PollsConfigurationInterface) {
    super(dataSource);
    if (pollsConfiguration != undefined) {
      this.pollsConfiguration = pollsConfiguration;
    }
  }

  /**
   *
   *
   * @returns {boolean}
   * @description Returns true if the message is deleted.
   */
  isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
  }

  /**
   *
   *
   * @returns {string}
   * @description Returns the unique ID for this extension.
   */
  getId(): string {
    return "Polls";
  }

  /**
   *
   *
   * @param {CometChat.Conversation} conversation - The conversation object.
   * @param {CometChatTheme} [theme] - The current theme.
   * @returns {string | JSX.Element}
   * @description Returns the preview text or element for the last conversation message.
   */
  getLastConversationMessage(
    conversation: CometChat.Conversation,
    theme?: CometChatTheme
  ): string | JSX.Element {
    if (conversation.getLastMessage() == undefined) {
      return "";
    }

    if (
      (conversation.getLastMessage() as CometChat.BaseMessage).getType() ==
        ExtensionTypeConstants.extensionPoll &&
      (conversation.getLastMessage() as CometChat.BaseMessage).getCategory() ==
        MessageCategoryConstants.custom &&
      (conversation.getLastMessage() as CometChat.BaseMessage).getDeletedAt() === undefined
    ) {
      return getMessagePreviewInternal("bar-chart-fill", t("CUSTOM_MESSAGE_POLL"), {
        theme,
      });
    } else {
      return super.getLastConversationMessage(conversation, theme);
    }
  }

  /**
   *
   *
   * @returns {string[]}
   * @description Returns all message categories including custom types.
   */
  getAllMessageCategories(): string[] {
    var categoryList: string[] = super.getAllMessageCategories();
    if (!categoryList.includes(MessageCategoryConstants.custom)) {
      categoryList.push(MessageCategoryConstants.custom);
    }
    return categoryList;
  }

  /**
   *
   *
   * @returns {string[]}
   * @description Returns all message types including the poll extension type.
   */
  getAllMessageTypes(): string[] {
    var messagesTypes: string[] = super.getAllMessageTypes();
    messagesTypes.push(ExtensionTypeConstants.extensionPoll);
    return messagesTypes;
  }

  /**
   *
   *
   * @param {CometChatTheme} theme - The current theme.
   * @param {any} [user] - The current user.
   * @param {any} [group] - The current group.
   * @param {any} [composerId] - The composer identifier.
   * @returns {CometChatMessageComposerAction[]}
   * @description Returns the attachment options for the message composer including polls.
   */
  getAttachmentOptions(
    theme: CometChatTheme,
    user?: any,
    group?: any,
    composerId?: any,
    additionalAttachmentOptionsParams?: AdditionalAttachmentOptionsParams
  ): CometChatMessageComposerAction[] {
    let attachmentOptions: CometChatMessageComposerAction[] = super.getAttachmentOptions(
      theme,
      user,
      group,
      composerId,
      additionalAttachmentOptionsParams
    );
    if (additionalAttachmentOptionsParams?.hidePollsAttachmentOption) return attachmentOptions;
    if (
      composerId == undefined ||
      (composerId as Map<any, any>).get("parentMessageId") == undefined
    )
      attachmentOptions.push({
        id: "polls",
        title: t("CUSTOM_MESSAGE_POLL"),
        icon: <Icon name='poll_icon' color={theme.color.primary} />,
        CustomView: (user, group, _id, pollsProps) => {
          return (
            <CometChatCreatePoll
              user={user}
              group={group}
              {...pollsProps}
              {...this.pollsConfiguration}
              replyToMessage={additionalAttachmentOptionsParams?.replyToMessage}
              closeReplyPreview={additionalAttachmentOptionsParams?.closeReplyPreview}
            />
          );
        },
      });
    return attachmentOptions;
  }

  /**
   *
   *
   * @param {CometChatTheme} theme - The current theme.
   * @param {AdditionalParams} [additionalParams] - Additional parameters.
   * @returns {CometChatMessageTemplate[]}
   * @description Returns all message templates including the poll template.
   */
  getAllMessageTemplates(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate[] {
    let templateList: CometChatMessageTemplate[] = super.getAllMessageTemplates(
      theme,
      additionalParams
    );

    templateList.push(
      new CometChatMessageTemplate({
        type: ExtensionTypeConstants.extensionPoll,
        category: MessageCategoryConstants.custom,
        ContentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignmentType) => {
          if (this.isDeletedMessage(message)) {
            return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
          } else {
            return this.getPollBubble(message, _alignment, theme);
          }
        },
        ReplyView: (
          message: CometChat.BaseMessage,
          _alignment?: MessageBubbleAlignmentType,
          onReplyViewClicked?: (messageToReply: CometChat.BaseMessage) => void
        ) => {
          let pollMessage: CometChat.CustomMessage = message as CometChat.CustomMessage;
          return ChatConfigurator.dataSource.getReplyView?.(pollMessage, theme, additionalParams) || null;
        },
        options: (loggedInUser, messageObject, theme, group) =>
          ChatConfigurator.dataSource.getMessageOptions(
            loggedInUser,
            messageObject,
            theme,
            group,
            additionalParams
          ),
        BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
          return ChatConfigurator.dataSource.getBottomView(message, alignment);
        },
      })
    );

    return templateList;
  }

  /**
   *
   *
   * @param {CometChat.BaseMessage} message - The poll message.
   * @param {MessageBubbleAlignmentType} _alignment - The alignment for the message bubble.
   * @param {CometChatTheme} theme - The current theme.
   * @returns {JSX.Element}
   * @description Returns the poll bubble element for a given poll message.
   */
  getPollBubble(
    message: CometChat.BaseMessage,
    _alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ) {
    let _loggedInUser = CometChatUIKit.loggedInUser;
    if (message && _loggedInUser) {
      const metaData = getExtensionData(message, MetadataConstants.extensions?.polls);
      const _style =
        message.getSender()?.getUid() === _loggedInUser.getUid()
          ? theme.messageListStyles.outgoingMessageBubbleStyles?.pollBubbleStyles
          : theme.messageListStyles.incomingMessageBubbleStyles?.pollBubbleStyles;

      return (
        <PollsBubble
          pollQuestion={(message as any)["customData"]?.["question"]}
          options={(message as any)["customData"]?.["options"]}
          pollId={(message as any)["customData"]?.["id"]}
          loggedInUser={_loggedInUser}
          // choosePoll
          senderUid={(message as any)["sender"]?.["uid"]}
          metadata={metaData}
          titleStyle={_style?.titleStyle}
          optionTextStyle={_style?.optionTextStyle}
          voteCountTextStyle={_style?.voteCountTextStyle}
          selectedIconStyle={_style?.selectedIconStyle}
          radioButtonStyle={_style?.radioButtonStyle}
          voteravatarStyle={_style?.voteravatarStyle}
          progressBarStyle={_style?.progressBarStyle}
          activeProgressBarTint={_style?.activeProgressBarTint}
        />
      );
    }

    return <View></View>;
  }
}
