import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX } from "react";
import { Text, View } from "react-native";
import { CometChatUIKit } from "../../shared";
import {
  AdditionalAttachmentOptionsParams,
  AdditionalParams,
  MessageBubbleAlignmentType,
} from "../../shared/base/Types";
import {
  MessageCategoryConstants,
  MetadataConstants,
  ReceiverTypeConstants,
} from "../../shared/constants/UIKitConstants";
import { CometChatUIEvents, MessageEvents } from "../../shared/events";
import { CometChatUIEventHandler } from "../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { ChatConfigurator, DataSource, DataSourceDecorator } from "../../shared/framework";
import { CometChatMessageComposerAction } from "../../shared/helper/types";
import { Icon } from "../../shared/icons/Icon";
import { CometChatMessageTemplate } from "../../shared/modals";
import { getMessagePreviewInternal } from "../../shared/utils/MessageUtils";
import { DEFAULT_ICONS } from "../../theme/default/resources/icons";
import { CometChatTheme } from "../../theme/type";
import { CometChatCollaborativeBubble } from "../CollaborativeBubble/CometChatCollaborativeBubble";
import { ExtensionConstants, ExtensionTypeConstants } from "../ExtensionConstants";
import { getExtensionData } from "../ExtensionModerator";
import { getCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew/LocalizationManager";
import { CometChatMessageEvents } from "../../shared/events/CometChatMessageEvents";
import { messageStatus } from "../../shared/utils/CometChatMessageHelper";
const t = getCometChatTranslation();

export class CollaborativeDocumentExtensionDecorator extends DataSourceDecorator {
  documentUrl: string = "v1/create";

  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
  }

  getId(): string {
    return "CollaborativeDocument";
  }

  getLastConversationMessage(
    conversation: CometChat.Conversation,
    theme?: CometChatTheme
  ): string | JSX.Element {
    if (conversation.getLastMessage() == undefined) {
      return "";
    }

    if (
      conversation.getLastMessage()?.getType() == ExtensionTypeConstants.document &&
      conversation.getLastMessage()?.getCategory() == MessageCategoryConstants.custom &&
      conversation.getLastMessage()?.getDeletedAt() === undefined
    ) {
      return getMessagePreviewInternal(
        "collaborative-document-fill",
        t("CUSTOM_MESSAGE_DOCUMENT"),
        { theme }
      );
    } else {
      return super.getLastConversationMessage(conversation, theme);
    }
  }

  getAllMessageCategories(): string[] {
    var categoryList: string[] = super.getAllMessageCategories();
    if (!categoryList.includes(MessageCategoryConstants.custom)) {
      categoryList.push(MessageCategoryConstants.custom);
    }
    return categoryList;
  }

  getAllMessageTypes(): string[] {
    var messagesTypes: string[] = super.getAllMessageTypes();
    messagesTypes.push(ExtensionTypeConstants.document);
    return messagesTypes;
  }

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
    if (additionalAttachmentOptionsParams?.hideCollaborativeDocumentOption)
      return attachmentOptions;
    if (
      composerId == undefined ||
      (composerId as Map<any, any>).get("parentMessageId") == undefined
    )
      attachmentOptions.push({
        id: "document",
        title: t("COLLABORATIVE_DOCUMENT"),
        icon: (
          <Icon
            name='collaborative-document-icon'
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
          this.shareCollaborativedocument(
            user, 
            group, 
            additionalAttachmentOptionsParams?.replyToMessage,
            additionalAttachmentOptionsParams?.closeReplyPreview
          );
        },
      });
    return attachmentOptions;
  }

  shareCollaborativedocument(
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
    } else {
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
      ExtensionConstants.document,
      ExtensionConstants.post,
      this.documentUrl,
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
        type: ExtensionTypeConstants.document,
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
          let documentMessage: CometChat.CustomMessage = message as CometChat.CustomMessage;
          return ChatConfigurator.dataSource.getReplyView?.(documentMessage, theme, additionalParams) || null;
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

  getCollaborativeBubble(
    message: CometChat.BaseMessage,
    _alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ) {
    let loggedInUser = CometChatUIKit.loggedInUser;
    if (message) {
      const documentData = getExtensionData(message, MetadataConstants.extensions?.document);

      if (documentData && documentData.document_url && documentData.document_url.trim().length) {
        let url: string = documentData.document_url;

        const _style =
          message.getSender()?.getUid() === loggedInUser?.getUid()
            ? theme.messageListStyles.outgoingMessageBubbleStyles?.collaborativeBubbleStyles
            : theme.messageListStyles.incomingMessageBubbleStyles?.collaborativeBubbleStyles;

        return (
          <CometChatCollaborativeBubble
            title={t("COLLABORATIVE_DOCUMENT")}
            titleStyle={_style?.titleStyle}
            subtitle={t("OPEN_DOCUMENT_TO_DRAW")}
            subtitleStyle={_style?.subtitleStyle}
            buttonText={t("OPEN_DOCUMENT")}
            icon={
              <Icon
                name='collaborative-whiteboard-fill'
                height={_style?.iconStyle?.height}
                width={_style?.iconStyle?.width}
                color={_style?.iconStyle?.tintColor}
                icon={_style?.iconCollaborativeDocument}
                imageStyle={_style?.iconStyle}
                containerStyle={_style?.iconContainerStyle}
              ></Icon>
            }
            url={url}
            image={
              <Icon
                icon={_style?.imageCollaborativeDocument ?? DEFAULT_ICONS.COLLAB_DOCUMENT_3X}
                height={_style?.imageStyle?.height}
                width={_style?.imageStyle?.width}
                color={_style?.imageStyle?.tintColor}
                imageStyle={_style?.imageStyle}
                containerStyle={_style?.imageContainerStyle}
              ></Icon>
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
