import React, { JSX } from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import {
  CometChatMentionsFormatter,
  CometChatTextFormatter,
  CometChatUIKit,
  CometChatUrlsFormatter,
  CometChatRichTextFormatter,
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
  ReceiverTypeConstants,
} from "../constants/UIKitConstants";
import { CometChatUiKitConstants } from "../index";
import { CometChatMessageComposerAction } from "../helper/types";
import { Icon, IconName } from "../icons/Icon";
import { getMessagePreviewInternal } from "../utils/MessageUtils";
import { canPin, isPinned, isPinSaveEligible, isSaved, PinSaveConfig } from "../utils/PinSaveHelper";
import {
  isThreadSubscribed,
  ThreadSubscriptionConfig,
} from "../utils/ThreadSubscriptionHelper";
import { CometChatMessageOption } from "../modals/CometChatMessageOption";
import { CometChatMessageTemplate } from "../modals/CometChatMessageTemplate";
import { CometChatConversationUtils, attachmentCountLabel } from "../utils/conversationUtils";
import { CometChatAudioBubble } from "../views/CometChatAudioBubble";
import { CometChatDeletedBubble } from "../views/CometChatDeletedBubble";
import { CometChatFileBubble } from "../views/CometChatFileBubble";
import { CometChatImageBubble } from "../views/CometChatImageBubble";
import { CometChatMessagePreview } from "../utils/CometChatMessagePreview";
import { CometChatTextBubble } from "../views/CometChatTextBubble";
import { CometChatVideoBubble } from "../views/CometChatVideoBubble";
import CometChatAIAssistantMessageBubble from '../views/CometChatAIAssistantMessageBubble/CometChatAIAssistantMessageBubble';
import CometChatStreamMessageBubble from '../views/CometChatStreamMessageBubble/CometChatStreamMessageBubble';
import { CometChatCardBubble } from "../views/CometChatCardBubble";
import { ChatConfigurator } from "./ChatConfigurator";
import { DataSource } from "./DataSource";
import { CommonUtils } from "../utils/CommonUtils";
import { DimensionValue, Modal, NativeModules, StyleSheet, TouchableOpacity, ViewStyle, View, Text, Platform } from "react-native";
const { FileManager } = NativeModules;
// Multiple Attachment Support — U9
import { groupAttachments, isGalleryMessage } from "../utils/groupAttachments";
import { CometChatImagesBubble } from "../views/CometChatImagesBubble";
import { CometChatVideosBubble } from "../views/CometChatVideosBubble";
import { CometChatFilesBubble } from "../views/CometChatFilesBubble";
import { CometChatAudiosBubble } from "../views/CometChatAudiosBubble";
import { CometChatVoiceNoteBubble } from "../views/CometChatVoiceNoteBubble";
import { ClipboardPasteHandler } from "../views/ClipboardPasteHandler/ClipboardPasteHandler";
import { stripMarkdown } from "../utils/MarkdownUtils";
import { getCometChatTranslation } from "../resources/CometChatLocalizeNew/LocalizationManager";

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

// Kind-specific icon + "N Photos/Videos/Audios/Files" label for a conversation-list preview, keyed by
// the message TYPE. Files are the default (documents + everything else). Never a generic "attachments".
function kindPreview(type: string, count: number): { icon: IconName; label: string } {
  const label = attachmentCountLabel(type, count); // shared "N Files/Photos/…" label
  switch (type) {
    case MessageTypeConstants.image: return { icon: 'photo-fill', label };
    case MessageTypeConstants.video: return { icon: 'videocam-fill', label };
    case MessageTypeConstants.audio: return { icon: 'mic-fill', label };
    default: return { icon: 'description-fill', label };
  }
}

// U10 — Conversation list subtitle for multi-attachment messages (design doc §17.2)
function buildMultiAttachmentSubtitle(
  mediaAttachments: CometChat.Attachment[],
  audioAttachments: CometChat.Attachment[],
  fileAttachments: CometChat.Attachment[],
  message: CometChat.MediaMessage
): string {
  const caption = (message.getCaption() ?? '').trim();
  const imageCount = mediaAttachments.filter(a =>
    a.getMimeType().startsWith('image/')
  ).length;
  const videoCount = mediaAttachments.filter(a =>
    a.getMimeType().startsWith('video/')
  ).length;
  const mediaCount = mediaAttachments.length;
  const audioCount = audioAttachments.length;
  const fileCount = fileAttachments.length;
  const totalCount = mediaCount + audioCount + fileCount;

  // Mixed kinds → generic label
  const kindCount = [mediaCount > 0, audioCount > 0, fileCount > 0].filter(Boolean).length;
  if (kindCount > 1) {
    return t('ATTACHMENT_COUNT').replace('{count}', String(totalCount));
  }

  // Audio only
  if (audioCount > 0) {
    return t('PREVIEW_AUDIOS_COUNT').replace('{count}', String(audioCount));
  }

  // Files only
  if (fileCount > 0) {
    return t('PREVIEW_FILES_COUNT').replace('{count}', String(fileCount));
  }

  // Media only — caption takes priority over image/video breakdown
  if (caption) {
    const truncated = caption.length > 40 ? caption.substring(0, 40) + '…' : caption;
    const mediaLabel = imageCount > 0 && videoCount === 0
      ? t('PREVIEW_PHOTOS_COUNT').replace('{count}', String(imageCount))
      : videoCount > 0 && imageCount === 0
        ? t('PREVIEW_VIDEOS_COUNT').replace('{count}', String(videoCount))
        : `📷 ${mediaCount} media`;
    return `${mediaLabel} · ${truncated}`;
  }
  if (imageCount > 0 && videoCount === 0) {
    return t('PREVIEW_PHOTOS_COUNT').replace('{count}', String(imageCount));
  }
  if (videoCount > 0 && imageCount === 0) {
    return t('PREVIEW_VIDEOS_COUNT').replace('{count}', String(videoCount));
  }
  return `${t('PREVIEW_PHOTOS_COUNT').replace('{count}', String(imageCount))} & ${t('PREVIEW_VIDEOS_COUNT').replace('{count}', String(videoCount))}`;
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

      // Clean plain text for every other app; colour preserved in a private representation
      // that only our own composer reads back on paste.
      if (textToCopy?.trim()) {
        ClipboardPasteHandler.copyMessageText(textToCopy);
      }
    } catch (err) {
      console.error(err);
    }
  };


  getAgentAssistantMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: 'assistant',
      category: 'agentic',
      ContentView: (message: CometChat.BaseMessage) =>
        this.getAgentAssistantMessageBubble(message, theme),
      ReplyView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignmentType) => {
        if (message.getReceiverType() !== ReceiverTypeConstants.group) {
          return null;
        }
        const replyView = ChatConfigurator.dataSource.getReplyView?.(message, theme, additionalParams) || null;
        if (!replyView) return null;
        return <View style={{ marginTop: 2, marginBottom: 6 }}>{replyView}</View>;
      },

      options: undefined,

      FooterView: (message: CometChat.BaseMessage) => (
        <TouchableOpacity onPress={() => this.handleCopy(message as CometChat.AIAssistantMessage)}>
          <Icon name="ai-copy-option" width={24} height={24} containerStyle={styles.aiCopyIcon} color={theme.color.textSecondary} />
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
  /**
   * Pin / Unpin (§6.1). Two option ids rather than one that flips its title,
   * because a consumer can legitimately hide one and not the other, and because
   * the press handler needs to know which direction it is going without
   * re-deriving state that may have changed since the sheet opened.
   */
  getPinOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.pinMessage,
      title: t("PIN_MESSAGE"),
      icon: (
        <Icon
          name='keep'
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

  getUnpinOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.unpinMessage,
      title: t("UNPIN_MESSAGE"),
      icon: (
        <Icon
          name='keep-off'
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

  /** Save / Unsave (§6.1). No role gate — a save is private to the acting user. */
  getSaveOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.saveMessage,
      title: t("SAVE_MESSAGE"),
      icon: (
        <Icon
          name='bookmark'
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

  getUnsaveOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.unsaveMessage,
      title: t("UNSAVE_MESSAGE"),
      icon: (
        // Bookmark-with-a-cross, the design's own glyph for the unsave ACTION. Distinct from
        // 'bookmark-fill', which stays the saved-STATE indicator beside the timestamp.
        <Icon
          name='unsave'
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

  /**
   * Pushes whichever of the pin/save pair applies to the message's CURRENT state.
   * Shared by getTextMessageOptions and getCommonOptions so every eligible
   * category gets the same four options in the same position — right after the
   * message's own actions and before the destructive ones.
   */
  pushPinSaveOptions(
    optionsList: CometChatMessageOption[],
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): void {
    const pinned = isPinned(messageObject);
    const saved = isSaved(messageObject);

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        pinned ? MessageOptionConstants.unpinMessage : MessageOptionConstants.pinMessage,
        group,
        additionalParams
      )
    ) {
      optionsList.push(pinned ? this.getUnpinOption(theme) : this.getPinOption(theme));
    }

    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        saved ? MessageOptionConstants.unsaveMessage : MessageOptionConstants.saveMessage,
        group,
        additionalParams
      )
    ) {
      optionsList.push(saved ? this.getUnsaveOption(theme) : this.getSaveOption(theme));
    }
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

  /**
   * Follow / unfollow the thread rooted at this message — "tell me when replies
   * arrive here in future". One option id; the title flips on the current state.
   *
   * Deliberately NOT gated on replyCount: following a message before anyone has
   * answered it is the whole point. Offered on a reply too — inside a thread the
   * user reaches for the same control — and there it targets the PARENT thread,
   * via getThreadIdFor, so no subscription is ever rooted at a reply id.
   */
  getThreadSubscriptionOption(
    theme: CometChatTheme,
    messageObject?: CometChat.BaseMessage
  ): CometChatMessageOption {
    const subscribed = messageObject ? isThreadSubscribed(messageObject) : false;
    return {
      id: MessageOptionConstants.threadSubscription,
      title: subscribed
        ? t("THREAD_SUBSCRIPTION_UNSUBSCRIBE")
        : t("THREAD_SUBSCRIPTION_SUBSCRIBE"),
      icon: (
        <Icon
          name={subscribed ? "notifications-off" : "notifications"}
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

    // follow / unfollow thread — placed straight after "Reply in thread" so the
    // two thread actions sit together (§6.3, locked so five kits don't diverge)
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.threadSubscription,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getThreadSubscriptionOption(theme, messageObject));
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

    // Before delete: pin/save are non-destructive, so they should not sit below
    // the one option the user must not hit by accident.
    this.pushPinSaveOptions(
      messageOptionList,
      loggedInUser,
      messageObject,
      theme,
      group,
      additionalParams
    );

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
    if (!isDeletedMessage(messageObject)) {
      optionsList.push(
        ...ChatConfigurator.dataSource.getCommonOptions(
          loggedInUser,
          messageObject,
          theme,
          group,
          additionalParams
        )
      );
      this.pushCaptionEditOption(
        optionsList,
        loggedInUser,
        messageObject,
        theme,
        group,
        additionalParams
      );
    }
    return optionsList;
  }
  /** §8.5 — Download all attachments sequentially via FileManager.checkAndDownload. */
  getDownloadAllOption(theme: CometChatTheme): CometChatMessageOption {
    return {
      id: MessageOptionConstants.downloadAll,
      title: t('ATTACHMENT_DOWNLOAD_ALL') ?? 'Download all',
      onPress: (message: CometChat.BaseMessage) => {
        const mediaMsg = message as CometChat.MediaMessage;
        const attachments = mediaMsg.getAttachments?.() ?? [];
        attachments.forEach((att) => {
          FileManager?.checkAndDownload(att.getUrl(), att.getName(), () => {});
        });
      },
    };
  }

  /**
   * Media messages get an Edit option only when they carry a caption — you edit the
   * caption of a media attachment, not the file. Inserted before Delete to mirror text ordering.
   */
  private pushCaptionEditOption(
    optionsList: CometChatMessageOption[],
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ) {
    const caption = ((messageObject as CometChat.MediaMessage).getCaption?.() ?? '').trim();
    if (!caption.length) return;
    if (
      !this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.editMessage,
        group,
        additionalParams
      )
    )
      return;
    const editOption = this.getEditOption(theme);
    const deleteIdx = optionsList.findIndex(
      (o) => o.id === MessageOptionConstants.deleteMessage
    );
    if (deleteIdx >= 0) optionsList.splice(deleteIdx, 0, editOption);
    else optionsList.push(editOption);
  }

  getVideoMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): CometChatMessageOption[] {
    let optionsList: Array<CometChatMessageOption> = [];
    if (!isDeletedMessage(messageObject)) {
      optionsList.push(
        ...ChatConfigurator.dataSource.getCommonOptions(
          loggedInUser,
          messageObject,
          theme,
          group,
          additionalParams
        )
      );
      this.pushCaptionEditOption(
        optionsList,
        loggedInUser,
        messageObject,
        theme,
        group,
        additionalParams
      );
    }
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
    if (!isDeletedMessage(messageObject)) {
      optionsList.push(
        ...ChatConfigurator.dataSource.getCommonOptions(
          loggedInUser,
          messageObject,
          theme,
          group,
          additionalParams
        )
      );
      this.pushCaptionEditOption(
        optionsList,
        loggedInUser,
        messageObject,
        theme,
        group,
        additionalParams
      );
    }
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
    if (!isDeletedMessage(messageObject)) {
      optionsList.push(
        ...ChatConfigurator.dataSource.getCommonOptions(
          loggedInUser,
          messageObject,
          theme,
          group,
          additionalParams
        )
      );
      this.pushCaptionEditOption(
        optionsList,
        loggedInUser,
        messageObject,
        theme,
        group,
        additionalParams
      );
    }
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

    // Shown on a root message AND on a reply — inside a thread the user reaches for the
    // same control, so hiding it there is a dead end. On a reply it acts on the PARENT
    // thread (getThreadIdFor), which is what kept the old gate necessary: the server will
    // accept a subscription rooted at a reply id and write a /threads row nobody can open,
    // so the fix is to never send that id, not to hide the option.
    // NOT gated on replyCount either: following a message before anyone answers is the
    // entire point. Only the feature gate applies, and it is off until the integrator opts in.
    if (
      MessageOptionConstants.threadSubscription === optionId &&
      ThreadSubscriptionConfig.isEnabled() &&
      !additionalParams?.hideThreadSubscriptionOption
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

    // Pin / Unpin (§6.1, §6.5). Role-gated via canPin, which is NOT the delete
    // gate: delete also allows isSentByMe, but a participant may not pin their
    // own message — pinning is a conversation-wide act on shared state.
    //
    // Offered on a thread REPLY too (Q9). Unlike thread subscription there is no
    // parent-redirect here: a reply is pinned as itself, and the pinned list
    // returns the parent for context.
    // isPinSaveEligible gates all four: no server id yet, deleted, or any
    // moderation verdict. The backend refuses those outright, so offering the
    // option means walking the user through a confirm modal to earn an error
    // toast. Applies to save as well as pin — an unsent message has no id to
    // save against either.
    if (
      MessageOptionConstants.pinMessage === optionId &&
      PinSaveConfig.isPinEnabled() &&
      isPinSaveEligible(messageObject) &&
      canPin(loggedInUser, group) &&
      !additionalParams?.hidePinMessageOption
    ) {
      return true;
    }

    if (
      MessageOptionConstants.unpinMessage === optionId &&
      PinSaveConfig.isPinEnabled() &&
      isPinSaveEligible(messageObject) &&
      canPin(loggedInUser, group) &&
      !additionalParams?.hideUnpinMessageOption
    ) {
      return true;
    }

    // Save / Unsave (§6.1). No role gate at all — the save is private to this
    // user, so there is no shared state for a scope to protect.
    if (
      MessageOptionConstants.saveMessage === optionId &&
      PinSaveConfig.isSaveEnabled() &&
      isPinSaveEligible(messageObject) &&
      !additionalParams?.hideSaveMessageOption
    ) {
      return true;
    }

    if (
      MessageOptionConstants.unsaveMessage === optionId &&
      PinSaveConfig.isSaveEnabled() &&
      isPinSaveEligible(messageObject) &&
      !additionalParams?.hideUnsaveMessageOption
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

    // follow / unfollow thread — same placement as the other assembler (§6.3)
    if (
      this.validateOption(
        loggedInUser,
        messageObject,
        MessageOptionConstants.threadSubscription,
        group,
        additionalParams
      )
    ) {
      messageOptionList.push(this.getThreadSubscriptionOption(theme, messageObject));
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

    // Same position as in getTextMessageOptions — above the destructive actions.
    this.pushPinSaveOptions(
      messageOptionList,
      loggedInUser,
      messageObject,
      theme,
      group,
      additionalParams
    );

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
   // A quoted message can arrive method-less (raw data, no prototype — same symlinked-SDK issue as
   // the conversation list). Every accessor below is guarded, and the whole builder is wrapped in
   // try/catch: a bad quoted message must, at worst, hide the reply preview — NEVER throw and blank
   // the entire message bubble (which is what made replies-to-attachments vanish from the list).
   try {
    const hasQuotedMessage = message.getQuotedMessage?.();

    if (!hasQuotedMessage ||
        message instanceof CometChat.Action ||
        message.getDeletedAt?.()) {
      return null;
    }

    // Check if the original message is outgoing to determine styling
    const loggedInUser = CometChatUIKit.loggedInUser;
    const isOutgoingMessage = loggedInUser && message.getSender?.()?.getUid?.() === loggedInUser?.getUid?.();

    const isQuotedMessageDeleted = ((hasQuotedMessage as any).getDeletedBy?.() ?? null) != null;
    
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
        const messageId = String((hasQuotedMessage as any).getId?.() ?? '');
        if (additionalParams?.onReplyClick) {
          additionalParams.onReplyClick(messageId);
        }
      }
    };

    // Mentions style for reply preview — derived from theme tokens so customers can
    // override via CometChatThemeProvider. Uses same tokens as outgoing bubble mentions.
    const replyMentionsStyle = isOutgoingMessage
      ? {
          textStyle: { color: theme.color.sendBubbleTextHighlight },
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
        }
      : undefined;

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
        mentionsStyle={replyMentionsStyle}
      />
    );

    // Wrap with TouchableOpacity for click handling
    if (additionalParams?.onReplyClick && !isQuotedMessageDeleted) {
      const replyTouchableStyle = { padding: theme.spacing.padding.p0_5 };
      return (
        <TouchableOpacity testID="bubble-quoted-reply" onPress={handleReplyClick} activeOpacity={0.7} style={replyTouchableStyle}>
          {previewComponent}
        </TouchableOpacity>
      );
    }

    return <View testID="bubble-quoted-reply">{previewComponent}</View>;
   } catch (e) {
     // A malformed quoted message must not crash the whole list — degrade gracefully by
     // hiding just the reply preview; the message bubble itself still renders.
     return null;
   }
  }

  getDeleteMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element {
    let loggedInUser = CometChatUIKit.loggedInUser;

    const _style =
      loggedInUser && message.getSender()?.getUid() === loggedInUser?.getUid()
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
        message.getSender()?.getUid() === loggedInUser?.getUid()
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
    const isMessageSentByLoggedInUser = message.getSender()?.getUid() === loggedInUser?.getUid();
    const _style: Partial<CometChatTheme["textBubbleStyles"]> = isMessageSentByLoggedInUser
      ? (theme.messageListStyles.outgoingMessageBubbleStyles
          .textBubbleStyles as CometChatTheme["textBubbleStyles"])
      : (theme.messageListStyles.incomingMessageBubbleStyles
          .textBubbleStyles as CometChatTheme["textBubbleStyles"]);

    let linksTextFormatter = ChatConfigurator.getDataSource().getUrlsFormatter(loggedInUser ?? undefined);
    let mentionsTextFormatter = ChatConfigurator.getDataSource().getMentionsFormatter(
      loggedInUser ?? undefined,
      theme
    );

    // Create rich text formatter for markdown parsing
    let richTextFormatter = new CometChatRichTextFormatter(loggedInUser ?? undefined);
    richTextFormatter.setMessage(message);
    richTextFormatter.setId("ccDefaultRichTextFormatterId");
    // Use same link color as CometChatUrlsFormatter for consistency
    // Inline code styles differ for sent vs received bubbles per Figma spec
    richTextFormatter.setStyle({
      linkStyle: {
        color: isMessageSentByLoggedInUser ? theme.color.sendBubbleLink : theme.color.receiveBubbleLink,
        textDecorationLine: 'underline',
      },
      inlineCodeStyle: isMessageSentByLoggedInUser
        ? {
            fontSize: theme.typography.body.regular.fontSize,
            fontWeight: '400',
            lineHeight: ((theme.typography.body.regular.fontSize as number) ?? 14) * 1.2,
            color: theme.color.sendBubbleTextHighlight,
          }
        : {
            fontSize: theme.typography.body.regular.fontSize,
            fontWeight: '400',
            lineHeight: ((theme.typography.body.regular.fontSize as number) ?? 14) * 1.2,
            color: theme.color.receiveBubbleTextHighlight,
          },
      inlineCodeContainerStyle: isMessageSentByLoggedInUser
        ? {
            backgroundColor: `${String(theme.color.extendedPrimary50)}33`, // 20% opacity
            borderRadius: 2,
            paddingHorizontal: 2,
            paddingVertical: 0,
          }
        : {
            backgroundColor: theme.color.background3,
            borderRadius: 2,
            paddingHorizontal: 2,
            paddingVertical: 0,
          },
      // Code block styles per Figma spec — monospace font in a rounded container
      codeBlockStyle: {
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 13,
        color: isMessageSentByLoggedInUser
          ? theme.color.sendBubbleText
          : theme.color.receiveBubbleText,
      },
      codeBlockContainerStyle: isMessageSentByLoggedInUser
        ? {
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            padding: 12,
          }
        : {
            backgroundColor: theme.color.background2,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: theme.color.borderDefault,
            padding: 12,
          },
      // Blockquote styles per Figma spec — rounded container with left bar
      blockquoteContainerStyle: isMessageSentByLoggedInUser
        ? {
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: theme.spacing.radius.r2,
          }
        : {
            backgroundColor: theme.color.background3,
            borderRadius: theme.spacing.radius.r2,
          },
      blockquoteBarStyle: isMessageSentByLoggedInUser
        ? {
            backgroundColor: 'rgba(255,255,255,0.6)',
          }
        : {
            backgroundColor: theme.color.primary,
          },
    });

    mentionsTextFormatter.setContext(isMessageSentByLoggedInUser ? MentionContext.Outgoing : MentionContext.Incoming);
    linksTextFormatter.setMessage(message);
    linksTextFormatter.setId("ccDefaultUrlsFormatterId");
    linksTextFormatter.setStyle({ linkTextColor: theme.color.receiveBubbleLink });
    if (isMessageSentByLoggedInUser) {
      linksTextFormatter.setStyle({ linkTextColor: theme.color.sendBubbleText });
    }

    if (!additionalParams?.disableMentions && mentionedUsers && mentionedUsers.length) {
      if (loggedInUser) {
        mentionsTextFormatter.setLoggedInUser(loggedInUser);
      }
      mentionsTextFormatter.setMessage(message);
      mentionsTextFormatter.setId("ccDefaultMentionFormatterId");
    }

    let finalFormatters: CometChatTextFormatter[] = [];

    let urlFormatterExists = false;
    let mentionsFormatterExists = false;
    let richTextFormatterExists = false;

    for (const formatter of textFormatters) {
      if (formatter instanceof CometChatUrlsFormatter) {
        urlFormatterExists = true;
      }

      if (formatter instanceof CometChatMentionsFormatter) {
        mentionsFormatterExists = true;
        formatter.setMessage(message);
        formatter.setTargetElement(MentionsTargetElement.textbubble);
        if (CometChatUIKit.loggedInUser) {
          formatter.setLoggedInUser(CometChatUIKit.loggedInUser);
        }
        formatter.setContext(isMessageSentByLoggedInUser ? "outgoing" : "incoming");
      }

      if (formatter instanceof CometChatRichTextFormatter) {
        richTextFormatterExists = true;
      }

      formatter.setMessage(message);
      finalFormatters.push(CommonUtils.clone(formatter));
      if (urlFormatterExists && mentionsFormatterExists && richTextFormatterExists) {
        break;
      }
    }

    // Add rich text formatter first (to parse markdown before other formatters)
    if (!richTextFormatterExists) {
      finalFormatters.unshift(richTextFormatter);
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
      const isSentByMe = message.getSender()?.getUid() === loggedInUser?.getUid();
      const _style = isSentByMe
        ? theme.messageListStyles.outgoingMessageBubbleStyles?.imageBubbleStyles
        : theme.messageListStyles.incomingMessageBubbleStyles?.imageBubbleStyles;

      return (
        <View>
          <CometChatImageBubble imageUrl={{ uri: imageUrl }} style={_style?.imageStyle} />
          {Boolean(caption) && (
            <Text style={{
              color: isSentByMe ? theme.color.staticWhite : theme.color.neutral900,
              paddingHorizontal: 8,
              paddingTop: 6,
              paddingBottom: 4,
            }}>{caption}</Text>
          )}
        </View>
      );
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
        message.getSender()?.getUid() === loggedInUser?.getUid()
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
        message.getSender()?.getUid() === loggedInUser?.getUid()
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
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element {
    // DD §9 — enableMultipleAttachments=false on the message list → deprecated single-attachment bubble.
    if (additionalParams?.enableMultipleAttachments === false) {
      const attachment = message.getAttachment();
      return ChatConfigurator.dataSource.getAudioMessageBubble(
        attachment.getUrl(), attachment.getName(), {}, message, theme
      );
    }
    // §8.1a — audio rendering matches WhatsApp:
    //  • SHARED / picked audio file (no audioType) → the headphone-chip + filename player
    //    (CometChatAudiosBubble), single or multiple.
    //  • RECORDED voice note (metadata.audioType === "voice_note") → the WAVEFORM player
    //    (CometChatVoiceNoteBubble for a stack; the single-audio CometChatAudioBubble for one).
    // An AUDIO message ALWAYS renders the audio bubble — no fallback to a file list. Any attachment
    // that isn't a playable audio file (unsupported audio format, or a non-audio image/video/doc)
    // shows a "no preview" file card (icon + name + Download) inside the bubble (see CometChatAudiosBubble).
    const audioType = (message.getMetadata?.() as Record<string, any> | undefined)?.audioType;
    if (audioType !== "voice_note") {
      // shared/picked audio file(s) → headphone + filename cards
      return <CometChatAudiosBubble message={message} theme={theme} />;
    }
    // DD §8.1a — recorded voice note → waveform: a STACK (2+) uses CometChatVoiceNoteBubble; a SINGLE
    // recording (the usual case — voice notes are recorded one at a time) uses the single-audio bubble.
    if (isGalleryMessage(message)) {
      return <CometChatVoiceNoteBubble message={message} theme={theme} />;
    }
    const attachment = message.getAttachment();
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
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element | null {
    // DD §9 — enableMultipleAttachments=false → deprecated single-attachment video bubble.
    if (additionalParams?.enableMultipleAttachments === false) {
      const attachment = message.getAttachment();
      return ChatConfigurator.dataSource.getVideoMessageBubble(
        attachment.getUrl(), attachment.getUrl(), message, theme
      );
    }
    // A VIDEO message ALWAYS renders the video grid — no fallback to a file list. Any attachment that
    // isn't a video (image / audio / file) shows a "no preview" placeholder cell inside the grid, and
    // a "No preview available" fullscreen on tap (see CometChatVideosBubble + CometChatMediaViewer).
    return <CometChatVideosBubble message={message} theme={theme} />;
  }
  getImageMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element | null {
    const caption = message.getCaption() ?? '';
    // DD §9 — enableMultipleAttachments=false → deprecated single-attachment image bubble.
    if (additionalParams?.enableMultipleAttachments === false) {
      const attachment = message.getAttachment();
      return ChatConfigurator.dataSource.getImageMessageBubble(
        attachment.getUrl(), caption, message, theme
      );
    }
    // An IMAGE message ALWAYS renders the image grid — no fallback to a file list. Any attachment that
    // can't be previewed (unsupported format / load error) shows a "no preview" placeholder cell inside
    // the grid instead (see CometChatImagesBubble's ImageCell).
    return <CometChatImagesBubble message={message} theme={theme} />;
  }
  getFileMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element {
    // DD §9 — enableMultipleAttachments=false → deprecated single-attachment file bubble.
    if (additionalParams?.enableMultipleAttachments === false) {
      const attachment = message.getAttachment();
      return ChatConfigurator.dataSource.getFileMessageBubble(
        attachment.getUrl(), attachment.getName(), {}, message, theme
      );
    }
    // DD §9 (flag=true, default): the new FilesBubble renders 1..N — including a single file.
    return <CometChatFilesBubble message={message} theme={theme} />;
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
          return ChatConfigurator.dataSource.getAudioMessageContentView(message, alignment, theme, additionalParams);
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
          return ChatConfigurator.dataSource.getVideoMessageContentView(message, alignment, theme, additionalParams);
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
          return ChatConfigurator.dataSource.getImageMessageContentView(message, alignment, theme, additionalParams);
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
          return ChatConfigurator.dataSource.getFileMessageContentView(message, alignment, theme, additionalParams);
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
          loggedInUser && message.getSender()?.getUid() === loggedInUser?.getUid()
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
          loggedInUser && message.getSender()?.getUid() === loggedInUser?.getUid()
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
          loggedInUser && message.getSender()?.getUid() === loggedInUser?.getUid()
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

  // --- Developer card (category: "card") ----------------------------------
  getCardBubbleContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element {
    return <CometChatCardBubble message={message} theme={theme} />;
  }

  getCardBubbleTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      // Sentinel type; developer card `type` is arbitrary and resolved on category alone.
      type: MessageTypeConstants.card,
      category: MessageCategoryConstants.card,
      ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        if (isDeletedMessage(message)) {
          return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
        }
        return ChatConfigurator.dataSource.getCardBubbleContentView(
          message,
          alignment,
          theme,
          additionalParams
        );
      },
      // Same option set as the text bubble, minus edit and copy.
      options: (loggedInuser, message, theme, group) =>
        ChatConfigurator.dataSource
          .getTextMessageOptions(loggedInuser, message, theme, group, additionalParams)
          .filter(
            (o: CometChatMessageOption) =>
              o.id !== MessageOptionConstants.editMessage &&
              o.id !== MessageOptionConstants.copyMessage
          ),
      ReplyView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getReplyView?.(message, theme, additionalParams) || null;
      },
      BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
        return ChatConfigurator.dataSource.getBottomView(message, alignment);
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
      ChatConfigurator.dataSource.getCardBubbleTemplate(theme, additionalParams),
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

    // Developer card: resolve on category alone (developer `type` is arbitrary).
    if (MessageCategory == MessageCategoryConstants.card) {
      return ChatConfigurator.dataSource.getCardBubbleTemplate(theme, additionalParams);
    }

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
      MessageCategoryConstants.agentic,
      MessageCategoryConstants.card
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
    // Multi-attachment subtitle (design doc §17.2 / §8.4). Drive the label + icon off the message's
    // COARSE TYPE (image/video/audio/file) — NOT per-attachment mime. A file message can carry a file
    // whose mime is image/* (e.g. "image (1).png" sent as a document); classifying by mime would split
    // it and mislabel a files-only message as a mixed "N attachments". The coarse type is single-kind.
    if (lastMessage instanceof CometChat.MediaMessage) {
      // §8.4 — batch-aware: a multi-KIND batch is fanned out into N messages, each single-kind. Prefer
      // the batch total (stamped on every member's metadata) so the row summarizes the whole send.
      const md = lastMessage.getMetadata?.() as any;
      const batchSize = md?.batchSize;
      const batchTotalCount = md?.batchTotalCount;
      const isBatch =
        md?.batchId != null &&
        typeof batchSize === "number" && batchSize > 1 &&
        typeof batchTotalCount === "number" && batchTotalCount > 1;
      const count = isBatch ? batchTotalCount : (lastMessage.getAttachments?.() ?? []).length;
      if (count > 1) {
        const { icon, label } = kindPreview(lastMessage.getType(), count);
        // Captions carry the same wire markup a text message does, and this branch returns a
        // JSX element — so the conversation list's own stripMarkdown pass, which only runs for
        // string subtitles, never sees it. Strip here or `<color=…>`/`**bold**` render verbatim
        // in the row (ENG-38258).
        const caption = stripMarkdown((lastMessage.getCaption?.() ?? '').trim()).trim();
        return getMessagePreviewInternal(icon, caption ? `${label} · ${caption}` : label, { theme });
      }
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
      if (isGalleryMessage(message)) {
        const { mediaAttachments, audioAttachments, fileAttachments } = groupAttachments(message);
        return buildMultiAttachmentSubtitle(mediaAttachments, audioAttachments, fileAttachments, message);
      }
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

const styles = StyleSheet.create({
  aiCopyIcon: {
    marginLeft: 10,
    marginBottom: -20,
  },
});