import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import theme from '../../../resources/theme';
import styles from './styles';

export default (props) => {
  const replyTheme = { ...theme, ...props.theme };

  const { replyCount } = props.message;
  const replyText = replyCount === 1 ? `${replyCount} reply` : `${replyCount} replies`;

  let replies = (
    <TouchableOpacity
      onPress={() => {
        props.actionGenerated('viewMessageThread', props.message);
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

  if (Object.prototype.hasOwnProperty.call(props.message, 'replyCount') === false) {
    replies = null;
  }

  if (
    Object.prototype.hasOwnProperty.call(props, 'widgetconfig') &&
    props.widgetconfig &&
    Object.prototype.hasOwnProperty.call(props.widgetconfig, 'threaded-chats') &&
    props.widgetconfig['threaded-chats'] === false
  ) {
    replies = null;
  }

  if (
    Object.prototype.hasOwnProperty.call(props, 'widgetsettings') &&
    props.widgetsettings &&
    Object.prototype.hasOwnProperty.call(props.widgetsettings, 'main') &&
    Object.prototype.hasOwnProperty.call(props.widgetsettings.main, 'enable_threaded_replies') &&
    props.widgetsettings.main.enable_threaded_replies === false
  ) {
    replies = null;
  }

  return replies;
};
