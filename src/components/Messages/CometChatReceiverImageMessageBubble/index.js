import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import { CometChatAvatar } from '../../Shared';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import style from './styles';
import theme from '../../../resources/theme';

const messageFrom = 'receiver';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default (props) => {
  const [message, setMessage] = useState({ ...props.message, messageFrom });
  const prevMessage = usePrevious(message);
  const ViewTheme = { ...theme, ...props.theme };
  let senderAvatar = null;
  if (message.receiverType === 'group') {
    senderAvatar = { uri: message.sender.avatar };
  }

  const open = () => {
    props.actionGenerated('viewActualImage', message);
  };

  useEffect(() => {
    const previousMessageStr = JSON.stringify(prevMessage);
    const currentMessageStr = JSON.stringify(props.message);

    if (previousMessageStr !== currentMessageStr) {
      const newMessage = { ...props.message, messageFrom };
      setMessage(newMessage);
    }
  }, [props]);

  let thumbnailGenerationObject = null;
  if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
    const { metadata } = message;
    const injectedObject = metadata['@injected'];
    if (injectedObject && Object.prototype.hasOwnProperty.call(injectedObject, 'extensions')) {
      const extensionsObject = injectedObject.extensions;
      if (
        extensionsObject &&
        Object.prototype.hasOwnProperty.call(extensionsObject, 'thumbnail-generation')
      ) {
        thumbnailGenerationObject = extensionsObject['thumbnail-generation'];
      }
    }
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
          <View style={[style.messageWrapperStyle]}>
            <TouchableOpacity
              onPress={() => open()}
              style={style.messageImgWrapperStyle}
              onLongPress={() => {
                props.actionGenerated('openMessageActions', message);
              }}>
              <FastImage
                style={style.messageImg}
                source={{
                  // uri: message.data.url,
                  uri: thumbnailGenerationObject
                    ? thumbnailGenerationObject.url_small
                    : message.data.url,
                }}
                resizeMode={FastImage.resizeMode.contain}
              />
            </TouchableOpacity>
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
