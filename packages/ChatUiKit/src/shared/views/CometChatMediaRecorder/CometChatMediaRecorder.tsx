import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../theme";
import { Icon } from "../../icons/Icon";
import { AnimatingMic } from "./AnimatingMic";
import { Timer } from "./Timer";
import { CometChatAudioPreview } from "./CometChatAudioPreview/CometChatAudioPreview";
import { CometChatTheme } from "../../../theme/type";
import { deepMerge } from "../../helper/helperFunctions";
import { useCometChatTranslation } from "../../resources/CometChatLocalizeNew";

export interface CometChatMediaRecorderInterface {
  onClose?: Function;
  onPlay?: Function;
  onPause?: Function;
  onStop?: Function;
  onSend?: Function;
  onStart?: Function;
  style?: CometChatTheme["mediaRecorderStyle"];
}

type RecordingState = "initial" | "recording" | "paused" | "stopped" | "loading";

export const CometChatMediaRecorder = (props: CometChatMediaRecorderInterface) => {
  const { onClose, onPause, onPlay, onSend, onStop, onStart, style } = props;
  const [time, setTime] = React.useState(0);
  const [recordedFile, setRecordedFile] = React.useState("");
  const [recordingState, setRecordedState] = React.useState<RecordingState>("initial");
  const recordingTimeRef = useRef({
    recordingStartedAt: 0,
    recordingTotalDuration: 0,
  });

  const theme = useTheme();
  const {t}=useCometChatTranslation()
  const mergedStyle = useMemo(() => {
    return deepMerge(theme.mediaRecorderStyle, style ?? {});
  }, [theme, style]);

  const _audioBubbleStyle = theme.messageListStyles.outgoingMessageBubbleStyles?.audioBubbleStyles;

  useEffect(() => {
    setRecordedState("loading"); // Set loading state before recording starts
    recordingInitiator(); // Automatically start recording
  }, []);

  useEffect(() => {
    return () => {
      if (Platform.OS === "android") {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO).then((res) => {
          if (!res) return;
          deleteFile();
        });
      } else {
        deleteFile();
      }
    };
  }, []);

  function deleteFile() {
    NativeModules.FileManager.deleteFile((success: any) => console.log("Filepath delete", success));
    NativeModules.FileManager.releaseMediaResources((result: any) => {});
    setRecordedFile("");
    // Stop playing audio here
  }

  function permissionAlert() {
    Alert.alert('', t("MICROPHONE_PERMISSION"), [
      {
        style: "cancel",
        text: t("CANCEL"),
      },
      {
        style: "default",
        text: t("SETTINGS"),
        onPress: () => {
          Linking.openSettings();
        },
      },
    ]);
  }

  const recordingInitiator = async (): Promise<void> => {
    let microphonePermission = Platform.select({
      ios: true,
      android: await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO),
    })!;

    if (microphonePermission) {
      NativeModules.FileManager.startRecording((filepath: any) => {
        recordingTimeRef.current.recordingStartedAt = Date.now();
        recordingTimeRef.current.recordingTotalDuration = 0;
        setRecordedState("recording");
        if (Platform.OS === "ios") {
          try {
            let resObj = JSON.parse(filepath);
            if (resObj?.granted === false) {
              permissionAlert();
              onClose && onClose();
            }
          } catch (error) {
            permissionAlert();
            onClose && onClose();
          }
        }
      });
    } else {
      permissionAlert();
      onClose && onClose();
    }
  };

  const _onStop = () => {
    NativeModules.FileManager.releaseMediaResources((result: any) => {
      setRecordedState("stopped");
      recordingTimeRef.current.recordingTotalDuration +=
        Date.now() - recordingTimeRef.current.recordingStartedAt;
      if (Platform.OS === "ios") {
        recordingTimeRef.current.recordingTotalDuration = JSON.parse(result).duration * 1000;
      }
      setRecordedFile(JSON.parse(result)?.file);
      onStop && onStop(JSON.parse(result)?.file);
    });
  };

  const startRecording = () => {
    // TODO: Set time to 0
    setRecordedState("loading");
    setRecordedFile("");
    NativeModules.FileManager.deleteFile((success: any) => {
      NativeModules.FileManager.startRecording((result: any) => {
        setRecordedState("recording");
      });
    });
    onStart && onStart();
  };

  // const _onPause = () => {
  //   NativeModules.FileManager.pausePlaying((filepath) => {
  //     console.log("Filepath onRecorderAudioPaused", filepath);
  //     onPause && onPause();
  //     setRecordedPlaying(false);
  //     // clearTimeout(stopRecordingIntervalId);
  //     console.log("timeout cleared", stopRecordingIntervalId);
  //   });
  // };

  // const _onClose = () => {
  //   _onPause();
  //   setRecordedFile("");
  //   setRecordedPlaying(false);
  //   NativeModules.FileManager.releaseMediaResources((filepath) => {
  //     console.log("Filepath onClose", filepath);
  //   });
  //   onClose && onClose();
  // };

  const _onDelete = () => {
    // Stop playing
    setRecordedFile("");
    setRecordedState("initial");
    NativeModules.FileManager.releaseMediaResources((filepath: any) => {
      //console.log("Filepath onClose", filepath);
    });
    onClose && onClose();
  };

  const _onSend = () => {
    NativeModules.FileManager.releaseMediaResources((result: any) => {
      //console.log("Filepath _stopRecorderAudio", result);
    });
    onSend && onSend(recordedFile);
    onClose && onClose();
  };

  const pressableIconStyle = useMemo(() => {
    return {
      padding: 8,
      backgroundColor: theme.color.background1,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,

      elevation: 4,
    };
  }, [theme]);

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.padding.p5,
        backgroundColor: theme.color.background1,
      }}
    >
      {recordingState !== "stopped" && (
        <AnimatingMic
          isAnimating={recordingState === "recording"}
          style={mergedStyle?.animationStyle}
        />
      )}
      {(recordingState === "recording" || recordingState === "paused") && (
        <Timer
          startTime={
            recordingTimeRef.current && recordingTimeRef.current.recordingStartedAt
              ? recordingTimeRef.current.recordingStartedAt
              : Date.now()
          }
          paused={["paused"].includes(recordingState)}
        />
      )}
      {recordingState === "stopped" && (
        <View
          style={{
            backgroundColor: theme.color.primary,
            padding: theme.spacing.padding.p2,
            borderRadius: theme.spacing.radius.r4,
            width: "100%",
            marginBottom: theme.spacing.padding.p5,
          }}
        >
          <CometChatAudioPreview
            audioUrl={recordedFile}
            playViewContainerStyle={{
              width: "100%",
              height: 32,
              gap: theme.spacing.padding.p3,
              flexDirection: "row",
            }}
            playIconStyle={_audioBubbleStyle?.playIconStyle}
            playIconContainerStyle={_audioBubbleStyle?.playIconContainerStyle}
            waveStyle={_audioBubbleStyle?.waveStyle}
            waveContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              height: 30,
              overflow: "hidden",
              width: "100%",
              flex: 1,
              marginRight: theme.spacing.margin.m2,
            }}
            playProgressTextStyle={_audioBubbleStyle?.playProgressTextStyle}
          />
        </View>
      )}
      <View
        style={{
          paddingVertical: 20,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        {["paused", "stopped", "recording"].includes(recordingState) && (
          <TouchableOpacity onPress={_onDelete}>
            <Icon
              name='delete-fill'
              height={theme.spacing.spacing.s6}
              width={theme.spacing.spacing.s6}
              color={
                mergedStyle?.deleteIconStyle?.iconStyle?.tintColor ?? theme.color.iconSecondary
              }
              icon={mergedStyle?.deleteIconStyle?.icon}
              containerStyle={mergedStyle?.deleteIconStyle?.containerStyle}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          disabled={recordingState === "loading"}
          onPress={() => {
            if (recordingState === "initial") {
              setRecordedState("loading");
              recordingInitiator();
            } else if (recordingState === "recording") {
              NativeModules.FileManager.pauseRecording().then((result: any) => {
                setRecordedState("paused");
                recordingTimeRef.current.recordingTotalDuration +=
                  Date.now() - recordingTimeRef.current.recordingStartedAt;

              });
              // _onStop();
            } else if (recordingState === "paused") {
              NativeModules.FileManager.resumeRecording().then((result: any) => {
                setRecordedState("recording");
              });
            } else if (recordingState === "stopped") {
              _onSend();
            }
          }}
        >
          {recordingState === "loading" ? (
            <ActivityIndicator size='small' color={theme.color.primary} />
          ) : (
            <Icon
              name={
                recordingState === "initial" || recordingState === "paused"
                  ? "mic-fill"
                  : recordingState === "stopped"
                  ? "send-fill"
                  : "pause-fill"
              }
              height={theme.spacing.spacing.s8}
              width={theme.spacing.spacing.s8}
              color={
                recordingState === "initial" || recordingState === "paused"
                  ? mergedStyle?.recordIconStyle?.iconStyle?.tintColor
                  : recordingState === "stopped"
                  ? mergedStyle?.sendIconStyle?.iconStyle?.tintColor ?? theme.color.primary
                  : mergedStyle?.pauseIconStyle?.iconStyle?.tintColor ?? theme.color.error
              }
              icon={
                recordingState === "initial" || recordingState === "paused"
                  ? mergedStyle?.recordIconStyle?.icon
                  : recordingState === "stopped"
                  ? mergedStyle?.sendIconStyle?.icon
                  : mergedStyle?.pauseIconStyle?.icon
              }
              containerStyle={
                recordingState === "initial" || recordingState === "paused"
                  ? mergedStyle?.recordIconStyle?.containerStyle
                  : recordingState === "stopped"
                  ? mergedStyle?.sendIconStyle?.containerStyle
                  : mergedStyle?.pauseIconStyle?.containerStyle
              }
              imageStyle={
                recordingState === "initial" || recordingState === "paused"
                  ? mergedStyle?.recordIconStyle?.iconStyle
                  : recordingState === "stopped"
                  ? mergedStyle?.sendIconStyle?.iconStyle
                  : mergedStyle?.pauseIconStyle?.iconStyle
              }
            />
          )}
        </TouchableOpacity>
        {(recordingState === "recording" || recordingState === "paused") && (
          <TouchableOpacity
            onPress={() => {
              setRecordedState("loading");
              _onStop();
            }}
          >
            <Icon
              name='stop-fill'
              height={theme.spacing.spacing.s6}
              width={theme.spacing.spacing.s6}
              color={mergedStyle?.stopIconStyle?.iconStyle?.tintColor ?? theme.color.iconSecondary}
              icon={mergedStyle?.stopIconStyle?.icon}
              containerStyle={mergedStyle?.stopIconStyle?.containerStyle}
              imageStyle={mergedStyle?.stopIconStyle?.iconStyle}
            />
          </TouchableOpacity>
        )}
        {recordingState === "stopped" && (
          <TouchableOpacity
            onPress={() => {
              startRecording();
            }}
          >
            <Icon
              name='mic-fill'
              height={theme.spacing.spacing.s6}
              width={theme.spacing.spacing.s6}
              color={mergedStyle?.recordIconStyle?.iconStyle?.tintColor ?? theme.color.iconSecondary}
              icon={mergedStyle?.recordIconStyle?.icon}
              containerStyle={mergedStyle?.recordIconStyle?.containerStyle}
              imageStyle={mergedStyle?.recordIconStyle?.iconStyle}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
