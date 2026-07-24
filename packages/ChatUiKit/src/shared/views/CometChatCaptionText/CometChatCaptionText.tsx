import React, { useMemo } from "react";
import { Platform, StyleProp, TextStyle, ViewStyle } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatTheme } from "../../../theme/type";
import { AdditionalParams } from "../../base/Types";
import { CometChatTextBubble } from "../CometChatTextBubble";
import {
  CometChatTextFormatter,
  CometChatMentionsFormatter,
  CometChatUrlsFormatter,
  CometChatRichTextFormatter,
} from "../../formatters";
import { CommonUtils } from "../../utils/CommonUtils";
import { CometChatUIKit } from "../../CometChatUiKit";
import { MentionsTargetElement } from "../../constants/UIKitConstants";

export interface CometChatCaptionTextProps {
  /** The media message the caption belongs to (drives mentions + sent/received styling). */
  message: CometChat.BaseMessage;
  /** The caption text to render. */
  caption: string;
  theme: CometChatTheme;
  /** Visible text color/typography — the bubble keeps control of this. */
  textStyle?: StyleProp<TextStyle>;
  /** Padding around the caption — the bubble keeps control of this. */
  containerStyle?: StyleProp<ViewStyle>;
  additionalParams?: AdditionalParams;
}

/**
 * Renders a media caption with the SAME rich-text support as the text bubble
 * (bold / italic / strikethrough, ordered + bullet lists, inline code + code blocks,
 * blockquotes, links, mentions). The caption is fed through the same formatter chain
 * `getTextMessageBubble` builds; the host bubble keeps control of the visible color/padding
 * via `textStyle` / `containerStyle`.
 */
export function CometChatCaptionText({
  message,
  caption,
  theme,
  textStyle,
  containerStyle,
  additionalParams,
}: CometChatCaptionTextProps) {
  const formatters = useMemo(
    () => buildCaptionFormatters(message, theme, additionalParams),
    [message, theme, additionalParams]
  );
  return (
    <CometChatTextBubble
      text={caption}
      textStyle={textStyle}
      textContainerStyle={containerStyle}
      textFormatters={formatters}
    />
  );
}

/**
 * Mirrors the formatter setup in `MessageDataSource.getTextMessageBubble` so captions format
 * identically to text messages. No decorator overrides `getUrlsFormatter`/`getMentionsFormatter`,
 * so we construct the formatters directly here — this keeps the util free of a `ChatConfigurator`
 * import, which would otherwise create a module-load cycle (bubble → this → ChatConfigurator →
 * MessageDataSource → bubble).
 */
export function buildCaptionFormatters(
  message: CometChat.BaseMessage,
  theme: CometChatTheme,
  additionalParams?: AdditionalParams
): CometChatTextFormatter[] {
  const loggedInUser = CometChatUIKit.loggedInUser;
  const mentionedUsers = (message as CometChat.TextMessage).getMentionedUsers?.() ?? [];
  const textFormatters = [...(additionalParams?.textFormatters || [])];
  const isMessageSentByLoggedInUser = message.getSender()?.getUid() === loggedInUser?.getUid();

  const linksTextFormatter = new CometChatUrlsFormatter(loggedInUser ?? undefined);
  const mentionsTextFormatter = new CometChatMentionsFormatter(theme, loggedInUser ?? undefined);

  // Rich text formatter — parses markdown (bold/italic/lists/code/blockquotes/links).
  const richTextFormatter = new CometChatRichTextFormatter(loggedInUser ?? undefined);
  richTextFormatter.setMessage(message);
  richTextFormatter.setId("ccDefaultRichTextFormatterId");
  richTextFormatter.setStyle({
    linkStyle: {
      color: isMessageSentByLoggedInUser ? theme.color.sendBubbleLink : theme.color.receiveBubbleLink,
      textDecorationLine: "underline",
    },
    inlineCodeStyle: isMessageSentByLoggedInUser
      ? {
          fontSize: theme.typography.body.regular.fontSize,
          fontWeight: "400",
          lineHeight: ((theme.typography.body.regular.fontSize as number) ?? 14) * 1.2,
          color: theme.color.sendBubbleTextHighlight,
        }
      : {
          fontSize: theme.typography.body.regular.fontSize,
          fontWeight: "400",
          lineHeight: ((theme.typography.body.regular.fontSize as number) ?? 14) * 1.2,
          color: theme.color.receiveBubbleTextHighlight,
        },
    inlineCodeContainerStyle: isMessageSentByLoggedInUser
      ? {
          backgroundColor: `${String(theme.color.extendedPrimary50)}33`,
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
    codeBlockStyle: {
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: 13,
      color: isMessageSentByLoggedInUser ? theme.color.sendBubbleText : theme.color.receiveBubbleText,
    },
    codeBlockContainerStyle: isMessageSentByLoggedInUser
      ? {
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: 4,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
          padding: 12,
        }
      : {
          backgroundColor: theme.color.background2,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: theme.color.borderDefault,
          padding: 12,
        },
    blockquoteContainerStyle: isMessageSentByLoggedInUser
      ? { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: theme.spacing.radius.r2 }
      : { backgroundColor: theme.color.background3, borderRadius: theme.spacing.radius.r2 },
    blockquoteBarStyle: isMessageSentByLoggedInUser
      ? { backgroundColor: "rgba(255,255,255,0.6)" }
      : { backgroundColor: theme.color.primary },
  });

  mentionsTextFormatter.setContext(isMessageSentByLoggedInUser ? "outgoing" : "incoming");
  linksTextFormatter.setMessage(message);
  linksTextFormatter.setId("ccDefaultUrlsFormatterId");
  linksTextFormatter.setStyle({ linkTextColor: theme.color.receiveBubbleLink });
  if (isMessageSentByLoggedInUser) {
    linksTextFormatter.setStyle({ linkTextColor: theme.color.sendBubbleText });
  }

  if (!additionalParams?.disableMentions && mentionedUsers && mentionedUsers.length) {
    if (loggedInUser) mentionsTextFormatter.setLoggedInUser(loggedInUser);
    mentionsTextFormatter.setMessage(message);
    mentionsTextFormatter.setId("ccDefaultMentionFormatterId");
  }

  const finalFormatters: CometChatTextFormatter[] = [];
  let urlFormatterExists = false;
  let mentionsFormatterExists = false;
  let richTextFormatterExists = false;

  for (const formatter of textFormatters) {
    if (formatter instanceof CometChatUrlsFormatter) urlFormatterExists = true;
    if (formatter instanceof CometChatMentionsFormatter) {
      mentionsFormatterExists = true;
      formatter.setMessage(message);
      formatter.setTargetElement(MentionsTargetElement.textbubble);
      if (loggedInUser) formatter.setLoggedInUser(loggedInUser);
      formatter.setContext(isMessageSentByLoggedInUser ? "outgoing" : "incoming");
    }
    if (formatter instanceof CometChatRichTextFormatter) richTextFormatterExists = true;
    formatter.setMessage(message);
    finalFormatters.push(CommonUtils.clone(formatter));
    if (urlFormatterExists && mentionsFormatterExists && richTextFormatterExists) break;
  }

  // Rich text goes first so markdown is parsed before links/mentions run.
  if (!richTextFormatterExists) finalFormatters.unshift(richTextFormatter);
  if (!urlFormatterExists) finalFormatters.push(linksTextFormatter);
  if (!mentionsFormatterExists) finalFormatters.push(mentionsTextFormatter);

  return finalFormatters;
}
