import React from 'react';
import { View } from 'react-native';
import type { Dayjs } from 'dayjs';

import type { DateProperties, Theme, DayComponentType } from '../Entities';
import { useSurroundingTimeUnits } from '../Hooks';
import { getExtraDays, dateRange } from '../Utils';
import { ThemeContext } from '../Contexts';
import { Day as DefaultDay } from '.';

export interface Props {
  DayComponent?: DayComponentType;
  visibleDate: Dayjs;
  minDate?: string;
  maxDate?: string;
  showExtraDates: boolean; // Fill in empty day slots with previous and next month's days
  onPressDay: (date: string) => void; // Receives date in YYYY-MM-DD format (ex. 2020-01-15 for January 15th, 2020)
  dateProperties: {
    [date: string /* YYYY-MM-DD */]: DateProperties;
  };
}

const Days: React.FC<Props> = ({
  minDate,
  maxDate,
  visibleDate,
  showExtraDates,
  onPressDay,
  dateProperties,
  DayComponent: CustomDay,
}) => {
  
  const theme = React.useContext<Theme>(ThemeContext);
  const { month } = useSurroundingTimeUnits(visibleDate.local().format());
  const daysOfVisibleMonth = dateRange(month.current.start, month.current.end);

  const initSlotsAvailable = month.current.start.day();
  const daysInWeek = 6; // 0-indexed
  let finalSlotsAvailable = daysInWeek - month.current.end.day();

  const nOfSlotsToFill6Rows = 7 * 6;
  if (
    initSlotsAvailable + daysOfVisibleMonth.length + finalSlotsAvailable <
    nOfSlotsToFill6Rows
  ) {
    // Add an extra row at the end of the calendar
    finalSlotsAvailable += 7;
  }

  const initialSlots: Dayjs[] = getExtraDays({
    from: month.last.end.subtract(initSlotsAvailable - 1, 'day'),
    to: month.last.end,
  });

  const finalSlots: Dayjs[] = getExtraDays({
    from: month.next.start,
    to: month.next.start.add(finalSlotsAvailable - 1, 'day'),
  });

  const Day = CustomDay || DefaultDay;
  return (
    <View style={theme.daysContainer} testID={'days-container'}>
      {initialSlots.map((day, index) => (
        <Day
          key={index}
          showExtraDates={showExtraDates}
          date={day.format()}
          onPress={onPressDay}
          isDisabled
          isExtraDay
        />
      ))}
      {daysOfVisibleMonth.map((day) => {
        const dayProperties = dateProperties[day.format('YYYY-MM-DD')];
        return (
          <Day
            {...dayProperties}
            key={day.date()}
            date={day.local().format('YYYY-MM-DD')}
            showExtraDates={showExtraDates}
            isStartOfMonth={month.current.start.isSame(day, 'day')}
            isEndOfMonth={month.current.end.isSame(day, 'day')}
            isStartOfWeek={day.day() === 0}
            isEndOfWeek={day.day() === 6}
            onPress={onPressDay}
            isExtraDay={false}
            isDisabled={
              dayProperties?.isDisabled ||
              Boolean(minDate && day.isBefore(minDate, 'day')) ||
              Boolean(maxDate && day.isAfter(maxDate, 'day'))
            }
          />
        );
      })}
      {finalSlots.map((day, index) => (
        <Day
          key={index}
          date={day.format()}
          showExtraDates={showExtraDates}
          onPress={onPressDay}
          isDisabled
          isExtraDay
        />
      ))}
    </View>
  );
};

export default Days;
