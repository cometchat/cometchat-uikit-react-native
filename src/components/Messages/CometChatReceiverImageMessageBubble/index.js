import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import { CometChatAvatar } from '../../Shared';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import style from './styles';
import theme from '../../../resources/theme';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import { CometChat } from '@cometchat-pro/react-native-chat';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const CometChatReceiverImageMessageBubble = (props) => {
  const [message, setMessage] = useState({
    ...props.message,
    messageFrom: enums.MESSAGE_FROM_RECEIVER,
  });
  const prevMessage = usePrevious(message);
  const viewTheme = { ...theme, ...props.theme };
  let senderAvatar = null;
  if (message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
    senderAvatar = { uri: message.sender.avatar };
  }

  const open = () => {
    props.actionGenerated(actions.VIEW_ACTUAL_IMAGE, message);
  };

  useEffect(() => {
    const previousMessageStr = JSON.stringify(prevMessage);
    const currentMessageStr = JSON.stringify(props.message);

    if (previousMessageStr !== currentMessageStr) {
      const newMessage = {
        ...props.message,
        messageFrom: enums.MESSAGE_FROM_RECEIVER,
      };
      setMessage(newMessage);
    }
  }, [props]);

  let thumbnailGenerationObject = null;
  if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
    const { metadata } = message;
    const injectedObject = metadata['@injected'];
    if (
      injectedObject &&
      Object.prototype.hasOwnProperty.call(injectedObject, 'extensions')
    ) {
      const extensionsObject = injectedObject.extensions;
      if (
        extensionsObject &&
        Object.prototype.hasOwnProperty.call(
          extensionsObject,
          'thumbnail-generation',
        )
      ) {
        thumbnailGenerationObject = extensionsObject['thumbnail-generation'];
      }
    }
  }

  return (
    <View style={style.container}>
      <View style={style.mainContainer}>
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
              <Text style={{ color: viewTheme.color.helpText }}>
                {message.sender.name}
              </Text>
            </View>
          ) : null}
          <View style={[style.messageWrapperStyle]}>
            <TouchableOpacity
              onPress={() => open()}
              style={style.messageImgWrapperStyle}
              onLongPress={() => {
                props.actionGenerated(actions.OPEN_MESSAGE_ACTIONS, message);
              }}>
              <FastImage
                style={style.messageImg}
                source={{
                  uri: thumbnailGenerationObject
                    ? thumbnailGenerationObject.url_small
                    : message.data.url,
                }}
                resizeMode={FastImage.resizeMode.contain}
              />
            </TouchableOpacity>
          </View>
          <View style={style.messageInfoWrapperStyle}>
            <CometChatReadReceipt {...props} message={message} />

            <CometChatThreadedMessageReplyCount {...props} message={message} />
            <CometChatMessageReactions
              theme={props.theme}
              {...props}
              message={message}
              showMessage={props?.showMessage}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default CometChatReceiverImageMessageBubble;
