import React, { useContext, useEffect, useState, useRef } from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import { CometChat } from '@cometchat/chat-sdk-react-native'
import { CometChatUIEventHandler } from '../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler'
import { CallButtonStyle, CallButtonStyleInterface } from './CallButtonStyle'
import { ImageType } from '../../shared/base'
import { CometChatContext } from "../../shared/CometChatContext";
import { localize } from "../../shared/resources/CometChatLocalize";
import { CallTypeConstants, MessageTypeConstants } from '../../shared/constants/UIKitConstants'
import { AudioIcon, VideoIcon } from './resources'
import { Style } from './style'
import { CallUIEvents } from '../CallEvents'
import { CometChatOutgoingCall } from '../CometChatOutgoingCall'
import { CometChatUIKit } from '../../shared/CometChatUiKit/CometChatUIKit'

const listenerId = "callEventListener_" + new Date().getTime();

export interface CometChatCallButtonsInterface {
    /**
     * CometChat.User object
     */
    user?: CometChat.User,
    /**
     * CometChat.Group object
     */
    group?: CometChat.Group,
    /**
     * Image icon for voice calls
     */
    voiceCallIconImage?: ImageType,
    /**
     * text tobe shown below voice icon
     */
    voiceCallIconText?: string,
    /**
     * video icon for Video calls
     */
    videoCallIconImage?: ImageType,
    /**
     * text tobe shown below video call icon.
     */
    videoCallIconText?: string,
    /**
     * action tobe performed when voice icon get clicked.
     */
    onVoiceCallPress?: (params: { user?: CometChat.User, group?: CometChat.Group }) => void,
    /**
     * action tobe performed when video icon get clicked.
     */
    onVideoCallPress?: (params: { user?: CometChat.User, group?: CometChat.Group }) => void,
    /**
     * should voice call icon be shown
     */
    hideVoiceCall?: boolean,
    /**
     * should video call icon be shown
     */
    hideVideoCall?: boolean,
    /**
     * style object for call buttons
     */
    callButtonStyle?: CallButtonStyleInterface,
    /**
     * callback if any error occured.
     */
    onError?: (e: CometChat.CometChatException) => void,
}

export const CometChatCallButtons = (props: CometChatCallButtonsInterface) => {

    const {
        user,
        group,
        voiceCallIconImage = AudioIcon,
        voiceCallIconText = localize("AUDIO_CALL"),
        videoCallIconImage = VideoIcon,
        videoCallIconText = localize("VIDEO_CALL"),
        onVoiceCallPress,
        onVideoCallPress,
        hideVoiceCall = false,
        hideVideoCall = false,
        callButtonStyle,
        onError,
    } = props;

    const { theme } = useContext(CometChatContext);

    const _callButtonStyle = new CallButtonStyle({
        backgroundColor: theme.palette.getAccent100(),
        videoCallIconTint: theme.palette.getPrimary(),
        voiceCallIconTint: theme.palette.getPrimary(),
        ...callButtonStyle
    });

    const {
        backgroundColor,
        border,
        borderRadius,
        buttonPadding,
        height,
        videoCallIconTint,
        voiceCallIconTint,
        width
    } = _callButtonStyle;

    const [disableButton, setDisableButton] = useState(false);
    const [showOutgoingCallScreen, setShowOutgoingCallScreen] = useState(false);
    const [callReceived, setCallReceived] = useState(false);

    const outGoingCall = useRef<CometChat.Call | CometChat.CustomMessage>(null);
    const incomingCall = useRef<CometChat.Call>(null);
    const loggedInUser = useRef<CometChat.User>();

    /**
     * checks CometChat.getActiveCall() if there is
     * then opens outgoing call screen and returns true
     * else returns false
    */


    const checkActiveCallOnly = () => {
        return false;
        // let activeCall = CometChat.getActiveCall();
        // if (activeCall != null) {
        //    setDisableButton(true);
        //     outGoingCall.current = activeCall;
        //     setShowOutgoingCallScreen(true);
        //     return true;
        // }
        // return false;
    }

    const checkActiveCallAndDoAction = () => {
    
            setDisableButton(true);
           
            return true;
    }

    const makeCall = (type) => {
        if (type == CallTypeConstants.audio || type == CallTypeConstants.video) {
            var receiverID = user ? user.getUid() : group ? group.getGuid() : undefined;
            var callType = type;
            //send custom message with type meeting
            if (group) {
                let customData = {
                    "callType": callType,
                    "sessionId": receiverID
                }
                let customMessage: CometChat.CustomMessage = new CometChat.CustomMessage(
                    receiverID,
                    CometChat.RECEIVER_TYPE.GROUP,
                    MessageTypeConstants.meeting,
                    customData
                );
                customMessage.setCategory(CometChat.CATEGORY_CUSTOM as CometChat.MessageCategory);
                customMessage.setMuid(new Date().getTime().toString());
                customMessage.setSender(loggedInUser.current);
                customMessage.setReceiver(group);
                customMessage.setMetadata({
                    ...customMessage.getMetadata(),
                    "incrementUnreadCount": true,
                    "pushNotification": MessageTypeConstants.meeting,
                })
                customMessage.setCustomData(customData);
                CometChatUIKit.sendCustomMessage(
                    customMessage,
                    (res) => {
                        outGoingCall.current = res as CometChat.CustomMessage
                        setShowOutgoingCallScreen(true);
                        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccOutgoingCall, { call: res });
                    },
                    (rej) => {
                        console.log("custom msg error", rej);
                        onError && onError(rej);
                    }
                );
            } else {
                var receiverType = user ? CometChat.RECEIVER_TYPE.USER : group ? CometChat.RECEIVER_TYPE.GROUP : undefined
                if (!receiverID || !receiverType)
                    return;

                var call = new CometChat.Call(receiverID, callType, receiverType, CometChat.CATEGORY_CALL);

                CometChat.initiateCall(call).then(
                    initiatedCall => {
                        outGoingCall.current = initiatedCall
                        setDisableButton(true)
                        setShowOutgoingCallScreen(true);
                        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccOutgoingCall, { call: outGoingCall.current });
                    },
                    error => {
                        console.log("Call initialization failed with exception:", error);
                        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallFailled, { call });
                        onError && onError(error);
                    }
                );
            }
        } else {
            console.log("Invalid call type.", type, CallTypeConstants.audio, type != CallTypeConstants.audio || type != CallTypeConstants.video);
            return;
        }
    }

    const makeVoiceCall = () => {
        if (disableButton)
            return;
        if (onVoiceCallPress)
            return onVoiceCallPress({ user, group })

        //code to make audio call
        makeCall(CallTypeConstants.audio);

    }

    const makeVideoCall = () => {
        if (disableButton)
            return;
        if (onVideoCallPress)
            return onVideoCallPress({ user, group })

        //code to make video call
        makeCall(CallTypeConstants.video);

    }

    useEffect(() => {
        CometChat.getLoggedinUser()
            .then(user => loggedInUser.current = user)
            .catch(rej => {
                loggedInUser.current = null;
                onError && onError(rej);
            })
        CometChat.addCallListener(
            listenerId,
            new CometChat.CallListener({
                onIncomingCallReceived: (call) => {
                    incomingCall.current = call;
                    setDisableButton(true);
                    setCallReceived(call);
                },
                onOutgoingCallAccepted: (call) => {
                    console.log("call accepted");
                },
                onOutgoingCallRejected: (call) => {
                    setShowOutgoingCallScreen(false);
                    outGoingCall.current = null;
                    setDisableButton(false)
                },
                onIncomingCallCancelled: (call) => {
                    setCallReceived(false);
                    incomingCall.current = null;
                    setDisableButton(false)
                },
            })
        )
        CometChatUIEventHandler.addCallListener(
            listenerId,
            {
                ccCallRejected: (call) => {
                    outGoingCall.current = null;
                    setShowOutgoingCallScreen(false);
                    setDisableButton(false)
                },
                ccCallEnded: () => {
                    outGoingCall.current = null;
                    setShowOutgoingCallScreen(false);
                    setDisableButton(false)
                },
            }
        )

        checkActiveCallOnly();

        return () => {
            CometChat.removeCallListener(listenerId);
            CometChatUIEventHandler.removeCallListener(listenerId);
        }
    }, []);

    return (
        <View style={[Style.row, { height, width }]}>
            {
                !hideVoiceCall && !group &&
                <TouchableOpacity
                    style={[
                        { backgroundColor, borderRadius, ...border, padding: buttonPadding },
                        Style.buttonStyle,
                    ]} onPress={() => makeVoiceCall()}>
                    <Image
                        source={voiceCallIconImage}
                        style={[
                            { height: 24, width: 24 },
                            { tintColor: disableButton ? theme.palette.getAccent700() : voiceCallIconTint }
                        ]}
                    />
                    {
                        voiceCallIconText != "" &&
                        <Text style={{ color: theme.palette.getPrimary() }}>{voiceCallIconText}</Text>
                    }
                </TouchableOpacity>
            }
            {
                !hideVideoCall &&
                <TouchableOpacity
                    style={[
                        { backgroundColor, borderRadius, ...border, padding: buttonPadding },
                        Style.buttonStyle,
                    ]} onPress={() => makeVideoCall()}>
                    <Image
                        source={videoCallIconImage}
                        style={[
                            { height: 24, width: 24 },
                            { tintColor: disableButton ? theme.palette.getAccent700() : videoCallIconTint }
                        ]}
                    />
                    {
                        videoCallIconText != "" &&
                        <Text style={{ color: theme.palette.getPrimary() }}>{videoCallIconText}</Text>
                    }
                </TouchableOpacity>
            }
            {
                showOutgoingCallScreen && <CometChatOutgoingCall
                    call={outGoingCall.current}
                    onDeclineButtonPressed={(call) => {
                        CometChat.rejectCall(call['sessionId'], CometChat.CALL_STATUS.CANCELLED).then(
                            rejectedCall => {
                                CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallRejected, { call: rejectedCall });
                            },
                            err => {
                                onError && onError(err);
                            }
                        );
                    }}
                />
            }
        </View>
    )
}