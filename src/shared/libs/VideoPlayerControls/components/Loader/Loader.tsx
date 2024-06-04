import React from 'react';
import {View, ActivityIndicator} from 'react-native';
import {styles} from './styles';

interface LoaderProps {
  loadingIconColor?: string
}

export const Loader = ({loadingIconColor}: LoaderProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={loadingIconColor || '#fff'}/>
    </View>
  );
};
