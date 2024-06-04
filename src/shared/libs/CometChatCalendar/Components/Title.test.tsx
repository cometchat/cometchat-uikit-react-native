import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import type { ReactTestInstance } from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext } from '../Contexts';
import { DefaultTheme } from '../Themes';
import { DefaultLocale } from '../Locales';
import { VIEW } from '../Constants';

import Title, { Props } from './Title';

dayjs.extend(utc);

test('Title render without error', () => {
  const title = new TitlePage({});
  expect(title.component).toBeTruthy();
});

test('Title renders date string in default format', () => {
  const title = new TitlePage({ date: '2020-09-18', locale: DefaultLocale });
  expect(title.text).toHaveTextContent('September 2020');
});

describe('Title format switches depending on the active view', () => {
  test('Month view format', () => {
    const title = new TitlePage({ date: '2020-09-18', activeView: VIEW.MONTH });
    expect(title.text).toHaveTextContent('September 2020');
  });

  test('Year view format', () => {
    const title = new TitlePage({ date: '2020-09-18', activeView: VIEW.YEAR });
    expect(title.text).toHaveTextContent('2020');
  });
});

test('Title receives locale context', () => {
  const title = new TitlePage({ date: '2020-09-18', locale: testLocale });
  expect(title.text).toHaveTextContent('I 2020');
});

test('Title calls onPress callback when clicked', () => {
  const onPress = jest.fn();
  const title = new TitlePage({ onPress });
  fireEvent.press(title.component);
  expect(onPress).toHaveBeenCalledTimes(1);
});

describe('Enabling and disabling', () => {
  test('Disable clicking if prop ´isDisabled´ is true', () => {
    const month = new TitlePage({ isDisabled: true });
    expect(month.component).toBeDisabled();
  });

  test('Enable clicking if prop ´isDisabled´ is false', () => {
    const month = new TitlePage({ isDisabled: false });
    expect(month.component).toBeEnabled();
  });
});

describe('Theme context', () => {
  test('Title container applies titleContainer theme', () => {
    const title = new TitlePage({});
    expect(title.component).toHaveStyle(theme.titleContainer);
  });

  test('Title text applies titleText theme', () => {
    const title = new TitlePage({});
    expect(title.text).toHaveStyle(theme.titleText);
  });
});

class TitlePage {
  component: ReactTestInstance;
  text: ReactTestInstance;

  constructor({
    date = '2020-01-01',
    locale = DefaultLocale,
    onPress = () => {},
    isDisabled = false,
    activeView = VIEW.MONTH,
  }: Partial<Props>) {
    const { getByTestId, getByRole } = render(
      <ThemeContext.Provider value={theme}>
        <Title {...{ locale, activeView, date, onPress, isDisabled }} />
      </ThemeContext.Provider>
    );

    this.component = getByRole('button');
    this.text = getByTestId('title-text');
  }
}

const testLocale = {
  ...DefaultLocale,
  months: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
};

const theme = {
  ...DefaultTheme,
  titleContainer: {
    marginTop: 10,
    backgroundColor: 'orange',
  },
  titleText: {
    color: 'pink',
  },
};
