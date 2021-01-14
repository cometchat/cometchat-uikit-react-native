import React from 'react';
import { TextInput, TouchableOpacity, View, Image, Text } from 'react-native';
import styles from './styles';

export default (props) => {
  return (
    <View style={styles.ModalBodyItemContainer}>
      <View style={styles.ModalBodyItem}>
        <Text style={styles.SpecificItemText} />
      </View>
      <View style={styles.WrapperForInputAndDelete}>
        <TextInput
          style={styles.Inputbox}
          value={props.option.value}
          placeholder="Enter your option"
          onChangeText={(feedback) => {
            props.optionChangeHandler(feedback, props.option);
          }}
        />
        <TouchableOpacity
          style={styles.ContainerForDelete}
          onPress={() => {
            props.removePollOption(props.option);
          }}>
          <Image source={require('./resources/remove.png')} style={styles.RemoveImage} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
