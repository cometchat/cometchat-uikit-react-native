import React from 'react';
import { View, Text } from 'react-native';
import FastImage from 'react-native-fast-image';

import theme from '../../../../resources/theme';
import {
  CometChatThreadedMessageReplyCount,
  CometChatReadReceipt,
} from '../../';
import style from './styles';
import { CometChatAvatar } from '../../../Shared';
import { CometChatMessageReactions } from '../index';
import * as enums from '../../../../utils/enums';
import { CometChat } from '@cometchat-pro/react-native-chat';

const CometChatReceiverStickerMessageBubble = (props) => {
  const message = {
    ...props.message,
    messageFrom: enums.MESSAGE_FROM_RECEIVER,
  };
  const viewTheme = { ...theme, ...props.theme };
  let stickerData = null;
  let stickerImg = null;
  if (
    Object.prototype.hasOwnProperty.call(message, 'data') &&
    Object.prototype.hasOwnProperty.call(message.data, 'customData')
  ) {
    stickerData = message.data.customData;

    if (Object.prototype.hasOwnProperty.call(stickerData, 'sticker_url')) {
      stickerImg = (
        <FastImage
          source={{ uri: stickerData.sticker_url }}
          style={style.messageImgWrapper}
        />
      );
    }
  }

  let senderAvatar = null;
  if (message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
    senderAvatar = { uri: message.sender.avatar };
  }
  return (
    <View style={style.container}>
      <View style={style.innerContainer}>
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
          <View>
            <View style={style.messageWrapperStyle}>{stickerImg}</View>

            <View style={style.containerStyle}>
              <CometChatReadReceipt {...props} message={message} />

              <CometChatThreadedMessageReplyCount
                theme={props.theme}
                {...props}
                message={message}
              />
              <CometChatMessageReactions
                theme={props.theme}
                {...props}
                message={message}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
export default CometChatReceiverStickerMessageBubble;
