import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import theme from '../../../resources/theme';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import { CometChatAvatar } from '../../Shared';
import style from './styles';
import AudioControls from './audioControls';

export default (props) => {
  const message = { ...props.message, messageFrom: 'receiver' };
  const ViewTheme = { ...theme, ...props.theme };
  let senderAvatar = null;
  if (message.receiverType === 'group') {
    senderAvatar = { uri: message.sender.avatar };
  }
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {props.message.receiverType === 'group' ? (
          <View style={style.avatarStyle}>
            <CometChatAvatar
              cornerRadius={18}
              borderColor={ViewTheme.color.secondary}
              borderWidth={0}
              image={senderAvatar}
              name={message.sender.name}
            />
          </View>
        ) : null}
        <View>
          {props.message.receiverType === 'group' ? (
            <View style={{ marginBottom: 5 }}>
              <Text>{message.sender.name}</Text>
            </View>
          ) : null}
          <View style={{ width: '81%' }}>
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
        </View>
      </View>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatReadReceipt {...props} message={message} />
        <CometChatThreadedMessageReplyCount {...props} message={message} />
      </View>
      <CometChatMessageReactions theme={props.theme} {...props} message={message} />
    </View>
  );
};
