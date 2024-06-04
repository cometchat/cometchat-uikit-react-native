import React from 'react';
import dayjs from 'dayjs';
import { TouchableOpacity, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { ThemeContext } from '../Contexts';
import { DefaultTheme } from '../Themes';
import type { Theme, MonthComponentType } from '../Entities';

import Months, { Props } from './Months';

const getDisabledMonths = (month: ReactTestInstance) =>
  month.props.accessibilityState.disabled;
const getSelectedMonths = (month: ReactTestInstance) =>
  month.props.accessibilityState.selected;

test('Months renders without error', () => {
  const months = new MonthsPage({});
  expect(months.component).toBeTruthy();
});

test('Renders the correct number of months', () => {
  const months = new MonthsPage({});
  expect(months.monthArray.length).toBe(12);
});

test('Component passes onPressMonth callback to Month children', () => {
  const onPressMonth = jest.fn();
  const months = new MonthsPage({ onPressMonth });
  months.firstMonth && fireEvent.press(months.firstMonth);
  expect(onPressMonth).toHaveBeenCalledTimes(1);
});

describe('Generates correct set of selected months', () => {
  test('None selected, undefined', () => {
    const months = new MonthsPage({ dateProperties: {} });
    const selectedMonths = months.monthArray.filter(getSelectedMonths);
    expect(selectedMonths.length).toBe(0);
  });

  test('None selected, false', () => {
    const months = new MonthsPage({
      dateProperties: {
        '2020-04-01': { isSelected: false },
      },
    });
    const selectedMonths = months.monthArray.filter(getSelectedMonths);
    expect(selectedMonths.length).toBe(0);
  });

  test('Date selection', () => {
    const dateProperties = {
      '2019-01-01': { isSelected: true },
      '2020-01-01': { isSelected: true },
      '2020-01-05': { isSelected: true },
      '2020-04-23': { isSelected: true },
    };

    const months = new MonthsPage({ dateProperties });
    const selectedMonths = months.monthArray.filter(getSelectedMonths);
    expect(selectedMonths.length).toBe(2);
    expect(selectedMonths[0]).toHaveTextContent('Jan');
    expect(selectedMonths[1]).toHaveTextContent('Apr');
  });
});

describe('Disables the correct months', () => {
  describe('due to min date', () => {
    test('works for start-of-year date', () => {
      const months = new MonthsPage({ minDate: '2020-01-01' });
      const disabledMonths = months.monthArray.filter(getDisabledMonths);
      expect(disabledMonths.length).toBe(0);
    });

    test('works for middle-of-the-year dates', () => {
      const months = new MonthsPage({ minDate: '2020-04-01' });
      const disabledMonths = months.monthArray.filter(getDisabledMonths);
      expect(disabledMonths.length).toBe(3);
      expect(disabledMonths[0]).toHaveTextContent('Jan');
      expect(disabledMonths[1]).toHaveTextContent('Feb');
      expect(disabledMonths[2]).toHaveTextContent('Mar');
    });

    test('works for end-of-year date', () => {
      const months = new MonthsPage({ minDate: '2020-12-31' });
      const disabledMonths = months.monthArray.filter(getDisabledMonths);
      expect(disabledMonths.length).toBe(11);
    });
  });

  describe('due to max date', () => {
    test('works for start-of-year date', () => {
      const months = new MonthsPage({ maxDate: '2020-01-01' });
      const disabledMonths = months.monthArray.filter(getDisabledMonths);
      expect(disabledMonths.length).toBe(11);
    });

    test('works for middle-of-the-year date', () => {
      const months = new MonthsPage({ maxDate: '2020-10-15' });
      const disabledMonths = months.monthArray.filter(getDisabledMonths);
      expect(disabledMonths.length).toBe(2);
      expect(disabledMonths[0]).toHaveTextContent('Nov');
      expect(disabledMonths[1]).toHaveTextContent('Dec');
    });

    test('works for end-of-year date', () => {
      const months = new MonthsPage({ maxDate: '2020-12-31' });
      const disabledMonths = months.monthArray.filter(getDisabledMonths);
      expect(disabledMonths.length).toBe(0);
    });
  });
});

describe('Theme context', () => {
  test('Months container applies monthsContainer theme', () => {
    const months = new MonthsPage({ theme: testTheme });
    expect(months.component).toHaveStyle(testTheme.monthsContainer);
  });
});

describe('Custom month component', () => {
  const MonthComponent: MonthComponentType = ({
    date,
    onPress,
    isSelected,
    isDisabled,
  }) => (
    <TouchableOpacity
      testID={'custom-month'}
      accessibilityState={{ disabled: isDisabled, selected: isSelected }}
      onPress={() => onPress(date)}>
      <Text>{dayjs(date).format('MMM')}</Text>
    </TouchableOpacity>
  );

  test('custom month receives onPress prop', () => {
    const onPressMonth = jest.fn();
    const months = new MonthsPage({ MonthComponent, onPressMonth });
    months.firstCustomMonth && fireEvent.press(months.firstCustomMonth);
    expect(onPressMonth).toHaveBeenCalledTimes(1);
  });

  describe('custom month receives isSelected prop', () => {
    test('None selected', () => {
      const months = new MonthsPage({ MonthComponent, dateProperties: {} });
      const selectedMonths = months.customMonthArray.filter(getSelectedMonths);
      expect(selectedMonths.length).toBe(0);
    });

    test('Date selection', () => {
      const dateProperties = {
        '2019-01-01': { isSelected: true },
        '2020-01-01': { isSelected: true },
        '2020-01-05': { isSelected: true },
        '2020-04-23': { isSelected: true },
      };

      const months = new MonthsPage({ MonthComponent, dateProperties });
      const selectedMonths = months.customMonthArray.filter(getSelectedMonths);
      expect(selectedMonths.length).toBe(2);
    });
  });

  describe('custom month component receives isDisabled prop', () => {
    describe('disable months due to min date', () => {
      test('works for start-of-year date', () => {
        const minDate = '2020-01-01';
        const months = new MonthsPage({ MonthComponent, minDate });
        const disabledMonths = months.customMonthArray.filter(getDisabledMonths);
        expect(disabledMonths.length).toBe(0);
      });

      test('works for middle-of-the-year dates', () => {
        const minDate = '2020-04-01';
        const months = new MonthsPage({ MonthComponent, minDate });
        const disabledMonths = months.customMonthArray.filter(getDisabledMonths);
        expect(disabledMonths.length).toBe(3);
      });

      test('works for end-of-year date', () => {
        const minDate = '2020-12-31';
        const months = new MonthsPage({ MonthComponent, minDate });
        const disabledMonths = months.customMonthArray.filter(getDisabledMonths);
        expect(disabledMonths.length).toBe(11);
      });
    });

    describe('disable months due to max date', () => {
      test('works for start-of-year date', () => {
        const maxDate = '2020-01-01';
        const months = new MonthsPage({ MonthComponent, maxDate });
        const disabledMonths = months.customMonthArray.filter(getDisabledMonths);
        expect(disabledMonths.length).toBe(11);
      });

      test('works for middle-of-the-year dates', () => {
        const maxDate = '2020-10-15';
        const months = new MonthsPage({ MonthComponent, maxDate });
        const disabledMonths = months.customMonthArray.filter(getDisabledMonths);
        expect(disabledMonths.length).toBe(2);
      });

      test('works for end-of-year date', () => {
        const maxDate = '2020-12-31';
        const months = new MonthsPage({ MonthComponent, maxDate });
        const disabledMonths = months.customMonthArray.filter(getDisabledMonths);
        expect(disabledMonths.length).toBe(0);
      });
    });
  });
});

export class MonthsPage {
  component: ReactTestInstance;
  firstMonth?: ReactTestInstance;
  firstCustomMonth?: ReactTestInstance;
  monthArray: ReactTestInstance[];
  customMonthArray: ReactTestInstance[];

  constructor({
    onPressMonth = () => {},
    dateProperties = {},
    visibleDate = dayjs('2020-05-01'),
    MonthComponent,
    minDate,
    maxDate,
    theme = DefaultTheme,
  }: Partial<Props> & { theme?: Theme }) {
    const { getAllByRole, getByTestId, getAllByTestId } = render(
      <ThemeContext.Provider value={theme}>
        <Months
          {...{
            MonthComponent,
            onPressMonth,
            dateProperties,
            visibleDate,
            minDate,
            maxDate,
          }}
        />
      </ThemeContext.Provider>
    );

    this.component = getByTestId('months-container');
    this.monthArray = !MonthComponent ? getAllByRole('button') : [];
    this.customMonthArray = MonthComponent ? getAllByTestId('custom-month') : [];

    this.firstMonth = this.monthArray.length ? this.monthArray[0] : undefined;
    this.firstCustomMonth = this.customMonthArray.length
      ? this.customMonthArray[0]
      : undefined;
  }
}

export const testTheme = {
  ...DefaultTheme,
  monthsContainer: {
    marginTop: 10,
    backgroundColor: 'black',
  },
};
