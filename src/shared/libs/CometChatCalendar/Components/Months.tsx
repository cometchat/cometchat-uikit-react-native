import React, { useMemo } from 'react';
import { View } from 'react-native';
import dayjs, { Dayjs } from 'dayjs';

import type { DateProperties, Theme, MonthComponentType, Locale } from '../Entities';
import { ThemeContext, LocaleContext } from '../Contexts';
import { dateRange } from '../Utils';

import { Month as DefaultMonth } from '.';

export interface Props {
  MonthComponent?: MonthComponentType;
  // Receives a start-of-month date in YYYY-MM-DD format (ex. 2020-01-01 for the month of January, 2020)
  onPressMonth: (date: string) => void;
  // YYYY-MM-DD format string respresenting the start-of-month date of currently visible month
  visibleDate: Dayjs;
  // YYYY-MM-DD format string respresenting the minimum date that can be selected
  minDate?: string;
  // YYYY-MM-DD format string respresenting the maximum date that can be selected
  maxDate?: string;
  dateProperties: {
    [date: string /* YYYY-MM-DD */]: DateProperties;
  };
}

const Months: React.FC<Props> = ({
  MonthComponent: CustomMonth,
  onPressMonth,
  dateProperties,
  visibleDate,
  minDate,
  maxDate,
}) => {
  const theme = React.useContext<Theme>(ThemeContext);
  const locale = React.useContext<Locale>(LocaleContext);

  const monthsOfVisibleYear = dateRange(
    visibleDate.startOf('year'),
    visibleDate.endOf('year'),
    'month'
  );

  const selectedMonths = useMemo(() => {
    return Object.entries(dateProperties).reduce(
      (selected: Record<string, boolean>, [date, properties]) => {
        if (properties.isSelected) {
          const month = dayjs(date).startOf('month').format('YYYY-MM-DD');
          selected[month] = true;
        }
        return selected;
      },
      {}
    );
  }, [dateProperties]);

  const Month = CustomMonth || DefaultMonth;
  return (
    <View style={theme.monthsContainer} testID={'months-container'}>
      {monthsOfVisibleYear.map((month, index) => {
        return (
          <Month
            key={index}
            locale={locale}
            date={month.format('YYYY-MM-DD')}
            isSelected={selectedMonths[month.format('YYYY-MM-DD')]}
            onPress={onPressMonth}
            isDisabled={
              !!(maxDate && month.startOf('month').isAfter(maxDate, 'day')) ||
              !!(minDate && month.endOf('month').isBefore(minDate, 'day'))
            }
          />
        );
      })}
    </View>
  );
};

export default React.memo(Months);
