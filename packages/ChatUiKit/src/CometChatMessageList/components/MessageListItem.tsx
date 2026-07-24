import React, { memo } from 'react';
import { View, Animated } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatDateSeparator } from '../../shared/views/CometChatDateSeperator';
import { CometChatTheme } from '../../theme/type';
import { CometChatNewMessageIndicator, NewMessageIndicatorStyle } from '../../shared/views';

interface MessageListItemProps {
  item: CometChat.BaseMessage;
  index: number;
  showSeparator: boolean;
  isHighlighted: boolean;
  highlightAnimatedValue: Animated.Value;
  theme: CometChatTheme;
  themeMode: string; 
  timestamp: number;
  dayHeaderString: string | undefined;
  RenderMessageItem: React.ComponentType<any>;
  itemSeparator: (tight?: boolean) => React.ReactNode;
  /** Collapse the TOP padding — the older (above) neighbour is in the same fan-out batch. */
  tightTop?: boolean;
  /** Collapse the BOTTOM padding — the newer (below) neighbour is in the same fan-out batch. */
  tightBottom?: boolean;
  staticStyles: any;
  onLayout?: (event: any, messageId: string) => void;
  showNewMessageIndicator?: boolean;
  NewMessageIndicatorView?: React.ComponentType<any>;
  newMessageIndicatorStyle?: NewMessageIndicatorStyle;
  newMessageIndicatorText?: string;
}

const MessageListItemComponent: React.FC<MessageListItemProps> = ({
  item,
  index,
  showSeparator,
  isHighlighted,
  highlightAnimatedValue,
  theme,
  themeMode,
  timestamp,
  dayHeaderString,
  RenderMessageItem,
  itemSeparator,
  tightTop,
  tightBottom,
  staticStyles,
  onLayout,
  showNewMessageIndicator,
  NewMessageIndicatorView,
  newMessageIndicatorStyle,
  newMessageIndicatorText,
}) => {

  // Handle layout event to get item position
  const handleLayout = (event: any) => {
    if (onLayout) {
      onLayout(event, String(item.getId()));
    }
  };

  return (
    <View
      style={[
        staticStyles.container,
        tightTop ? staticStyles.messageTightTop : null,
        tightBottom ? staticStyles.messageTightBottom : null,
      ]}
      onLayout={handleLayout}
    >
      {isHighlighted && (
        <Animated.View
          style={[
            staticStyles.highlightOverlay,
            showSeparator ? staticStyles.highlightOverlayBelowSeparator : null,
            {
              backgroundColor: highlightAnimatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', String(theme.color.extendedPrimary200)],
              }),
            },
          ]}
        />
      )}
      <View style={staticStyles.contentWrapper}>
        {showSeparator && (
          <View style={staticStyles.separatorContainer}>
            <CometChatDateSeparator
              timeStamp={timestamp}
              pattern="dayDateFormat"
              customDateString={dayHeaderString}
              style={theme.messageListStyles.dateSeparatorStyle}
            />
          </View>
        )}
        {showNewMessageIndicator && (
          <CometChatNewMessageIndicator
            NewMessageIndicatorView={NewMessageIndicatorView}
            style={newMessageIndicatorStyle}
            text={newMessageIndicatorText}
          />
        )}
        <RenderMessageItem item={item} theme={theme} idx={index} />
        {/* The separator sits BELOW the bubble → it faces the newer (below) neighbour, so it must
            collapse with tightBottom (not tightTop) for same-batch rows to read as one group. */}
        {itemSeparator(tightBottom)}
      </View>
    </View>
  );
};

// Memoize with custom comparison
export const MessageListItem = memo(MessageListItemComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props changed (re-render needed)

  const itemUnchanged = prevProps.item === nextProps.item;

  // Theme mode change should trigger re-render for theme updates
  const themeModeUnchanged = prevProps.themeMode === nextProps.themeMode;

  const visualsUnchanged =
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.showSeparator === nextProps.showSeparator &&
    prevProps.tightTop === nextProps.tightTop &&
    prevProps.tightBottom === nextProps.tightBottom &&
    prevProps.timestamp === nextProps.timestamp &&
    prevProps.dayHeaderString === nextProps.dayHeaderString &&
    prevProps.showNewMessageIndicator === nextProps.showNewMessageIndicator &&
    prevProps.newMessageIndicatorText === nextProps.newMessageIndicatorText;

  const styleUnchanged =
    prevProps.staticStyles === nextProps.staticStyles &&
    prevProps.newMessageIndicatorStyle === nextProps.newMessageIndicatorStyle;

  const functionsUnchanged =
    prevProps.itemSeparator === nextProps.itemSeparator &&
    prevProps.highlightAnimatedValue === nextProps.highlightAnimatedValue &&
    prevProps.onLayout === nextProps.onLayout;

  return itemUnchanged && themeModeUnchanged && visualsUnchanged && styleUnchanged && functionsUnchanged;
});

MessageListItem.displayName = 'MessageListItem';
