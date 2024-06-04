import dateRange from './dateRange';
import dayjs from 'dayjs';

test('works for 3 days', () => {
  const start = dayjs();
  const end = dayjs().add(2, 'day');
  expect(dateRange(start, end).length).toBe(3);
});

test('works for 1 day', () => {
  const start = dayjs();
  const end = dayjs();
  expect(dateRange(start, end).length).toBe(1);
});

test("throws error if start date doesn't come before end date", () => {
  const start = dayjs();
  const end = dayjs().subtract(2, 'day');
  expect(() => dateRange(start, end)).toThrow('Start date must come before end date');
});
