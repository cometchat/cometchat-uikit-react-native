import React from 'react';
import dayjs from 'dayjs';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../Contexts';
import type { Theme, Locale } from '../Entities';

export interface Props {
  date: string;
  locale: Locale;
  onPress: (date: string) => void;
  isSelected: boolean;
  isDisabled: boolean;
}

const Month: React.FC<Props> = ({ date, onPress, isSelected, isDisabled, locale }) => {
  const theme = React.useContext<Theme>(ThemeContext);
  const _onPress = React.useCallback(() => onPress(date), [date, onPress]);

  return (
    <TouchableOpacity
      testID={'month-container'}
      accessibilityRole={'button'}
      accessibilityLabel={dayjs(date).locale(locale).format('MMM')}
      accessibilityState={{ disabled: isDisabled, selected: isSelected }}
      accessibilityHint={'Press to select this month and return to calendar month view'}
      disabled={isDisabled}
      onPress={_onPress}
      style={[
        theme.normalMonthContainer,
        isSelected && theme.selectedMonthContainer,
        isDisabled && theme.disabledMonthContainer,
      ]}>
      <Text
        testID={'month-text'}
        style={[
          theme.normalMonthText,
          isSelected && theme.selectedMonthText,
          isDisabled && theme.disabledMonthText,
        ]}>
        {dayjs(date).locale(locale).format('MMM')}
      </Text>
    </TouchableOpacity>
  );
};

export default React.memo(Month);
