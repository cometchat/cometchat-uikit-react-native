import React, { useContext } from 'react';
// @ts-ignore
import { Text, View } from 'react-native';
import { CometChatContextType } from '../../base/Types';
import { CometChatContext } from '../../CometChatContext';
import { BadgeStyle } from './BadgeStyle';
import styles from './styles';

/**
 *
 * CometChatBadge is a component useful when returning the number of unread messages in a chat.
 * This component is used to return the unread message count with custom style.
 *
 * @version 1.0.0
 * @author CometChat
 *
 */
interface CometChatBadgeProps {
  count: number;
  style?: BadgeStyle;
}

export const CometChatBadge = (props: CometChatBadgeProps) => {
  const { theme } = useContext<CometChatContextType>(CometChatContext);

  const defaultStyleProps = new BadgeStyle({
    backgroundColor: theme?.palette.getPrimary(),
    textFont: theme.typography.caption2,
    textColor: theme.palette.getBackgroundColor(),
  });
  const { count } = props;
  const style = {
    ...defaultStyleProps,
    ...props.style,
    border: { ...defaultStyleProps.border, ...props.style?.border },
    textFont: { ...defaultStyleProps.textFont, ...props.style?.textFont },
  };
  if (count == 0) return null;
  return (
    <View
      style={[
        styles.badgeStyle,
        {
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius,
          width: style.width,
          height: style.height,
        },
        style.border,
      ]}
    >
      <Text
        style={[
          styles.textStyle,
          {
            color: style.textColor,
          },
          style.textFont,
        ]}
      >
        {count > 999 ? '999+' : count}
      </Text>
    </View>
  );
};

CometChatBadge.defaultProps = {
  count: 0,
  style: new BadgeStyle({}),
};
