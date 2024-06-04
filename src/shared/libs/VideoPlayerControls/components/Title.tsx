import React from 'react';
import {Text, View} from 'react-native';
import {styles} from './styles';

interface TitleProps {
  title: string;
}

export const Title = ({title}: TitleProps) => {
  if (title) {
    return (
      <View style={[styles.control, _styles.title]}>
        <Text style={[styles.text, _styles.titleText]} numberOfLines={1}>
          {title || ''}
        </Text>
      </View>
    );
  }

  return null;
};

import {StyleSheet} from 'react-native';

const _styles = StyleSheet.create({
  title: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    padding: 0,
  },
  titleText: {
    textAlign: 'center',
  },
});
