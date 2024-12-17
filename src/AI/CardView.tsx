import { useState } from 'react';
import {
  contentContainerStyle,
  getButtonStyles,
  getPopoverStyle,
} from './style';
import { CardViewStyle } from './CardViewStyle';
import { CometChatTheme } from '../shared';
import { TouchableOpacity, Text, ScrollView, TextStyle } from 'react-native';
import React from 'react';
import { View } from 'react-native';
import { AIButtonsStyle } from './utils';
export type Card = {
  title?: string;
  id?: string;
  onClick?: (id: string) => void;
  style?: AIButtonsStyle;
};
interface CardProps {
  buttons?: Card[];
  backCallback?: (callback: () => void) => void;
  cardViewStyle?: CardViewStyle;
}

export const CardView = (
  {
    buttons= undefined,
    backCallback= undefined,
    cardViewStyle= undefined,
  }: CardProps
) => {
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  function fetchButtonContent(button: Card) {
    setCurrentSection(button?.id!);
    if (button && button.onClick) {
      button.onClick(button.id!);
    }
  }

  function getButtons(): JSX.Element | null {
    return (
      <View
        style={{
          width: '100%',
          backgroundColor: 'transparent',
        }}
      >
        {buttons?.map((item) => (
          <TouchableOpacity
            key={item.id} // Make sure to set a unique key for each item
            onPress={() => fetchButtonContent(item)}
          >
            <Text
              style={
                getButtonStyles(
                  new CometChatTheme({}),
                  item?.style || {}
                ) as TextStyle
              }
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={getPopoverStyle(cardViewStyle || {}) as TextStyle}>
      <View style={contentContainerStyle as TextStyle}>
        {!currentSection && buttons && (
          <ScrollView style={{ height: '100%', width: '100%' }}>
            {getButtons()}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default CardView;
