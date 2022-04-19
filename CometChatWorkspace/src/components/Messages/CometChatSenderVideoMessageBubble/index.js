import React, { useState, createRef, useEffect } from 'react';
import { View } from 'react-native';
import VideoPlayer from 'react-native-video-controls';
import { TouchableOpacity } from 'react-native-gesture-handler';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import style from './styles';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';

const CometChatSenderVideoMessageBubble = (props) => {
  const player = createRef();
  
  useEffect(() => {
       if (props.message) {
        setMessage({ ...props.message, messageFrom: enums.MESSAGE_FROM_SENDER });
       }
      }, [props.message]);
      const [message, setMessage] = useState({
       ...props.message,
       messageFrom: enums.MESSAGE_FROM_SENDER,
      });

  return (
    <View style={style.container}>
      <View style={style.messageWrapperStyle}>
        <TouchableOpacity
          style={{
            ...style.messageVideoWrapperStyle,
          }}
          onPress={() => {
            props.actionGenerated(actions.VIEW_ACTUAL_VIDEO, message);
          }}
          onLongPress={() =>
            props.actionGenerated(actions.OPEN_MESSAGE_ACTIONS, message)
          }>
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
            muted
            resizeMode="contain"
          />
        </TouchableOpacity>
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
