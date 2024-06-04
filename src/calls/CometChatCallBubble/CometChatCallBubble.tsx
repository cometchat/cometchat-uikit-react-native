import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import { Style } from './styles';
import { ImageType } from '../../shared';
import { CallBubbleStyle, CallBubbleStyleInterface } from './CallBubbleStyle';

export interface CometChatCallBubbleInterface {
  title: string,
  icon: ImageType,
  buttonText: string,
  onClick: () => void,
  style?: CallBubbleStyleInterface,
}

export const CometChatCallBubble = (props: CometChatCallBubbleInterface) => {
  const {
    icon,
    title,
    buttonText,
    onClick,
    style
  } = props;

  const _style = new CallBubbleStyle({
    ...style
  })

  const {
    backgroundColor,
    border,
    borderRadius,
    buttonBackgroundColor,
    buttonTextColor,
    buttonTextFont,
    iconTint,
    titleColor,
    titleFont,
  } = _style;

  return <View style={[{ backgroundColor, borderRadius }, border]} >
    <View style={[Style.row, {margin: 8}]}>
      <Image source={icon} style={[Style.iconStyle, { tintColor: iconTint }]} />
      <Text style={{ flexShrink: 1, color: titleColor, ...titleFont }}> {title} </Text>
    </View>
    <TouchableOpacity onPress={onClick} style={[Style.buttonStyle, { backgroundColor: buttonBackgroundColor }]} >
      <Text style={{ color: buttonTextColor, ...buttonTextFont }}> {buttonText} </Text>
    </TouchableOpacity>
  </View>
}