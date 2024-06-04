import React, {useCallback, useState, useEffect, useRef} from 'react';
import {View} from 'react-native';
import Video from '../VideoPlayer/Video';
import {useControlTimeout, useJSAnimations, usePanResponders} from './hooks';
import {
  Error,
  Loader,
  TopControls,
  BottomControls,
  PlayPause,
  Overlay,
} from './components';
import {PlatformSupport} from './OSSupport';
import {_onBack} from './utils';
import {_styles} from './styles';
import type {VideoPlayerProps, WithRequiredProperty} from './types';

const volumeWidth = 150;
const iconOffset = 0;

const AnimatedVideoPlayer = (
  props: WithRequiredProperty<VideoPlayerProps, 'animations'>,
) => {
  
  const {
    loadingIconColor,
    playIcon,
    playIconColor,
    pauseIcon,
    pauseIconColor,
    backIcon,
    backIconColor,
    volumeIcon,
    volumeIconColor,
    animations,
    toggleResizeModeOnFullscreen,
    doubleTapTime = 130,
    resizeMode = 'contain',
    isFullscreen = false,
    showOnStart = false,
    showOnEnd = false,
    alwaysShowControls = false,
    paused = false,
    muted = false,
    volume = 1,
    title = '',
    rate = 1,
    showDuration = false,
    showTimeRemaining = false,
    showHours = false,
    onSeek,
    onError,
    onBack,
    onEnd,
    onEnterFullscreen = () => {},
    onExitFullscreen = () => {},
    onHideControls = () => {},
    onShowControls = () => {},
    onPause,
    onPlay,
    onLoad,
    onLoadStart,
    onProgress,
    controlTimeoutDelay = 15000,
    tapAnywhereToPause = false,
    videoStyle = {},
    containerStyle = {},
    seekColor = '',
    source,
    disableBack = false,
    disableVolume = false,
    disableFullscreen = false,
    disableTimer = false,
    disableSeekbar = false,
    disablePlayPause = false,
    disableSeekButtons = false,
    disableOverlay,
    navigator,
    rewindTime = 15,
    pan: {horizontal: horizontalPan, inverted: invertedPan} = {},
  } = props;

  const mounted = useRef(false);
  const _videoRef = useRef<any>(null);
  const controlTimeout = useRef<ReturnType<typeof setTimeout>>(
    setTimeout(() => {}),
  ).current;
  const tapActionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [_resizeMode, setResizeMode] = useState<any>(resizeMode);
  const [_paused, setPaused] = useState<boolean>(paused);
  const [_muted, setMuted] = useState<boolean>(muted);
  const [_volume, setVolume] = useState<number>(volume);
  const [_isFullscreen, setIsFullscreen] = useState<boolean>(
    isFullscreen || resizeMode === 'cover' || false,
  );
  const [_showTimeRemaining, setShowTimeRemaining] =
    useState<boolean>(showTimeRemaining);
  const [volumeTrackWidth, setVolumeTrackWidth] = useState<number>(0);
  const [volumeFillWidth, setVolumeFillWidth] = useState<number>(0);
  const [seekerFillWidth, setSeekerFillWidth] = useState<number>(0);
  const [showControls, setShowControls] = useState(showOnStart);
  const [volumePosition, setVolumePositionState] = useState(0);
  const [seekerPosition, setSeekerPositionState] = useState(0);
  const [volumeOffset, setVolumeOffset] = useState(0);
  const [seekerOffset, setSeekerOffset] = useState(0);
  const [seekerWidth, setSeekerWidth] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState(0);

  const videoRef = props.videoRef || _videoRef;

  const toggleFullscreen = () => setIsFullscreen((prevState) => !prevState);
  const toggleControls = () =>
    setShowControls((prevState) => alwaysShowControls || !prevState);
  const toggleTimer = () => setShowTimeRemaining((prevState) => !prevState);
  const togglePlayPause = () => {
    setPaused((prevState) => !prevState);
  };

  const styles = {
    videoStyle,
    containerStyle: containerStyle,
  };

  const _onSeek = (obj: any) => {
    if (!seeking) {
      setControlTimeout();
    }
    setCurrentTime(obj.seekTime);

    if (typeof onSeek === 'function') {
      onSeek(obj);
    }
  };

  const _onEnd = () => {
    if (currentTime < duration) {
      setCurrentTime(duration);
      setPaused(!props.repeat);

      if (showOnEnd) {
        setShowControls(!props.repeat);
      }
    }

    if (typeof onEnd === 'function') {
      onEnd();
    }
  };

  const _onError = () => {
    setError(true);
    setLoading(false);
  };

  function _onLoadStart(e: any) {
    setLoading(true);

    if (typeof onLoadStart === 'function') {
      onLoadStart(e);
    }
  }

  function _onLoad(data: any) {
    setDuration(data.duration);
    setLoading(false);

    if (showControls) {
      setControlTimeout();
    }

    if (typeof onLoad === 'function') {
      onLoad(data);
    }
  }

  function _onProgress(data: any) {
    if (!seeking) {
      setCurrentTime(data.currentTime);

      if (typeof onProgress === 'function') {
        onProgress(data);
      }
    }
  }

  const _onScreenTouch = () => {
    if (tapActionTimeout.current) {
      clearTimeout(tapActionTimeout.current);
      tapActionTimeout.current = null;
      toggleFullscreen();
      if (showControls) {
        resetControlTimeout();
      }
    } else {
      tapActionTimeout.current = setTimeout(() => {
        if (tapAnywhereToPause && showControls) {
          togglePlayPause();
          resetControlTimeout();
        } else {
          toggleControls();
        }
        tapActionTimeout.current = null;
      }, doubleTapTime);
    }
  };

  const events = {
    onError: onError || _onError,
    onBack: (onBack || _onBack(navigator)) as () => void,
    onEnd: _onEnd,
    onScreenTouch: _onScreenTouch,
    onEnterFullscreen,
    onExitFullscreen,
    onShowControls,
    onHideControls,
    onLoadStart: _onLoadStart,
    onProgress: _onProgress,
    onSeek: _onSeek,
    onLoad: _onLoad,
    onPause,
    onPlay,
  };

  const constrainToSeekerMinMax = useCallback(
    (val = 0) => {
      if (val <= 0) {
        return 0;
      } else if (val >= seekerWidth) {
        return seekerWidth;
      }
      return val;
    },
    [seekerWidth],
  );

  const constrainToVolumeMinMax = (val = 0) => {
    if (val <= 0) {
      return 0;
    } else if (val >= volumeWidth + 9) {
      return volumeWidth + 9;
    }
    return val;
  };

  const setSeekerPosition = useCallback(
    (position = 0) => {
      const positionValue = constrainToSeekerMinMax(position);
      setSeekerPositionState(positionValue);
      setSeekerOffset(positionValue);
      setSeekerFillWidth(positionValue);
    },
    [constrainToSeekerMinMax],
  );

  const setVolumePosition = (position = 0) => {
    const positionValue = constrainToVolumeMinMax(position);
    setVolumePositionState(positionValue + iconOffset);

    if (positionValue < 0) {
      setVolumeFillWidth(0);
    } else {
      setVolumeFillWidth(positionValue);
    }
  };

  const {clearControlTimeout, resetControlTimeout, setControlTimeout} =
    useControlTimeout({
      controlTimeout,
      controlTimeoutDelay,
      mounted: mounted.current,
      showControls,
      setShowControls,
      alwaysShowControls,
    });

  const {volumePanResponder, seekPanResponder} = usePanResponders({
    duration,
    seekerOffset,
    volumeOffset,
    loading,
    seekerWidth,
    seeking,
    seekerPosition,
    seek: videoRef?.current?.seek,
    clearControlTimeout,
    setVolumePosition,
    setSeekerPosition,
    setSeeking,
    setControlTimeout,
    onEnd: events.onEnd,
    horizontal: horizontalPan,
    inverted: invertedPan,
  });

  useEffect(() => {
    if (currentTime >= duration) {
      videoRef?.current?.seek(0);
    }
  }, [currentTime, duration, videoRef]);

  useEffect(() => {
    if (toggleResizeModeOnFullscreen) {
      setResizeMode(_isFullscreen ? 'cover' : 'contain');
    }

    if (_isFullscreen) {
      typeof events.onEnterFullscreen === 'function' &&
        events.onEnterFullscreen();
    } else {
      typeof events.onExitFullscreen === 'function' &&
        events.onExitFullscreen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_isFullscreen, toggleResizeModeOnFullscreen]);

  useEffect(() => {
    setIsFullscreen(isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    setPaused(paused);
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, [paused]);

  useEffect(() => {
    if (_paused) {
      typeof events.onPause === 'function' && events.onPause();
    } else {
      typeof events.onPlay === 'function' && events.onPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_paused]);

  useEffect(() => {
    if (!seeking && currentTime && duration) {
      const percent = currentTime / duration;
      const position = seekerWidth * percent;

      setSeekerPosition(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, seekerWidth, setSeekerPosition]);

  useEffect(() => {
    if (showControls && !loading) {
      animations.showControlAnimation();
      setControlTimeout();
      typeof events.onShowControls === 'function' && events.onShowControls();
    } else {
      animations.hideControlAnimation();
      clearControlTimeout();
      typeof events.onHideControls === 'function' && events.onHideControls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showControls, loading]);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const newVolume = volumePosition / volumeWidth;

    if (newVolume <= 0) {
      setMuted(true);
    } else {
      setMuted(false);
    }

    setVolume(newVolume);
    setVolumeOffset(volumePosition);

    const newVolumeTrackWidth = volumeWidth - volumeFillWidth;

    if (newVolumeTrackWidth > 150) {
      setVolumeTrackWidth(150);
    } else {
      setVolumeTrackWidth(newVolumeTrackWidth);
    }
  }, [volumeFillWidth, volumePosition]);

  useEffect(() => {
    const position = volumeWidth * _volume;
    setVolumePosition(position);
    setVolumeOffset(position);
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearControlTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PlatformSupport
      showControls={showControls}
      containerStyles={styles.containerStyle}
      onScreenTouch={events.onScreenTouch}>
      <View style={[_styles.player.container, styles.containerStyle]}>
        <Video
          {...props}
          {...events}
          ref={videoRef || _videoRef}
          resizeMode={_resizeMode}
          volume={_volume}
          paused={_paused}
          muted={_muted}
          rate={rate}
          style={[_styles.player.video, styles.videoStyle]}
          source={source}
        />
        {loading ? (
          <Loader loadingIconColor={loadingIconColor}/>
        ) : (
          <>
            <Error error={error} />
            {!disableOverlay && <Overlay animations={animations} />}
            <TopControls
              panHandlers={volumePanResponder.panHandlers}
              animations={animations}
              disableBack={disableBack}
              disableVolume={disableVolume}
              volumeFillWidth={volumeFillWidth}
              volumeTrackWidth={volumeTrackWidth}
              volumePosition={volumePosition}
              onBack={events.onBack}
              resetControlTimeout={resetControlTimeout}
              showControls={showControls}
              backIcon={backIcon}
              backIconColor={backIconColor}
              volumeIcon={volumeIcon}
              volumeIconColor={volumeIconColor}
            />
            <PlayPause
              animations={animations}
              disablePlayPause={disablePlayPause}
              disableSeekButtons={disableSeekButtons}
              paused={_paused}
              togglePlayPause={togglePlayPause}
              resetControlTimeout={resetControlTimeout}
              showControls={showControls}
              onPressRewind={() =>
                videoRef?.current?.seek(currentTime - rewindTime)
              }
              onPressForward={() =>
                videoRef?.current?.seek(currentTime + rewindTime)
              }
              playIcon={playIcon}
              playIconColor={playIconColor}
              pauseIcon={pauseIcon}
              pauseIconColor={pauseIconColor}
            />
            <BottomControls
              animations={animations}
              panHandlers={seekPanResponder.panHandlers}
              disableTimer={disableTimer}
              disableSeekbar={disableSeekbar}
              showHours={showHours}
              showDuration={showDuration}
              paused={_paused}
              showTimeRemaining={_showTimeRemaining}
              currentTime={currentTime}
              duration={duration}
              seekColor={seekColor}
              title={title}
              toggleTimer={toggleTimer}
              resetControlTimeout={resetControlTimeout}
              seekerFillWidth={seekerFillWidth}
              seekerPosition={seekerPosition}
              setSeekerWidth={setSeekerWidth}
              isFullscreen={isFullscreen}
              disableFullscreen={disableFullscreen}
              toggleFullscreen={toggleFullscreen}
              showControls={showControls}
            />
          </>
        )}
      </View>
    </PlatformSupport>
  );
};

const CustomAnimations = ({
  useAnimations,
  controlAnimationTiming = 450,
  ...props
}: WithRequiredProperty<VideoPlayerProps, 'useAnimations'>) => {
  const animations = useAnimations(controlAnimationTiming);
  return <AnimatedVideoPlayer animations={animations} {...props} />;
};

const JSAnimations = (props: VideoPlayerProps) => {
  const animations = useJSAnimations(props.controlAnimationTiming);

  return <AnimatedVideoPlayer animations={animations} {...props} />;
};

export const VideoPlayer = (props: Omit<VideoPlayerProps, 'animations'>) => {
  if (props?.useAnimations) {
    return <CustomAnimations useAnimations={props?.useAnimations} {...props} />;
  }

  return <JSAnimations {...props} />;
};
