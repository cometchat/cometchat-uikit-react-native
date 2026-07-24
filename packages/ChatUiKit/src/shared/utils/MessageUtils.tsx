import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX } from "react";
import { ColorValue, PixelRatio, Text, View } from "react-native";
import { MessageBubbleAlignmentType } from "../base";
import {
  CometChatCustomMessageTypes,
  MessageCategoryConstants,
  MentionsTargetElement,
  MessageReceipt,
  MessageTypeConstants,
} from "../constants/UIKitConstants";
import { ChatConfigurator } from "../framework";
import { Icon, IconName } from "../icons/Icon";
import { CometChatMessageTemplate } from "../modals";
import { CometChatMessageBubble } from "../views/CometChatMessageBubble";
import { BubbleStyles, CometChatTheme, OutgoingBubbleStyles } from "../../theme/type";
import { CometChatUIKit } from "../CometChatUiKit/CometChatUIKit";
import { SuggestionItem } from "../views/CometChatSuggestionList/SuggestionItem";
import { CommonUtils } from "./CommonUtils";
import { deepMerge } from "../helper/helperFunctions";
import { CometChatDate } from "../views/CometChatDate";
import { CometChatAvatar, CometChatReceipt } from "../views";
import { useCometChatTranslation } from "../resources/CometChatLocalizeNew";
import { useTheme } from "../../theme";

type MessageViewParamsType = {
  message: CometChat.BaseMessage;
  templates?: CometChatMessageTemplate[];
  alignment?: MessageBubbleAlignmentType;
  theme: CometChatTheme;
  isThreaded?: boolean;
  datePattern?: (message: CometChat.BaseMessage) => string;
  receiptsVisibility?: boolean;
  avatarVisibility?: boolean;
};

const getOverridenBubbleStyles = (theme: CometChatTheme) => {
  const styleCache = new Map();
  const outgoingBubbleStyles = theme.messageListStyles.outgoingMessageBubbleStyles;
  const incomingBubbleStyles = theme.messageListStyles.incomingMessageBubbleStyles;

  styleCache.set(MessageTypeConstants.text, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.textBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.textBubbleStyles ?? {}),
  });

  styleCache.set(MessageTypeConstants.image, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.imageBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.imageBubbleStyles ?? {}),
  });

  styleCache.set(MessageTypeConstants.file, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.fileBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.fileBubbleStyles ?? {}),
  });

  styleCache.set(MessageTypeConstants.audio, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.audioBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.audioBubbleStyles ?? {}),
  });

  styleCache.set(MessageTypeConstants.messageDeleted, {
    incoming: deepMerge(
      incomingBubbleStyles,
      theme.deletedBubbleStyles ?? {},
      incomingBubbleStyles.deletedBubbleStyles ?? {}
    ),
    outgoing: deepMerge(
      outgoingBubbleStyles,
      theme.deletedBubbleStyles ?? {},
      outgoingBubbleStyles.deletedBubbleStyles ?? {}
    ),
  });

  styleCache.set(MessageTypeConstants.sticker, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.stickerBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.stickerBubbleStyles ?? {}),
  });

  styleCache.set(MessageTypeConstants.document, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.collaborativeBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.collaborativeBubbleStyles ?? {}),
  });

  styleCache.set(CometChatCustomMessageTypes.meeting, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.meetCallBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.meetCallBubbleStyles ?? {}),
  });

  styleCache.set(MessageTypeConstants.whiteboard, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.collaborativeBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.collaborativeBubbleStyles ?? {}),
  });

  styleCache.set(MessageTypeConstants.video, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.videoBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.videoBubbleStyles ?? {}),
  });

  styleCache.set(MessageTypeConstants.poll, {
    incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.pollBubbleStyles ?? {}),
    outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.pollBubbleStyles ?? {}),
  });

  return styleCache;
};

const getTemplatesMap = (templates: CometChatMessageTemplate[]) => {
  let templatesMap = new Map<string, CometChatMessageTemplate>();
  templates.forEach((template) => {
    if (templatesMap.get(`${template.category}_${template.type}`)) return;
    templatesMap.set(`${template.category}_${template.type}`, template);
  });
  return templatesMap;
};

const MessageContentView = (props: {
  message: CometChat.BaseMessage;
  alignment: MessageBubbleAlignmentType;
  theme: CometChatTheme;
}): JSX.Element | null => {
  const { message, alignment, theme } = props;

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
  }
  return null;
};

const getLeadingView = (
  item: CometChat.BaseMessage,
  theme: CometChatTheme,
  avatarVisibility = true
): JSX.Element | undefined => {
  if (!avatarVisibility) return undefined;
  let _style = getBubbleStyle(item, theme);
  if (
    item.getSender()?.getUid() !== CometChatUIKit.loggedInUser?.getUid() &&
    item.getCategory() != MessageCategoryConstants.action
  ) {
    return (
      <CometChatAvatar
        image={
          item?.getSender()?.getAvatar && item?.getSender()?.getAvatar()
            ? { uri: item.getSender()?.getAvatar() }
            : undefined
        }
        name={
          item?.getSender()?.getName && item?.getSender()?.getName()
            ? item?.getSender()?.getName()
            : ""
        }
        style={_style.avatarStyle}
      />
    );
  }
  return undefined;
};

const getHeaderView = (
  item: CometChat.BaseMessage | any,
  theme: CometChatTheme
): JSX.Element | undefined => {
  const _style = getBubbleStyle(item, theme);
  if (
    item.getSender()?.getUid() != CometChatUIKit.loggedInUser?.getUid() &&
    ![MessageCategoryConstants.action, MessageCategoryConstants.call].includes(item.getCategory())
  ) {
    const senderName = (item.getSender()?.getName() || "").trim();
    return (
      <View style={{flexDirection: "row" }}>
        {Boolean(senderName) && (
          <Text style={_style.senderNameTextStyles} numberOfLines={1} ellipsizeMode={"tail"}>
            {senderName}
          </Text>
        )}
      </View>
    );
  }
  return undefined;
};
const getBubbleStyle = (item: CometChat.BaseMessage, theme: CometChatTheme): BubbleStyles => {
  const loggedInUser = CometChatUIKit.loggedInUser;
  const type = (() => {
    if (item.getDeletedAt()) {
      return MessageTypeConstants.messageDeleted;
    }
    return item.getType();
  })();

  if (item.getSender()?.getUid() != loggedInUser?.getUid()) {
    return (
      getOverridenBubbleStyles(theme).get(type)?.incoming ??
      theme.messageListStyles.incomingMessageBubbleStyles
    );
  }

  return (
    getOverridenBubbleStyles(theme).get(type)?.outgoing ??
    theme.messageListStyles.outgoingMessageBubbleStyles
  );
};

const getSentAtTimestamp = (item: any) => {
  return item.getSentAt() ? item.getSentAt() * 1000 : Date.now();
};

const getStatusInfoView = (
  item:
    | CometChat.TextMessage
    | CometChat.MediaMessage
    | CometChat.CustomMessage
    | CometChat.InteractiveMessage
    | CometChat.BaseMessage
    | any,
  theme: CometChatTheme,
  receiptsVisibility: boolean = true,
  datePattern?: (message: CometChat.BaseMessage) => string
): JSX.Element | undefined => {
  const loggedInUser = CometChatUIKit.loggedInUser;

  let isOutgoingMessage = item.getSender()?.getUid() == loggedInUser?.getUid();
  let _style = getBubbleStyle(item, theme);

  let messageState;
  if (item.getReadAt()) messageState = "READ";
  else if (item.getDeliveredAt()) messageState = "DELIVERED";
  else if (item.getSentAt()) messageState = "SENT";
  else if (item?.getData()?.metaData?.error) messageState = "ERROR";
  else if (isOutgoingMessage) messageState = "WAIT";
  else messageState = "ERROR";

  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: "flex-end",
          alignSelf: "flex-end",
        },
        _style.dateReceiptContainerStyle,
      ]}
    >
      <CometChatDate
        timeStamp={(item.getDeletedAt() || item.getSentAt()) * 1000 || getSentAtTimestamp(item)}
        pattern={"timeFormat"}
        customDateString={datePattern && datePattern(item)}
        style={_style.dateStyles}
      />
      {receiptsVisibility && isOutgoingMessage ? (
        /* ToDoM Use Icon From Incoming/Outgoing bubble styles */
        <View style={{ marginLeft: 2, alignItems: "center", justifyContent: "center" }}>
          <CometChatReceipt
            receipt={messageState as MessageReceipt}
            style={{
              sentIconStyle: _style.receiptStyles.sentIconStyle,
              readIconStyle: _style.receiptStyles.readIconStyle,
              waitIconStyle: _style.receiptStyles.waitIconStyle,
              errorIconStyle: _style.receiptStyles.errorIconStyle,
              deliveredIconStyle: _style.receiptStyles.deliveredIconStyle,
            }}
          />
        </View>
      ) : null}
    </View>
  );
};

export const MessageUtils = {
  getMessageView: (params: MessageViewParamsType) => {
    const {
      message,
      templates,
      alignment,
      theme,
      datePattern,
      receiptsVisibility,
      avatarVisibility,
    } = params;
    const templatesMap = getTemplatesMap(templates ?? []);
    const baseStyle = getBubbleStyle(message, theme);
    
    let hasTemplate = templatesMap.get(`${message.getCategory()}_${message.getType()}`);
    if ((templates?.length ?? 0) > 0) {
      let customTemplate = templates?.find(
        (template) =>
          template.type == message.getType() && template.category == message.getCategory()
      );
      if (customTemplate) hasTemplate = customTemplate;
    }

    // Only show moderation bottom view for outgoing disapproved messages
    const moderationStatus = getModerationStatus(message);
    const isOutgoing = message.getSender()?.getUid() === CometChatUIKit.loggedInUser?.getUid();
    const styleForThisMessage =
      isOutgoing && moderationStatus === "disapproved"
        ? deepMerge(baseStyle, {
            containerStyle: {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: "hidden",
            },
          })
        : baseStyle;

    const DefaultModerationBottomView =
      isOutgoing && moderationStatus === "disapproved" ? (
        <ModerationBottomView status={moderationStatus} />
      ) : undefined;

    return (
      <CometChatMessageBubble
        id={`${message.getId()}`}
        alignment={alignment}
        ContentView={
          hasTemplate?.ContentView?.(message, alignment ?? "left") ||
          MessageContentView({ message, alignment: alignment ?? "left", theme: theme! })
        }
        LeadingView={
          message.getReceiverType() === "group"
            ? getLeadingView(message, theme, avatarVisibility)
            : undefined
        }
        HeaderView={
          message.getReceiverType() === "group" ? getHeaderView(message, theme) : undefined
        }
        BottomView={
          DefaultModerationBottomView ||
          (hasTemplate?.BottomView && hasTemplate?.BottomView(message, alignment ?? "left"))
        }
        StatusInfoView={
          (hasTemplate?.StatusInfoView && hasTemplate?.StatusInfoView(message, alignment ?? "left")) ||
          getStatusInfoView(message, theme, receiptsVisibility, datePattern)
        }
        style={styleForThisMessage}
      />
    );
  },
};

export const getMessagePreviewInternal = (
  iconName: IconName,
  text: string,
  { iconColor, theme }: { iconColor?: ColorValue; theme?: CometChatTheme }
) => {
  const fontScale = PixelRatio.getFontScale();
  const iconSize = (theme?.spacing?.spacing?.s4 ?? 16) * fontScale;
  return (
    // Self-contained center-aligned row so the icon and label align to EACH OTHER (not to the taller
    // receipt/thread siblings in the parent row). Matching the text's line-box to the icon height keeps
    // the glyph on the icon's centre on both platforms.
    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0 }}>
      {iconName && (
        <Icon
          name={iconName}
          size={iconSize}
          color={iconColor || theme?.color?.textSecondary}
          containerStyle={{ marginRight: theme?.spacing?.spacing?.s0_5 }}
        />
      )}
      <Text
        numberOfLines={1}
        ellipsizeMode='tail'
        style={{
          color: theme?.color?.textSecondary,
          ...theme?.typography?.body?.regular,
          flexShrink: 1,
          minWidth: 0,
          lineHeight: iconSize,
          includeFontPadding: false,
          textAlignVertical: 'center',
        }}
      >
        {text}
      </Text>
    </View>
  );
};

/**
 * Applies mentions formatting to message content.
 * Shared helper used by CometChatConversations subtitle and CometChatMessagePreview
 * to ensure consistent @mention styling across the UI.
 *
 * @param message - The message containing mentioned users
 * @param content - The current formatted content (string or JSX)
 * @param rawText - The raw message text (for detecting @all alias tokens)
 * @param mentionsStyle - Optional style overrides for mentions
 * @returns The content with styled mentions applied
 */
export const applyMentionsFormatting = (
  message: CometChat.BaseMessage,
  content: string | JSX.Element,
  rawText: string,
  mentionsStyle?: any,
): string | JSX.Element => {
  const containsAllAlias = /<@all:(.*?)>/.test(rawText);
  if (!message.getMentionedUsers?.().length && !containsAllAlias) {
    return content;
  }

  try {
    let mentionsFormatter = ChatConfigurator.getDataSource().getMentionsFormatter();
    mentionsFormatter.setContext("conversation");
    if (CometChatUIKit.loggedInUser) {
      mentionsFormatter.setLoggedInUser(CometChatUIKit.loggedInUser);
    }
    mentionsFormatter.setTargetElement(MentionsTargetElement.conversation);
    mentionsFormatter.setMessage(message);
    if (mentionsStyle) {
      mentionsFormatter.setMentionsStyle(mentionsStyle);
    }

    if (containsAllAlias) {
      const match = rawText.match(/<@all:(.*?)>/);
      const aliasLabel = match && match[1] ? match[1] : "all";
      let existing = mentionsFormatter.getSuggestionItems();
      const underlyingText = `<@all:${aliasLabel}>`;
      const already = existing.find((it: any) => it.underlyingText === underlyingText);
      if (!already) {
        const aliasItem = new SuggestionItem({
          id: aliasLabel,
          name: aliasLabel,
          promptText: aliasLabel,
          trackingCharacter: "@",
          underlyingText,
          hideLeadingIcon: true,
        });
        mentionsFormatter.setSuggestionItems([...existing, aliasItem]);
      }
    }

    let suggestionUsers = mentionsFormatter.getSuggestionItems();
    mentionsFormatter.setMessage(message);
    if (suggestionUsers.length > 0) mentionsFormatter.setSuggestionItems(suggestionUsers);
    let _formatter = CommonUtils.clone(mentionsFormatter);
    return _formatter.getFormattedText(content, mentionsStyle);
  } catch (e) {
    console.warn("Error applying mentions formatting:", e);
    return content;
  }
};

export const getModerationStatus = (message: CometChat.BaseMessage | any): string => {
  if (message?.getModerationStatus) {
    try {
      return message.getModerationStatus();
    } catch (e) {
      console.log("🚀 ~ getModerationStatus ~ e:", e);
    }
  }
  const rawStatus =
    message?.getData?.()?.moderation?.status ||
    message?.getData?.()?.metaData?.moderation?.status ||
    message?.data?.moderation?.status ||
    message?.data?.metaData?.moderation?.status ||
    message?.moderationStatus;
  if (!rawStatus) return "unmoderated";
  return String(rawStatus);
};

export const ModerationBottomView = ({
  status,
  moderationStyle,
}: {
  status: string;
  moderationStyle?: OutgoingBubbleStyles["moderationStyle"];
}) => {
  const { t } = useCometChatTranslation();
  const theme = useTheme();
  if (status !== "disapproved") return null;
  // The "blocked due to moderation" banner: a message whose media uploaded but whose send was
  // disapproved (uploaded-but-not-delivered state).
  const bubblePadH =
  theme.messageListStyles.outgoingMessageBubbleStyles?.containerStyle?.paddingHorizontal ??
  theme.spacing?.spacing?.s3 ?? 12;

  const bubblePadB =
  theme.messageListStyles.outgoingMessageBubbleStyles?.containerStyle?.paddingBottom ?? 0;

  const bubbleRadius =
    theme.messageListStyles.outgoingMessageBubbleStyles?.containerStyle?.borderRadius ?? 8;

  const themeModerationStyle =
    theme.messageListStyles.outgoingMessageBubbleStyles.moderationStyle || {};

  const effective = deepMerge(themeModerationStyle, moderationStyle || {});

  return (
    <View
      testID="moderation-blocked"
      style={[
        {
        marginHorizontal: -bubblePadH,
        marginBottom: -bubblePadB,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: bubbleRadius,
        borderBottomRightRadius: bubbleRadius,
        flexDirection: "row",
        alignItems: "center",
      },
        effective?.containerStyle,
      ]}
    >
      <Icon
        name="message-blocked"
        color={effective?.iconTintColor}
        containerStyle={{ paddingLeft: 12, paddingRight: 4, alignSelf: "stretch" }}
      />
      <Text
        style={[
          effective?.textStyle,
        ]}
      >
        {t("BLOCKED_MODERATION")}
      </Text>
    </View>
  );
};

export const MimeErrorBottomView = ({
  moderationStyle,
}: {
  moderationStyle?: OutgoingBubbleStyles["moderationStyle"];
}) => {
  const { t } = useCometChatTranslation();
  const theme = useTheme();

  const bubblePadH =
    theme.messageListStyles.outgoingMessageBubbleStyles?.containerStyle?.paddingHorizontal ??
    theme.spacing?.spacing?.s3 ?? 12;

  const bubblePadB =
    theme.messageListStyles.outgoingMessageBubbleStyles?.containerStyle?.paddingBottom ?? 0;

  const bubbleRadius =
    theme.messageListStyles.outgoingMessageBubbleStyles?.containerStyle?.borderRadius ?? 8;

  const themeModerationStyle =
    theme.messageListStyles.outgoingMessageBubbleStyles.moderationStyle || {};

  const effective = deepMerge(themeModerationStyle, moderationStyle || {});

  return (
    <View
      style={[
        {
          marginHorizontal: -bubblePadH,
          marginBottom: -bubblePadB,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: bubbleRadius,
          borderBottomRightRadius: bubbleRadius,
          flexDirection: "row",
          alignItems: "center",
        },
        effective?.containerStyle,
      ]}
    >
      <Icon
        name="message-blocked"
        color={effective?.iconTintColor}
        containerStyle={{ paddingLeft: 12, paddingRight: 4, alignSelf: "stretch" }}
      />
      <Text
        style={[
          effective?.textStyle,
        ]}
      >
        {t("FILE_TYPE_NOT_ALLOWED")}
      </Text>
    </View>
  );
};


