import React from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import CometChatReadReceipt from '../CometChatReadReceipt';
import style from './styles';
import theme from '../../../resources/theme';
import AudioControls from './audioControls';

export default (props) => {
  const message = { ...props.message, messageFrom: 'sender' };
  const ViewTheme = { ...theme, ...props.theme };
  return (
    <View style={{ marginBottom: 16, alignItems: 'flex-end' }}>
      <View style={{ width: '70%' }}>
        <TouchableWithoutFeedback
          onLongPress={() => props.actionGenerated('openMessageActions', message)}>
          <View
            style={[
              style.messageWrapperStyle,
              { backgroundColor: ViewTheme.backgroundColor.grey },
            ]}>
            <AudioControls source={props.message.data.url} />
          </View>
        </TouchableWithoutFeedback>
      </View>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatThreadedMessageReplyCount {...props} message={message} />
        <CometChatReadReceipt {...props} />
      </View>
      <CometChatMessageReactions theme={props.theme} {...props} message={message} />
    </View>
  );
};
