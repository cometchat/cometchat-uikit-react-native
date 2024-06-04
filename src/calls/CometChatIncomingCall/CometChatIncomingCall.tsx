import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AvatarStyleInterface, CometChatContext, CometChatListItem, CometChatSoundManager, ListItemStyleInterface, localize } from '../../shared';
import { IncomingCallStyle, IncomingCallStyleInterface } from './IncomingCallStyle';
import { Style } from './styles';
import { CallTypeConstants, MessageCategoryConstants } from '../../shared/constants/UIKitConstants';
import { CometChatCard } from '../../shared/views/CometChatCard';
import { AcceptCall, DeclineIcon } from './resources';
import { CometChatButton } from '../../shared/views/CometChatButton';
import { CometChatOngoingCall, OngoingCallStyleInterface } from '../CometChatOngoingCall';
import { CometChatUIEventHandler } from '../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { CallUIEvents } from '../CallEvents';
import { CallingPackage } from '../CallingPackage';

const listnerID = "CALL_LISTENER_" + new Date().getTime();

const CometChatCalls = CallingPackage.CometChatCalls;
export interface CometChatIncomingCallInterface {
  call: CometChat.Call | CometChat.CustomMessage,
  title?: string,
  SubtitleView?: (call: CometChat.Call | CometChat.CustomMessage) => JSX.Element,
  disableSoundForCalls?: boolean,
  customSoundForCalls?: string,
  onAccept?: (message: CometChat.BaseMessage) => void,
  onDecline: (message: CometChat.BaseMessage) => void,
  onError?: (e: CometChat.CometChatException) => void,
  acceptButtonText?: string,
  declineButtonText?: string,
  avatarStyle?: AvatarStyleInterface,
  incomingCallStyle?: IncomingCallStyleInterface,
  ongoingCallScreenStyle?: OngoingCallStyleInterface
}

export const CometChatIncomingCall = (props: CometChatIncomingCallInterface) => {

  const {
    onAccept,
    onDecline,
    title,
    customSoundForCalls,
    disableSoundForCalls,
    SubtitleView,
    acceptButtonText,
    avatarStyle,
    call,
    declineButtonText,
    incomingCallStyle,
    ongoingCallScreenStyle,
    onError,
  } = props;

  const { theme } = useContext(CometChatContext);

  const [showCallScreen, setShowCallScreen] = useState(false);
  const acceptedCall = useRef(null);
  const callListener = useRef(null);
  const callSettings = useRef(null);

  const {
    titleColor,
    titleFont,
    acceptButtonBackgroundColor,
    acceptButtonBorder,
    acceptButtonTextColor,
    acceptButtontextFont,
    backgroundColor,
    border,
    borderRadius,
    declineButtonBackgroundColor,
    declineButtonBorder,
    declineButtonTextColor,
    declineButtonTextFont,
    height,
    subtitleColor,
    subtitleFont,
    width,
  } = new IncomingCallStyle({
    titleColor: theme.palette.getSecondary(),
    titleFont: theme.typography.body,

    acceptButtonBackgroundColor: theme.palette.getPrimary(),
    acceptButtontextFont: theme.typography.text2,
    acceptButtonTextColor: theme.palette.getAccent(),

    declineButtonBackgroundColor: theme.palette.getError(),
    declineButtonTextColor: theme.palette.getAccent(),
    declineButtonTextFont: theme.typography.text2,

    subtitleColor: theme.palette.getAccent(),
    subtitleFont: theme.typography.text2,

    ...incomingCallStyle
  });

  const endCall = () => {
    CometChat.rejectCall(call["sessionId"], CometChat.CALL_STATUS.REJECTED).then(
      call => {
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallRejected, { call });
        onDecline && onDecline(call);
        CometChatSoundManager.pause();
      },
      err => {
        onError && onError(err);
      }
    )
  }

  const acceptCall = () => {
    CometChatSoundManager.pause();
    if (onAccept) {
      onAccept(call);
      return;
    }
    CometChat.acceptCall(call['sessionId']).then(
      call => {
        acceptedCall.current = call;
        setShowCallScreen(true);
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallAccepted, { call });
      },
      err => {
        onError && onError(err);
      }
    )
  }

  function  checkIfDefualtCall( call : CometChat.BaseMessage): Boolean{
    return call.getCategory()== MessageCategoryConstants.call

  }

  useEffect(() => {
    if (call) {
      if (!disableSoundForCalls) {
        if (customSoundForCalls)
          CometChatSoundManager.play(
            "incomingCall",
            customSoundForCalls
          )
        else
          CometChatSoundManager.play("incomingCall")
      }
    }

    
     CometChatUIEventHandler.addCallListener(listnerID,
    {
      ccCallEnded: () => {
        setShowCallScreen(false);
        acceptedCall.current = null;
        
      }
    })

    CometChat.addCallListener(
      listnerID,
      new CometChat.CallListener({
        onIncomingCallCancelled: (call) => {
          CometChatSoundManager.pause();
        }
      })
    );

    callListener.current = new CometChatCalls.OngoingCallListener({
      onCallEnded: () => {
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded,{});
        setShowCallScreen(false);
        acceptedCall.current = null;
      },
      onCallEndButtonPressed: () => {
        if(checkIfDefualtCall(call)){
          CometChat.endCall( (call as CometChat.Call).getSessionId())
            .then(endedCall => {
              CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded,{call: endedCall});
            });
        }
    },
      onUserJoined: user => {
        console.log("user joined:", user);
    },
    onUserLeft: user => {
      if(checkIfDefualtCall(call)) {
        CometChat.endCall( (call as CometChat.Call).getSessionId()).then(( endedCall2 ) => {
          //let endedCall = (call as CometChat.Call).setStatus("ended");
          CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded, {call: endedCall2})
        })
        .catch(err => {
          console.log("Error", err);
        });
      }
    },
    onError: (error) => {
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallFailled, { error });
        onError && onError(error);
      }
    });

    callSettings.current = new CometChatCalls.CallSettingsBuilder()
      .enableDefaultLayout(true)
      .setCallEventListener(callListener.current)
      .setIsAudioOnlyCall(call['type'] == 'audio')

    return () => {
      CometChatUIEventHandler.removeCallListener(listnerID);
      CometChat.removeCallListener(listnerID);
    }
  }, []);

  return (
    <>
      {
        showCallScreen ?
          <CometChatOngoingCall
            sessionID={acceptedCall.current?.['sessionId']}
            onError={onError}
            ongoingCallStyle={ongoingCallScreenStyle}
            callSettingsBuilder={callSettings.current}
          /> :
          <CometChatCard
            id={call['sessionId']}
            title={title || call['sender']['name']}
            avatarName={call['sender']['name']}
            avatarUrl={call['sender']['avatar']}
            avatarStyle={avatarStyle}
            SubtitleView={() => (SubtitleView && SubtitleView(call)) || <Text style={{ color: subtitleColor, ...subtitleFont }}>{
              call?.['type'] == CallTypeConstants.audio ?
                localize("INCOMING_AUDIO_CALL") :
                localize("INCOMING_VIDEO_CALL")}</Text>
            }
            style={{
              height,
              width,
              border,
              borderRadius,
              titleColor,
              titleFont,
              backgroundColor,
            }}
            BottomView={() => {
              return <View style={{ justifyContent: "space-around", flexDirection: "row", width: "100%", paddingBottom: 32 }}>
                <CometChatButton
                  iconUrl={DeclineIcon}
                  onPress={() => endCall()}
                  text={declineButtonText || localize("DECLINE")}
                  style={{
                    ...Style.buttonStyle,
                    border: declineButtonBorder,
                    iconBackgroundColor: declineButtonBackgroundColor || theme.palette.getError(),
                    iconTint: theme.palette.getSecondary(),
                    textColor: declineButtonTextColor || theme.palette.getAccent(),
                    textFont: declineButtonTextFont
                  }}
                />
                <CometChatButton
                  iconUrl={AcceptCall}
                  text={acceptButtonText || localize("ACCEPT")}
                  onPress={() => acceptCall()}
                  style={{
                    ...Style.buttonStyle,
                    border: acceptButtonBorder,
                    iconBackgroundColor: theme.palette.getPrimary(),
                    iconTint: theme.palette.getSecondary(),
                    textColor: acceptButtonTextColor || theme.palette.getAccent(),
                    textFont: acceptButtontextFont
                  }}
                />
              </View>
            }}
          />
      }
    </>
  )
};