import React from 'react';
import { Text, View, Image, Platform } from 'react-native';
import { get as _get } from 'lodash';

import blueDoubleTick from './resources/blue-double-tick-icon.png';
import greyDoubleTick from './resources/grey-double-tick-icon.png';
import greyTick from './resources/grey-tick-icon.png';
import sendingTick from './resources/sending.png';
import errorTick from './resources/error.png';
import styles from './styles';
import { CometChat } from '@cometchat-pro/react-native-chat';
const CometChatReadReceipt = (props) => {
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
  if (Platform.OS === 'android') {
    let time = timestamp.split(':'); // convert to array

    // fetch
    var hours = Number(time[0]);
    var minutes = Number(time[1]?.split(' ')[0]);

    // calculate
    var timeValue;

    if (hours > 0 && hours <= 12) {
      timeValue = '' + hours;
    } else if (hours > 12) {
      timeValue = '' + (hours - 12);
    } else if (hours == 0) {
      timeValue = '12';
    }

    timeValue += minutes < 10 ? ':0' + minutes : ':' + minutes; // get minutes
    timeValue += hours >= 12 ? ' PM' : ' AM'; // get AM/PM
    timestamp = timeValue;
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
