import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Modal, Text, SafeAreaView
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatSoundManager, localize } from '../../shared/resources';
import { AvatarStyleInterface } from '../../shared/views';
import { ImageType } from '../../shared/base';
import { CometChatContext } from '../../shared/CometChatContext';
import { CometChatCard } from '../../shared/views/CometChatCard/CometChatCard';
import { ButtonStyleInterface, CometChatButton } from '../../shared/views/CometChatButton';
import { DeclineIcon } from './resources';
import { OutgoingCallStyle, OutgoingCallStyleInterface } from './OutgoingCallStyle';
import { CometChatOngoingCall } from '../CometChatOngoingCall';
import { CometChatUIEventHandler } from '../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { CallTypeConstants, MessageCategoryConstants, MessageTypeConstants } from '../../shared/constants/UIKitConstants';
import { CallingPackage } from '../CallingPackage';
import { CallUIEvents } from '../CallEvents';

const listenerId = "callListener_" + new Date().getTime();

export interface CometChatOutgoingCallInterface {
  /**
   * CometChat.Call object
   */
  call?: CometChat.Call | CometChat.CustomMessage,
  /**
   * text tobe displayed below cancel/reject button
   */
  declineButtonText?: string,
  /**
   * cancel/reject button icon
   */
  declineButtonIcon?: ImageType,
  /**
   * action tobe performed on click of cancel/reject button 
   * it provides CometChat.Call object as argument.
   */
  onDeclineButtonPressed?: (call: CometChat.Call) => void,
  /**
   * style object of OutgoingCallStyleInterface
   */
  outgoingCallStyle?: OutgoingCallStyleInterface,
  /**
   * object of ButtonStyleInterface
   */
  buttonStyle?: ButtonStyleInterface,
  /**
   * object of AvatarStyleInterface
   */
  avatarStyle?: AvatarStyleInterface,
  /**
   * toggle sound for call
   */
  disableSoundForCalls?: boolean,
  /**
   * custom sound for call
   */
  customSoundForCalls?: string,
}



const CometChatCalls = CallingPackage.CometChatCalls;
export const CometChatOutgoingCall = (props: CometChatOutgoingCallInterface) => {

  const {
    avatarStyle,
    buttonStyle,
    call,
    customSoundForCalls,
    declineButtonIcon,
    declineButtonText = localize("DECLINE"),
    disableSoundForCalls,
    onDeclineButtonPressed,
    outgoingCallStyle
  } = props;

  const { theme } = useContext(CometChatContext);

  const [isCallConnected, setCallConnected] = useState(false);

  const ongoingCall = useRef<CometChat.Call | CometChat.CustomMessage>(null);
  const callSessionId = useRef<string>(null);
  const callListener = useRef(null);
  const callSettings = useRef(null);

  const {
    backgroundColor,
    border,
    borderRadius,
    height,
    width,
    subtitleColor,
    subtitleFont,
    titleColor,
    titleFont,
  } = new OutgoingCallStyle({
    backgroundColor: theme.palette.getBackgroundColor(),
    titleColor: theme.palette.getAccent(),
    titleFont: theme.typography.heading,
    subtitleColor: theme.palette.getAccent700(),
    subtitleFont: theme.typography.text2,
    ...outgoingCallStyle,
  });
  
  function  checkIfDefualtCall( call : CometChat.BaseMessage): Boolean{
    return call.getCategory()== MessageCategoryConstants.call

  }

  const endCallIfRequired = () => {
    if (checkIfDefualtCall(call)) {
      CometChat.endCall((call as CometChat.Call).getSessionId())
        .then(() => {
          (call as CometChat.Call).setStatus("ended");
          CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded,{call});
        })
        .catch(err => {
          console.log("Error", err);})
    }
  }
  
  useEffect(() => {
    if (call['status'] == "ongoing" || (call.getCategory() == (CometChat.CATEGORY_CUSTOM as CometChat.MessageCategory) && call.getType() == MessageTypeConstants.meeting) ) {
      ongoingCall.current = call;
      if (call.getType() == MessageTypeConstants.meeting)
        callSessionId.current = (call as CometChat.CustomMessage).getCustomData()['sessionId'];
      if (call.getCategory() == MessageCategoryConstants.call)
        callSessionId.current = call['sessionId'];
      setCallConnected(true);
    }
    if (!disableSoundForCalls)
      CometChatSoundManager.play("outgoingCall", customSoundForCalls);

    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onOutgoingCallAccepted(call) {
          CometChatSoundManager.pause();
          ongoingCall.current = call;
          callSessionId.current = call['sessionId'];
          setCallConnected(true);
        },
        onOutgoingCallRejected: (call) => {
          CometChatSoundManager.pause();
          ongoingCall.current = null;
          callSessionId.current = null;
          setCallConnected(false);
        },
      })
    );

    CometChatUIEventHandler.addCallListener("listener", {
      ccCallEnded: () => {
        setCallConnected(false);
      },
      ccCallFailled: () => {
        setCallConnected(false);
      }
    });


    callListener.current = new CometChatCalls.OngoingCallListener({
      onCallEnded: () => {
        setCallConnected(false);
        call.setStatus("ended");
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded,{call});
       
      },
      onCallEndButtonPressed: () => {
        if(!checkIfDefualtCall(call)){
          setCallConnected(false);
          call.setStatus("ended");
          CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallEnded,{call});
        } else {
          endCallIfRequired();
        }
    },
      onUserJoined: user => {
        console.log("user joined:", user);
    },
    onUserLeft: user => {
      endCallIfRequired();
    },
    onError: (error) => {
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallFailled, { error });
      }
    });

    callSettings.current = new CometChatCalls.CallSettingsBuilder()
      .enableDefaultLayout(true)
      .setCallEventListener(callListener.current)
      .setIsAudioOnlyCall(call['type'] == 'audio')


    return () => {
      if (!disableSoundForCalls)
        CometChatSoundManager.pause();
      CometChat.removeCallListener(listenerId);
    }
  }, []);

  return (
    <Modal
      transparent
      animated
      animationType="fade"
      onRequestClose={() => onDeclineButtonPressed && onDeclineButtonPressed(call as CometChat.Call)}
    >
      <SafeAreaView>
      {
        isCallConnected ?
          <CometChatOngoingCall
            sessionID={callSessionId.current}
            callSettingsBuilder={callSettings.current}
          /> :
          <CometChatCard
            avatarUrl={
              call?.getReceiverType?.() == "user" ?
                call?.getReceiver?.()['avatar'] :
                call?.getReceiver?.()['icon']
            }
            avatarName={call?.getReceiver?.().getName?.()}
            avatarStyle={avatarStyle}
            title={call?.getReceiver?.().getName?.()}
            style={{
              backgroundColor,
              height,
              width,
              border,
              borderRadius,
              titleColor,
              titleFont,
            }}
            SubtitleView={() => {
              return <Text style={{ color: subtitleColor, ...subtitleFont }}>{
                call?.['type'] == CallTypeConstants.audio ?
                  localize("OUTGOING_AUDIO_CALL") :
                  localize("OUTGOING_VIDEO_CALL")}</Text>
            }}
            BottomView={() => {
              return <CometChatButton
                onPress={() => onDeclineButtonPressed && onDeclineButtonPressed(call as CometChat.Call)}
                iconUrl={declineButtonIcon || DeclineIcon}
                text={declineButtonText || localize("CANCEL")}
                style={{
                  iconTint: theme.palette.getSecondary(),
                  iconBackgroundColor: theme.palette.getError(),
                  iconCornerRadius: 25,
                  height: 50,
                  width: 50,
                  textColor: theme.palette.getAccent(),
                  ...buttonStyle
                }}
              />
            }}
          />
      }
      </SafeAreaView>
    </Modal>
  );
}