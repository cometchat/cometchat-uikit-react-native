import React from 'react';
import {StyleSheet} from 'react-native';
import type {VideoAnimations} from '../types';

export const Overlay = ({
  animations: {AnimatedView, controlsOpacity},
}: {
  animations: VideoAnimations;
}) => {
  return <AnimatedView style={[_styles.overlay, controlsOpacity]} />;
};

const _styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,.6)',
    opacity: 0,
  },
});
