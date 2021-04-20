import React, { Component } from 'react';

import { View, Text, Animated, Image, Platform } from 'react-native';
import theme from '../../../resources/theme';
import ErrorIcon from './resources/error.png';
import SuccessIcon from './resources/success.png';
import CloseIcon from './resources/close.png';
import styles from './styles';
import { StatusBar } from 'react-native';
import { TouchableOpacity } from 'react-native';

export default class DropDownAlert extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorText: null,
      type: null,
    };
    this.animatedY = new Animated.Value(-100);
  }

  slideIn = () => {
    Animated.timing(this.animatedY, {
      duration: 1000,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  slideOut = () => {
    if (this.props.onClose) {
      this.props.onClose();
    }
    const self = this;
    Animated.timing(this.animatedY, {
      duration: 1000,
      toValue: -100,
      useNativeDriver: true,
    }).start(() => {
      self.setState({ errorText: null, type: null });
    });
  };

  showMessage = (type = 'error', text = 'Something went wrong') => {
    return;
    this.setState({ errorText: text, type }, () => {
      this.slideIn();
    });
  };

  render() {
    let { type, errorText } = this.state;

    if (!errorText) {
      return null;
    }

    return (
      <>
        <Animated.View
          style={[
            styles.mainContainer,

            {
              backgroundColor: type == 'success' ? '#5cb85c' : theme.color.red,
              transform: [
                {
                  translateY: this.animatedY,
                },
              ],
            },
          ]}>
          <StatusBar
            backgroundColor={type == 'success' ? '#5cb85c' : theme.color.red}
          />
          <View style={styles.iconContainer}>
            <Image
              resizeMode={'contain'}
              source={type == 'success' ? SuccessIcon : ErrorIcon}
              style={styles.iconStyle}
            />
          </View>
          <View style={styles.textContainer}>
            <Text
              ellipsizeMode="tail"
              numberOfLines={3}
              style={styles.textStyle}>
              {errorText}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => this.slideOut()}>
            <Image
              resizeMode={'contain'}
              source={CloseIcon}
              style={styles.iconStyle}
            />
          </TouchableOpacity>
        </Animated.View>
      </>
    );
  }
}
