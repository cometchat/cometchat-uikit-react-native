import { DataSource, DataSourceDecorator } from "../../shared/framework";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import {
  MessageCategoryConstants,
  MetadataConstants,
  ReceiverTypeConstants,
} from "../../shared/constants/UIKitConstants";
import { CometChatUIEvents, MessageEvents } from "../../shared/events";
import { ChatConfigurator } from "../../shared/framework";
import { CometChatMessageComposerAction } from "../../shared/helper/types";
import { CometChatMessageTemplate } from "../../shared/modals";
import { CometChatCollaborativeBubble } from "../CollaborativeBubble/CometChatCollaborativeBubble";
import { ExtensionConstants, ExtensionTypeConstants } from "../ExtensionConstants";
import { getExtensionData } from "../ExtensionModerator";
import React, { JSX } from "react";
import { Text, View } from "react-native";
import { CometChatUIKit } from "../../shared";
import {
  AdditionalAttachmentOptionsParams,
  AdditionalParams,
  MessageBubbleAlignmentType,
} from "../../shared/base/Types";
import { CometChatUIEventHandler } from "../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { Icon } from "../../shared/icons/Icon";
import { getMessagePreviewInternal } from "../../shared/utils/MessageUtils";
import { DEFAULT_ICONS } from "../../theme/default/resources/icons";
import { CometChatTheme } from "../../theme/type";
import { getCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew/LocalizationManager";
import { CometChatMessageEvents } from "../../shared/events/CometChatMessageEvents";
import { messageStatus } from "../../shared/utils/CometChatMessageHelper";
const t = getCometChatTranslation();

/**
 * Extension decorator for Collaborative Whiteboard messages.
 */
export class CollaborativeWhiteboardExtensionDecorator extends DataSourceDecorator {
  whiteboardUrl: string = "v1/create";

  loggedInUser: CometChat.User | null = null;

  /**
   * Creates an instance of CollaborativeWhiteboardExtensionDecorator.
   *
   * @param dataSource - The data source instance to decorate.
   */
  constructor(dataSource: DataSource) {
    super(dataSource);

    CometChat.getLoggedinUser()
      .then((u) => {
        if (u) {
          this.loggedInUser = u;
        }
      })
      .catch((err) => console.log(err));
  }

  /**
   * Checks if the given message is deleted.
   *
   * @param message - The message to check.
   * @returns True if the message is deleted.
   */
  isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
  }

  /**
   * Returns the unique ID for this extension.
   *
   * @returns The extension ID.
   */
  getId(): string {
    return "CollaborativeWhiteBoard";
  }

  /**
   * Gets a preview for the last conversation message.
   *
   * @param conversation - The conversation object.
   * @param theme - (Optional) The theme.
   * @returns A string or JSX.Element to display as the conversation preview.
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
        ExtensionTypeConstants.whiteboard &&
      (conversation.getLastMessage() as CometChat.BaseMessage).getCategory() ==
        MessageCategoryConstants.custom &&
      (conversation.getLastMessage() as CometChat.BaseMessage).getDeletedAt() === undefined
    ) {
      return getMessagePreviewInternal(
        "collaborative-whiteboard-fill",
        t("COLLABORATIVE_WHITEBOARD"),
        { theme }
      );
    } else {
      return super.getLastConversationMessage(conversation, theme);
    }
  }

  /**
   * Returns an array of all message categories, ensuring custom category is included.
   *
   * @returns Array of message categories.
   */
  getAllMessageCategories(): string[] {
    const categoryList: string[] = super.getAllMessageCategories();
    if (!categoryList.includes(MessageCategoryConstants.custom)) {
      categoryList.push(MessageCategoryConstants.custom);
    }
    return categoryList;
  }

  /**
   * Returns an array of all message types, including whiteboard type.
   *
   * @returns Array of message types.
   */
  getAllMessageTypes(): string[] {
    const messagesTypes: string[] = super.getAllMessageTypes();
    messagesTypes.push(ExtensionTypeConstants.whiteboard);
    return messagesTypes;
  }

  /**
   * Returns the attachment options for the composer, including the whiteboard option.
   *
   * @param theme - The current theme.
   * @param user - (Optional) The user object.
   * @param group - (Optional) The group object.
   * @param composerId - (Optional) The composer ID.
   * @returns Array of attachment option actions.
   */
  getAttachmentOptions(
    theme: CometChatTheme,
    user?: any,
    group?: any,
    composerId?: any,
    additionalAttachmentOptionsParams?: AdditionalAttachmentOptionsParams
  ): CometChatMessageComposerAction[] {
    const attachmentOptions: CometChatMessageComposerAction[] = super.getAttachmentOptions(
      theme,
      user,
      group,
      composerId,
      additionalAttachmentOptionsParams
    );
    if (additionalAttachmentOptionsParams?.hideCollaborativeWhiteboardOption)
      return attachmentOptions;
    if (
      composerId === undefined ||
      (composerId as Map<any, any>).get("parentMessageId") === undefined
    ) {
      attachmentOptions.push({
        id: "whiteboard",
        title: t("COLLABORATIVE_WHITEBOARD"),
        icon: (
          <Icon
            name='collaborative-whiteboard-icon'
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
        onPress: (user, group) => {
          this.shareCollaborativeWhiteboard(
            user, 
            group, 
            additionalAttachmentOptionsParams?.replyToMessage,
            additionalAttachmentOptionsParams?.closeReplyPreview
          );
        },
      });
    }
    return attachmentOptions;
  }

  /**
   * Shares a collaborative whiteboard by calling the extension.
   *
   * @param user - (Optional) The user object.
   * @param group - (Optional) The group object.
   * @param replyToMessage - (Optional) The message to reply to.
   * @param closeReplyPreview - (Optional) Function to close reply preview.
   */
  shareCollaborativeWhiteboard(
    user?: CometChat.User, 
    group?: CometChat.Group,
    replyToMessage?: CometChat.BaseMessage,
    closeReplyPreview?: () => void
  ) {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccToggleBottomSheet, {
      isBottomSheetVisible: false,
    });
    let receiverId!: string;
    let receiverType!: string;

    if (user != undefined) {
      receiverId = user.getUid();
      receiverType = ReceiverTypeConstants.user;
    } else if (group != undefined) {
      receiverId = group.getGuid();
      receiverType = ReceiverTypeConstants.group;
    }

    const payload: any = {
      receiver: receiverId,
      receiverType: receiverType,
    };

    if (replyToMessage) {
      payload.quotedMessageId = replyToMessage.getId();
    }

    if (closeReplyPreview) {
      closeReplyPreview();
    }

    CometChat.callExtension(
      ExtensionConstants.whiteboard,
      ExtensionConstants.post,
      this.whiteboardUrl,
      payload
    )
      .then((response) => {
        console.log("extension sent ", response);
        if (replyToMessage) {
          CometChatMessageEvents.emit(CometChatMessageEvents.ccReplyToMessage, {
            message: replyToMessage,
            status: messageStatus.success,
          });
        }
      })
      .catch((error) => {
        console.log("error", error);
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageError, error);
      });
  }

  /**
   * Returns all message templates including the whiteboard template.
   *
   * @param theme - The current theme.
   * @param additionalParams - (Optional) Additional parameters.
   * @returns Array of message templates.
   */
  getAllMessageTemplates(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate[] {
    const templateList: CometChatMessageTemplate[] = super.getAllMessageTemplates(
      theme,
      additionalParams
    );

    templateList.push(
      new CometChatMessageTemplate({
        type: ExtensionTypeConstants.whiteboard,
        category: MessageCategoryConstants.custom,
        ContentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignmentType) => {
          if (this.isDeletedMessage(message)) {
            return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
          } else {
            return this.getCollaborativeBubble(message, _alignment, theme);
          }
        },
        ReplyView: (
          message: CometChat.BaseMessage,
          _alignment?: MessageBubbleAlignmentType,
          onReplyViewClicked?: (messageToReply: CometChat.BaseMessage) => void
        ) => {
          let whiteboardMessage: CometChat.CustomMessage = message as CometChat.CustomMessage;
          return ChatConfigurator.dataSource.getReplyView?.(whiteboardMessage, theme, additionalParams) || null;
        },
        options: (
          loggedInUser: CometChat.User,
          messageObject: CometChat.BaseMessage,
          theme: CometChatTheme,
          group?: CometChat.Group
        ) =>
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
   * Returns the collaborative bubble component for a whiteboard message.
   *
   * @param message - The message object.
   * @param _alignment - The bubble alignment.
   * @param theme - The current theme.
   * @returns A JSX.Element to render.
   */
  getCollaborativeBubble(
    message: CometChat.BaseMessage,
    _alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ) {
    const loggedInUser = CometChatUIKit.loggedInUser;
    if (message && this.loggedInUser) {
      const whiteboardData = getExtensionData(message, MetadataConstants.extensions?.whiteboard);

      if (whiteboardData && whiteboardData.board_url && whiteboardData.board_url.trim().length) {
        const username = this.loggedInUser?.getName()?.replace(" ", "_");
        const url: string = whiteboardData.board_url + "&username=" + username;
        const _style =
          message.getSender()?.getUid() === loggedInUser?.getUid()
            ? theme.messageListStyles.outgoingMessageBubbleStyles?.collaborativeBubbleStyles
            : theme.messageListStyles.incomingMessageBubbleStyles?.collaborativeBubbleStyles;

        return (
          <CometChatCollaborativeBubble
            title={t("COLLABORATIVE_WHITEBOARD")}
            titleStyle={_style?.titleStyle}
            subtitle={t("OPEN_WHITEBOARD_TO_DRAW")}
            subtitleStyle={_style?.subtitleStyle}
            buttonText={t("OPEN_WHITEBOARD")}
            icon={
              <Icon
                name='collaborative-whiteboard-fill'
                height={_style?.iconStyle?.height}
                width={_style?.iconStyle?.width}
                color={_style?.iconStyle?.tintColor}
                icon={_style?.iconCollaborativeWhiteboard}
                imageStyle={_style?.iconStyle}
                containerStyle={_style?.iconContainerStyle}
              />
            }
            url={url}
            image={
              <Icon
                icon={_style?.imageCollaborativeWhiteboard ?? DEFAULT_ICONS.COLLAB_WHITEBOARD_3X}
                height={_style?.imageStyle?.height}
                width={_style?.imageStyle?.width}
                color={_style?.imageStyle?.tintColor}
                imageStyle={_style?.imageStyle}
                containerStyle={_style?.imageContainerStyle}
              />
            }
            buttonViewStyle={_style?.buttonViewStyle}
            buttonTextStyle={_style?.buttonTextStyle}
            dividerStyle={_style?.dividerStyle}
          />
        );
      }
    }
    return (
      <View>
        <Text>{"no match"}</Text>
      </View>
    );
  }
}
