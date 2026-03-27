import { useEffect, useState } from "react";
import { Keyboard, KeyboardEvent } from "react-native";

export let isKeyboardVisible = false;

export const useKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    function onKeyboardDidShow(e: KeyboardEvent) {
      isKeyboardVisible = true;
      // NOTE: LayoutAnimation removed to prevent Fabric crashes (SIGABRT)
      // LayoutAnimation.configureNext() on iOS with Fabric causes crashes when
      // components are removed during the animation (e.g., message list updates).
      // The crash happens in RCTComponentViewRegistry.componentViewDescriptorWithTag
      // when React tries to access a view that was destroyed during animation.
      setKeyboardHeight(e.endCoordinates.height);
    }

    function onKeyboardDidHide() {
      isKeyboardVisible = false;
      // NOTE: LayoutAnimation removed to prevent Fabric crashes (SIGABRT)
      setKeyboardHeight(0);
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", onKeyboardDidShow);
    const hideSubscription = Keyboard.addListener("keyboardDidHide", onKeyboardDidHide);
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
};
