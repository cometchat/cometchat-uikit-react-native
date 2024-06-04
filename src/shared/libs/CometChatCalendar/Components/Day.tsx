import React from 'react';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { Text, TouchableOpacity } from 'react-native';
import type { DateProperties, Theme } from '../Entities';
import { ThemeContext } from '../Contexts';

dayjs.extend(localizedFormat);

interface OtherProps {
  date: string;
  onPress: (date: string) => void;
  isStartOfWeek?: boolean;
  isEndOfWeek?: boolean;
  isStartOfMonth?: boolean;
  isEndOfMonth?: boolean;
  isExtraDay?: boolean;
  showExtraDates?: boolean;
}

export type Props = DateProperties & OtherProps;

const Day: React.FC<Props> = ({
  date,
  onPress,
  showExtraDates = false,
  isDisabled = false,
  isSelected = false,
  isStartOfWeek = false,
  isEndOfWeek = false,
  isStartOfMonth = false,
  isEndOfMonth = false,
  isExtraDay = false,
}) => {
  const theme = React.useContext<Theme>(ThemeContext);
  const _onPress = () => {
    onPress(date);
  };

  if (isExtraDay) {
    return (
      <TouchableOpacity
        disabled
        testID={'extra-day-container'}
        accessibilityLabel={`${dayjs(date).format('LL')}`}
        accessibilityState={{ disabled: true, selected: false }}
        onPress={_onPress}
        style={[theme.normalDayContainer, theme.extraDayContainer]}>
        <Text testID={'extra-day-text'} style={[theme.normalDayText, theme.extraDayText]}>
          {showExtraDates && dayjs(date).date()}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      testID={'day-container'}
      accessibilityLabel={`${dayjs(date).format('LL')}`}
      accessibilityState={{
        disabled: !!(isDisabled || isExtraDay),
        selected: isSelected,
      }}
      disabled={isDisabled || isExtraDay}
      onPress={_onPress}
      style={[
        theme.normalDayContainer,
        isDisabled && theme.disabledDayContainer,
        isSelected && theme.selectedDayContainer,
        isStartOfWeek && theme.startOfWeekDayContainer,
        isEndOfWeek && theme.endOfWeekDayContainer,
        isStartOfMonth && theme.startOfMonthDayContainer,
        isEndOfMonth && theme.endOfMonthDayContainer,
      ]}>
      <Text
        testID={'day-text'}
        style={[
          theme.normalDayText,
          isDisabled && theme.disabledDayText,
          isSelected && theme.selectedDayText,
          isStartOfWeek && theme.startOfWeekDayText,
          isEndOfWeek && theme.endOfWeekDayText,
          isStartOfMonth && theme.startOfMonthDayText,
          isEndOfMonth && theme.endOfMonthDayText,
        ]}>
        {dayjs(date).date()}
      </Text>
    </TouchableOpacity>
  );
};

export default React.memo(Day);
