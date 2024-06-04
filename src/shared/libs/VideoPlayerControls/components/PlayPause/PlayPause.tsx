import React, {createRef} from 'react';
import {Image, ImageSourcePropType, Platform, TouchableHighlight} from 'react-native';
import {Control} from '../Control';
import {NullControl} from '../NullControl';
import type {VideoAnimations} from '../../types';
import {styles} from './styles';

export const playPauseRef = createRef<TouchableHighlight>();

interface PlayPauseProps {
  animations: VideoAnimations;
  disablePlayPause: boolean;
  disableSeekButtons: boolean;
  paused: boolean;
  togglePlayPause: () => void;
  resetControlTimeout: () => void;
  showControls: boolean;
  onPressForward: () => void;
  onPressRewind: () => void;
  playIcon?: ImageSourcePropType
  playIconColor?: string
  pauseIcon?: ImageSourcePropType
  pauseIconColor?: string
}

const play = require('../../assets/img/play.png');
const pause = require('../../assets/img/pause.png');
const rewind = require('../../assets/img/rewind.png');
const forward = require('../../assets/img/forward.png');

export const PlayPause = ({
  playIcon,
  playIconColor,
  pauseIcon,
  pauseIconColor,
  animations: {AnimatedView, ...animations},
  disablePlayPause,
  disableSeekButtons,
  paused,
  togglePlayPause,
  resetControlTimeout,
  showControls,
  onPressForward,
  onPressRewind,
}: PlayPauseProps) => {
  let source = paused
    ? playIcon
      ? playIcon
      : play
    : pauseIcon
    ? pauseIcon
    : pause;

  const animatedStyles = {
    zIndex: showControls ? 99999 : 0,
  };

  if (disablePlayPause) {
    return <NullControl />;
  }

  return (
    <AnimatedView
      pointerEvents={'box-none'}
      style={[styles.container, animatedStyles, animations.controlsOpacity]}>
      {!disableSeekButtons ? (
        <Control
          disabled={!showControls}
          callback={onPressRewind}
          resetControlTimeout={resetControlTimeout}>
          <Image source={rewind} resizeMode={'contain'} style={styles.rewind} />
        </Control>
      ) : null}
      <Control
        disabled={!showControls}
        callback={togglePlayPause}
        resetControlTimeout={resetControlTimeout}
        style={styles.playContainer}
        controlRef={playPauseRef}
        {...(Platform.isTV ? {hasTVPreferredFocus: showControls} : {})}>
        <Image
          source={source}
          resizeMode={'contain'}
          style={
            paused
              ? pauseIconColor
                ? { tintColor: pauseIconColor }
                : {}
              : playIconColor
              ? { tintColor: playIconColor }
              : {}
          }
        />
      </Control>
      {!disableSeekButtons ? (
        <Control
          disabled={!showControls}
          callback={onPressForward}
          resetControlTimeout={resetControlTimeout}>
          <Image
            source={forward}
            resizeMode={'contain'}
            style={styles.rewind}
          />
        </Control>
      ) : null}
    </AnimatedView>
  );
};
