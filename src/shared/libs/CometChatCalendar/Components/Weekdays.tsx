import React from 'react';
import { View, Text } from 'react-native';

import type { Theme } from '../Entities';
import { ThemeContext } from '../Contexts';

export interface Props {
  days: string[];
}

const Weekdays: React.FC<Props> = ({ days }) => {
  const theme = React.useContext<Theme>(ThemeContext);

  return (
    <View style={theme.weekdaysContainer} testID={'weekdays'}>
      {days.map((day) => (
        <Text
          testID={'weekday'}
          accessibilityLabel={day}
          key={day}
          style={theme.weekdayText}>
          {day}
        </Text>
      ))}
    </View>
  );
};

export default React.memo(Weekdays);
