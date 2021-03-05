import React from 'react';
import { View, Text } from 'react-native';
import theme from '../../../resources/theme';
import style from './style';
import * as enums from '../../../utils/enums';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatAvatar } from '../../Shared';

const CometChatDeleteMessageBubble = (props) => {
  const message = { ...props.message, messageFrom: props.messageOf };
  let messageContainer = null;
  const timestamp = new Date(props.message.sentAt * 1000).toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    },
  );
  const viewTheme = { ...theme, ...props.theme };

  if (props.messageOf === enums.MESSAGE_OF_SENDER) {
    messageContainer = (
      <View style={style.messageContainerStyle}>
        <View style={style.messageWrapperStyleSender}>
          <View style={style.messageTxtWrapperStyle}>
            <Text style={style.messageTxtStyle}>You deleted this message.</Text>
          </View>
        </View>
        <View style={style.containerStyle}>
          <View style={style.messageInfoWrapperStyle}>
            <Text style={style.msgTimestampStyle}>{timestamp}</Text>
          </View>
        </View>
      </View>
    );
  } else if (message.messageFrom === enums.MESSAGE_FROM_RECEIVER) {
    let senderAvatar = null;

    if (message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
      if (message.sender.avatar) {
        senderAvatar = { uri: message.sender.CometChatAvatar };
      }
    }

    messageContainer = (
      <View style={style.messageContainerStyle}>
        <View style={style.messageContainerForReceiver}>
          {message.receiverType === CometChat.RECEIVER_TYPE.GROUP ? (
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
            {message.receiverType === CometChat.RECEIVER_TYPE.GROUP ? (
              <View style={style.messageSenderNameContainerStyle}>
                <Text>{message.sender.name}</Text>
              </View>
            ) : null}

            <View style={style.messageWrapperStyleReceiver}>
              <View style={style.messageTxtWrapperStyle}>
                <Text style={style.messageTxtStyle}>
                  This message was deleted.
                </Text>
              </View>
            </View>
            <View style={style.messageInfoWrapperStyle}>
              <Text style={style.msgTimestampStyle}>{timestamp}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
  return <View>{messageContainer}</View>;
};
export default CometChatDeleteMessageBubble;
