import React from 'react';
import { View, Text } from 'react-native';
import FastImage from 'react-native-fast-image';

import theme from '../../../../resources/theme';
import { CometChatThreadedMessageReplyCount, CometChatReadReceipt } from '../../';
import style from './styles';
import { CometChatAvatar } from '../../../Shared';
import { CometChatMessageReactions } from '../index';

export default (props) => {
  const message = { ...props.message, messageFrom: 'receiver' };
  const ViewTheme = { ...theme, ...props.theme };
  let stickerData = null;
  let stickerImg = null;
  if (
    Object.prototype.hasOwnProperty.call(message, 'data') &&
    Object.prototype.hasOwnProperty.call(message.data, 'customData')
  ) {
    stickerData = message.data.customData;

    if (Object.prototype.hasOwnProperty.call(stickerData, 'sticker_url')) {
      stickerImg = (
        <FastImage source={{ uri: stickerData.sticker_url }} style={style.messageImgWrapper} />
      );
    }
  }

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
          <View>
            <View style={style.messageWrapperStyle}>{stickerImg}</View>

            <View style={style.containerStyle}>
              <CometChatReadReceipt {...props} message={message} />

              <CometChatThreadedMessageReplyCount
                theme={props.theme}
                {...props}
                message={message}
              />
            </View>
            <CometChatMessageReactions theme={props.theme} {...props} message={message} />
          </View>
        </View>
      </View>
    </View>
  );
};
