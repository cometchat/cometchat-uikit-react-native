import type { Dayjs } from 'dayjs';

// Inclusive range
const getExtraDays = ({ from, to }: { from: Dayjs; to: Dayjs }): Dayjs[] => {
  const days: Dayjs[] = [];
  const diff = from.diff(to, 'day');

  // If 'to' date is before 'from' date, there are 0 slots available
  if (diff > 0) {
    return days;
  }

  /*
   * Start iteration from 0 to include 'from' day
   * Iterate until less than or equal to diff, to include 'to' day
   */

  for (let i = 0; i <= Math.abs(diff); i += 1) {
    days.push(from.add(i, 'day'));
  }
  return days;
};

export default getExtraDays;
