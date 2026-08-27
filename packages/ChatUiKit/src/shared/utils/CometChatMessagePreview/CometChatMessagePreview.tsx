import React, { JSX } from "react";
import { View, Text, TouchableOpacity, StyleProp, ViewStyle, Platform, StyleSheet } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { useTheme } from "../../../theme";
import { Styles } from "./style";
import { getCometChatTranslation } from "../../resources/CometChatLocalizeNew/LocalizationManager";
import { Icon } from "../../icons/Icon";
import { stripMarkdown, preparePreviewText } from "../MarkdownUtils";
import { CometChatRichTextFormatter } from "../../formatters/CometChatRichTextFormatter";
import { applyMentionsFormatting } from "../MessageUtils";
import { attachmentCountLabel } from "../conversationUtils";
import { isViewElement } from "../elementType";

const t = getCometChatTranslation();

/** Module-level formatter instance — reused across renders (SRP, no GC churn) */
const previewFormatter = new CometChatRichTextFormatter();

/**
 * Props for CometChatMessagePreview component
 */
interface CometChatMessagePreviewProps {
  // Old interface (for backward compatibility)
  messagePreviewTitle?: string;
  messagePreviewSubtitle?: string;
  closeIconURL?: any;
  onCloseClick?: () => void;
  
  // New interface (message-based)
  message?: CometChat.BaseMessage;
  theme?: any;
  showCloseIcon?: boolean;
  style?: StyleProp<ViewStyle>;
  
  // Icon support
  subtitleIcon?: JSX.Element;

  // Suppress the auto-generated media icon (e.g. editing a caption — show only the caption text)
  hideSubtitleIcon?: boolean;

  // Muted context line shown between the title and the subtitle (e.g. "8 attachments" when editing a
  // media caption). The message's media-type icon (photo/video/file) is rendered before it.
  overlineText?: string;

  // Title style override
  titleStyle?: any;
  
  // Deleted message indicator
  isDeletedMessage?: boolean;

  // Mentions style override for reply preview context
  mentionsStyle?: any;
}

/**
 *
 * CometChatMessagePreview
 *
 */
const CometChatMessagePreview = (props: CometChatMessagePreviewProps) => {
  const {
    messagePreviewTitle,
    messagePreviewSubtitle,
    closeIconURL,
    onCloseClick,
    message,
    theme: propTheme,
    showCloseIcon = false,
    style,
    subtitleIcon,
    hideSubtitleIcon = false,
    overlineText,
    titleStyle,
    isDeletedMessage = false,
    mentionsStyle,
  } = props;
  
  const theme = useTheme();
  const finalTheme = propTheme || theme;

  // Helper function to get message preview title (sender name)
  const getMessagePreviewTitle = (): string => {
    if (messagePreviewTitle) return messagePreviewTitle;
    
    if (!message) return "";
    
    try {
      if (message && typeof message.getSender === 'function') {
        const sender = message.getSender();
        if (sender && typeof sender.getName === 'function') {
          return sender.getName() || "";
        }
      }
      // Fallback for cases where getSender is not available
      if (message && (message as any).sender && (message as any).sender.name) {
        return (message as any).sender.name;
      }
    } catch (error) {
      console.warn("Error getting message sender:", error);
    }
    return "";
  };

  // Helper function to get message preview subtitle/content
  const getMessagePreviewSubtitle = (): string | JSX.Element => {
    if (messagePreviewSubtitle) return messagePreviewSubtitle;
    
    if (!message) return "";
    

    if (props.isDeletedMessage) {
      return t("MESSAGE_IS_DELETED") || "Message deleted";
    }
    
    try {
      const messageType = typeof message.getType === 'function' ? message.getType() : (message as any).type;
      const messageCategory = typeof message.getCategory === 'function' ? message.getCategory() : (message as any).category;

      if (messageCategory === CometChat.CATEGORY_MESSAGE) {
        switch (messageType) {
          case CometChat.MESSAGE_TYPE.TEXT:
            const textMessage = message as CometChat.TextMessage;
            let text = (typeof textMessage.getText === 'function' ? textMessage.getText() : (textMessage as any).text) || "";

            // Prepare text for preview: collapse code blocks, strip block markers, flatten to single line
            const previewResult = preparePreviewText(text);
            const cleanText = previewResult.text;
            // Set inline code styles for the preview context — uses theme's textPrimary
            // which is white for outgoing (set by getReplyView) and dark for composer tray.
            previewFormatter.setStyle({
              inlineCodeStyle: {
                fontSize: 14,
                fontWeight: '400',
                color: finalTheme?.color?.textPrimary as string || '#141414',
              },
              inlineCodeContainerStyle: {
                backgroundColor: finalTheme?.color?.previewInlineCodeBackground ?? finalTheme?.color?.background3 ?? 'rgba(120, 120, 128, 0.18)',
                borderRadius: 4,
                borderWidth: 0.5,
                borderColor: finalTheme?.color?.borderDefault ?? 'rgba(120, 120, 128, 0.3)',
              },
            });
            const formatted = previewFormatter.getFormattedText(cleanText || null);

            // Resolve subtitle content
            let subtitleContent: string | JSX.Element;
            if (formatted && typeof formatted !== 'string') {
              subtitleContent = formatted;
            } else {
              subtitleContent = (formatted as string) || stripMarkdown(text);
            }

            // Apply mentions formatter using shared helper (DRY — same as conversation list)
            // mentionsStyle prop is passed from the caller (e.g., getReplyView in MessageDataSource)
            subtitleContent = applyMentionsFormatting(textMessage, subtitleContent, text, mentionsStyle);

            // For code blocks (first rich block): render compact code block container
            if (previewResult.codeBlockFirstLine !== null) {
              isCodeBlockPreview = true;
              codeBlockLine = previewResult.codeBlockFirstLine;
            }

            // For blockquotes: set flag for render section to add container styling
            if (previewResult.isBlockquote) {
              isBlockquotePreview = true;
            }

            // For list items: set flag so render shows prefix + content with ellipsis
            if (previewResult.listPrefix) {
              isListPreview = true;
              listPrefix = previewResult.listPrefix;
            }

            return subtitleContent;
          
          case CometChat.MESSAGE_TYPE.IMAGE:
          case CometChat.MESSAGE_TYPE.VIDEO:
          case CometChat.MESSAGE_TYPE.AUDIO:
          case CometChat.MESSAGE_TYPE.FILE: {
            const mediaMsg = message as CometChat.MediaMessage;
            // §8.4 — multi-attachment: show count+kind summary instead of one filename
            const atts = mediaMsg.getAttachments?.() ?? [];
            if (atts.length > 1) {
              // Label by the COARSE message type (single-kind), NOT per-attachment mime — a file whose
              // mime is image/* (e.g. "image (1).png" sent as a document) must not turn a files-only
              // message into a mixed "N attachments". Matches the conversation-list preview.
              return attachmentCountLabel(messageType, atts.length);
            }
            const singleAtt = typeof mediaMsg.getAttachment === 'function' ? mediaMsg.getAttachment() : (mediaMsg as any).attachment;
            const fallbackKey = messageType === CometChat.MESSAGE_TYPE.IMAGE ? "MESSAGE_IMAGE"
              : messageType === CometChat.MESSAGE_TYPE.VIDEO ? "MESSAGE_VIDEO"
              : messageType === CometChat.MESSAGE_TYPE.AUDIO ? "MESSAGE_AUDIO"
              : "MESSAGE_FILE";
            return singleAtt?.getName?.() || (singleAtt as any)?.name || t(fallbackKey) || fallbackKey;
          }
          
          default:
            return messageType || t("MESSAGE") || "Message";
        }
      } else if (messageCategory === CometChat.CATEGORY_CUSTOM) {
        // Handle custom message types with proper formatting
        
        if (messageType === "extension_sticker") {
          return "Sticker";
        } else if (messageType === "extension_collaborative_whiteboard" || messageType === "extension_whiteboard") {
          return "Collaborative Whiteboard";
        } else if (messageType === "extension_document") {
          return "Document";
        } else if (messageType === "extension_poll") {
          return "Poll";
        } else if (messageType === "meeting") {
          return "Meeting";
        } else if (messageType === "extension_location") {
          return "Location";
        } else {
          // Convert snake_case or camelCase to Title Case, but remove "extension_" prefix
          if (messageType) {
            let formattedType = messageType;
            
            // Remove "extension_" prefix if present
            if (formattedType.startsWith('extension_')) {
              formattedType = formattedType.replace('extension_', '');
            }
            
            return formattedType
              .replace(/[_-]/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }
          return t("CUSTOM_MESSAGE") || "Custom Message";
        }
      } else if (messageCategory === CometChat.CATEGORY_ACTION) {
        return t("ACTION_MESSAGE") || "Action";
      } else if (messageCategory === CometChat.CATEGORY_CARD) {
        // Developer card preview: getText() if present, else localized "Card Message".
        const cardMessage = message as any;
        const cardText =
          (typeof cardMessage.getText === "function" && cardMessage.getText()) ||
          "";
        return cardText || t("CARD_MESSAGE") || "Card Message";
      }
      
      return t("MESSAGE") || "Message";
    } catch (error) {
      console.warn("Error getting message preview subtitle:", error);
      return t("MESSAGE") || "Message";
    }
  };

  // Helper function to get auto-generated icon for attachment types
  const getAutoIcon = (): JSX.Element | null => {
    if (subtitleIcon) return null; // Don't auto-generate if icon is manually provided
    if (!message) {
      return null;
    }
    
    try {
      const messageType = typeof message.getType === 'function' ? message.getType() : (message as any).type;
      const messageCategory = typeof message.getCategory === 'function' ? message.getCategory() : (message as any).category;

      // Use theme colors safely
      const iconColor = finalTheme?.palette?.getAccent600?.() || 
                       finalTheme?.color?.iconSecondary || 
                       finalTheme?.colors?.accent || 
                       "#666666"; // fallback color

      if (messageCategory === CometChat.CATEGORY_MESSAGE) {
        switch (messageType) {
          case CometChat.MESSAGE_TYPE.IMAGE:
            return <Icon name="photo-fill" width={16} height={16} color={iconColor} />;
          case CometChat.MESSAGE_TYPE.VIDEO:
            return <Icon name="videocam-fill" width={16} height={16} color={iconColor} />;
          case CometChat.MESSAGE_TYPE.AUDIO:
            return <Icon name="play-circle-fill" width={16} height={16} color={iconColor} />;
          case CometChat.MESSAGE_TYPE.FILE:
            return <Icon name="description-fill" width={16} height={16} color={iconColor} />;
          default:
        }
      } else if (messageCategory === CometChat.CATEGORY_CUSTOM) {
        // Handle custom message types with appropriate icons
        let iconMessageType = messageType;
        
        // Normalize the message type by removing "extension_" prefix if present
        if (iconMessageType && iconMessageType.startsWith('extension_')) {
          iconMessageType = iconMessageType.replace('extension_', '');
        }
        
        switch (iconMessageType) {
          case "sticker":
            return <Icon name="sticker-fill" width={16} height={16} color={iconColor} />;
          case "collaborative_whiteboard":
          case "whiteboard":
            return <Icon name="collaborative-whiteboard-fill" width={16} height={16} color={iconColor} />;
          case "document":
            return <Icon name="collaborative-document-fill" width={16} height={16} color={iconColor} />;
          case "poll":
            return <Icon name="poll-fill" width={16} height={16} color={iconColor} />;
          case "meeting":
            return <Icon name="videocam-fill" width={16} height={16} color={iconColor} />;
          case "location":
            return <Icon name="location-on-fill" width={16} height={16} color={iconColor} />;
          default:
            return <Icon name="chat-fill" width={16} height={16} color={iconColor} />;
        }
      }
    } catch (error) {
      console.warn("Error getting auto icon:", error);
    }
    
    return null;
  };

  // Mutable flags set by getMessagePreviewSubtitle when block types are detected
  let isBlockquotePreview = false;
  let isCodeBlockPreview = false;
  let isListPreview = false;
  let listPrefix = '';
  let codeBlockLine = '';

  let messageText: string | JSX.Element = getMessagePreviewSubtitle();
  let title = getMessagePreviewTitle();
  let autoIcon = getAutoIcon();

  const shouldShowClose = showCloseIcon || onCloseClick;
  const containerStyle = style ? [Styles(finalTheme).editPreviewContainerStyle, style] : Styles(finalTheme).editPreviewContainerStyle;
  const iconToShow = hideSubtitleIcon ? null : (subtitleIcon || autoIcon);

  // Determine if subtitle is rich (JSX) or plain string
  const isRichSubtitle = typeof messageText !== 'string';
  // Detect if the formatter returned a View root (block-level content that
  // slipped through preparePreviewText). View can't nest inside Text, so we
  // render it in a height-constrained View wrapper instead.
  const isViewRoot = isRichSubtitle && React.isValidElement(messageText) && isViewElement(messageText);

  return (
    <View style={containerStyle}>
      {/* <View style={Styles(finalTheme).leftBar} /> */}
      <View style={Styles(finalTheme).previewHeadingStyle}>
        <Text style={[Styles(finalTheme).previewTitleStyle, titleStyle]}>{title}</Text>
        {shouldShowClose && (
          <TouchableOpacity
            style={Styles(finalTheme).previewCloseStyle}
            onPress={onCloseClick ?? (() => {})}
          >
            <Icon name='close' width={16} height={16} color={finalTheme.color.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      {overlineText ? (
        <View style={[previewBlockStyles.overlineRow, { gap: finalTheme?.spacing?.padding?.p1 }]}>
          {autoIcon}
          <Text numberOfLines={1} ellipsizeMode='tail' style={[Styles(finalTheme).previewSubTitleStyle, previewBlockStyles.flexOne]}>
            {overlineText}
          </Text>
        </View>
      ) : null}
      <View style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: finalTheme?.spacing?.padding?.p1 }]}>
        {iconToShow && <View>{iconToShow}</View>}
        {isCodeBlockPreview ? (
          <View style={previewBlockStyles.codeBlockRow}>
            <View style={[previewBlockStyles.codeBlockBadge, { backgroundColor: (finalTheme?.color?.previewCodeBlockBackground ?? finalTheme?.color?.background2) as string || '#FAFAFA', borderColor: (finalTheme?.color?.previewCodeBlockBorder ?? finalTheme?.color?.borderDefault) as string || '#E8E8E8' }]}>
              <Text numberOfLines={1} ellipsizeMode='tail' style={[previewBlockStyles.codeBlockText, { color: finalTheme?.color?.textPrimary as string || '#141414' }]}>
                {codeBlockLine + '..'}
              </Text>
            </View>
          </View>
        ) : isBlockquotePreview ? (
          <View style={previewBlockStyles.blockquoteRow}>
            <View style={[previewBlockStyles.blockquoteBar, { backgroundColor: finalTheme.color.primaryColor as string }]} />
            <Text numberOfLines={1} ellipsizeMode='tail' style={[Styles(finalTheme).previewSubTitleStyle, previewBlockStyles.blockquoteText]}>
              {messageText}
            </Text>
          </View>
        ) : isListPreview ? (
          <Text numberOfLines={1} ellipsizeMode='tail' style={[Styles(finalTheme).previewSubTitleStyle, previewBlockStyles.flexOne]}>
            {listPrefix}{messageText}{'...'}
          </Text>
        ) : isViewRoot ? (
          <View style={previewBlockStyles.viewRootContainer}>
            {messageText}
          </View>
        ) : (
          <Text numberOfLines={1} ellipsizeMode='tail' style={[Styles(finalTheme).previewSubTitleStyle, previewBlockStyles.flexOne]}>
            {messageText}
          </Text>
        )}
      </View>
    </View>
  );
};

export { CometChatMessagePreview };

// Static styles for message preview block-level elements.
// Theme-dependent values (colors) are applied inline via style array merging.
const previewBlockStyles = StyleSheet.create({
  codeBlockRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeBlockBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 1,
  },
  codeBlockText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  blockquoteRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(104, 81, 214, 0.08)',
    borderRadius: 8,
    minHeight: 26,
    paddingVertical: 2,
  },
  blockquoteBar: {
    width: 4,
    borderRadius: 2,
    marginVertical: 4,
    marginLeft: 4,
  },
  blockquoteText: {
    flex: 1,
    marginBottom: 0,
    paddingHorizontal: 6,
    lineHeight: 22,
  },
  flexOne: {
    flex: 1,
  },
  overlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  viewRootContainer: {
    flex: 1,
    overflow: 'hidden',
    maxHeight: 28,
  },
});
