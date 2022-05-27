import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  Text,
  Vibration
} from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import Sound from 'react-native-sound';

import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import * as consts from '../../../utils/consts';
import theme from '../../../resources/theme';
import CometChatAvatar from '../../Shared/CometChatAvatar';

import { messageAlertManager } from './controller';

import style from './styles';

import audioCallIcon from './resources/incomingaudiocall.png';
import videoCallIcon from './resources/incomingvideocall.png';
import { incomingCallAlert } from '../../../resources/audio';
import { logger } from '../../../utils/common';
import DropDownAlert from '../../Shared/DropDownAlert';
import { CometChatContext } from '../../../utils/CometChatContext';
let incomingAlert; 

export default (props) => {
  let callAlertManager = null;
  const viewTheme = { ...theme, ...props.theme };
  
  const [isMessagesSoundEnabled, setIsMessagesSoundEnabled] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const context = useContext(CometChatContext);
  
  const checkRestrictions = async () => {
    let isEnabled = await context.FeatureRestriction.isCallsSoundEnabled();
    setIsMessagesSoundEnabled(isEnabled);
   let incomingAlertRef = new Sound(incomingCallAlert, () => {
    incomingAlert = incomingAlertRef;     
    });
  };
  /**
   * Play call alerts
   * @param
   */
  const playIncomingAlert = () => {
    if (!isMessagesSoundEnabled) {
      return false;
    }
    try {
      incomingAlert.setCurrentTime(0);
      incomingAlert.setNumberOfLoops(-1);
      incomingAlert.play(()=>{});
      Vibration.vibrate(consts.PATTERN,true);
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Pause incoming alerts
   * @param
   */
  const pauseIncomingAlert = () => {
    try {
      incomingAlert.pause();
      Vibration.cancel();
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Mark message as read
   * @param message
   */
  const markMessageAsRead = (message) => {
    try {
      const { receiverType } = message;
      const receiverId =
        receiverType === 'user' ? message.sender.uid : message.receiverId;

      if (Object.prototype.hasOwnProperty.call(message, 'readAt') === false) {
        CometChat.markAsRead(message);
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle incoming calls
   * if already an active call -> reject call
   * else play incoming call alert
   * @param call - call object
   */
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
            props.actionGenerated(
              actions.REJECTED_INCOMING_CALL,
              call,
              rejectedCall,
            );
          })
          .catch((error) => {
            props.actionGenerated(actions.CALL_ERROR, error);
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
          });
      } else if (incomingCall === null) {
        playIncomingAlert();
        setIncomingCall(call);   
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handles if incoming call cancelled
   * @param
   */
  const incomingCallCancelled = () => {
    try {
      pauseIncomingAlert();
      setIncomingCall(null);
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Updates the call screen and opens/closes outgoing callAlert , depending on action taken by user
   * @param key - actionType, @param call - callObject
   */
  const callScreenUpdated = (key, call) => {
    try {
      switch (key) {
        case enums.CUSTOM_MESSAGE_RECEIVED: // occurs at the callee end
          incomingCallReceived(call);
          break;
        case enums.INCOMING_CALL_CANCELLED: // occurs(call dismissed) at the callee end, caller cancels the call
          incomingCallCancelled(call);
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Reject calls
   * @param
   */
  const rejectCall = () => {
    try {
      pauseIncomingAlert();
      CometChatManager.rejectCall(
        incomingCall.sessionId,
        CometChat.CALL_STATUS.REJECTED,
      )
        .then((rejectedCall) => {
          props.actionGenerated(
            actions.REJECTED_INCOMING_CALL,
            incomingCall,
            rejectedCall,
          );
          setIncomingCall(null);
        })
        .catch((error) => {
          const errorCode = error?.message || 'ERROR';
          this.dropDownAlertRef?.showMessage('error', errorCode);
          props.actionGenerated(actions.CALL_ERROR, error);
          setIncomingCall(null);
        });
    } catch (error) {
      const errorCode = error?.message || 'ERROR';
      this.dropDownAlertRef?.showMessage('error', errorCode);
      logger(error);
    }
  };

  /**
   * Accept calls
   * @param
   */
  const acceptCall = () => {
    try {
      pauseIncomingAlert();
      props.actionGenerated(actions.ACCEPT_DIRECT_CALL, incomingCall);
      setIncomingCall(null);
    } catch (error) {
      const errorCode = error?.message || 'ERROR';
      this.dropDownAlertRef?.showMessage('error', errorCode);
      logger(error);
    }
  };

  /**
   * Add call listeners on mount and remove listeners on unmount
   * @param
   */
  useEffect(() => {
    
    checkRestrictions();

    callAlertManager = new messageAlertManager();
    callAlertManager.attachListeners(callScreenUpdated);

    return () => {
      pauseIncomingAlert();
      callAlertManager.removeListeners();
    }; 
  },[]);

  if (incomingCall) {
    playIncomingAlert();
    return (
      <>
      <Modal transparent animated animationType="fade">
        <SafeAreaView>
          <View style={[style.callContainerStyle]}>
            <View style={style.senderDetailsContainer}>
              <View>
                <Text numberOfLines={1} style={style.nameStyle}>
                  {incomingCall.sender.name}
                </Text>

                <View style={style.callTypeStyle}>
                  <Image source={videoCallIcon} alt="Incoming video call" />
                  <View style={style.callMessageContainerStyle}>
                    <Text numberOfLines={1} style={style.callMessageTextStyle}>
                      Incoming video call
                    </Text>
                  </View>
                </View>
              </View>
              <View style={style.headerButtonStyle}>
                <TouchableOpacity
                  style={[
                    style.buttonStyle,
                    { backgroundColor: viewTheme.backgroundColor.red,width:'65%',marginLeft:5 },
                  ]}
                  onPress={rejectCall}>
                  <Text style={style.btnTextStyle}>Decline</Text>
                </TouchableOpacity>       
              </View>
            </View>
            <View style={style.headerButtonStyle}>
              <TouchableOpacity
                style={[
                  style.buttonStyle,
                  { backgroundColor: viewTheme.backgroundColor.red },
                ]}
                onPress={rejectCall}>
                <Text style={style.btnTextStyle}>Ignore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  style.buttonStyle,
                  { backgroundColor: viewTheme.backgroundColor.blue },
                ]}
                onPress={acceptCall}>
                <Text style={style.btnTextStyle}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      </>
    );
  }

  return null;
};
