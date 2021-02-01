import React, { useState } from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
import FastImage from 'react-native-fast-image';
import { CometChatReadReceipt, CometChatThreadedMessageReplyCount } from '../../';
import { CometChatMessageReactions } from '../index';
import style from './styles';

export default (props) => {
  const [message] = useState({
    ...props.message,
    messageFrom: 'sender',
  });
  let stickerData = null;
  let stickerImg = null;
  if (
    Object.prototype.hasOwnProperty.call(message, 'data') &&
    Object.prototype.hasOwnProperty.call(message.data, 'customData')
  ) {
    stickerData = message.data.customData;

    if (Object.prototype.hasOwnProperty.call(stickerData, 'sticker_url')) {
      // const stickerName = Object.prototype.hasOwnProperty.call(stickerData, 'sticker_name')
      //   ? stickerData.sticker_name
      //   : 'Sticker';
      stickerImg = (
        <FastImage source={{ uri: stickerData.sticker_url }} style={style.messageImgWrapper} />
      );
    }
  }
  return (
    <View style={style.messageContainerStyle}>
      <TouchableWithoutFeedback
        onLongPress={() =>
          props.actionGenerated('openMessageActions', message)
        }>
        <View style={style.messageWrapperStyle}>{stickerImg}</View>
      </TouchableWithoutFeedback>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatThreadedMessageReplyCount {...props} message={message} />
        <CometChatReadReceipt {...props} message={message} />
      </View>
      <CometChatMessageReactions
        theme={props.theme}
        {...props}
        message={message}></CometChatMessageReactions>
    </View>
  );
};
