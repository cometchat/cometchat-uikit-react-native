import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatCardView } from '@cometchat/cards-react-native';
import { useTheme } from '../../../theme';
import { CometChatTheme } from '../../../theme/type';
import { CometChatUIEventHandler, CometChatUIEvents } from '../../events';

export interface CometChatAIAssistantMessageBubbleProps {
  message: any;
  theme?: CometChatTheme;
  style?: any;
}

const getMessageText = (message: any) => {
  if (!message) return '';
  if (message instanceof CometChat.CustomMessage) {
    const customData = message.getData();
    if (customData?.text) return customData.text;
    if (customData?.assistantMessageData?.getText) return customData.assistantMessageData.getText();
  }
  if (typeof message.getAssistantMessageData === 'function') {
    const assistantData = message.getAssistantMessageData();
    if (assistantData?.getText) return assistantData.getText();
  }
  if (typeof message.getText === 'function') return message.getText();
  if (typeof message.text === 'string') return message.text;
  return '';
};

const CometChatAIAssistantMessageBubble: React.FC<CometChatAIAssistantMessageBubbleProps> = ({ 
  message, 
  style: bubbleStyle 
}) => {
  const theme = useTheme();
  const text = getMessageText(message);

  // Check if message has elements (agent card blocks)
  const elements: any[] | undefined = useMemo(() => {
    try {
      if (typeof message?.getElements === 'function') {
        const els = message.getElements();
        if (Array.isArray(els) && els.length > 0) return els;
      }
    } catch {}
    return undefined;
  }, [message]);

  const resolvedThemeMode: "light" | "dark" =
    theme?.mode === "dark" ? "dark" : "light";

  // Use the bubbleStyle passed from parent, with theme fallbacks
  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: bubbleStyle?.containerStyle?.backgroundColor || 'transparent',
      borderRadius: bubbleStyle?.containerStyle?.borderRadius || theme.spacing.radius.r3,
      minWidth: bubbleStyle?.containerStyle?.minWidth || 90,
      alignSelf: bubbleStyle?.containerStyle?.alignSelf || 'flex-start',
      maxWidth: '100%',
      overflow: 'hidden',
      ...bubbleStyle?.containerStyle,
    },
    cardBlock: {
      alignSelf: 'stretch',
      overflow: 'visible',
      borderRadius: theme.spacing.radius.r3,
      marginVertical: 8,
      marginHorizontal: -4,
    },
  }), [bubbleStyle, theme]);

  // Create markdown styles based on theme
  const markdownStyles = useMemo(() => ({
    body: {
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      fontSize: bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize,
      ...bubbleStyle?.textStyle,
      margin: 0,
      padding: 0,
      textAlignVertical: 'top',
    },
    text: {
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      fontSize: bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize,
      ...(bubbleStyle?.textStyle && Object.fromEntries(
        Object.entries(bubbleStyle.textStyle).filter(([key]: [string, any]) => key !== 'color')
      )),
    },
    paragraph: {
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      margin: 0,
      padding: 0,
    },
    code_inline: {
      backgroundColor: theme.color.background3,
      color: theme.color.textHighlight,
      borderRadius: theme.spacing.radius.r1,
      padding: theme.spacing.padding.p0_5,
    },
    code_block: {
      backgroundColor: theme.color.background3,
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      borderRadius: theme.spacing.radius.r2,
      padding: theme.spacing.padding.p2,
      fontFamily: 'monospace',
    },
    fence: {
      backgroundColor: theme.color.background3,
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      borderRadius: theme.spacing.radius.r2,
      borderWidth: 1,
      borderColor: theme.color.borderDefault,
      padding: theme.spacing.padding.p2,
      marginVertical: theme.spacing.margin.m4,
      fontFamily: 'monospace',
    },
    table: {
      borderWidth: 1,
      borderColor: theme.color.borderDefault,
      borderRadius: theme.spacing.radius.r2,
      backgroundColor: theme.color.background2,
      marginVertical: theme.spacing.margin.m2,
      overflow: 'hidden' as 'hidden',
      borderCollapse: 'separate' as 'separate',
      borderSpacing: 0,
    },
    thead: {
      backgroundColor: theme.color.background3,
      margin: 0,
      padding: 0,
    },
    tbody: {
      backgroundColor: theme.color.background1,
      margin: 0,
      padding: 0,
    },
    th: {
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.color.borderDefault,
      backgroundColor: theme.color.background3,
      padding: theme.spacing.padding.p2,
      fontWeight: 'bold',
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      fontSize: bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize,
      margin: 0,
      borderTopWidth: 0,
      borderLeftWidth: 0,
    },
    td: {
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.color.borderDefault,
      backgroundColor: theme.color.background1,
      padding: theme.spacing.padding.p2,
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      fontSize: bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize,
      margin: 0,
      borderTopWidth: 0,
      borderLeftWidth: 0,
    },
    tr: {
      borderBottomWidth: 0,
      margin: 0,
      padding: 0,
    },
    heading1: {
      fontWeight: '700' as '700',
      fontSize: (bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize) * 1.6,
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      marginVertical: theme.spacing.margin.m2,
    },
    heading2: {
      fontWeight: '700' as '700',
      fontSize: (bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize) * 1.4,
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      marginVertical: theme.spacing.margin.m2,
    },
    heading3: {
      fontWeight: '700' as '700',
      fontSize: (bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize) * 1.2,
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      marginVertical: theme.spacing.margin.m1,
    },
    heading4: {
      fontWeight: '700' as '700',
      fontSize: (bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize) * 1.1,
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      marginVertical: theme.spacing.margin.m1,
    },
    heading5: {
      fontWeight: '700' as '700',
      fontSize: bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize,
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      marginVertical: theme.spacing.margin.m1,
    },
    heading6: {
      fontWeight: '700' as '700',
      fontSize: (bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize) * 0.9,
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      marginVertical: theme.spacing.margin.m1,
    },
    strong: {
      fontWeight: '700' as '700',
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
    },
    em: {
      fontStyle: 'italic' as 'italic',
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: theme.color.borderDefault,
      paddingLeft: theme.spacing.padding.p2,
      color: theme.color.textSecondary,
    },
    link: {
      underlineColor: theme.color.textHighlight,
      color: theme.color.textHighlight,
      borderRadius: theme.spacing.radius.r1,
      paddingHorizontal: theme.spacing.padding.p0_5,
      paddingVertical: theme.spacing.padding.p0_5,
      textDecorationLine: 'underline' as 'underline',
    },
  }), [bubbleStyle?.textStyle, theme]);

  // Handle card action from a nested agent-card block (event-only, no prop).
  const handleCardAction = (actionEvent: any) => {
    // Renderer emits { action, elementId, cardJson }. Forward the raw action.
    const action = actionEvent?.action ?? actionEvent;
    if (!action) return;
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccCardActionClicked, {
      message,
      action,
    });
  };

  // Render elements walk (§2.7(b)): when getElements() is non-empty, walk
  // blocks in array order, switch on element.getType().
  const renderElements = useMemo(() => {
    if (!elements) return null;
    return elements.map((element: any, index: number) => {
      const type = typeof element.getType === 'function' ? element.getType() : element.type;
      const data = typeof element.getData === 'function' ? element.getData() : element.value;

      if (type === 'card') {
        // data is { card: {...}, cardId: "..." }
        const cardPayload = data?.card;
        if (!cardPayload) {
          // Empty/invalid block payload (§2.8): skip the renderer and fall back to
          // the block's fallbackText, else the block's text. Other blocks render normally.
          const blockFallback = data?.fallbackText ?? data?.text ?? '';
          if (!blockFallback || !String(blockFallback).trim()) return null;
          return (
            <View key={`card-fb-${index}`} style={{ marginTop: index > 0 ? 8 : 0 }}>
              <Markdown style={markdownStyles} mergeStyle={true}>
                {String(blockFallback).trim()}
              </Markdown>
            </View>
          );
        }
        const cardJson = JSON.stringify(cardPayload);
        return (
          <View key={`card-${index}`} style={styles.cardBlock}>
            <CometChatCardView
              cardJson={cardJson}
              themeMode={resolvedThemeMode}
              onAction={handleCardAction}
            />
          </View>
        );
      }

      if (type === 'text') {
        // data is the text string
        const textContent = typeof data === 'string' ? data : (data?.text ?? '');
        if (!textContent.trim()) return null;
        return (
          <View key={`text-${index}`} style={{ marginTop: index > 0 ? 8 : 0 }}>
            <Markdown style={markdownStyles} mergeStyle={true}>
              {textContent.trim()}
            </Markdown>
          </View>
        );
      }

      // Other element types — skip for now (renderer owns unknown handling)
      return null;
    });
  }, [elements, styles, markdownStyles, resolvedThemeMode, message]);

  // If elements are present, render them in order. Otherwise fall back to getText().
  if (elements) {
    return (
      <View style={styles.container}>
        {renderElements}
      </View>
    );
  }

  // Fallback: existing getText() rendering (older messages without elements)
  return (
    <View style={styles.container}>
      <Markdown style={markdownStyles} mergeStyle={true}>
        {text.trim()}
      </Markdown>
    </View>
  );
};

export default CometChatAIAssistantMessageBubble;
