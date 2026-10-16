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
import { Icon } from "../../../icons/Icon";
import { AnimatedAudioWaves } from "../../CometChatAudioBubble/AnimatedAudioWaves";

const { SoundPlayer } = NativeModules;
const eventEmitter = new NativeEventEmitter(SoundPlayer);
let listener: EmitterSubscription | undefined;
let interval: ReturnType<typeof setTimeout>;

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

export const CometChatAudioPreview = ({
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

  useEffect(() => {
    if (audioUrl) {
      SoundPlayer.prepareMediaPlayer(audioUrl, (s: string) => {
        try {
          setDuration(JSON.parse(s).duration);
        } catch (e) {
          console.log("prepareMediaPlayer parse error", e);
        }
      });
    }

    // release player on unmount (all platforms) — keeps behaviour consistent with AudioBubble
    return () => {
      SoundPlayer.releaseMediaPlayer();
    };
  }, [audioUrl]);

  useEffect(() => {
    listener = eventEmitter.addListener("soundPlayStatus", (event) => {
      const data = event as { url?: string };
      if (audioUrl === data.url) {
        // playback ended for this url — reset to idle, clear interval and reset time
        setStatus("");
        clearInterval(interval);
        setCurrentTime(0);
      }
    });

    return () => {
      listener?.remove();
      clearInterval(interval);
    };
  }, [audioUrl]);

  const playPauseAudio = () => {
    if (onPress) {
      onPress(audioUrl);
      return;
    }

    if (status === "playing") {
      SoundPlayer.pause((s: string) => {
        try {
          const json = JSON.parse(s);
          if (json["success"] === true) {
            setStatus("paused");
            clearInterval(interval);
          }
        } catch (ex) {
          console.log(ex);
        }
      });
      return;
    }
    if (status === "paused") {
      SoundPlayer.resume();
      if (Platform.OS == "ios") {
        setStatus("playing");
      }
      // Get total duration/position when resume
      SoundPlayer.getPosition((info: string) => {
        if (info) {
          if (Platform.OS == "android") {
            setStatus("playing");
          }
          setCurrentTime(JSON.parse(info).position);
        }
      });

      // Start tracking the current time
      interval = setInterval(() => {
        SoundPlayer.getPosition((info: string) => {
          if (info) {
            setCurrentTime(JSON.parse(info).position);
          }
        });
      }, 500);
      return;
    }
    if (audioUrl) {
      setStatus("loading");
      SoundPlayer.play(audioUrl, (s: string) => {
        try {
          const json = JSON.parse(s);
          if (json["success"] == true) {
            setStatus("playing");
            // Get total duration when audio starts playing
            SoundPlayer.getPosition((info: string) => {
              if (info) {
                setCurrentTime(JSON.parse(info).position);
              }
            });

            // Start tracking the current time
            interval = setInterval(() => {
              SoundPlayer.getPosition((info: string) => {
                try {
                  if (info) {
                    setCurrentTime(JSON.parse(info).position);
                  }
                } catch (e) {}
              });
            }, 500);
          }
        } catch (ex) {
          console.log(ex);
        }
      });
    }
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
      <Text style={playProgressTextStyle}>
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

      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", width: "100%" }}>
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
