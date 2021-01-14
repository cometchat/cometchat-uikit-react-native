import React from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import style from './styles';

export default (props) => {
  const options = props.options.map((option, key) => {
    return (
      <TouchableOpacity
        key={key}
        style={style.previewOptionStyle}
        onPress={() => props.clicked(option)}>
        <Text style={{ fontSize: 15 }}>{option}</Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={style.previewWrapperStyle}>
      <ScrollView
        horizontal
        style={style.previewOptionsWrapperStyle}
        showsHorizontalScrollIndicator={false}>
        {options}
      </ScrollView>
    </View>
  );
};
