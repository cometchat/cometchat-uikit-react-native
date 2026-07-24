import React, { JSX, useCallback, useEffect, useRef, useState } from "react";
import {
  EmitterSubscription,
  ImageSourcePropType,
  ImageStyle,
  NativeEventEmitter,
  NativeModules,
  Platform,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Icon } from "../../icons/Icon";
import { AnimatedAudioWaves } from "./AnimatedAudioWaves";
import { audioPlaybackCoordinator } from "../../utils/audioPlaybackCoordinator";

const { SoundPlayer } = NativeModules;
const eventEmitter = new NativeEventEmitter(SoundPlayer);

export interface CometChatAudioBubbleInterface {
  /**
   * url of audio
   */
  audioUrl: string;
  /**
   * custom icon for play
   */
  playIcon?: ImageSourcePropType | JSX.Element;
  /**
   * custom icon for pause
   */
  pauseIcon?: ImageSourcePropType | JSX.Element;
  /**
   * pass function to handle custom play/pause logic.
   * one parameters will be received audioUrl
   */
  onPress?: Function;
  playViewContainerStyle?: StyleProp<ViewStyle>;
  playIconStyle?: ImageStyle;
  playIconContainerStyle?: StyleProp<ViewStyle>;
  waveStyle?: StyleProp<ViewStyle>;
  waveContainerStyle?: StyleProp<ViewStyle>;
  playProgressTextStyle?: TextStyle;
}

export const CometChatAudioBubble = ({
  audioUrl,
  onPress,
  playIcon,
  pauseIcon,
  playViewContainerStyle = {},
  playIconStyle = {},
  playIconContainerStyle = {},
  waveStyle = {},
  waveContainerStyle = {},
  playProgressTextStyle = {},
}: CometChatAudioBubbleInterface) => {
  const [status, setStatus] = useState<"playing" | "paused" | "loading" | "">("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  // Per-instance (the module-level interval/listener were shared across every voice-note bubble).
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subRef = useRef<ReturnType<typeof eventEmitter.addListener> | null>(null);
  const statusRef = useRef(status); statusRef.current = status;
  const currentTimeRef = useRef(currentTime); currentTimeRef.current = currentTime;
  // True when this clip was paused because another audio started (native player moved away).
  const wasInterruptedRef = useRef(false);

  const clearPoll = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };
  const startPoll = () => {
    clearPoll();
    intervalRef.current = setInterval(() => {
      SoundPlayer.getPosition((info: string) => {
        try { if (info) setCurrentTime(JSON.parse(info).position); } catch (e) {}
      });
    }, 500);
  };
  // (Re)play from `fromSeconds`. Announces first so any other playing clip pauses in place.
  const play = (fromSeconds = 0) => {
    audioPlaybackCoordinator.announcePlay(audioUrl);
    wasInterruptedRef.current = false;
    setStatus("loading");
    SoundPlayer.play(audioUrl, (s: string) => {
      try {
        if (JSON.parse(s)?.success) {
          setStatus("playing");
          if (fromSeconds > 0) SoundPlayer.playAt(Math.floor(fromSeconds), () => {});
          startPoll();
        } else {
          setStatus("");
        }
      } catch (ex) { console.log(ex); }
    });
  };

  useEffect(() => {
    if (audioUrl) {
      SoundPlayer.prepareMediaPlayer(audioUrl, (s: string) => {
        try {
          setDuration(JSON.parse(s).duration);
        } catch (e) {}
      });
    }

    return () => {
      SoundPlayer.releaseMediaPlayer();
    };
  }, [audioUrl]);

  // WhatsApp coordination: another audio (recorded or shared) starting pauses THIS one in place,
  // keeping its position so it can resume from where it left off.
  useEffect(() => {
    const unsub = audioPlaybackCoordinator.subscribe((activeUrl) => {
      if (activeUrl === audioUrl) return;
      if (statusRef.current === "playing" || statusRef.current === "paused") {
        wasInterruptedRef.current = true;
        clearPoll();
        setStatus("paused"); // keep currentTime — position preserved
      }
    });
    return unsub;
  }, [audioUrl]);

  // Native fires soundPlayStatus on natural completion AND when a new play() replaces this clip.
  // Interrupt echo (we were interrupted) → ignore; genuine finish → reset to idle.
  useEffect(() => {
    subRef.current = eventEmitter.addListener("soundPlayStatus", (data) => {
      if (audioUrl !== data.url) return;
      if (wasInterruptedRef.current) return;
      setStatus("");
      clearPoll();
      setCurrentTime(0);
    });
    return () => {
      subRef.current?.remove();
      clearPoll();
    };
  }, [audioUrl]);

  const playPauseAudio = () => {
    if (onPress) {
      onPress(audioUrl);
      return;
    }
    if (status === "playing") {
      // User pause — native player is still ours; a plain resume works later.
      wasInterruptedRef.current = false;
      SoundPlayer.pause((s: string) => {
        try {
          if (JSON.parse(s)?.success) {
            setStatus("paused");
            clearPoll();
          }
        } catch (ex) { console.log(ex); }
      });
      return;
    }
    if (status === "paused") {
      if (wasInterruptedRef.current) {
        play(currentTimeRef.current); // player moved away — re-play from where we paused
      } else {
        audioPlaybackCoordinator.announcePlay(audioUrl); // resuming still stops any other clip
        SoundPlayer.resume();
        setStatus("playing");
        startPoll();
      }
      return;
    }
    if (audioUrl) play(currentTimeRef.current || 0);
  };

  const pressTime = useRef<number | null>(0);

  const handleTouchStart = () => {
    pressTime.current = Date.now();
  };

  const handleTouchEnd = () => {
    if (pressTime.current === null && Platform.OS === "ios") return;
    const endTime = Date.now();
    const pressDuration = endTime - (pressTime.current ?? 0);
    if (pressDuration < 500) {
      playPauseAudio();
    }
  };

  const onTouchMove = () => {
    if (Platform.OS === "ios") {
      pressTime.current = null;
    }
  };

  const displayDuration = useCallback(
    () => (
      <Text allowFontScaling={false} style={playProgressTextStyle}>
        {`${String(Math.floor((currentTime || 0) / 60)).padStart(2, "0")}:${String(
          Math.floor((currentTime || 0) % 60)
        ).padStart(2, "0")}`}
        /
        {`${String(Math.floor((duration || 0) / 60)).padStart(2, "0")}:${String(
          Math.floor((duration || 0) % 60)
        ).padStart(2, "0")}`}
      </Text>
    ),
    [currentTime, duration]
  );

  return (
    <View style={playViewContainerStyle}>
      <View
        style={playIconContainerStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={onTouchMove}
      >
        <Icon
          name={status === "playing" ? "pause-fill" : "play-arrow-fill"}
          height={playIconStyle?.height}
          width={playIconStyle?.width}
          color={playIconStyle?.tintColor}
          imageStyle={playIconStyle}
          icon={status === "playing" ? pauseIcon : playIcon}
        />
      </View>

      <View style={{ flex: 1 }}>
        <AnimatedAudioWaves
          waveStyle={waveStyle}
          waveContainerStyle={waveContainerStyle}
          isAnimating={status === "playing"}
        />
        {displayDuration()}
      </View>
    </View>
  );
};
// CometChatAudioBubble