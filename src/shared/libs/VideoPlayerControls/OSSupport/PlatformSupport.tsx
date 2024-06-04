import React, {ReactNode} from 'react';
import {
  TouchableWithoutFeedback,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {TVOSSupport} from './TVOSSupport';
import {_styles} from '../styles';

interface OSSupport {
  children: ReactNode;
  containerStyles: StyleProp<ViewStyle>;
  onScreenTouch: () => void;
  showControls: boolean;
}

export const PlatformSupport = ({
  children,
  onScreenTouch,
  containerStyles,
  showControls,
}: OSSupport) => {
  if (Platform.isTV) {
    return (
      <>
        <TVOSSupport
          showControls={showControls}
          onScreenTouch={onScreenTouch}
        />
        {children}
      </>
    );
  }

  return (
    <TouchableWithoutFeedback
      onPress={onScreenTouch}
      style={[_styles.player.container, containerStyles]}>
      {children}
    </TouchableWithoutFeedback>
  );
};
