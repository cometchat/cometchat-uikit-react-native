let __listenerIdCounter = 0;
import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { CometChatAvatar, CometChatSoundManager } from "../../shared";
import {
  CallTypeConstants,
  MessageCategoryConstants,
  MessageTypeConstants,
} from "../../shared/constants/UIKitConstants";
import { CometChatUIEventHandler } from "../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { CallUIEvents } from "../CallEvents";
import { CallingPackage } from "../CallingPackage";
import { CometChatOngoingCall } from "../CometChatOngoingCall";
import { Icon } from "../../shared/icons/Icon";
import { useTheme } from "../../theme";
import { IncomingCallStyle } from "./style";
import { deepMerge } from "../../shared/helper/helperFunctions";
import { DeepPartial } from "../../shared/helper/types";
import { JSX } from "react";
import { useCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew";
import { SafeAreaView } from "react-native-safe-area-context";

const listnerID = "CALL_LISTENER_" + Date.now() + "_" + (++__listenerIdCounter);
const CometChatCalls = CallingPackage.CometChatCalls;

/**
 * Props for the CometChatIncomingCall component.
 *
 * @interface CometChatIncomingCallInterface
 */
export interface CometChatIncomingCallInterface {
  /** The incoming call object, which can be a Call or a CustomMessage */
  call: CometChat.Call | CometChat.CustomMessage | any;
  /** Custom view for the entire call item */
  ItemView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element;
  /** Custom view for the title section of the call item */
  TitleView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element;
  /** Custom view for the subtitle section of the call item */
  SubtitleView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element;
  /** Custom view for the leading section of the call item */
  LeadingView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element;
  /** Custom view for the trailing section of the call item */
  TrailingView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element;
  /** Flag to disable sound for incoming calls */
  disableSoundForCalls?: boolean;
  /** Path or identifier for a custom sound to play for incoming calls */
  customSoundForCalls?: string;
  /** Callback fired when the call is accepted */
  onAccept?: (message: CometChat.BaseMessage) => void;
  /** Callback fired when the call is declined */
  onDecline: (message: CometChat.BaseMessage) => void;
  /** Callback fired when an error occurs */
  onError?: (e: CometChat.CometChatException) => void;
  /** Optional custom call settings builder */
  callSettingsBuilder?: typeof CometChatCalls.CallSettingsBuilder;
  /** Custom style overrides for the incoming call component */
  style?: DeepPartial<IncomingCallStyle>;
}

/**
 * CometChatIncomingCall component.
 *
 * This component handles incoming calls by playing a sound, offering accept/decline buttons,
 * and showing an ongoing call screen if accepted. Custom views for various parts of the call UI
 * can be provided via props.
 *
 * @param {CometChatIncomingCallInterface} props - Component configuration props.
 * @returns {JSX.Element} The rendered incoming call UI.
 */
export const CometChatIncomingCall = (props: CometChatIncomingCallInterface): JSX.Element => {
  const {
    onAccept,
    onDecline,
    customSoundForCalls,
    disableSoundForCalls,
    ItemView,
    TitleView,
    SubtitleView,
    LeadingView,
    TrailingView,
    call,
    onError,
    callSettingsBuilder,
    style,
  } = props;

  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const [showCallScreen, setShowCallScreen] = useState(false);
  const acceptedCall = useRef<CometChat.Call>(undefined);

  /** Reference to the call listener */
  const callListener = useRef<any>(undefined);
  /** Reference to the call settings builder instance */
  const callSettings = useRef<any>(undefined);

  // Merge the default and custom styles for incoming calls.
  const incomingCallStyle = useMemo(() => {
    return deepMerge(theme.incomingCallStyle, style ?? {});
  }, [theme.incomingCallStyle, style]);

  /**
   * Ends the call by rejecting it and emitting a call rejected event.
   */
  const endCall = () => {
    CometChat.rejectCall(call["sessionId"], CometChat.CALL_STATUS.REJECTED).then(
      (rejectedCall) => {
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallRejected, {
          call: rejectedCall,
        });
        // Notify parent so it can unmount this component.
        onDecline && onDecline(rejectedCall);
        CometChatSoundManager.pause();
      },
      (err) => {
        onError && onError(err);
      }
    );
  };

  /**
   * Accepts the incoming call.
   *
   * If a custom onAccept callback is provided, it is used instead of the default behavior.
   */
  const acceptCall = () => {
    CometChatSoundManager.pause();
    if (onAccept) {
      onAccept(call);
      return;
    }
    CometChat.acceptCall(call["sessionId"]).then(
      (accepted) => {
        acceptedCall.current = accepted!;
        setShowCallScreen(true);
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallAccepted, {
          call: accepted,
        });
      },
      (err) => {
        onError && onError(err);
      }
    );
  };

  /**
   * Checks if the provided call is a default CometChat call (not a custom meeting call).
   *
   * @param {CometChat.BaseMessage} ccCall - The call to check.
   * @returns {Boolean} True if it's a default call; otherwise, false.
   */
  function isDefaultCall(ccCall: CometChat.BaseMessage): Boolean {
    return ccCall.getCategory() === MessageCategoryConstants.call;
  }

  // Set up listeners and call settings on component mount.
  useEffect(() => {
    if (call && !disableSoundForCalls && call.getType() !== MessageTypeConstants.meeting) {
      // Play a custom or default incoming call ringtone.
      if (customSoundForCalls) {
        CometChatSoundManager.play("incomingCall", customSoundForCalls);
      } else {
        CometChatSoundManager.play("incomingCall");
      }
    }

    // Add a call listener for call cancellation.
    CometChat.addCallListener(
      listnerID,
      new CometChat.CallListener({
        onIncomingCallCancelled: () => {
          CometChatSoundManager.pause();
        },
      })
    );

    // Create an ongoing call listener for managing call events.
    callListener.current = new CometChatCalls.OngoingCallListener({
      onCallEnded: () => {
        CometChatCalls.endSession();
        CometChat.clearActiveCall();
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded, {});
        setShowCallScreen(false);
        acceptedCall.current = undefined;
      },
      onCallEndButtonPressed: () => {
        if (isDefaultCall(call)) {
          CometChat.endCall(call.getSessionId()).then((endedCall) => {
            CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded, {
              call: endedCall,
            });
          });
        }
      },
      onUserJoined: (user: CometChat.User) => {
        console.log("user joined:", user);
      },
      onUserLeft: (user: CometChat.User) => {
        if (isDefaultCall(call)) {
          CometChat.endCall(call.getSessionId())
            .then((endedCall2) => {
              CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded, {
                call: endedCall2,
              });
            })
            .catch((err) => {
              console.log("Error on userLeft:", err);
            });
        }
      },
      onError: (error: CometChat.CometChatException) => {
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallFailed, { error });
        onError && onError(error);
      },
    });

    // Initialize call settings using the provided builder or default values.
    callSettings.current =
      callSettingsBuilder?.setCallEventListener(callListener.current) ??
      new CometChatCalls.CallSettingsBuilder()
        .enableDefaultLayout(true)
        .setCallEventListener(callListener.current)
        .setIsAudioOnlyCall(call["type"] === "audio");

    // Cleanup listeners and pause any sounds on unmount.
    return () => {
      CometChatUIEventHandler.removeCallListener(listnerID);
      CometChat.removeCallListener(listnerID);
      CometChatSoundManager.pause();
    };
  }, []);

  /**
   * If the call is accepted, render the ongoing call screen.
   */
  if (showCallScreen) {
    return (
      <CometChatOngoingCall
        sessionID={acceptedCall.current?.getSessionId()!}
        onError={onError}
        callSettingsBuilder={callSettings.current}
      />
    );
  }

  /**
   * Render a custom ItemView if provided.
   */
  if (ItemView) {
    return ItemView(call);
  }

  /**
   * Render the default incoming call overlay with header and action buttons.
   */
  return (
    <SafeAreaView style={styles.overlay}>
      <View style={[incomingCallStyle.containerStyle, { width: "100%" }]}>
        {/* Top row: LeadingView, Title/Subtitle, TrailingView */}
        <View style={styles.topRow}>
          {LeadingView && LeadingView(call)}
          <View>
            {TitleView ? (
              TitleView(call)
            ) : (
              <Text style={incomingCallStyle.titleTextStyle}>
                {call["sender"]?.["name"] ?? t("INCOMING_CALL")}
              </Text>
            )}

            {SubtitleView ? (
              SubtitleView(call)
            ) : (
              <View style={styles.rowInline}>
                <Icon
                  name='call-fill'
                  size={16}
                  containerStyle={{ marginTop: 4, marginRight: 4 }}
                />
                <Text style={incomingCallStyle.subtitleTextStyle}>
                  {call?.["type"] === CallTypeConstants.audio
                    ? t("INCOMING_AUDIO_CALL")
                    : t("INCOMING_VIDEO_CALL")}
                </Text>
              </View>
            )}
          </View>

          {TrailingView ? (
            TrailingView(call)
          ) : (
            <CometChatAvatar
              name={call?.["sender"]?.["name"]}
              image={{ uri: call?.["sender"]?.["avatar"] }}
              style={incomingCallStyle.avatarStyle}
            />
          )}
        </View>

        {/* Buttons row */}
        <View style={[styles.bottomRow, { marginTop: 16 }]}>
          <TouchableOpacity onPress={endCall} style={incomingCallStyle.declineCallButtonStyle}>
            <Text style={incomingCallStyle.declineCallTextStyle}>{t("DECLINE")}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={acceptCall} style={incomingCallStyle.acceptCallButtonStyle}>
            <Text style={incomingCallStyle.acceptCallTextStyle}>{t("ACCEPT")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    bottom: 0,
    zIndex: 99999,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowInline: {
    flexDirection: "row",
    alignItems: "center",
  },
});
