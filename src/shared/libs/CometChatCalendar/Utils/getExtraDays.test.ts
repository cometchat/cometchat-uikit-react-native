import dayjs from 'dayjs';
import getExtraDays from './getExtraDays';

test('Negative range - "to" is before "from"', () => {
  const result = getExtraDays({
    from: dayjs('2020-01-02'),
    to: dayjs('2020-01-01'),
  });

  expect(result).toEqual([]);
});

describe('Positive range - "to" is equal to/after "from"', () => {
  test('1 day', () => {
    const result = getExtraDays({
      from: dayjs('2020-01-01'),
      to: dayjs('2020-01-01'),
    });

    expect(result.length).toBe(1);
    expect(result[0].isSame('2020-01-01', 'day')).toBeTruthy();
  });

  test('2 days', () => {
    const result = getExtraDays({
      from: dayjs('2020-01-01'),
      to: dayjs('2020-01-02'),
    });

    expect(result.length).toBe(2);
    expect(result[0].isSame('2020-01-01', 'day')).toBeTruthy();
    expect(result[1].isSame('2020-01-02', 'day')).toBeTruthy();
  });

  test('5 days', () => {
    const result = getExtraDays({
      from: dayjs('2020-01-01'),
      to: dayjs('2020-01-05'),
    });

    expect(result.length).toBe(5);
    expect(result[0].isSame('2020-01-01', 'day')).toBeTruthy();
    expect(result[1].isSame('2020-01-02', 'day')).toBeTruthy();
    expect(result[2].isSame('2020-01-03', 'day')).toBeTruthy();
    expect(result[3].isSame('2020-01-04', 'day')).toBeTruthy();
    expect(result[4].isSame('2020-01-05', 'day')).toBeTruthy();
  });
});
