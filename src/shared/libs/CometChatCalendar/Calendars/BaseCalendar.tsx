import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import dayjs from 'dayjs';

import localeData from 'dayjs/plugin/localeData';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';

import { getSurroundingTimeUnits } from '../Utils';
import { useSurroundingTimeUnits } from '../Hooks';
import { ThemeContext, LocaleContext } from '../Contexts';
import { VIEW } from '../Constants';

import {
  Months,
  Days,
  Arrow as DefaultArrow,
  Title as DefaultTitle,
  Weekdays as DefaultWeekdays,
} from '../Components';

import type {
  Theme,
  Locale,
  ArrowComponentType,
  TitleComponentType,
  DayComponentType,
  MonthComponentType,
  WeekdaysComponentType,
} from '../Entities';

dayjs.extend(localeData);
dayjs.extend(localizedFormat);
dayjs.extend(utc);

export interface Props {
  ArrowComponent?: ArrowComponentType;
  TitleComponent?: TitleComponentType;
  DayComponent?: DayComponentType;
  MonthComponent?: MonthComponentType;
  WeekdaysComponent?: WeekdaysComponentType;
  testID?: string;
  showExtraDates?: boolean;
  allowYearView?: boolean; // Boolean that disables the calendar year view
  onPressDay: (date: string) => void; // Recieves a date format string
  minDate?: string; // YYYY-MM-DD format string respresenting the minimum date that can be selected
  maxDate?: string; // YYYY-MM-DD format string respresenting the maximum date that can be selected
  initVisibleDate?: string; // YYYY-MM-DD format string respresenting the date that should be visible when the calendar first renders
  dateProperties: {
    [date: string /* YYYY-MM-DD */]: {
      isSelected?: boolean;
    };
  };
}

const BaseCalendar: React.FC<Props> = ({
  ArrowComponent: CustomArrow,
  TitleComponent: CustomTitle,
  WeekdaysComponent: CustomWeekdays,
  DayComponent,
  MonthComponent,
  allowYearView,
  showExtraDates,
  onPressDay,
  maxDate,
  minDate,
  initVisibleDate,
  dateProperties,
  testID,
}) => {
  const theme = React.useContext<Theme>(ThemeContext);
  const locale = React.useContext<Locale>(LocaleContext);

  const [rightArrowDisabled, disableRightArrow] = useState<boolean>(false);
  const [leftArrowDisabled, disableLeftArrow] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<VIEW>(VIEW.MONTH);
  const [visibleDate, setVisibleDate] = useState<string>(
    initVisibleDate ?? dayjs().local().format()
  );

  const localeAwareVisibleDate = React.useMemo(
    () => dayjs(visibleDate).locale(locale.name, locale),
    [locale, visibleDate]
  );

  const weekdays = React.useMemo(() => locale.weekdaysShort ?? [''], [locale]);

  const { month, year } = useSurroundingTimeUnits(visibleDate);

  const verifyUnitIsPastMaxDate = useCallback(
    (unit) => {
      if (maxDate) {
        if (unit.isAfter(maxDate)) {
          disableRightArrow(true);
        } else {
          disableRightArrow(false);
        }
      }
    },
    [disableRightArrow, maxDate]
  );

  const verifyUnitIsBeforeMinDate = useCallback(
    (unit) => {
      if (minDate) {
        if (unit.isBefore(minDate)) {
          disableLeftArrow(true);
        } else {
          disableLeftArrow(false);
        }
      }
    },
    [disableLeftArrow, minDate]
  );

  const toggleCalendarView = useCallback(
    (newVisibleDate: string = visibleDate) => {
      const { month: _month, year: _year } = getSurroundingTimeUnits(newVisibleDate);

      if (activeView === VIEW.MONTH) {
        setActiveView(VIEW.YEAR);
        verifyUnitIsPastMaxDate(_year.next);
        verifyUnitIsBeforeMinDate(_year.last);
      }

      if (activeView === VIEW.YEAR) {
        setActiveView(VIEW.MONTH);
        verifyUnitIsPastMaxDate(_month.next);
        verifyUnitIsBeforeMinDate(_month.last);
      }
    },
    [activeView, verifyUnitIsBeforeMinDate, verifyUnitIsPastMaxDate, visibleDate]
  );

  useEffect(() => {
    verifyUnitIsPastMaxDate(month.next.start);
    verifyUnitIsBeforeMinDate(month.last.end);
  }, [
    month.last.end,
    month.next.start,
    verifyUnitIsPastMaxDate,
    verifyUnitIsBeforeMinDate,
  ]);

  const addMonth = useCallback(() => {
    setVisibleDate(month.next.start.local().format());
    verifyUnitIsPastMaxDate(month.afterNext);
    verifyUnitIsBeforeMinDate(month.current.end);
  }, [month, verifyUnitIsBeforeMinDate, verifyUnitIsPastMaxDate]);

  const subtractMonth = useCallback(() => {
    setVisibleDate(month.last.start.local().format());
    verifyUnitIsPastMaxDate(month.current.start);
    verifyUnitIsBeforeMinDate(month.beforeLast);
  }, [month, verifyUnitIsBeforeMinDate, verifyUnitIsPastMaxDate]);

  const addYear = useCallback(() => {
    setVisibleDate(year.next.persistMonth.local().format());
    verifyUnitIsPastMaxDate(year.afterNext);
    verifyUnitIsBeforeMinDate(year.current.end);
  }, [year, verifyUnitIsBeforeMinDate, verifyUnitIsPastMaxDate]);

  const subtractYear = useCallback(() => {
    setVisibleDate(year.last.persistMonth.local().format());
    verifyUnitIsPastMaxDate(year.current.start);
    verifyUnitIsBeforeMinDate(year.beforeLast);
  }, [year, verifyUnitIsBeforeMinDate, verifyUnitIsPastMaxDate]);

  const onPressMonth = (newVisibleDate: string) => {
    setVisibleDate(newVisibleDate);
    toggleCalendarView(newVisibleDate);
  };

  const Weekdays = CustomWeekdays || DefaultWeekdays;
  const Arrow = CustomArrow || DefaultArrow;
  const Title = CustomTitle || DefaultTitle;

  return (
    <View style={theme.calendarContainer} testID={testID}>
      <View testID={'header'} style={theme.headerContainer}>
        <Arrow
          direction={'left'}
          isDisabled={leftArrowDisabled}
          onPress={activeView === VIEW.MONTH ? subtractMonth : subtractYear}
        />
        <Title
          activeView={activeView}
          locale={locale}
          date={localeAwareVisibleDate.format('YYYY-MM-DD')}
          isDisabled={!allowYearView}
          onPress={toggleCalendarView}
        />
        <Arrow
          direction={'right'}
          isDisabled={rightArrowDisabled}
          onPress={activeView === VIEW.MONTH ? addMonth : addYear}
        />
      </View>
      {activeView === VIEW.MONTH ? (
        <>
          <Weekdays days={weekdays} />
          <Days
            DayComponent={DayComponent}
            visibleDate={localeAwareVisibleDate}
            showExtraDates={!!showExtraDates}
            dateProperties={dateProperties}
            onPressDay={onPressDay}
            minDate={minDate}
            maxDate={maxDate}
          />
        </>
      ) : (
        <Months
          MonthComponent={MonthComponent}
          visibleDate={localeAwareVisibleDate}
          minDate={minDate ? dayjs(minDate).local().format() : undefined}
          maxDate={maxDate ? dayjs(maxDate).local().format() : undefined}
          dateProperties={dateProperties}
          onPressMonth={onPressMonth}
        />
      )}
    </View>
  );
};

export default BaseCalendar;
