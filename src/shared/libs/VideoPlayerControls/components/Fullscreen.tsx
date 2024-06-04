import React from 'react';
import {Image, StyleSheet} from 'react-native';
import {Control} from './Control';

interface FullscreenProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  resetControlTimeout: () => void;
  showControls: boolean;
}

export const Fullscreen = ({
  isFullscreen,
  toggleFullscreen,
  resetControlTimeout,
  showControls,
}: FullscreenProps) => {
  let source = isFullscreen
    ? require('../assets/img/shrink.png')
    : require('../assets/img/expand.png');
  return (
    <Control
      callback={toggleFullscreen}
      resetControlTimeout={resetControlTimeout}
      style={styles.fullscreen}
      disabled={!showControls}>
      <Image source={source} />
    </Control>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flexDirection: 'row',
  },
});
