import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { Text, TouchableOpacity } from 'react-native';
import { VIEW } from '../Constants';
import type { Theme, Locale } from '../Entities';
import { ThemeContext } from '../Contexts';

dayjs.extend(utc);

export interface Props {
  date: string;
  locale: Locale;
  onPress: (date: string) => void;
  isDisabled?: boolean;
  activeView: VIEW;
}

const Title: React.FC<Props> = ({ activeView, date, onPress, isDisabled, locale }) => {
  const theme: Theme = React.useContext<Theme>(ThemeContext);
  const _date = dayjs(date).locale(locale).local();

  const title =
    activeView === VIEW.MONTH ? _date.format('MMMM YYYY') : _date.format('YYYY');
  const _onPress = React.useCallback(() => onPress(date), [date, onPress]);

  return (
    <TouchableOpacity
      testID={'title'}
      accessibilityRole={'button'}
      accessibilityHint={'Press to switch calendar views'}
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      style={theme.titleContainer}
      disabled={isDisabled}
      onPress={_onPress}>
      <Text testID={'title-text'} style={theme.titleText}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Title;
