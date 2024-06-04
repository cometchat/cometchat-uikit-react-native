import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  GestureResponderEvent,
  ImageSourcePropType,
  StyleProp,
  TextStyle,
} from 'react-native';
import React from 'react';
import { ICONS } from './resources';
import { FontStyleInterface, ImageType } from '../shared';

const Header = (props: {
  title: string;
  showCloseButton?: boolean;
  closeButtonIcon?: ImageType;
  onPress: (event: GestureResponderEvent) => void;
  titleStyle?: TextStyle;
  closeIconTint?: string;
}) => {
  const {
    title,
    showCloseButton,
    closeButtonIcon,
    onPress,
    titleStyle,
    closeIconTint,
  } = props;
  return (
    <View style={styles.container}>
      {showCloseButton && (
        <TouchableOpacity style={styles.iconContainer} onPress={onPress}>
          <Image
            source={closeButtonIcon as ImageSourcePropType}
            style={{ tintColor: closeIconTint ?? '', height: 24, width: 24 }}
          />
        </TouchableOpacity>
      )}
      <Text style={[styles.headingText, titleStyle]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingLeft: 15,
  },
  iconContainer: { paddingRight: 25, alignItems: 'center' },
  headingText: { fontSize: 20, fontWeight: '600', color: '#000' },
});
export default Header;
