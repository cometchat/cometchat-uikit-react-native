let __listenerIdCounter = 0;
import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import {
  MessageCategoryConstants,
  MessageTypeConstants,
} from "../../shared/constants/UIKitConstants";
import { CometChatUIEventHandler } from "../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { CometChatSoundManager } from "../../shared/resources";
import { CometChatAvatar } from "../../shared/views";
import { CallUIEvents } from "../CallEvents";
import { CallingPackage } from "../CallingPackage";
import { CometChatOngoingCall } from "../CometChatOngoingCall";
import { useTheme } from "../../theme";
import { Icon } from "../../shared/icons/Icon";
import { deepMerge } from "../../shared/helper/helperFunctions";
import { OutgoingCallStyle } from "./styles";
import { DeepPartial } from "../../shared/helper/types";
import { useCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew";
import { SafeAreaView } from "react-native-safe-area-context";

const listenerId = "callListener_" + Date.now() + "_" + (++__listenerIdCounter);
const CometChatCalls = CallingPackage.CometChatCalls;

/**
 * Props for the CometChatOutgoingCall component.
 *
 * @interface CometChatOutgoingCallInterface
 */
export interface CometChatOutgoingCallInterface {
  /**
   * The outgoing call object, can be a CometChat.Call or CometChat.CustomMessage.
   */
  call?: CometChat.Call | CometChat.CustomMessage | any;
  /**
   * Action to be performed on click of the cancel/reject button.
   * Provides the CometChat.Call object as argument.
   */
  onEndCallButtonPressed?: (call: CometChat.Call) => void;
  /**
   * Flag to disable sound for the call.
   */
  disableSoundForCalls?: boolean;
  /**
   * Custom sound for the call.
   */
  customSoundForCalls?: string;
  /**
   * Custom call settings builder instance.
   */
  callSettingsBuilder?: typeof CometChatCalls.CallSettingsBuilder;
  /**
   * Custom style overrides for the outgoing call component.
   */
  style?: DeepPartial<OutgoingCallStyle>;
  /**
   * Custom view for the title section.
   */
  TitleView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element;
  /**
   * Custom view for the subtitle section.
   */
  SubtitleView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element;
  /**
   * Custom view for the avatar section.
   */
  AvatarView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element;
  /**
   * Custom view for the end call button.
   */
  EndCallView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element;
  /**
   * Callback fired when an error occurs.
   * @param {CometChat.CometChatException} error - The error object.
   */
  onError?: (error: CometChat.CometChatException) => void;
}

/**
 * CometChatOutgoingCall component.
 *
 * This component handles the UI for an outgoing call by playing sound,
 * rendering call details and providing an end call action. It listens to call events
 * to update the UI based on the call's state.
 *
 * @param {CometChatOutgoingCallInterface} props - Component configuration props.
 * @returns {JSX.Element} The rendered outgoing call UI.
 */
export const CometChatOutgoingCall = (props: CometChatOutgoingCallInterface): JSX.Element => {
  const {
    call,
    customSoundForCalls,
    disableSoundForCalls,
    onEndCallButtonPressed,
    callSettingsBuilder,
    style,
    TitleView,
    SubtitleView,
    AvatarView,
    EndCallView,
    onError,
  } = props;

  // State to track whether the call is connected.
  const [isCallConnected, setCallConnected] = useState(false);

  // Controls visibility of this modal.
  const [isModalVisible, setModalVisible] = useState(true);

  const ongoingCall = useRef<CometChat.Call | CometChat.CustomMessage>(undefined);
  const callSessionId = useRef<string>(undefined);
  const callListener = useRef<any>(null);
  const callSettings = useRef<any>(null);
  const isCallEnded = useRef<null | boolean>(undefined);

  const theme = useTheme();
  const { t } = useCometChatTranslation();

  // Merge default and custom styles for the outgoing call.
  const outgoingCallStyle = useMemo(() => {
    return deepMerge(theme.outgoingCallStyle, style ?? {});
  }, [theme.outgoingCallStyle, style]);

  function checkIfDefaultCall(call: CometChat.BaseMessage): boolean {
    return call.getCategory() === MessageCategoryConstants.call;
  }

  /**
   * Ends the call if required by checking if it is a default call.
   */
  const endCallIfRequired = () => {
    if (call && checkIfDefaultCall(call)) {
      CometChat.endCall((call as CometChat.Call).getSessionId())
        .then(() => {
          (call as CometChat.Call).setStatus("ended");
          if (!isCallEnded.current) {
            CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded, { call });
          }
          isCallEnded.current = true;
        })
        .catch((err) => {
          console.log("Error", err);
          onError && onError(err);
        });
    }
  };

  // Set up listeners, call settings, and sound for the outgoing call.
  useEffect(() => {
    if (
      call &&
      (call["status"] === "ongoing" ||
        (call.getCategory() === (CometChat.CATEGORY_CUSTOM as CometChat.MessageCategory) &&
          call.getType() === MessageTypeConstants.meeting))
    ) {
      ongoingCall.current = call;
      if (call.getType() == MessageTypeConstants.meeting) {
        callSessionId.current = (
          (call as CometChat.CustomMessage).getCustomData() as any
        )?.sessionId;
      }
      if (call.getCategory() === MessageCategoryConstants.call) {
        callSessionId.current = call["sessionId"];
      }
      setCallConnected(true);
    }

    if (!disableSoundForCalls && call?.getType() !== MessageTypeConstants.meeting) {
      if (customSoundForCalls) {
        CometChatSoundManager.play("outgoingCall", customSoundForCalls);
      } else {
        CometChatSoundManager.play("outgoingCall");
      }
    }

    // Add call listener to handle outgoing call acceptance and rejection.
    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onOutgoingCallAccepted: (acceptedCall: any) => {
          CometChatSoundManager.pause();
          ongoingCall.current = acceptedCall;
          callSessionId.current = acceptedCall["sessionId"];
          setCallConnected(true);
        },
        onOutgoingCallRejected: () => {
          CometChatSoundManager.pause();
          ongoingCall.current = undefined;
          callSessionId.current = undefined;
          setCallConnected(false);
        },
      })
    );

    // Listen for call failure events.
    CometChatUIEventHandler.addCallListener(listenerId, {
      ccCallFailed: (error: CometChat.CometChatException) => {
        setCallConnected(false);
        onError && onError(error);
      },
    });

    // Create an ongoing call listener to manage call events.
    callListener.current = new CometChatCalls.OngoingCallListener({
      onCallEnded: () => {
        CometChatCalls.endSession();
        if (checkIfDefaultCall(call)) {
          CometChat.clearActiveCall();
          setCallConnected(false);
          call.setStatus("ended");
          if (!isCallEnded.current) {
            CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded, { call });
          }
          isCallEnded.current = true;
        }
      },
      onCallEndButtonPressed: () => {
        if (!checkIfDefaultCall(call)) {
          setCallConnected(false);
          call.setStatus("ended");
          if (!isCallEnded.current) {
            CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded, { call });
          }
          isCallEnded.current = true;
        } else {
          endCallIfRequired();
        }
      },
      onUserJoined: (user: CometChat.User) => {
        console.log("user joined:", user);
      },
      onUserLeft: (user: CometChat.User) => {
        endCallIfRequired();
      },
      onError: (error: CometChat.CometChatException) => {
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallFailed, { error });
      },
    });

    // Determine call type (audio or meeting) and initialize call settings.
    const callType =
      call?.getType() === MessageTypeConstants.meeting
        ? call["customData"]?.["callType"]
        : call.getType();

    callSettings.current =
      callSettingsBuilder?.setCallEventListener(callListener.current) ??
      new CometChatCalls.CallSettingsBuilder()
        .enableDefaultLayout(true)
        .setCallEventListener(callListener.current)
        .setIsAudioOnlyCall(callType === "audio");

    // Cleanup on unmount.
    return () => {
      if (!disableSoundForCalls) {
        CometChatSoundManager.pause();
      }
      CometChat.removeCallListener(listenerId);
    };
  }, []);

  /**
   * Handles closing the modal (via hardware back button on Android or a custom button).
   * This is where you can call onEndCallButtonPressed or do any other cleanup.
   */
  const handleModalClose = () => {
    if (onEndCallButtonPressed) {
      onEndCallButtonPressed(call as CometChat.Call);
    }
    // Hide the modal – onDismiss fires after the animation completes
    setModalVisible(false);
  };

  const callReceiverName = call?.getReceiver?.().getName?.() ?? "Unknown";

  return (
    <Modal
      transparent
      animationType='fade'
      visible={isModalVisible}
      onRequestClose={handleModalClose}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {isCallConnected ? (
          <CometChatOngoingCall
            sessionID={callSessionId.current!}
            callSettingsBuilder={callSettings.current!}
          />
        ) : (
          <View style={outgoingCallStyle.containerStyle}>
            {TitleView ? (
              TitleView(call)
            ) : (
              <Text style={outgoingCallStyle.titleTextStyle}>{callReceiverName}</Text>
            )}
            {SubtitleView ? (
              SubtitleView(call)
            ) : (
              <Text style={outgoingCallStyle.subtitleTextStyle}>{t("CALLING")}</Text>
            )}
            {AvatarView ? (
              AvatarView(call)
            ) : (
              <CometChatAvatar
                name={callReceiverName}
                image={{
                  uri:
                    call?.getReceiverType?.() === "user"
                      ? (call?.getReceiver?.() as CometChat.User)?.getAvatar()
                      : (call?.getReceiver?.() as CometChat.Group)?.getIcon(),
                }}
                style={outgoingCallStyle.avatarStyle}
              />
            )}
            {EndCallView ? (
              EndCallView(call)
            ) : (
              <TouchableOpacity
                style={outgoingCallStyle.endCallButtonStyle}
                onPress={handleModalClose}
              >
                <Icon
                  name='call-end-fill'
                  size={32}
                  height={outgoingCallStyle.endCallIconStyle.height}
                  width={outgoingCallStyle.endCallIconStyle.width}
                  color={outgoingCallStyle.endCallIconStyle.tintColor}
                  imageStyle={outgoingCallStyle.endCallIconStyle}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};
