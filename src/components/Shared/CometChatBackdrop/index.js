import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import styles from './styles';

export default (props) => {
  return props.show ? (
    <TouchableWithoutFeedback style={styles.backdropStyle} onPress={props.clicked}>
      {props.children}
    </TouchableWithoutFeedback>
  ) : null;
};
