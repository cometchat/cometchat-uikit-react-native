import React from 'react';
import { View } from 'react-native';
import styles from './styles';
import * as enums from '../../../utils/enums';
import { CometChat } from '@cometchat-pro/react-native-chat';

const CometChatUserPresence = (props) => {
  let presenceStatus = {
    backgroundColor: 'rgb(85, 85, 85)',
  };
  let borderWidth = props.borderWidth || 1;
  const borderColor = props.borderColor || '#AAA';
  const cornerRadius = props.cornerRadius || 4.5;

  if (
    props.status === CometChat.USER_STATUS.ONLINE ||
    props.status === enums.STATUS_TYPE_AVAILABLE
  ) {
    presenceStatus = {
      backgroundColor: 'rgb(0, 255, 0)',
    };
    // borderWidth = 0;
  }

  const borderStyle = {
    borderWidth,
    borderStyle: 'solid',
    borderColor,
    borderRadius: cornerRadius,
  };
  return (
    <View
      style={[
        styles.statueIndicatorStyle,
        presenceStatus,
        props.style,

        borderStyle,
      ]}
    />
  );
};
export default CometChatUserPresence;
