import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import theme from '../../../resources/theme';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import { CometChatAvatar } from '../../Shared';
import style from './styles';
import AudioControls from './audioControls';
import { CometChat } from '@cometchat-pro/react-native-chat';

const CometChatReceiverAudioMessageBubble = (props) => {
  const message = {
    ...props.message,
    messageFrom: enums.MESSAGE_FROM_RECEIVER,
  };
  const viewTheme = { ...theme, ...props.theme };
  let senderAvatar = null;
  if (message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
    senderAvatar = { uri: message.sender.avatar };
  }
  return (
    <View style={style.container}>
      <View style={style.messageContainer}>
        {props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP ? (
          <View style={style.avatarStyle}>
            <CometChatAvatar
              cornerRadius={18}
              borderColor={viewTheme.color.secondary}
              borderWidth={0}
              image={senderAvatar}
              name={message.sender.name}
            />
          </View>
        ) : null}
        <View>
          {props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP ? (
            <View style={style.senderNameContainer}>
              <Text>{message.sender.name}</Text>
            </View>
          ) : null}
          <View style={style.audioContainer}>
            <TouchableWithoutFeedback
              onLongPress={() =>
                props.actionGenerated(actions.OPEN_MESSAGE_ACTIONS, message)
              }>
              <View
                style={[
                  style.messageWrapperStyle,
                  { backgroundColor: viewTheme.backgroundColor.grey },
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
      <CometChatMessageReactions
        theme={props.theme}
        {...props}
        message={message}
        showMessage={props?.showMessage}
      />
    </View>
  );
};
export default CometChatReceiverAudioMessageBubble;
