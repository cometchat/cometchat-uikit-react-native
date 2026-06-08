let __listenerIdCounter = 0;
import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorValue,
  DimensionValue,
  ImageSourcePropType,
  ImageStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { CometChatUIKit } from "../../shared/CometChatUiKit/CometChatUIKit";
import { CallTypeConstants, MessageTypeConstants } from "../../shared/constants/UIKitConstants";
import { CometChatUIEventHandler } from "../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { deepMerge } from "../../shared/helper/helperFunctions";
import { Icon } from "../../shared/icons/Icon";
import { getUnixTimestampInMilliseconds } from "../../shared/utils/CometChatMessageHelper";
import { permissionUtil } from "../../shared/utils/PermissionUtil";
import { useTheme } from "../../theme";
import { useCompTheme } from "../../theme/hook";
import { CallUIEvents } from "../CallEvents";
import { CometChatOutgoingCall, OutgoingCallConfiguration } from "../CometChatOutgoingCall";
import { CallButtonStyle } from "./style";
import { DeepPartial } from "../../shared/helper/types";
import { CallingPackage } from "../CallingPackage";
import { JSX } from "react";

const CometChatCalls = CallingPackage.CometChatCalls;

const listenerId = "callEventListener_" + Date.now() + "_" + (++__listenerIdCounter);

/**
 * Props for the CometChatCallButtons component.
 *
 * @interface CometChatCallButtonsInterface
 */
export interface CometChatCallButtonsInterface {
  /**
   * CometChat.User object.
   */
  user?: CometChat.User;
  /**
   * CometChat.Group object.
   */
  group?: CometChat.Group;
  /**
   * Should the voice call icon be shown.
   */
  hideVoiceCallButton?: boolean;
  /**
   * Should the video call icon be shown.
   */
  hideVideoCallButton?: boolean;
  /**
   * Callback to handle errors.
   *
   * @param {CometChat.CometChatException} e - The exception object.
   */
  onError?: (e: CometChat.CometChatException) => void;
  /**
   * Function to build call settings.
   *
   * @param {CometChat.User} [user] - The user object.
   * @param {CometChat.Group} [group] - The group object.
   * @param {boolean} [isAudioOnly] - Flag indicating if the call is audio only.
   * @returns {CometChatCalls.CallSettingsBuilder} The call settings builder.
   */
  callSettingsBuilder?: (
    user?: CometChat.User,
    group?: CometChat.Group,
    isAudioOnly?: boolean
  ) => typeof CometChatCalls.CallSettingsBuilder;
  /**
   * Configuration for outgoing calls.
   */
  outgoingCallConfiguration?: OutgoingCallConfiguration;
  /**
   * Custom style overrides for the call button.
   */
  style?: DeepPartial<CallButtonStyle>;
}

/**
 * CometChatCallButtons component.
 *
 * This component renders call action buttons (voice and video) and handles call initiation,
 * outgoing call screen, and call events.
 *
 * @param {CometChatCallButtonsInterface} props - Component properties.
 * @returns {JSX.Element} The rendered component.
 */
export const CometChatCallButtons = (props: CometChatCallButtonsInterface): JSX.Element => {
  const {
    user,
    group,
    hideVoiceCallButton = false,
    hideVideoCallButton = false,
    onError,
    callSettingsBuilder,
    outgoingCallConfiguration,
    style = {},
  } = props;

  const theme = useTheme();
  const compTheme = useCompTheme();

  // Merge default and custom styles for call buttons
  const callButtonStyles = useMemo(() => {
    return deepMerge(theme.callButtonStyles, compTheme.callButtonStyles ?? {}, style);
  }, [theme, compTheme, style]);

  const [disableButton, setDisableButton] = useState(false);
  const [showOutgoingCallScreen, setShowOutgoingCallScreen] = useState(false);
  const [callReceived, setCallReceived] = useState<CometChat.Call>();

  const outGoingCall = useRef<CometChat.Call | CometChat.CustomMessage>(undefined);
  const callType = useRef<typeof CometChat.CALL_TYPE.AUDIO | typeof CometChat.CALL_TYPE.VIDEO>(undefined);
  const incomingCall = useRef<CometChat.Call>(undefined);
  const loggedInUser = useRef<CometChat.User>(undefined);

  /**
   * Checks if there is an active call.
   * If found, opens the outgoing call screen and returns true.
   * Otherwise, returns false.
   *
   * @returns {boolean} Whether an active call exists.
   */

  const checkActiveCallOnly = () => {
    return false;
  };

  /**
   * Initiates a call based on the provided call type.
   *
   * @param {any} type - The type of call (audio or video).
   */
  const makeCall = (type: any): void => {
    if (type == CallTypeConstants.audio || type == CallTypeConstants.video) {
      var receiverID = user ? user.getUid() : group ? group.getGuid() : undefined;
      var callType = type;
      // For group calls, send a custom meeting message.
      if (group) {
        let customData = {
          callType: callType,
          sessionId: receiverID,
        };
        let customMessage: CometChat.CustomMessage = new CometChat.CustomMessage(
          receiverID,
          CometChat.RECEIVER_TYPE.GROUP,
          MessageTypeConstants.meeting,
          customData
        );
        customMessage.setCategory(CometChat.CATEGORY_CUSTOM as CometChat.MessageCategory);
        customMessage.setMuid(String(getUnixTimestampInMilliseconds()));
        customMessage.setSender(loggedInUser.current);
        customMessage.setReceiver(group);
        customMessage.setMetadata({
          ...customMessage.getMetadata(),
          incrementUnreadCount: true,
          pushNotification: MessageTypeConstants.meeting,
        });
        customMessage.shouldUpdateConversation(true);
        customMessage.setMetadata({ incrementUnreadCount: true });
        customMessage.setCustomData(customData);
        CometChatUIKit.sendCustomMessage(customMessage)
          .then((res) => {
            outGoingCall.current = res as CometChat.CustomMessage;
            setShowOutgoingCallScreen(true);
            CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccOutgoingCall, { call: res });
          })
          .catch((rej) => {
            console.log("custom msg error", rej);
            onError && onError(rej);
          });
      } else {
        var receiverType = user
          ? CometChat.RECEIVER_TYPE.USER
          : group
          ? CometChat.RECEIVER_TYPE.GROUP
          : undefined;
        if (!receiverID || !receiverType) return;

        var call = new CometChat.Call(receiverID, callType, receiverType, CometChat.CATEGORY_CALL);

        CometChat.initiateCall(call).then(
          (initiatedCall) => {
            outGoingCall.current = initiatedCall;
            setDisableButton(true);
            setShowOutgoingCallScreen(true);
            CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccOutgoingCall, {
              call: outGoingCall.current,
            });
          },
          (error) => {
            console.log("Call initialization failed with exception:", error);
            CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallFailed, { call });
            onError && onError(error);
          }
        );
      }
    } else {
      console.log(
        "Invalid call type.",
        type,
        CallTypeConstants.audio,
        type != CallTypeConstants.audio || type != CallTypeConstants.video
      );
      return;
    }
  };

  /**
   * Initiates a voice call.
   *
   * Checks for necessary permissions before making the call.
   */
  const makeVoiceCall = async (): Promise<void> => {
    if (disableButton) return;

    if (!(await permissionUtil.startResourceBasedTask(["mic"]))) {
      return;
    }

    callType.current = CallTypeConstants.audio;
    makeCall(CallTypeConstants.audio);
  };

  /**
   * Initiates a video call.
   *
   * Checks for necessary permissions (mic and camera) before making the call.
   */
  const makeVideoCall = async (): Promise<void> => {
    if (disableButton) return;

    if (!(await permissionUtil.startResourceBasedTask(["mic", "camera"]))) {
      return;
    }

    callType.current = CallTypeConstants.video;
    makeCall(CallTypeConstants.video);
  };

  // Set up event listeners and logged-in user on mount.
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then((user) => (loggedInUser.current = user!))
      .catch((rej: CometChat.CometChatException) => {
        onError && onError(rej);
      });

    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          incomingCall.current = call;
          setDisableButton(true);
          setCallReceived(call);
        },
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          console.log("call accepted");
        },
        onOutgoingCallRejected: (call: CometChat.Call) => {
          setShowOutgoingCallScreen(false);
          outGoingCall.current = undefined;
          setDisableButton(false);
        },
        onIncomingCallCancelled: (call: CometChat.Call) => {
          setCallReceived(undefined);
          incomingCall.current = undefined;
          setDisableButton(false);
        },
      })
    );
    CometChatUIEventHandler.addCallListener(listenerId, {
      ccCallRejected: (call: CometChat.Call) => {
        outGoingCall.current = undefined;
        setShowOutgoingCallScreen(false);
        setDisableButton(false);
      },
      ccCallEnded: () => {
        outGoingCall.current = undefined;
        setShowOutgoingCallScreen(false);
        setDisableButton(false);
      },
    });

    checkActiveCallOnly();

    return () => {
      CometChat.removeCallListener(listenerId);
      CometChatUIEventHandler.removeCallListener(listenerId);
    };
  }, []);

  return (
    <View style={callButtonStyles.containerStyle as ViewStyle}>
      {!hideVoiceCallButton && (
        <TouchableOpacity onPress={() => makeVoiceCall()}>
          <Icon
            name='call'
            height={callButtonStyles?.audioCallButtonIconStyle?.height as DimensionValue}
            width={callButtonStyles?.audioCallButtonIconStyle?.width as DimensionValue}
            color={callButtonStyles?.audioCallButtonIconStyle?.tintColor as ColorValue}
            imageStyle={callButtonStyles?.audioCallButtonIconStyle as ImageStyle}
            icon={callButtonStyles?.audioCallButtonIcon as JSX.Element | ImageSourcePropType}
            containerStyle={callButtonStyles?.audioCallButtonIconContainerStyle as ImageStyle}
          />
        </TouchableOpacity>
      )}
      {!hideVideoCallButton && (
        <TouchableOpacity onPress={() => makeVideoCall()}>
          <Icon
            name='videocam'
            height={callButtonStyles?.videoCallButtonIconStyle?.height as DimensionValue}
            width={callButtonStyles?.videoCallButtonIconStyle?.width as DimensionValue}
            color={callButtonStyles?.videoCallButtonIconStyle?.tintColor as ColorValue}
            imageStyle={callButtonStyles?.videoCallButtonIconStyle as ImageStyle}
            icon={callButtonStyles?.videoCallButtonIcon as JSX.Element | ImageSourcePropType}
            containerStyle={callButtonStyles?.videoCallButtonIconContainerStyle as ImageStyle}
          />
        </TouchableOpacity>
      )}
      {showOutgoingCallScreen && (
        <CometChatOutgoingCall
          call={outGoingCall.current}
          onEndCallButtonPressed={(call) => {
            CometChat.rejectCall(call?.getSessionId(), CometChat.CALL_STATUS.CANCELLED).then(
              (rejectedCall) => {
                CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallRejected, {
                  call: rejectedCall,
                });
              },
              (err) => {
                onError && onError(err);
              }
            );
          }}
          {...(callSettingsBuilder
            ? {
                callSettingsBuilder: callSettingsBuilder(
                  props.user,
                  props.group,
                  callType.current == CallTypeConstants.audio ? true : false
                ),
              }
            : {})}
          {...outgoingCallConfiguration}
        />
      )}
    </View>
  );
};
