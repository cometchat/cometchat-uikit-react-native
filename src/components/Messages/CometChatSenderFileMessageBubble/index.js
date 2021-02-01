import React from 'react';
import { View, Text, TouchableWithoutFeedback, Alert } from 'react-native';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import style from './styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFetchBlob from 'rn-fetch-blob';

export default (props) => {
  const message = { ...props.message, messageFrom: 'sender' };
  const download = () => {
    let PictureDir = RNFetchBlob.fs.dirs.PictureDir;
    let date = new Date();
    let ext = '.' + props.message.data.attachments[0].extension;
    RNFetchBlob.config({
      // add this option that makes response data to be stored as a file,
      // this is much more performant.
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
      .then(() => {
        Alert.alert('File Downloaded');
      });
  };
  return (
    <View style={{ marginBottom: 16 }}>
      <TouchableWithoutFeedback
        onPress={download}
        onLongPress={() => props.actionGenerated('openMessageActions', message)}>
        <View style={style.messageWrapperStyle}>
          <View style={{ flex: 1, marginRight: 4 }}>
            <Text style={{ color: 'white', fontSize: 15, textAlign: 'justify' }}>
              {props.message.data.attachments[0].name}
            </Text>
          </View>
          <Icon name="file-download-outline" size={24} color="#fff" />
        </View>
      </TouchableWithoutFeedback>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatThreadedMessageReplyCount {...props} message={message} />
        <CometChatReadReceipt {...props} />
      </View>
      <CometChatMessageReactions theme={props.theme} {...props} message={message} />
    </View>
  );
};
