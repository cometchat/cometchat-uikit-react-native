import React, { useState, createRef } from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
import VideoPlayer from 'react-native-video-controls';

import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import style from './styles';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';

const CometChatSenderVideoMessageBubble = (props) => {
  const player = createRef();
  const [message] = useState({
    ...props.message,
    messageFrom: enums.MESSAGE_FROM_SENDER,
  });
  return (
    <View style={style.container}>
      <View style={style.messageWrapperStyle}>
        <TouchableWithoutFeedback
          onLongPress={() =>
            props.actionGenerated(actions.OPEN_MESSAGE_ACTIONS, message)
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
        <CometChatReadReceipt {...props} message={message} />
      </View>
      <CometChatMessageReactions
        theme={props.theme}
        {...props}
        message={message}
        showMessage={props?.showMessage}
      />
    </View>
  );
};
export default CometChatSenderVideoMessageBubble;
