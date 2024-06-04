import { renderHook } from '@testing-library/react-hooks';
import useSurroundingTimeUnits from './useSurroundingTimeUnits';

test('Should return surrounding time units', () => {
  const { result, rerender } = renderHook(
    ({ visibleDate }) => useSurroundingTimeUnits(visibleDate),
    {
      initialProps: {
        visibleDate: '2020-01-06',
      },
    }
  );

  expect(result.current.month.current.start.isSame('2020-01-01', 'day')).toBe(true);
  expect(result.current.month.current.end.isSame('2020-01-31', 'day')).toBe(true);
  expect(result.current.month.last.start.isSame('2019-12-01', 'day')).toBe(true);
  expect(result.current.month.last.end.isSame('2019-12-31', 'day')).toBe(true);
  expect(result.current.month.next.start.isSame('2020-02-01', 'day')).toBe(true);
  expect(result.current.month.next.end.isSame('2020-02-29', 'day')).toBe(true);

  rerender({
    visibleDate: '2020-01-01',
  });

  expect(result.current.month.current.start.isSame('2020-01-01', 'day')).toBe(true);
  expect(result.current.month.current.end.isSame('2020-01-31', 'day')).toBe(true);
  expect(result.current.month.last.start.isSame('2019-12-01', 'day')).toBe(true);
  expect(result.current.month.last.end.isSame('2019-12-31', 'day')).toBe(true);
  expect(result.current.month.next.start.isSame('2020-02-01', 'day')).toBe(true);
  expect(result.current.month.next.end.isSame('2020-02-29', 'day')).toBe(true);

  rerender({
    visibleDate: '2020-02-01',
  });

  expect(result.current.month.current.start.isSame('2020-02-01', 'day')).toBe(true);
  expect(result.current.month.current.end.isSame('2020-02-29', 'day')).toBe(true);
  expect(result.current.month.last.start.isSame('2020-01-01', 'day')).toBe(true);
  expect(result.current.month.last.end.isSame('2020-01-31', 'day')).toBe(true);
  expect(result.current.month.next.start.isSame('2020-03-01', 'day')).toBe(true);

  // console.log(result.current.month.next.end.format());
  expect(result.current.month.next.end.isSame('2020-03-31', 'day')).toBe(true);
});
