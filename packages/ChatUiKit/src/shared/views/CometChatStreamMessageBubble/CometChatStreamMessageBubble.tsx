import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { useTheme } from '../../../theme';
import { messageStream, streamingState$, IStreamData, getAIAssistantTools, stopStreamingForRunId, handleWebsocketMessage, startStreamingForRunId, streamConnection$, notifyStreamRenderComplete } from '../../services/stream-message.service';
import { CometChatUiKitConstants } from '../../index';

export interface CometChatStreamMessageBubbleProps {
  message: any;
  theme?: any;
  style?: any;
}

const CometChatStreamMessageBubble: React.FC<CometChatStreamMessageBubbleProps> = memo(({ 
  message, 
  style: bubbleStyle
}) => {
  const initialMessageRef = useRef<any>(message);
  const [data, setData] = useState<any>(initialMessageRef.current || null);
  const [fullMessage, setFullMessage] = useState<string>('');
  const [executionText, setExecutionText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [finished, setFinished] = useState(false);
  const [contentStreamStarted, setContentStreamStarted] = useState(false);
  const [runStarted, setRunStarted] = useState(false);
  const [showingExecutionText, setShowingExecutionText] = useState(false);
  const shimmerAnimation = useRef(new Animated.Value(-1)).current;
  const theme = useTheme();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const streamListenerId = useRef(`stream_bubble_${Date.now()}`);
  const hasInitializedStreaming = useRef(false);
  const [renderComplete, setRenderComplete] = useState(false);

  const toolCallNameRef = useRef<string>('');
  const toolCallDataRef = useRef<object>({});

  // Tool events mapping
  const toolEventsMap = [
    CometChatUiKitConstants.streamMessageTypes.tool_call_args,
    CometChatUiKitConstants.streamMessageTypes.tool_call_end,
    CometChatUiKitConstants.streamMessageTypes.tool_call_result,
    CometChatUiKitConstants.streamMessageTypes.tool_call_start
  ];
  useEffect(() => {
  if (finished && fullMessage && contentStreamStarted) {
    setRenderComplete(true);
    const runId = (initialMessageRef.current as any)?.getId?.();
    if (runId) {
      notifyStreamRenderComplete(runId);
    }
  }
}, [finished, fullMessage, contentStreamStarted]);

  useEffect(() => {
    const isStreamMessage = (initialMessageRef.current as any)?.isStreamMessage;
    const runId = (initialMessageRef.current as any)?.getId?.();
    const metadata = (initialMessageRef.current as any)?.getMetadata?.();
    const startRunning = metadata?.start_running;

    if (isStreamMessage && runId && startRunning && !hasInitializedStreaming.current) {
      hasInitializedStreaming.current = true;
      startStreamingForRunId(runId, (aiEvent: CometChat.AIAssistantBaseEvent) => {
        if (aiEvent.getMessageId && aiEvent.getMessageId() === runId) {
          if (aiEvent.getType() === CometChatUiKitConstants.streamMessageTypes.run_started) {
            setRunStarted(true);
          }
        }
      });
    }

    return () => {
      if (hasInitializedStreaming.current) {
        stopStreamingForRunId();
      }
    };
  }, []);


  useEffect(() => {
    const streamState = streamingState$.subscribe({
      next: setIsStreaming,
      error: () => {
        stopStreamingForRunId();
        setHasError(true);
      },
    });

    const subscription = messageStream.subscribe({
      next: (streamData: IStreamData) => {
        const targetMessageId = (initialMessageRef.current as any)?.getId?.();
        const currentId = String(streamData.message?.getMessageId?.());

        if (targetMessageId && String(currentId) !== String(targetMessageId)) {
          return;
        }

        // Handle tool call events
        const eventType = streamData.message.getType();

        // Handle tool call events
        if (toolEventsMap.includes(eventType)) {
          if (eventType === CometChatUiKitConstants.streamMessageTypes.tool_call_start) {
            toolCallNameRef.current = (streamData.message as any).getToolCallName();
            const execText = streamData.message.getData()?.executionText;
            
            if (execText) {
              setExecutionText(execText);
              setShowingExecutionText(true);
              setContentStreamStarted(false);
            }
          }
          if (eventType === CometChatUiKitConstants.streamMessageTypes.tool_call_args) {
            toolCallDataRef.current = JSON.parse((streamData.message as any).getDelta());
          }
          if (eventType === CometChatUiKitConstants.streamMessageTypes.tool_call_end) {
            const assistantTools = getAIAssistantTools();
            const toolCallName = toolCallNameRef.current;

            if (toolCallName && assistantTools) {
              const handler = assistantTools.getAction(toolCallName);
              handler?.(toolCallDataRef.current);
            }
            setShowingExecutionText(false);
            setExecutionText('');
          }
        }

        setData(streamData.message);

        if (streamData.streamedMessages !== undefined) {
          const newMessage = streamData.streamedMessages ?? '';
          if (!contentStreamStarted && streamData.message?.getType() === CometChatUiKitConstants.streamMessageTypes.text_message_content) {
            setContentStreamStarted(true);
            setShowingExecutionText(false);
          }
          setFullMessage(() => newMessage);
        }

        if (streamData.message?.getType() === CometChatUiKitConstants.streamMessageTypes.run_finished) {
          setFinished(true);
          setContentStreamStarted(true);
          setShowingExecutionText(false);
          subscription.unsubscribe();
          streamState.unsubscribe();
          if (hasInitializedStreaming.current) {
            CometChat.removeAIAssistantListener(streamListenerId.current);
            hasInitializedStreaming.current = false;
          }
        }
      },
      error: () => {
        stopStreamingForRunId();
        setHasError(true);
      },
    });

    return () => {
      subscription.unsubscribe();
      streamState.unsubscribe();
      shimmerAnimation.stopAnimation();
    };
  }, []);

  useEffect(() => {
    let disconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    const sub = streamConnection$.subscribe(({ status, error }) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        if (disconnectTimeout) {
          clearTimeout(disconnectTimeout);
          disconnectTimeout = null;
        }
        setHasError(false);
      } else if (status === 'disconnected' || status === 'error') {
        disconnectTimeout = setTimeout(() => {
          setHasError(true);
        }, 5000);
      }
    });
    return () => {
      sub.unsubscribe();
      if (disconnectTimeout) clearTimeout(disconnectTimeout);
    };
  }, []);

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
        Object.entries(bubbleStyle.textStyle).filter(([key]) => key !== 'color')
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

  const MemoMarkdown = useMemo(() => {
    return fullMessage ? (
      <Markdown style={markdownStyles} mergeStyle={true}>
        {fullMessage.trim()}
      </Markdown>
    ) : null;
  }, [fullMessage, markdownStyles]);

  const shouldShowThinking = !contentStreamStarted && !runStarted && !showingExecutionText;
  const shouldShowExecutionText = showingExecutionText && executionText && !contentStreamStarted;

  // Simple shimmer component - single text with opacity and color animation
  const ShimmerText = useCallback(({ children, style }: { children: string, style: any }) => {
    return (
      <Animated.Text
        style={[
          style,
          {
            opacity: shimmerAnimation.interpolate({
              inputRange: [-1, -0.5, 0, 0.5, 1],
              outputRange: [0.4, 0.7, 1, 0.7, 0.4],
            }),
            color: shimmerAnimation.interpolate({
              inputRange: [-1, -0.5, 0, 0.5, 1],
              outputRange: [
                style.color || theme.color.textTertiary,
                style.color || theme.color.textTertiary,
                style.color || theme.color.textSecondary,
                style.color || theme.color.textPrimary,
                style.color || theme.color.receiveBubbleText,
              ],
            }),
          },
        ]}
      >
        {children}
      </Animated.Text>
    );
  }, [shimmerAnimation, theme]);

  // Use the bubbleStyle passed from parent, with theme fallbacks
  const styles = StyleSheet.create({
    container: {
      display: 'flex',
      paddingVertical: bubbleStyle?.containerStyle?.paddingVertical || 0,
      paddingHorizontal: bubbleStyle?.containerStyle?.paddingHorizontal || 0,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      alignSelf: 'flex-start',
      backgroundColor: bubbleStyle?.containerStyle?.backgroundColor || 'transparent',
      borderRadius: bubbleStyle?.containerStyle?.borderRadius || theme.spacing.radius.r3,
      maxWidth: '100%',
      ...bubbleStyle?.containerStyle,
    },
    textContainer: {
      ...bubbleStyle?.textContainerStyle,
    },
    text: {
      color: bubbleStyle?.textStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.textStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      fontSize: bubbleStyle?.textStyle?.fontSize || theme.typography.body.regular.fontSize,
      ...bubbleStyle?.textStyle,
    },
    placeholderText: {
      color: bubbleStyle?.placeholderTextStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.placeholderTextStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      fontSize: bubbleStyle?.placeholderTextStyle?.fontSize || theme.typography.body.regular.fontSize,
      opacity: bubbleStyle?.placeholderTextStyle?.opacity || 0.6,
      ...bubbleStyle?.placeholderTextStyle,
      marginTop: 10
    },
    executionText: {
      color: bubbleStyle?.placeholderTextStyle?.color || theme.color.receiveBubbleText,
      fontFamily: bubbleStyle?.placeholderTextStyle?.fontFamily || theme.typography.body.regular.fontFamily,
      fontSize: bubbleStyle?.placeholderTextStyle?.fontSize || theme.typography.body.regular.fontSize,
      opacity: bubbleStyle?.placeholderTextStyle?.opacity || 0.8,
      ...bubbleStyle?.placeholderTextStyle,
      marginTop: 10,
      fontStyle: 'italic',
    },
    errorContainer: {
      borderLeftWidth: 3,
      borderLeftColor: theme.color.error,
      backgroundColor: bubbleStyle?.errorContainerStyle?.backgroundColor || theme.color.error,
      padding: bubbleStyle?.errorContainerStyle?.padding || theme.spacing.padding.p2,
      borderRadius: bubbleStyle?.errorContainerStyle?.borderRadius || theme.spacing.radius.r2,
      marginTop: bubbleStyle?.errorContainerStyle?.marginTop || theme.spacing.margin.m1,
      ...bubbleStyle?.errorContainerStyle,
    },
    errorText: {
      color: bubbleStyle?.errorTextStyle?.color || theme.color.background1,
      fontFamily: bubbleStyle?.errorTextStyle?.fontFamily || theme.typography.caption1.regular.fontFamily,
      fontSize: bubbleStyle?.errorTextStyle?.fontSize || theme.typography.caption1.regular.fontSize,
      ...bubbleStyle?.errorTextStyle,
    },
  });

  useEffect(() => {
    if ((shouldShowThinking || shouldShowExecutionText) && !fullMessage.trim() && !hasError) {
      Animated.loop(
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        })
      ).start();
    } else {
      shimmerAnimation.stopAnimation();
      shimmerAnimation.setValue(-1);
    }
  }, [shouldShowThinking, shouldShowExecutionText, fullMessage, hasError]);


  return (
    <View style={styles.container}>
      {shouldShowThinking && (
        <ShimmerText
          style={[
            styles.placeholderText,
            {
              fontStyle: theme.assistantBubbleStyles?.placeholderTextStyle?.fontStyle || theme.typography.body.regular.fontStyle,
            },
          ]}
        >
          Thinking...
        </ShimmerText>
      )}

      {shouldShowExecutionText && (
        <ShimmerText
          style={[
            styles.executionText,
            {
              fontStyle: theme.assistantBubbleStyles?.placeholderTextStyle?.fontStyle || theme.typography.body.regular.fontStyle,
            },
          ]}
        >
          {executionText}
        </ShimmerText>
      )}

      {fullMessage && contentStreamStarted && MemoMarkdown}

      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No internet connection. Please check your connection and try again.</Text>
        </View>
      )}
    </View>
  );
});

export default CometChatStreamMessageBubble;