import dayjs from 'dayjs';

const getSurroundingTimeUnits = (visibleDate: string) => {
  const month = {
    next: dayjs(visibleDate).startOf('month').add(1, 'month'),
    last: dayjs(visibleDate).endOf('month').subtract(1, 'month'),
  };
  const year = {
    next: dayjs(visibleDate).startOf('year').add(1, 'year'),
    last: dayjs(visibleDate).endOf('year').subtract(1, 'year'),
  };

  return {
    year,
    month,
  };
};

export default getSurroundingTimeUnits;
