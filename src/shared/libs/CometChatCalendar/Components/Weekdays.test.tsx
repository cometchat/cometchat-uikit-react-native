import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { render } from '@testing-library/react-native';
import { ThemeContext, LocaleContext } from '../Contexts';
import { DefaultTheme } from '../Themes';
import { DefaultLocale } from '../Locales';

import Weekdays from './Weekdays';

test('Weekdays render without error', () => {
  const weekdays = new WeekdaysPage();
  expect(weekdays.component).toBeTruthy();
});

test('Weekday receives locale context', () => {
  const weekdays = new WeekdaysPage();
  expect(weekdays.array).toStrictEqual(locale.weekdays);
});

describe('Theme context', () => {
  test('Weekday container applies weekdayContainer theme', () => {
    const weekdays = new WeekdaysPage();
    expect(weekdays.component).toHaveStyle(theme.weekdaysContainer);
  });

  test('Weekday text applies weekdayText theme', () => {
    const weekdays = new WeekdaysPage();
    expect(weekdays.text).toHaveStyle(theme.weekdayText);
  });
});

class WeekdaysPage {
  component: ReactTestInstance;
  text: ReactTestInstance;
  array: (string | ReactTestInstance)[];

  constructor() {
    const { getByTestId, getAllByTestId } = render(
      <LocaleContext.Provider value={locale}>
        <ThemeContext.Provider value={theme}>
          <Weekdays days={locale.weekdays} />
        </ThemeContext.Provider>
      </LocaleContext.Provider>
    );

    const allWeekdays = getAllByTestId('weekday');

    this.component = getByTestId('weekdays');
    this.array = allWeekdays.map((day: ReactTestInstance) => day.children[0]);
    this.text = allWeekdays[0];
  }
}

const locale = {
  ...DefaultLocale,
  weekdays: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
};

const theme = {
  ...DefaultTheme,
  weekdaysContainer: {
    marginTop: 10,
    backgroundColor: 'black',
  },
  weekdayText: {
    marginBottom: 10,
    color: 'green',
  },
};
