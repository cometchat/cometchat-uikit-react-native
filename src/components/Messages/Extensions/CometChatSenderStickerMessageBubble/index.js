import React, { useState } from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
import FastImage from 'react-native-fast-image';
import {
  CometChatReadReceipt,
  CometChatThreadedMessageReplyCount,
} from '../../';
import { CometChatMessageReactions } from '../index';
import style from './styles';

import * as enums from '../../../../utils/enums';
import * as actions from '../../../../utils/actions';

const CometChatSenderStickerMessageBubble = (props) => {
  const [message] = useState({
    ...props.message,
    messageFrom: enums.MESSAGE_FROM_SENDER,
  });
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
  return (
    <View style={style.messageContainerStyle}>
      <TouchableWithoutFeedback
        onLongPress={() =>
          props.actionGenerated(actions.OPEN_MESSAGE_ACTIONS, message)
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
        message={message}
        showMessage={props?.showMessage}></CometChatMessageReactions>
    </View>
  );
};
export default CometChatSenderStickerMessageBubble;
