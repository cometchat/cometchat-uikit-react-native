/* eslint-disable import/no-named-as-default */
import React from 'react';
import { View, Text, TouchableWithoutFeedback, Alert } from 'react-native';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import style from './styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFetchBlob from 'rn-fetch-blob';
import { CometChatAvatar } from '../../Shared';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import { CometChat } from '@cometchat-pro/react-native-chat';

const CometChatReceiverFileMessageBubble = (props) => {
  const message = {
    ...props.message,
    messageFrom: enums.MESSAGE_FROM_RECEIVER,
  };
  let avatarImg = '';

  if (message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
    avatarImg = { uri: message.sender.avatar };
  }

  /**
   * Handler for downloading file attachment in local storage.
   * @param
   */

  const download = () => {
    let PictureDir = RNFetchBlob.fs.dirs.PictureDir;
    let date = new Date();
    let ext = '.' + props.message.data.attachments[0].extension;
    RNFetchBlob.config({
      // add option that makes response data to be stored as a file,
      // is much more performant.
      fileCache: true,
      appendExt: props.message.data.attachments[0].extension,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        path:
          PictureDir +
          '/' +
          Math.floor(date.getTime() + date.getSeconds() / 2) +
          ext,
      },
    })
      .fetch('GET', props.message.data.attachments[0].url, {
        // some headers ..
      })
      .then((res) => {
        Alert.alert('File Downloaded');
      });
  };

  return (
    <View style={style.mainContainerStyle}>
      <View style={style.messageContainer}>
        {props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP ? (
          <View style={style.avatarStyle}>
            <CometChatAvatar
              cornerRadius={18}
              borderColor={props.theme.color.secondary}
              borderWidth={0}
              image={avatarImg}
              name={message.sender.name}
            />
          </View>
        ) : null}
        <View>
          {props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP ? (
            <View style={style.senderNameContainer}>
              <Text style={{ color: props.theme.color.helpText }}>
                {message.sender.name}
              </Text>
            </View>
          ) : null}

          <View style={style.messageContainerStyle}>
            <TouchableWithoutFeedback
              onPress={download}
              onLongPress={() =>
                props.actionGenerated(actions.OPEN_MESSAGE_ACTIONS, message)
              }>
              <View
                style={[
                  style.messageWrapperStyle,
                  { backgroundColor: props.theme.backgroundColor.grey },
                ]}>
                <View style={style.attachmentNameStyle}>
                  <Text style={[style.attachmentName]}>
                    {props.message.data.attachments[0].name}
                  </Text>
                </View>
                <Icon name="file-download-outline" size={25} color="#3399FF" />
              </View>
            </TouchableWithoutFeedback>
          </View>
          <View style={style.containerStyle}>
            <View style={style.messageInfoWrapperStyle}>
              <CometChatReadReceipt {...props} message={message} />
              <CometChatThreadedMessageReplyCount
                {...props}
                message={message}
              />
            </View>
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
export default CometChatReceiverFileMessageBubble;
