import React from 'react';
import dayjs from 'dayjs';
import LocaleData from 'dayjs/plugin/localeData';
import type { ReactTestInstance } from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext } from '../Contexts';
import { DefaultTheme } from '../Themes';
import { DefaultLocale } from '../Locales';

dayjs.extend(LocaleData);

import Month, { Props } from './Month';

test('Month renders without error', () => {
  const month = new MonthPage({});
  expect(month.component).toBeTruthy();
});

test('Component calls onPress callback when clicked', () => {
  const onPress = jest.fn();
  const month = new MonthPage({ onPress });
  fireEvent.press(month.component);
  expect(onPress).toHaveBeenCalledTimes(1);
});

describe('Enabling and disabling', () => {
  test('Disable clicking if prop ´isDisabled´ is true', () => {
    const month = new MonthPage({ isDisabled: true });
    expect(month.component).toBeDisabled();
  });

  test('Enable clicking if prop ´isDisabled´ is false', () => {
    const month = new MonthPage({ isDisabled: false });
    expect(month.component).toBeEnabled();
  });
});

describe('Theme context', () => {
  test('Container applies normal theme in enabled state', () => {
    const month = new MonthPage({ isDisabled: false, isSelected: false });
    expect(month.component).toHaveStyle(theme.normalMonthContainer);
    expect(month.component).not.toHaveStyle(theme.selectedMonthContainer);
    expect(month.component).not.toHaveStyle(theme.disabledMonthContainer);
  });

  test('Container applies disabled theme in disabled state', () => {
    const month = new MonthPage({ isDisabled: true });
    expect(month.component).toHaveStyle([
      theme.normalMonthContainer,
      theme.disabledMonthContainer,
    ]);
    expect(month.component).not.toHaveStyle(theme.selectedMonthContainer);
  });

  test('Container applies selected theme in selected state', () => {
    const month = new MonthPage({ isSelected: true });
    expect(month.component).toHaveStyle([
      theme.normalMonthContainer,
      theme.selectedMonthContainer,
    ]);
    expect(month.component).not.toHaveStyle(theme.disabledMonthContainer);
  });

  test('Container applies selected + disabled themes in selected + disabled state', () => {
    const month = new MonthPage({ isSelected: true, isDisabled: true });
    expect(month.component).toHaveStyle([
      theme.normalMonthContainer,
      theme.selectedMonthContainer,
      theme.disabledMonthContainer,
    ]);
  });

  test('Text applies normal theme in enabled state', () => {
    const month = new MonthPage({ isDisabled: false, isSelected: false });
    expect(month.text).toHaveStyle(theme.normalMonthText);
    expect(month.text).not.toHaveStyle(theme.selectedMonthText);
    expect(month.text).not.toHaveStyle(theme.disabledMonthText);
  });

  test('Text applies disabled theme in disabled state', () => {
    const month = new MonthPage({ isDisabled: true });
    expect(month.text).toHaveStyle([theme.normalMonthText, theme.disabledMonthText]);
    expect(month.text).not.toHaveStyle(theme.selectedMonthText);
  });

  test('Text applies selected theme in selected state', () => {
    const month = new MonthPage({ isSelected: true });
    expect(month.text).toHaveStyle([theme.normalMonthText, theme.selectedMonthText]);
    expect(month.text).not.toHaveStyle(theme.disabledMonthText);
  });

  test('Text applies selected + disabled themes in selected + disabled state', () => {
    const month = new MonthPage({ isSelected: true, isDisabled: true });
    expect(month.text).toHaveStyle([
      theme.normalMonthText,
      theme.selectedMonthText,
      theme.disabledMonthText,
    ]);
  });
});

class MonthPage {
  component: ReactTestInstance;
  text: ReactTestInstance;

  constructor({
    date = '2020-01-01',
    onPress = () => {},
    locale = DefaultLocale,
    isSelected = false,
    isDisabled = false,
  }: Partial<Props>) {
    const { getByLabelText, getByTestId } = render(
      <ThemeContext.Provider value={theme}>
        <Month {...{ locale, date, onPress, isSelected, isDisabled }} />
      </ThemeContext.Provider>
    );

    const months = dayjs(date).localeData().monthsShort();
    const index = dayjs(date).month();

    this.component = getByLabelText(months[index]);
    this.text = getByTestId('month-text');
  }
}

// Mix of properties which get overwritten and which don't
const theme = {
  ...DefaultTheme,
  normalMonthContainer: {
    marginTop: 10,
    backgroundColor: 'black',
  },
  selectedMonthContainer: {
    marginBottom: 10,
    backgroundColor: 'green',
  },
  disabledMonthContainer: {
    marginLeft: 10,
    backgroundColor: 'gray',
  },
  normalMonthText: {
    marginTop: 10,
    color: 'black',
  },
  selectedMonthText: {
    marginBottom: 10,
    color: 'green',
  },
  disabledMonthText: {
    marginLeft: 10,
    color: 'gray',
  },
};

export const testLocale = {
  ...DefaultLocale,
  monthsShort: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
};
