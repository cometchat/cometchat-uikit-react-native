import React, { useState, createRef } from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
import VideoPlayer from 'react-native-video-controls';

import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import style from './styles';

const messageFrom = 'sender';

export default (props) => {
  const player = createRef();
  const [message] = useState({ ...props.message, messageFrom });
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={style.messageWrapperStyle}>
        <TouchableWithoutFeedback
          onLongPress={() =>
            props.actionGenerated('openMessageActions', message)
          }>
          <View style={style.messageVideoWrapperStyle}>
            <VideoPlayer
              source={{
                uri: message.data.url,
              }} // Can be a URL or a local file.
              ref={player} // Store reference
              style={style.messageVideo}
              navigator={props.navigator}
              disableBack
              disableFullscreen
              disableVolume
              paused
              resizeMode="contain"
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatThreadedMessageReplyCount {...props} message={message} />
        <CometChatReadReceipt {...props} />
      </View>
      <CometChatMessageReactions
        theme={props.theme}
        {...props}
        message={message}
      />
    </View>
  );
};
