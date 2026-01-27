import { useState, useEffect } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

/**
 * Custom hook that returns whether the keyboard is currently visible.
 * Uses React Native's Keyboard API directly, independent of ChatUiKit.
 * @returns {boolean} True if keyboard is visible, false otherwise.
 */
export const useIsKeyboardVisible = (): boolean => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return isKeyboardVisible;
};
