import React, { useEffect, useState, useMemo, JSX } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  ChatConfigurator,
  CometChatMentionsFormatter,
  CometChatMessageTemplate,
  CometChatTextFormatter,
  CometChatUIKit,
  CometChatUrlsFormatter,
  MessageBubbleAlignmentType,
} from "../shared";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { messageStatus } from "../shared/utils/CometChatMessageHelper";
import { MessageUtils } from "../shared/utils/MessageUtils";
import { useTheme } from "../theme";
import { CometChatTheme } from "../theme/type";
import { deepMerge } from "../shared/helper/helperFunctions";
import { CommonUtils } from "../shared/utils/CommonUtils";
import { DeepPartial } from "../shared/helper/types";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";
import { ExtensionConstants } from "../extensions";
import { getExtensionData } from "../shared/helper/functions";
import { urlPattern } from "../shared/constants/UIKitConstants";

/**
 * Unique UI event identifier for CometChatUIEventHandler.
 */
const uiEventId = "ccUiEvent" + new Date().getTime();

/**
 * Interface for the props of CometChatThreadHeader component.
 *
 * @interface CometChatThreadHeaderInterface
 */
export interface CometChatThreadHeaderInterface {
  /**
   * The parent message for the thread. It is a CometChat BaseMessage object.
   *
   * @type {CometChat.BaseMessage}
   */
  parentMessage: CometChat.BaseMessage;

  /**
   * Optional custom message template to render the message.
   *
   * @type {CometChatMessageTemplate}
   */
  template?: CometChatMessageTemplate;

  /**
   * Custom styles for the thread header, partially overriding the default theme.
   *
   * @type {DeepPartial<CometChatTheme["threadHeaderStyles"]>}
   */
  style?: DeepPartial<CometChatTheme["threadHeaderStyles"]>;
  /**
   * toggle visibility for the reply count.
   *
   * @type {boolean}
   */
  replyCountVisibility?: boolean;
  /**
   * toggle visibility for the reply count bar.
   *
   * @type {boolean}
   */
  replyCountBarVisibility?: boolean;
  /**
   * Custom styles for the thread header, partially overriding the default theme.
   */
  receiptsVisibility?: boolean;
  /**
   * toggle visibility for the receipts.
   *
   * @type {boolean}
   */
  avatarVisibility?: boolean;
  /**
   * Alignment type for the parent message bubble
   */
  alignment?: MessageBubbleAlignmentType;
  /**
   * Function that returns a custom string representation for a parent message's sent date.
   *
   * @param message - The base message object.
   * @returns A string representing the custom date.
   */
  datePattern?: (message: CometChat.BaseMessage) => string;
  /**
   * Collection of text formatter classes to apply custom formatting.
   *
   * @type {Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>}
   */
  textFormatters?: Array<
    CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter
  >;
}

/**
 * CometChatThreadHeader component renders the header of a message thread including
 * the message bubble and the reply count.
 *
 * @param {CometChatThreadHeaderInterface} props - The properties for the component.
 * @returns {JSX.Element} The rendered thread header.
 */
export const CometChatThreadHeader = (props: CometChatThreadHeaderInterface): JSX.Element => {
  const {
    parentMessage,
    template,
    replyCountVisibility = true,
    replyCountBarVisibility = true,
    textFormatters,
    datePattern,
    alignment,
    receiptsVisibility = true,
    avatarVisibility = true,
  } = props;
  const [message, setMessage] = useState<CometChat.BaseMessage>(parentMessage);
  const [replyCount, setReplyCount] = useState<number>(parentMessage.getReplyCount() || 0);

  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const style = deepMerge(theme.threadHeaderStyles, props.style ?? {});

  /**
   * Checks if an updated message belongs to the same thread as the current message.
   *
   * @param {CometChat.BaseMessage} updatedMessage - The message to be checked.
   * @returns {boolean} True if the updated message belongs to the same thread.
   */
  const checkMessageBelongsToSameThread = (updatedMessage: CometChat.BaseMessage): boolean => {
    return updatedMessage.getParentMessageId() == message.getId();
  };

  /**
   * Checks the updated message and increments the reply count if it belongs to the same thread.
   *
   * @param {CometChat.BaseMessage} updatedMessage - The message to check.
   */
  const checkAndUpdateRepliesCount = (updatedMessage: CometChat.BaseMessage): void => {
    if (checkMessageBelongsToSameThread(updatedMessage)) {
      setReplyCount((prev) => prev + 1);
    }
  };

  /**
   * Handler for the message sent event.
   *
   * @param {{ message: CometChat.BaseMessage, status: string }} param0 - The message and its status.
   */
  const ccMessageSentFunc = ({ message: msg, status }: any): void => {
    if (status === messageStatus.success) {
      checkAndUpdateRepliesCount(msg);
      if (message.getId() == msg.id) setMessage(message);
    }
  };

  /**
   * Handler for the message edited event.
   *
   * @param {{ message: CometChat.BaseMessage, status: string }} param0 - The edited message and its status.
   */
  const ccMessageEditedFunc = ({ message: msg, status }: any): void => {
    if (message.getId() == msg.id && status == messageStatus.success) setMessage(message);
  };

  /**
   * Handler for the message deleted event.
   *
   * @param {{ message: CometChat.BaseMessage }} param0 - The deleted message.
   */
  const ccMessageDeletedFunc = ({ message: msg }: any): void => {
    if (message.getId() == msg.id) setMessage(message);
  };

  /**
   * Handler for the message read event.
   *
   * @param {{ message: CometChat.BaseMessage }} param0 - The read message.
   */
  const ccMessageReadFunc = ({ message: msg }: any): void => {
    if (message.getId() == msg.id) setMessage(message);
  };

  /**
   * Merges the theme for the thread header with additional styles and maps some styles for MessageUtils.
   *
   * @returns {CometChatTheme} The merged theme.
   */
  const mergedTheme: CometChatTheme = useMemo(() => {
    const themeClone = CommonUtils.clone(theme);
    // Clone and map to messageListStyles in order to use these styles in MessageUtils.
    themeClone.messageListStyles.incomingMessageBubbleStyles = deepMerge(
      theme.threadHeaderStyles.incomingMessageBubbleStyles,
      style.incomingMessageBubbleStyles
    );
    // Clone and map to messageListStyles in order to use these styles in MessageUtils.
    themeClone.messageListStyles.outgoingMessageBubbleStyles = deepMerge(
      theme.threadHeaderStyles.outgoingMessageBubbleStyles,
      style.outgoingMessageBubbleStyles
    );
    return themeClone;
  }, [theme, style]);

  useEffect(() => {
    CometChatUIEventHandler.addMessageListener(uiEventId, {
      ccMessageSent: (item: any) => ccMessageSentFunc(item),
      ccMessageEdited: (item: any) => ccMessageEditedFunc(item),
      ccMessageDeleted: (item: any) => ccMessageDeletedFunc(item),
      ccMessageRead: (item: any) => ccMessageReadFunc(item),
      onTextMessageReceived: (textMessage: CometChat.BaseMessage) => {
        checkAndUpdateRepliesCount(textMessage);
      },
      onMediaMessageReceived: (mediaMessage: CometChat.BaseMessage) => {
        checkAndUpdateRepliesCount(mediaMessage);
      },
      onCustomMessageReceived: (customMessage: CometChat.BaseMessage) => {
        checkAndUpdateRepliesCount(customMessage);
      },
      onFormMessageReceived: (formMessage: CometChat.BaseMessage) => {
        checkAndUpdateRepliesCount(formMessage);
      },
      onCardMessageReceived: (cardMessage: CometChat.BaseMessage) => {
        checkAndUpdateRepliesCount(cardMessage);
      },
      onSchedulerMessageReceived: (schedulerMessage: CometChat.BaseMessage) => {
        checkAndUpdateRepliesCount(schedulerMessage);
      },
      onCustomInteractiveMessageReceived: (customInteractiveMessage: CometChat.BaseMessage) => {
        checkAndUpdateRepliesCount(customInteractiveMessage);
      },
    });

    return () => {
      CometChatUIEventHandler.removeMessageListener(uiEventId);
    };
  }, []);

  // Check if message has URLs (link preview or URLs in text)
  const hasUrl = useMemo(() => {
    // Check for link preview extension data
    const linkData = getExtensionData(message, ExtensionConstants.linkPreview);
    if (linkData && linkData.links && linkData.links.length > 0) {
      return true;
    }

    // Check if text message contains URLs
    if (message.getType() === "text") {
      const textMessage = message as CometChat.TextMessage;
      const text = textMessage.getText() || "";
      const urlRegex = new RegExp(urlPattern);
      return urlRegex.test(text);
    }

    return false;
  }, [message]);

  return (
    <View style={[style?.containerStyle]}>
      <ScrollView style={style?.messageBubbleContainerStyle}>
        <View pointerEvents={hasUrl ? 'auto' : 'none'}>
          {MessageUtils.getMessageView({
            message,
            templates:
              template && template.type === parentMessage.getType()
                ? [template]
                : ChatConfigurator.dataSource.getAllMessageTemplates(mergedTheme, {
                    textFormatters,
                  }),
            alignment: alignment
              ? alignment
              : message.getSender().getUid() === CometChatUIKit.loggedInUser!.getUid()
                ? "right"
                : "left",
            theme: mergedTheme,
            datePattern,
            receiptsVisibility,
            avatarVisibility
            
          })}
        </View>
      </ScrollView>
      {replyCountBarVisibility && (
        <View style={style?.replyCountBarStyle}>
          <Text style={style?.replyCountTextStyle}>
            {replyCountVisibility
              ? replyCount.toString() +
                " " +
                (replyCount == 1 ? t("REPLY") : t("REPLIES"))
              : ""}
          </Text>
        </View>
      )}
    </View>
  );
};
