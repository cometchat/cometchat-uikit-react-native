import type {RefObject} from 'react';
import type {ViewStyle, StyleProp, Animated, ImageSourcePropType} from 'react-native';
// import type Reanimated from 'react-native-reanimated';
// import type {StyleProps} from 'react-native-reanimated';
// import type {VideoRef, ReactVideoProps} from 'react-native-video';

export type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};

export type VideoAnimations = {
  AnimatedView: any;
  hideControlAnimation: () => void;
  showControlAnimation: () => void;
  bottomControl: any; // type AnimatedViewStyle = Animated.AnimatedProps<ViewProps>['style'];
  topControl: any;
  controlsOpacity: any;
};

export interface VideoPlayerProps {
  loadingIconColor?: string;
  playIcon?: ImageSourcePropType
  playIconColor?: string
  pauseIcon?: ImageSourcePropType
  pauseIconColor?: string
  backIcon?: ImageSourcePropType
  backIconColor?: string
  volumeIcon?: ImageSourcePropType
  volumeIconColor?: string
  
  repeat?: boolean;
  resizeMode?: string;
  paused?: boolean;
  muted?: boolean;
  volume?: number;
  rate?: number;
  onSeek?: Function;
  onError?: Function;
  onEnd?: Function;
  onLoad?: Function;
  onLoadStart?: Function;
  onProgress?: Function;
  source: object;
  animations?: VideoAnimations;
  useAnimations?: (controlAnimationTiming: number) => VideoAnimations;
  /**
   * If true, clicking the fullscreen button will toggle the <Video />
   * component between cover/contain, set to false
   * if you want to customize fullscreen behaviour
   *
   * @default false
   */
  toggleResizeModeOnFullscreen?: boolean;

  /**
   * The amount of time (in milliseconds) to animate the controls in and out.
   *
   * @default 500
   */
  controlAnimationTiming?: number;

  /**
   * Tapping twice within this amount of time in milliseconds is considered a double tap.
   * Single taps will not be actioned until this time has expired
   *
   * @default 100
   */
  doubleTapTime?: number;

  /**
   * The VideoPlayer fullscreen state.
   *
   * @default false
   */
  isFullscreen?: boolean;

  /**
   * Show or hide the controls on first render
   *
   * @default false
   */
  showOnStart?: boolean;

  /**
   * Show or hide the controls on end of video
   *
   * @default false
   */
  showOnEnd?: boolean;

  /**
   * Always show controls.
   *
   * @default false
   */
  alwaysShowControls?: boolean;

  /**
   * Title of the video
   */
  title?: string;

  /**
   * If true, show the time remaing, else show the current time in the Player.
   *
   * @default false
   */
  showTimeRemaining?: boolean;

  /**
   * Show duration of the media.
   *
   * @default false
   */
  showDuration?: boolean;

  /**
   * If true, convert time to hours in the Player
   *
   * @default false
   */
  showHours?: boolean;

  /**
   * Function fired when back button is pressed, override if using custom navigation
   */
  onBack?: () => void;

  /**
   * Fired when the video enters fullscreen after the fullscreen button is pressed
   */
  onEnterFullscreen?: () => void;

  /**
   * Fired when the video exits fullscreen after the fullscreen button is pressed
   */
  onExitFullscreen?: () => void;

  /**
   * Fired when the controls disappear
   */
  onHideControls?: () => void;

  /**
   * Fired when the controls appear
   */
  onShowControls?: () => void;

  /**
   * Fired when the video is paused after the play/pause button is pressed
   */
  onPause?: () => void;

  /**
   * Fired when the video begins playing after the play/pause button is pressed
   */
  onPlay?: () => void;

  /**
   * Hide controls after X amount of time in milliseconds
   *
   * @default 15000
   */
  controlTimeoutDelay?: number;

  /**
   * If true, single tapping anywhere on the video (other than a control) toggles between playing and paused.
   *
   * @default false
   */
  tapAnywhereToPause?: boolean;

  /**
   * StyleSheet passed to the <Video /> component
   *
   */
  videoStyle?: StyleProp<ViewStyle>;

  /**
   * Container styles
   *
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * Fill/handle colour of the seekbar
   *
   * @default '#FFF'
   */
  seekColor?: string;

  /**
   * Hide the back button
   *
   * @default false
   */
  disableBack?: boolean;

  /**
   * Hide the Volume control
   *
   * @default false
   */
  disableVolume?: boolean;

  /**
   * Hide the fullscreen button
   *
   * @default false
   */
  disableFullscreen?: boolean;

  /**
   * Hide the timer
   *
   * @default false
   */
  disableTimer?: boolean;

  /**
   * Hide the seekbar
   *
   * @default false
   */
  disableSeekbar?: boolean;

  /**
   * Hide the play/pause toggle and the rewind/forward buttons
   *
   * @default false
   */
  disablePlayPause?: boolean;

  /**
   * Hide the rewind/forward buttons without hiding the play/pause button
   *
   * @default false
   */
  disableSeekButtons?: boolean;

  /**
   * Hide the transparent overlay which is active when the controls are shown. Generally used when you want to disable all the controls.
   *
   * @default false
   */
  disableOverlay?: boolean;

  /**
   * When using the default React Native navigator and do not override the `onBack` function,
   * you'll need to pass the navigator to the VideoPlayer for it to function
   *
   * @default null
   */
  navigator?: any;

  /**
   * Pass ref to the `<Video/>` component
   *
   * @default false
   */
  videoRef?: RefObject<any>;

  /**
   * Number of seconds to rewind or forward.
   *
   * @default 15
   */
  rewindTime?: number;

  /**
   * Object allowing fine grained control of the pan responder
   *
   * @default { horizontal: true, inverted: false }
   */
  pan?: {
    /**
     * Boolean representing if the player is oriented horizontally or vertically
     *
     * @default true
     */
    horizontal?: boolean;

    /**
     * Boolean representing if the player controls pan gesture should be inverted
     *
     * @default false
     */
    inverted?: boolean;
  };
}
