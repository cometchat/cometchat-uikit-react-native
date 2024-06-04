import React from 'react';
import {Image, Text, View} from 'react-native';
import {styles} from './styles';

interface ErrorProps {
  error: boolean;
}

export const Error = ({error}: ErrorProps) => {
  if (error) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../../assets/img/error-icon.png')}
          style={styles.icon}
        />
        <Text style={styles.text}>Video unavailable</Text>
      </View>
    );
  }
  return null;
};
