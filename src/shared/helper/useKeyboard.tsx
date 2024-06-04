import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  LayoutAnimation,
  Platform,
} from 'react-native';

export let isKeyboardVisible = false;

export const useKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    function onKeyboardDidShow(e: KeyboardEvent) {
      isKeyboardVisible = true;
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext({
          duration: 200,
          create: {type: 'linear', property: 'opacity'},
          update: {type: 'linear', property: 'opacity'},
          delete: {type: 'linear', property: 'opacity'},
        });
      }
      setKeyboardHeight(e.endCoordinates.height);
    }

    function onKeyboardDidHide() {
      isKeyboardVisible = false;
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext({
          duration: 200,
          create: {type: 'linear', property: 'opacity'},
          update: {type: 'linear', property: 'opacity'},
          delete: {type: 'linear', property: 'opacity'},
        });
      }
      setKeyboardHeight(0);
    }

    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      onKeyboardDidShow
    );
    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      onKeyboardDidHide
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
};
