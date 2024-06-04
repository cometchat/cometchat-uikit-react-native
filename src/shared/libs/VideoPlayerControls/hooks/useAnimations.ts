import {useRef} from 'react';
import {Animated} from 'react-native';
import type {VideoAnimations} from '../types';

export const useJSAnimations = (
  controlAnimationTiming: number = 450,
): VideoAnimations => {
  const bottomControlMarginBottom = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const topControlMarginTop = useRef(new Animated.Value(0)).current;

  const hideControlAnimation = () => {
    Animated.parallel([
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(topControlMarginTop, {
        toValue: -100,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(bottomControlMarginBottom, {
        toValue: -100,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const showControlAnimation = () => {
    Animated.parallel([
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(topControlMarginTop, {
        toValue: 0,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(bottomControlMarginBottom, {
        toValue: 0,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animations = {
    bottomControl: {
      marginBottom: bottomControlMarginBottom,
    },
    topControl: {
      marginTop: topControlMarginTop,
    },
    controlsOpacity: {
      opacity: controlsOpacity,
    },
    showControlAnimation,
    hideControlAnimation,
    AnimatedView: Animated.View,
  } as unknown as VideoAnimations;

  return animations;
};
