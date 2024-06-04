import {useTVEventHandler} from 'react-native';

interface OSSupport {
  showControls: boolean;
  onScreenTouch: () => void;
}

export const TVOSSupport = ({showControls, onScreenTouch}: OSSupport) => {
  useTVEventHandler(() => {
    if (!showControls) {
      onScreenTouch();
    }
  });

  return null;
};
