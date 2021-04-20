import React, { useRef, useEffect } from 'react';
import { Animated, View } from 'react-native';
import theme from '../../../resources/theme';
import styles from './styles';
import PropTypes from 'prop-types';
const CometChatBadgeCount = (props) => {
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
      <View
        style={{
          ...styles.badgeStyle,
          ...props.containerStyle,
          backgroundColor: badgeTheme.backgroundColor.blue,
        }}>
        <Animated.Text
          style={[
            styles.textStyle,
            {
              color: badgeTheme.color.white,
              opacity: fadeAnim,
            },
          ]}>
          {props.count}
        </Animated.Text>
      </View>
    );
  }

  return null;
};
export default CometChatBadgeCount;

CometChatBadgeCount.defaultProps = {
  containerStyle: {},
  theme: {},
  count: 0,
};

CometChatBadgeCount.propTypes = {
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  containerStyle: PropTypes.object,
  theme: PropTypes.object,
};
