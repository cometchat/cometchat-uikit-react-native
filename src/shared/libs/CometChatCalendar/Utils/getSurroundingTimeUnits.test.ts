import getSurroundingTimeUnits from './getSurroundingTimeUnits';

describe('Surrounding months', () => {
  describe('works for months surrouding Febuary', () => {
    test('January', () => {
      const { month } = getSurroundingTimeUnits('2020-01-25');
      expect(month.last.format('YYYY-MM-DD')).toEqual('2019-12-31');
      expect(month.next.format('YYYY-MM-DD')).toEqual('2020-02-01');
    });
    test('March', () => {
      const { month } = getSurroundingTimeUnits('2020-03-25');
      expect(month.last.format('YYYY-MM-DD')).toEqual('2020-02-29');
      expect(month.next.format('YYYY-MM-DD')).toEqual('2020-04-01');
    });
  });

  test('works for end-of-month visible date', () => {
    const { month } = getSurroundingTimeUnits('2020-07-31');
    expect(month.last.format('YYYY-MM-DD')).toEqual('2020-06-30');
    expect(month.next.format('YYYY-MM-DD')).toEqual('2020-08-01');
  });
  test('works for start-of-month visible date', () => {
    const { month } = getSurroundingTimeUnits('2020-07-01');
    expect(month.last.format('YYYY-MM-DD')).toEqual('2020-06-30');
    expect(month.next.format('YYYY-MM-DD')).toEqual('2020-08-01');
  });
  test('works for end-of-year visible dates', () => {
    const { month } = getSurroundingTimeUnits('2020-12-31');
    expect(month.last.format('YYYY-MM-DD')).toEqual('2020-11-30');
    expect(month.next.format('YYYY-MM-DD')).toEqual('2021-01-01');
  });
  test('works for start-of-year visible dates', () => {
    const { month } = getSurroundingTimeUnits('2020-01-01');
    expect(month.last.format('YYYY-MM-DD')).toEqual('2019-12-31');
    expect(month.next.format('YYYY-MM-DD')).toEqual('2020-02-01');
  });
});

describe('Surrounding years', () => {
  test('works for end-of-month visible date', () => {
    const { year } = getSurroundingTimeUnits('2020-07-31');
    expect(year.last.format('YYYY-MM-DD')).toEqual('2019-12-31');
    expect(year.next.format('YYYY-MM-DD')).toEqual('2021-01-01');
  });
  test('works for start-of-month visible date', () => {
    const { year } = getSurroundingTimeUnits('2020-07-01');
    expect(year.last.format('YYYY-MM-DD')).toEqual('2019-12-31');
    expect(year.next.format('YYYY-MM-DD')).toEqual('2021-01-01');
  });
  test('works for end-of-year visible dates', () => {
    const { year } = getSurroundingTimeUnits('2020-12-31');
    expect(year.last.format('YYYY-MM-DD')).toEqual('2019-12-31');
    expect(year.next.format('YYYY-MM-DD')).toEqual('2021-01-01');
  });
  test('works for start-of-year visible dates', () => {
    const { year } = getSurroundingTimeUnits('2020-01-01');
    expect(year.last.format('YYYY-MM-DD')).toEqual('2019-12-31');
    expect(year.next.format('YYYY-MM-DD')).toEqual('2021-01-01');
  });
});
