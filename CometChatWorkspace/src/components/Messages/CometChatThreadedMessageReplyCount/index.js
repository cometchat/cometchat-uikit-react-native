import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import theme from '../../../resources/theme';
import styles from './styles';
import * as actions from '../../../utils/actions';

const CometChatThreadedMessageReplyCount = (props) => {
  const replyTheme = { ...theme, ...props.theme };

  const { replyCount } = props.message;
  const replyText =
    replyCount === 1 ? `${replyCount} reply` : `${replyCount} replies`;

  let replies = (
    <TouchableOpacity
      onPress={() => {
        props.actionGenerated(actions.VIEW_MESSAGE_THREAD, props.message);
      }}>
      <Text
        style={[
          styles.replyTextStyle,
          {
            color: replyTheme.color.blue,
          },
        ]}>
        {replyText}
      </Text>
    </TouchableOpacity>
  );

  if (
    Object.prototype.hasOwnProperty.call(props.message, 'replyCount') === false
  ) {
    replies = null;
  }

  return replies;
};
export default CometChatThreadedMessageReplyCount;
