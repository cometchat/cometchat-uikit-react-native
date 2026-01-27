import React, { memo } from 'react';
import { View, Animated } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatDateSeparator } from '../../shared/views/CometChatDateSeperator';
import { CometChatTheme } from '../../theme/type';
import { CometChatNewMessageIndicator, NewMessageIndicatorStyle } from '../../shared/views';

const SEPARATOR_HEIGHT = 40;

interface MessageListItemProps {
  item: CometChat.BaseMessage;
  index: number;
  showSeparator: boolean;
  isHighlighted: boolean;
  highlightAnimatedValue: Animated.Value;
  theme: CometChatTheme;
  timestamp: number;
  dayHeaderString: string | undefined;
  RenderMessageItem: React.ComponentType<any>;
  itemSeparator: () => React.ReactNode;
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
  timestamp,
  dayHeaderString,
  RenderMessageItem,
  itemSeparator,
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
    <View style={staticStyles.container} onLayout={handleLayout}>
      {isHighlighted && (
        <Animated.View
          style={{
            backgroundColor: highlightAnimatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['transparent', String(theme.color.extendedPrimary200)],
            }),
            position: 'absolute',
            left: 0,
            right: 0,
            top: showSeparator ? SEPARATOR_HEIGHT : 0,
            bottom: 0,
            zIndex: 1,
          }}
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
        {itemSeparator()}
      </View>
    </View>
  );
};

// Memoize with custom comparison
export const MessageListItem = memo(MessageListItemComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props changed (re-render needed)
  
  const itemUnchanged = prevProps.item === nextProps.item;
  
  const visualsUnchanged =
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.showSeparator === nextProps.showSeparator &&
    prevProps.timestamp === nextProps.timestamp &&
    prevProps.dayHeaderString === nextProps.dayHeaderString &&
    prevProps.showNewMessageIndicator === nextProps.showNewMessageIndicator &&
    prevProps.newMessageIndicatorText === nextProps.newMessageIndicatorText;
  
  const styleUnchanged =
    prevProps.theme === nextProps.theme &&
    prevProps.staticStyles === nextProps.staticStyles &&
    prevProps.newMessageIndicatorStyle === nextProps.newMessageIndicatorStyle;
  
  const functionsUnchanged =
    prevProps.RenderMessageItem === nextProps.RenderMessageItem &&
    prevProps.itemSeparator === nextProps.itemSeparator &&
    prevProps.highlightAnimatedValue === nextProps.highlightAnimatedValue &&
    prevProps.onLayout === nextProps.onLayout;
  
  return itemUnchanged && visualsUnchanged && styleUnchanged && functionsUnchanged;
});

MessageListItem.displayName = 'MessageListItem';
