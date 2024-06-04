import React from 'react';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import type { ReactTestInstance } from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext } from '../Contexts';
import { DefaultTheme } from '../Themes';
import type { Theme } from '../Entities';

import Days, { Props } from './Days';

dayjs.extend(localizedFormat);

// import { DayComponentType } from '../Entities';

const getDisabledDays = (day: ReactTestInstance): boolean =>
  day.props.accessibilityState.disabled;
const getSelectedDays = (day: ReactTestInstance): boolean =>
  day.props.accessibilityState.selected;
const getAccessibilityLabel = (day: ReactTestInstance): string =>
  day.props.accessibilityLabel;

test('Days renders without error', () => {
  const days = new DaysPage({});
  expect(days.component).toBeTruthy();
});

describe('Renders the correct number of normal days', () => {
  test('works for months with 31 days', () => {
    // January 2020 had 31 days
    const days = new DaysPage({ visibleDate: dayjs('2020-01-01') });
    expect(days.normalDayArray.length).toBe(31);
  });

  test('works for months with 30 days', () => {
    // April 2020 had 30 days
    const days = new DaysPage({ visibleDate: dayjs('2020-04-01') });
    expect(days.normalDayArray.length).toBe(30);
  });

  test('works for leap-year Febuary', () => {
    // Febuary 2020 had 29 days
    const days = new DaysPage({ visibleDate: dayjs('2020-02-01') });
    expect(days.normalDayArray.length).toBe(29);
  });

  test('works for non-leap-year Febuary', () => {
    // February 2019 had 28 days
    const days = new DaysPage({ visibleDate: dayjs('2019-02-01') });
    expect(days.normalDayArray.length).toBe(28);
  });
});

describe('Renders correct number of extra days', () => {
  test('works with months that need an extra row', () => {
    // January 2020 needs a final padding row
    const days = new DaysPage({ visibleDate: dayjs('2020-01-01') });
    expect(days.extraDayArray.length).toBe(11);
  });

  test('works with months that do not need an extra row', () => {
    // May 2020 does not need a final padding row
    const days = new DaysPage({ visibleDate: dayjs('2020-05-01') });
    expect(days.extraDayArray.length).toBe(11);
  });
});

test('Component passes onPressDay callback to Day children', () => {
  const onPressDay = jest.fn();
  const days = new DaysPage({ onPressDay });
  days.randomDay && fireEvent.press(days.randomDay);
  expect(onPressDay).toHaveBeenCalledTimes(1);
});

describe('Selects the correct days', () => {
  test('none selected', () => {
    const days = new DaysPage({ dateProperties: {} });
    const selectedDays = days.normalDayArray.filter(getSelectedDays);
    expect(selectedDays.length).toBe(0);
  });

  test('date selection mode', () => {
    const visibleDate = dayjs('2020-01-01');
    const dateProperties = {
      '2019-01-01': { isSelected: true }, // same month of last year, is not rendered
      '2020-01-05': { isSelected: true },
      '2020-01-15': { isSelected: true },
      '2020-01-31': { isSelected: true },
      '2020-02-01': { isSelected: true }, // next month, is not rendered
    };

    const days = new DaysPage({ visibleDate, dateProperties });
    const selectedDays = days.normalDayArray.filter(getSelectedDays);
    const selectedDayLabels = selectedDays.map(getAccessibilityLabel);

    expect(selectedDays.length).toBe(3);
    expect(selectedDayLabels[0]).toBe('January 5, 2020');
    expect(selectedDayLabels[1]).toBe('January 15, 2020');
    expect(selectedDayLabels[2]).toBe('January 31, 2020');
  });
});

describe('Disables the correct days', () => {
  test('none disabled', () => {
    const days = new DaysPage({ dateProperties: {} });
    const disabledDays = days.normalDayArray.filter(getDisabledDays);
    expect(disabledDays.length).toBe(0);
  });

  test('some disabled', () => {
    const visibleDate = dayjs('2020-01-01');
    const dateProperties = {
      '2019-01-01': { isDisabled: true }, // same month of last year, is not rendered
      '2020-01-05': { isDisabled: true },
      '2020-01-15': { isDisabled: true },
      '2020-01-31': { isDisabled: true },
      '2020-02-01': { isDisabled: true }, // next month, is not rendered
    };

    const days = new DaysPage({ visibleDate, dateProperties });
    const disabledDays = days.normalDayArray.filter(getDisabledDays);
    const disabledDayLabels = disabledDays.map(getAccessibilityLabel);

    expect(disabledDays.length).toBe(3);
    expect(disabledDayLabels[0]).toBe('January 5, 2020');
    expect(disabledDayLabels[1]).toBe('January 15, 2020');
    expect(disabledDayLabels[2]).toBe('January 31, 2020');
  });

  test('Disables dates before min date', () => {
    const visibleDate = dayjs('2020-01-01');
    const minDate = '2020-01-04'; // 1-3 should be disabled
    const days = new DaysPage({ visibleDate, minDate });
    const disabledDays = days.normalDayArray.filter(getDisabledDays);
    const disabledDayLabels = disabledDays.map(getAccessibilityLabel);

    expect(disabledDays.length).toBe(3);
    expect(disabledDayLabels[0]).toBe('January 1, 2020');
    expect(disabledDayLabels[1]).toBe('January 2, 2020');
    expect(disabledDayLabels[2]).toBe('January 3, 2020');
  });

  test('Disables dates after max date', () => {
    const visibleDate = dayjs('2020-01-01');
    const maxDate = '2020-01-28'; // 29-31 should be disabled
    const days = new DaysPage({ visibleDate, maxDate });
    const disabledDays = days.normalDayArray.filter(getDisabledDays);
    const disabledDayLabels = disabledDays.map(getAccessibilityLabel);

    expect(disabledDays.length).toBe(3);
    expect(disabledDayLabels[0]).toBe('January 29, 2020');
    expect(disabledDayLabels[1]).toBe('January 30, 2020');
    expect(disabledDayLabels[2]).toBe('January 31, 2020');
  });
});

describe('Theme context', () => {
  test('Days container applies daysContainer theme', () => {
    const days = new DaysPage({ theme: testTheme });
    expect(days.component).toHaveStyle(testTheme.daysContainer);
  });
});

class DaysPage {
  component: ReactTestInstance;
  randomDay?: ReactTestInstance;
  randomCustomDay?: ReactTestInstance;
  normalDayArray: ReactTestInstance[];
  extraDayArray: ReactTestInstance[];
  customDayArray: ReactTestInstance[];

  constructor({
    visibleDate = dayjs('2020-01-01'),
    showExtraDates = false,
    onPressDay = () => {},
    dateProperties = {},
    theme = DefaultTheme,
    minDate,
    maxDate,
    DayComponent,
  }: Partial<Props> & { theme?: Theme }) {
    const { getByTestId, queryAllByTestId } = render(
      <ThemeContext.Provider value={theme}>
        <Days
          {...{
            minDate,
            maxDate,
            visibleDate,
            showExtraDates,
            onPressDay,
            dateProperties,
            DayComponent,
          }}
        />
      </ThemeContext.Provider>
    );

    this.component = getByTestId('days-container');
    this.normalDayArray = queryAllByTestId('day-container');
    this.extraDayArray = queryAllByTestId('extra-day-container');
    this.customDayArray = queryAllByTestId('custom-day');

    this.randomDay = this.normalDayArray.length ? this.normalDayArray[0] : undefined;
    this.randomCustomDay = this.customDayArray.length ? this.customDayArray[0] : undefined;
  }
}

const testTheme = {
  ...DefaultTheme,
  daysContainer: {
    marginTop: 10,
    backgroundColor: 'black',
  },
};
