import React, { useContext, useEffect, useState } from 'react';
import { Text, View, Image, Platform } from 'react-native';
import { get as _get, identity } from 'lodash';

import blueDoubleTick from './resources/blue-double-tick-icon.png';
import greyDoubleTick from './resources/grey-double-tick-icon.png';
import greyTick from './resources/grey-tick-icon.png';
import sendingTick from './resources/sending.png';
import errorTick from './resources/error.png';
import styles from './styles';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatContext } from '../../../utils/CometChatContext';
const CometChatReadReceipt = (props) => {
  const context = useContext(CometChatContext);
  const [isDeliveryReceiptsEnabled, setIsDeliveryReceiptsEnabled] = useState(
    true,
  );
  useEffect(() => {
    checkRestrictions();
  });
  const checkRestrictions = async () => {
    let isEnabled = await context.FeatureRestriction.isDeliveryReceiptsEnabled();
    setIsDeliveryReceiptsEnabled(isEnabled);
  };
  let ticks = blueDoubleTick;
  if (props.message.messageFrom === 'sender') {
    if (props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
      if (props.message.hasOwnProperty('error')) {
        ticks = errorTick;
      } else {
        ticks = sendingTick;

        if (props.message.hasOwnProperty('sentAt')) {
          ticks = greyTick;
        }
      }
    } else {
      if (props.message.hasOwnProperty('error')) {
        ticks = errorTick;
      } else {
        ticks = sendingTick;

        if (props.message.hasOwnProperty('sentAt')) {
          ticks = greyTick;

          if (props.message.hasOwnProperty('deliveredAt')) {
            ticks = greyDoubleTick;
            if (props.message.hasOwnProperty('readAt')) {
              ticks = blueDoubleTick;
            }
          }
        }
      }
    }
  }
  if (props.message.messageFrom !== 'sender') {
    ticks = null;
  }

  let timestamp = new Date(
    props.message.sentAt
      ? props.message.sentAt * 1000
      : props.message._composedAt,
  ).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
 
  if (!isDeliveryReceiptsEnabled) {
    ticks = null;
  }
  return (
    <View style={styles.containerStyle}>
      <Text style={styles.msgTimestampStyle}>{timestamp}</Text>

      {ticks ? (
        <Image source={ticks} alt="time" style={styles.tickImageStyle} />
      ) : null}
    </View>
  );
};

export default CometChatReadReceipt;
