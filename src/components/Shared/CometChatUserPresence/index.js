import React from 'react';
import { View } from 'react-native';
import styles from './styles';

export default (props) => {
  let presenceStatus = {
    backgroundColor: 'rgb(85, 85, 85)',
  };
  let borderWidth = props.borderWidth || 1;
  const borderColor = props.borderColor || '#AAA';
  const cornerRadius = props.cornerRadius || 4.5;

  if (props.status === 'online' || props.status === 'available') {
    presenceStatus = {
      backgroundColor: 'rgb(0, 255, 0)',
    };
    borderWidth = 0;
  }

  if (
    Object.prototype.hasOwnProperty.call(props, 'widgetsettings') &&
    props.widgetsettings &&
    Object.prototype.hasOwnProperty.call(props.widgetsettings, 'main') &&
    Object.prototype.hasOwnProperty.call(props.widgetsettings.main, 'show_user_presence') &&
    props.widgetsettings.main.show_user_presence === false
  ) {
    return null;
  }

  const borderStyle = {
    borderWidth,
    borderStyle: 'solid',
    borderColor,
    borderRadius: cornerRadius,
  };
  return <View style={[styles.statueIndicatorStyle, borderStyle, presenceStatus]} />;
};
