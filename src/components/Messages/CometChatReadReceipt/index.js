import React from 'react';
import { Text, View, Image, Platform } from 'react-native';
import { get as _get } from 'lodash';

import blueDoubleTick from './resources/blue-double-tick-icon.png';
import greyDoubleTick from './resources/grey-double-tick-icon.png';
import greyTick from './resources/grey-tick-icon.png';

import styles from './styles';

export default (props) => {
  let ticks = blueDoubleTick;
  if (
    _get(props, 'message.sentAt', null) &&
    !_get(props, 'message.readAt', null) &&
    !_get(props, 'message.deliveredAt', null)
  ) {
    ticks = greyTick;
  } else if (
    _get(props, 'message.sentAt', null) &&
    !_get(props, 'message.readAt', null) &&
    _get(props, 'message.deliveredAt', null)
  ) {
    ticks = greyDoubleTick;
  }
  if (
    Object.prototype.hasOwnProperty.call(props, 'widgetsettings') &&
    props.widgetsettings &&
    Object.prototype.hasOwnProperty.call(props.widgetsettings, 'main') &&
    Object.prototype.hasOwnProperty.call(
      props.widgetsettings.main,
      'show_delivery_read_indicators'
    ) &&
    props.widgetsettings.main.show_delivery_read_indicators === false
  ) {
    ticks = null;
  }

  if (props.message.messageFrom !== 'sender') {
    ticks = null;
  }

  let timestamp = new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  if(Platform.OS==="android"){
    let time = timestamp.split(':'); // convert to array

    // fetch
    var hours = Number(time[0]);
    var minutes = Number(time[1]);
    var seconds = Number(time[2]);

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
    // timeValue += seconds < 10 ? ':0' + seconds : ':' + seconds; // get seconds
    timeValue += hours >= 12 ? ' PM' : ' AM'; // get AM/PM
    timestamp= timeValue;
  }

  return (
    <View style={styles.containerStyle}>
      <Text style={styles.msgTimestampStyle}>{timestamp}</Text>
      {ticks ? <Image source={ticks} alt="time" style={styles.tickImageStyle} /> : null}
    </View>
  );
};
