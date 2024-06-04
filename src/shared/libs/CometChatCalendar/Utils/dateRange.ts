import type { Dayjs } from 'dayjs';

const dateRange = (start: Dayjs, end: Dayjs, jump: 'day' | 'month' = 'day') => {
  let range: Dayjs[] = [];
  let current: Dayjs = start;

  if (end.isBefore(start)) {
    throw new Error('Start date must come before end date');
  }

  // To avoid loading isSameOrBefore plugin, we add a day to end date
  let _end = end.add(1, jump);

  while (!current.isSame(_end, jump)) {
    range.push(current);
    current = current.add(1, jump);
  }

  return range;
};

export default dateRange;
