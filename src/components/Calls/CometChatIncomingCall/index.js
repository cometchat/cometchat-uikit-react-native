import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  Text,
} from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import Sound from 'react-native-sound';

import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import theme from '../../../resources/theme';
import { CometChatAvatar } from '../../Shared';

import { CallAlertManager } from './controller';

import style from './styles';

import audioCallIcon from './resources/incomingaudiocall.png';
import videoCallIcon from './resources/incomingvideocall.png';
import { incomingCallAlert } from '../../../resources/audio';

export default (props) => {
  let callAlertManager = null;
  const ViewTheme = { ...theme, ...props.theme };
  const incomingAlert = new Sound(incomingCallAlert);

  const [incomingCall, setIncomingCall] = useState(null);

  const playIncomingAlert = () => {
    try{
    if (
      Object.prototype.hasOwnProperty.call(props, 'widgetsettings') &&
      props.widgetsettings &&
      Object.prototype.hasOwnProperty.call(props.widgetsettings, 'main') &&
      (Object.prototype.hasOwnProperty.call(
        props.widgetsettings.main,
        'enable_sound_for_calls',
      ) === false ||
        (Object.prototype.hasOwnProperty.call(
          props.widgetsettings.main,
          'enable_sound_for_calls',
        ) &&
          props.widgetsettings.main.enable_sound_for_calls === false))
    ) {
      return false;
    }

    incomingAlert.setCurrentTime(0);
    incomingAlert.setNumberOfLoops(-1);
    incomingAlert.play();
  }catch(error){
    console.log(error)
  }
  };

  const pauseIncomingAlert = () => {
    try {
      if (
        Object.prototype.hasOwnProperty.call(props, 'widgetsettings') &&
        props.widgetsettings &&
        Object.prototype.hasOwnProperty.call(props.widgetsettings, 'main') &&
        (Object.prototype.hasOwnProperty.call(
          props.widgetsettings.main,
          'enable_sound_for_calls',
        ) === false ||
          (Object.prototype.hasOwnProperty.call(
            props.widgetsettings.main,
            'enable_sound_for_calls',
          ) &&
            props.widgetsettings.main.enable_sound_for_calls === false))
      ) {
        return false;
      }

      incomingAlert.pause();
    } catch (error) {
      console.log(error);
    }
  };

  const markMessageAsRead = (message) => {
    try {
      const { receiverType } = message;
      const receiverId =
        receiverType === 'user' ? message.sender.uid : message.receiverId;

      if (Object.prototype.hasOwnProperty.call(message, 'readAt') === false) {
        CometChat.markAsRead(message.id, receiverId, receiverType);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const incomingCallReceived = (call) => {
    try {
      if (
        props.loggedInUser &&
        call.callInitiator.uid === props.loggedInUser.uid
      ) {
        return;
      }

      const activeCall = CometChat.getActiveCall();
      // if there is another call in progress
      if (activeCall) {
        CometChat.rejectCall(call.sessionId, CometChat.CALL_STATUS.BUSY)
          .then((rejectedCall) => {
            // mark as read incoming call message
            markMessageAsRead(call);
            props.actionGenerated('rejectedIncomingCall', call, rejectedCall);
          })
          .catch((error) => {
            props.actionGenerated('callError', error);
          });
      } else if (incomingCall === null) {
        playIncomingAlert();
        setIncomingCall(call);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const incomingCallCancelled = () => {
    try {
      pauseIncomingAlert();
      setIncomingCall(null);
    } catch (error) {
      console.log(error);
    }
  };

  const callScreenUpdated = (key, call) => {
    try {
      switch (key) {
        case enums.INCOMING_CALL_RECEIVED: // occurs at the callee end
          incomingCallReceived(call);
          break;
        case enums.INCOMING_CALL_CANCELLED: // occurs(call dismissed) at the callee end, caller cancels the call
          incomingCallCancelled(call);
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const rejectCall = () => {
    try {
      pauseIncomingAlert();

      CometChatManager.rejectCall(
        incomingCall.sessionId,
        CometChat.CALL_STATUS.REJECTED,
      )
        .then((rejectedCall) => {
          props.actionGenerated(
            'rejectedIncomingCall',
            incomingCall,
            rejectedCall,
          );
          setIncomingCall(null);
        })
        .catch((error) => {
          props.actionGenerated('callError', error);
          setIncomingCall(null);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const acceptCall = () => {
    try {
      pauseIncomingAlert();

      props.actionGenerated('acceptIncomingCall', incomingCall);
      setIncomingCall(null);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    callAlertManager = new CallAlertManager();
    callAlertManager.attachListeners(callScreenUpdated);

    return () => {
      pauseIncomingAlert();
      callAlertManager.removeListeners();
    };
  });

  if (incomingCall) {
    return (
      <Modal transparent animated animationType="fade">
        <SafeAreaView>
          <View
            style={[style.callContainerStyle, { backgroundColor: '#444444' }]}>
            <View style={style.senderDetailsContainer}>
              <View>
                <Text numberOfLines={1} style={style.nameStyle}>
                  {incomingCall.sender.name}
                </Text>
                {incomingCall.type === 'video' ? (
                  <View style={style.callTypeStyle}>
                    <Image source={videoCallIcon} alt="Incoming video call" />
                    <View style={{ marginLeft: 5 }}>
                      <Text numberOfLines={1} style={{ color: '#8A8A8A' }}>
                        Incoming video call
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={style.callTypeStyle}>
                    <Image source={audioCallIcon} alt="Incoming video call" />
                    <View style={{ marginLeft: 5 }}>
                      <Text numberOfLines={1} style={{ color: '#8A8A8A' }}>
                        Incoming audio call
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={style.avatarStyle}>
                <CometChatAvatar
                  cornerRadius={1000}
                  borderWidth={0}
                  textColor="white"
                  image={{ uri: incomingCall.sender.avatar }}
                  name={incomingCall.sender.name}
                />
              </View>
            </View>
            <View style={style.headerButtonStyle}>
              <TouchableOpacity
                style={[
                  style.buttonStyle,
                  { backgroundColor: ViewTheme.backgroundColor.red },
                ]}
                onPress={rejectCall}>
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  Decline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  style.buttonStyle,
                  { backgroundColor: ViewTheme.backgroundColor.blue },
                ]}
                onPress={acceptCall}>
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  Accept
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return null;
};
