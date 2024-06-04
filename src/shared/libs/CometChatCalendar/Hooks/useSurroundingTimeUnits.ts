import React from 'react';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import utc from 'dayjs/plugin/utc';

dayjs.extend(localeData);
dayjs.extend(utc);

const useSurroundingTimeUnits = (visibleDate: string) => {
  return React.useMemo(() => {
    const startOfMonth = dayjs(visibleDate).local().startOf('month');
    const endOfMonth = dayjs(visibleDate).local().endOf('month');

    const month = {
      current: {
        start: startOfMonth,
        end: endOfMonth,
      },
      next: {
        start: startOfMonth.add(1, 'month').startOf('month'),
        end: endOfMonth.add(1, 'month').endOf('month'),
      },
      last: {
        start: startOfMonth.subtract(1, 'month').startOf('month'),
        end: endOfMonth.subtract(1, 'month').endOf('month'),
      },
      afterNext: startOfMonth.add(2, 'month'),
      beforeLast: endOfMonth.subtract(2, 'month'),
    };

    const startOfYear = dayjs(visibleDate).local().startOf('year');
    const endOfYear = dayjs(visibleDate).local().endOf('year');

    const year = {
      current: {
        start: startOfYear,
        end: endOfYear,
      },
      next: {
        start: startOfYear.add(1, 'year').startOf('year'),
        persistMonth: dayjs(visibleDate).local().add(1, 'year'),
        end: endOfYear.add(1, 'year').endOf('year'),
      },
      last: {
        start: startOfYear.subtract(1, 'year').startOf('year'),
        persistMonth: dayjs(visibleDate).local().subtract(1, 'year'),
        end: endOfYear.subtract(1, 'year').endOf('year'),
      },
      afterNext: startOfYear.add(2, 'year'),
      beforeLast: endOfYear.subtract(2, 'year'),
    };

    return {
      year,
      month,
    };
  }, [visibleDate]);
};

export default useSurroundingTimeUnits;
