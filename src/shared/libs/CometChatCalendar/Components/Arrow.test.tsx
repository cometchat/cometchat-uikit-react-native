import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext } from '../Contexts';
import { DefaultTheme } from '../Themes';

import Arrow, { Props } from './Arrow';

test('Arrow renders without error', () => {
  const arrow = new ArrowPage({ direction: 'left' });
  expect(arrow.component).toBeTruthy();
});

test('Component calls onPress callback when clicked', () => {
  const onPress = jest.fn();
  const month = new ArrowPage({ onPress });
  fireEvent.press(month.component);
  expect(onPress).toHaveBeenCalledTimes(1);
});

describe('Enabling and disabling', () => {
  test('Disable clicking if prop ´isDisabled´ is true', () => {
    const arrow = new ArrowPage({ isDisabled: true });
    expect(arrow.component).toBeDisabled();
  });

  test('Enable clicking if prop ´isDisabled´ is false', () => {
    const arrow = new ArrowPage({ isDisabled: false });
    expect(arrow.component).toBeEnabled();
  });
});

describe('Theme context', () => {
  test('Container applies normal theme in enabled state', () => {
    const arrow = new ArrowPage({});
    expect(arrow.component).toHaveStyle(theme.normalArrowContainer);
    expect(arrow.component).not.toHaveStyle(theme.disabledArrowContainer);
  });

  test('Container applies isDisabled theme in isDisabled state', () => {
    const arrow = new ArrowPage({ isDisabled: true });
    expect(arrow.component).toHaveStyle([
      theme.normalArrowContainer,
      theme.disabledArrowContainer,
    ]);
  });

  test('Image applies normal theme in enabled state', () => {
    const arrow = new ArrowPage({});
    expect(arrow.image).toHaveStyle(theme.normalArrowImage);
    expect(arrow.image).not.toHaveStyle(theme.disabledArrowImage);
  });

  test('Image applies isDisabled theme in isDisabled state', () => {
    const arrow = new ArrowPage({ isDisabled: true });
    expect(arrow.image).toHaveStyle([theme.normalArrowImage, theme.disabledArrowImage]);
  });
});

describe('Automatic image rotation', () => {
  const rotation = { transform: [{ rotate: '180deg' }] };

  test('Rotate "right" arrow towards the right', () => {
    const arrow = new ArrowPage({ direction: 'right' });
    expect(arrow.image).toHaveStyle(rotation);
  });

  test('Do not rotate "left" arrows', () => {
    const arrow = new ArrowPage({ direction: 'left' });
    expect(arrow.image).not.toHaveStyle(rotation);
  });
});

class ArrowPage {
  component: ReactTestInstance;
  image: ReactTestInstance;

  constructor({
    direction = 'left',
    isDisabled = false,
    onPress = () => {},
  }: Partial<Props>) {
    const { getByLabelText, getByTestId } = render(
      <ThemeContext.Provider value={theme}>
        <Arrow {...{ direction, isDisabled, onPress }} />
      </ThemeContext.Provider>
    );

    this.component = getByLabelText(`${direction} arrow`);
    this.image = getByTestId('arrow-image');
  }
}

const theme = {
  ...DefaultTheme,
  normalArrowContainer: {
    marginTop: 10,
    backgroundColor: 'green',
  },
  disabledArrowContainer: {
    marginBottom: 10,
    backgroundColor: 'gray',
  },
  normalArrowImage: {
    marginTop: 10,
    tintColor: 'green',
  },
  disabledArrowImage: {
    marginBottom: 10,
    tintColor: 'gray',
  },
};
