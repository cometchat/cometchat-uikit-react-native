import React from 'react';
import { View, Text } from 'react-native';
import theme from '../../../resources/theme';
import style from './style';
import { CometChatAvatar } from '../../Shared';

export default (props) => {
  const message = { ...props.message, messageFrom: props.messageOf };
  let messageContainer = null;
  const timestamp = new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  const ViewTheme = { ...theme, ...props.theme };

  if (props.messageOf === 'sender') {
    messageContainer = (
      <View style={{ marginBottom: 16 }}>
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
  } else if (message.messageFrom === 'receiver') {
    let senderAvatar = null;

    if (message.receiverType === 'group') {
      if (message.sender.avatar) {
        senderAvatar = { uri: message.sender.CometChatAvatar };
      }
    }

    messageContainer = (
      <View style={{ marginBottom: 16 }}>
        <View style={style.messageContainerForReceiver}>
          {message.receiverType === 'group' ? (
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
            {message.receiverType === 'group' ? (
              <View style={{ marginBottom: 5 }}>
                <Text>{message.sender.name}</Text>
              </View>
            ) : null}

            <View style={style.messageWrapperStyleReceiver}>
              <View style={style.messageTxtWrapperStyle}>
                <Text style={style.messageTxtStyle}>This message was deleted.</Text>
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
