import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';

import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import CometChatReadReceipt from '../CometChatReadReceipt';
import style from './styles';

const messageFrom = 'sender';

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
      <View
        style={[
          style.messageWrapperStyle,
          {
            backgroundColor: props.theme.backgroundColor.blue,
          },
        ]}>
        <TouchableOpacity
          onPress={() => open()}
          style={style.messageImgWrapperStyle}
          onLongPress={() => props.actionGenerated('openMessageActions', message)}>
          <FastImage
            style={style.messageImg}
            source={{
              uri: message.data.url,
              // uri: thumbnailGenerationObject
              //   ? thumbnailGenerationObject.url_small
              //   : message.data.url,
            }}
            resizeMode={FastImage.resizeMode.contain}
          />
        </TouchableOpacity>
      </View>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatThreadedMessageReplyCount {...props} message={message} />
        <CometChatReadReceipt {...props} />
      </View>
      <CometChatMessageReactions theme={props.theme} {...props} message={message} />
    </View>
  );
};
