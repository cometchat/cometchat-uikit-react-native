import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import theme from '../../../resources/theme';
import styles from './styles';

export default (props) => {
  const badgeTheme = { ...theme, ...props.theme };

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (props.count) {
    return (
      <Animated.Text
        style={[
          styles.badgeStyle,
          {
            backgroundColor: badgeTheme.backgroundColor.blue,
            color: badgeTheme.color.white,
            opacity: fadeAnim,
          },
        ]}>
        {props.count}
      </Animated.Text>
    );
  }

  return null;
};
