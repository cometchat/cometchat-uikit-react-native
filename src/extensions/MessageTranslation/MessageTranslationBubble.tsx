import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import React, { useContext } from 'react';
import {
  CometChatContext,
} from '../../shared/CometChatContext';
import {
  CometChatTextBubble,
  TextBubbleStyle, } from "../../shared/views";
import { FontStyleInterface } from "../../shared/base";
import { FormatTextForLinks } from '../../shared/views/CometChatTextBubble';

interface textStyle extends FontStyleInterface {
  color?: string;
}
export interface MessageTranslationBubble {
  translatedText?: string;
  text?: string;
  style?: {
    backgroundColor?: string;
    textFont?: FontStyleInterface;
    textColor?: string;
    borderRadius?: number;
    translatedTextStyle?: textStyle;
    translatedMsgStyle?: textStyle;
  };
  textContainerStyle?: StyleProp<ViewStyle>;
  alignment?: string;
}

export const MessageTranslationBubble = (props: MessageTranslationBubble) => {
  const { theme } = useContext(CometChatContext);
  const {
    translatedText,
    text,
    style = {},
    textContainerStyle,
    alignment,
  } = props;
  const _style = {
    ...new TextBubbleStyle({}),
    backgroundColor:
      alignment == 'left'
        ? theme?.palette?.getAccent50()
        : theme?.palette?.getPrimary(),
    textFont: theme?.typography.body,
    textColor:
      alignment == 'right'
        ? theme?.palette.getSecondary()
        : theme?.palette?.getAccent(),
    borderRadius: 8,
    translatedTextStyle: {
      color:
        alignment == 'right'
          ? theme?.palette.getSecondary()
          : theme?.palette?.getAccent(),
      ...(theme?.typography?.subtitle2 ?? {
        fontSize: 13,
        fontWeight: '400',
      }),
    },
    translatedMsgStyle: {
      color:
        alignment == 'right'
          ? theme?.palette.getSecondary()
          : theme?.palette?.getAccent(),
      ...(theme?.typography?.caption2 ?? {
        fontSize: 11,
        fontWeight: '400',
      }),
    },
    ...style,
  };

  const {
    backgroundColor,
    border,
    borderRadius,
    textColor,
    textFont,
    linkTextColor,
    linkTextFont,
    height,
    width,
  } = _style;

  if (translatedText && translatedText !== '') {
    return (
      <View
        style={[
          {
            backgroundColor,
            borderRadius,
            height,
            width,
            overflow: 'hidden',
            padding: 8,
          },
          border,
          textContainerStyle,
        ]}
      >
        <FormatTextForLinks
          str={text}
          style={{ textColor, textFont, linkTextColor, linkTextFont }}
        />
        <Text style={[styles.textsPadding, style.translatedTextStyle]}>
          {translatedText}
        </Text>
        <Text style={[styles.textsPadding, style.translatedMsgStyle]}>
          Translated Message
        </Text>
      </View>
    );
  }
  return (
    <CometChatTextBubble
      text={text}
      textContainerStyle={textContainerStyle}
      style={_style}
    />
  );
};

const styles = StyleSheet.create({
  textsPadding: {
    paddingVertical: 5,
  },
});
