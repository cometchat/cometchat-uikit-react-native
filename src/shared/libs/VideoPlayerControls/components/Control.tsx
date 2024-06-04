import React, {ReactNode, RefObject, useState} from 'react';
import {TouchableHighlight, ViewProps} from 'react-native';
import {styles} from './styles';

interface ControlProps extends ViewProps {
  children: ReactNode;
  callback?: () => void;
  controlRef?: RefObject<TouchableHighlight>;
  disabled?: boolean;
  style?: any;
  resetControlTimeout?: () => void;
}

export const Control = ({
  children,
  callback,
  controlRef,
  disabled,
  style = {},
  ...props
}: ControlProps) => {
  const [focused, setFocused] = useState(false);

  const setFocusedState = () => setFocused(true);
  const cancelFocusedState = () => setFocused(false);

  const focusedStyle = focused ? {opacity: 1} : {};

  return (
    <TouchableHighlight
      onFocus={setFocusedState}
      onBlur={cancelFocusedState}
      disabled={disabled}
      ref={controlRef}
      underlayColor="transparent"
      activeOpacity={1}
      onPress={() => {
        callback && callback();
      }}
      style={[styles.control, style, focused && focusedStyle]}
      {...props}>
      {children}
    </TouchableHighlight>
  );
};
