import React from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import { CometChatMessageReactions } from '../../Messages/Extensions';
import CometChatReadReceipt from '../CometChatReadReceipt';
import style from './styles';
import theme from '../../../resources/theme';
import * as actions from '../../../utils/actions';
import * as enums from '../../../utils/enums';
import AudioControls from './audioControls';

const CometChatSenderAudioMessageBubble = (props) => {
  const message = { ...props.message, messageFrom: enums.MESSAGE_FROM_SENDER };
  const viewTheme = { ...theme, ...props.theme };
  return (
    <View style={style.container}>
      <View style={style.innerContainer}>
        <TouchableWithoutFeedback
          onLongPress={() =>
            props.actionGenerated(actions.OPEN_MESSAGE_ACTIONS, message)
          }>
          <View
            style={[
              style.messageWrapperStyle,
              { backgroundColor: viewTheme.backgroundColor.grey },
            ]}>
            <AudioControls source={props.message.data.url} />
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
        showMessage={props?.showMessage}
      />
    </View>
  );
};
export default CometChatSenderAudioMessageBubble;
