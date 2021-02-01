import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import style from './styles';

export default (props) => {
  const getMessage = useCallback(() => {
    const call = props.message;
    const { loggedInUser } = props;

    let message = null;
    switch (call.status) {
      case CometChat.CALL_STATUS.INITIATED: {
        message = 'Call initiated';
        if (call.type === 'audio') {
          if (call.receiverType === 'user') {
            message =
              call.callInitiator.uid === loggedInUser.uid
                ? 'Outgoing audio call'
                : 'Incoming audio call';
          } else if (call.receiverType === 'group') {
            if (call.action === CometChat.CALL_STATUS.INITIATED) {
              message =
                call.callInitiator.uid === loggedInUser.uid
                  ? 'Outgoing audio call'
                  : 'Incoming audio call';
            } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
              message =
                call.sender.uid === loggedInUser.uid
                  ? 'Call rejected'
                  : `${call.sender.name} rejected call`;
            }
          }
        } else if (call.type === 'video') {
          if (call.receiverType === 'user') {
            message =
              call.callInitiator.uid === loggedInUser.uid
                ? 'Outgoing video call'
                : 'Incoming video call';
          } else if (call.receiverType === 'group') {
            if (call.action === CometChat.CALL_STATUS.INITIATED) {
              message =
                call.callInitiator.uid === loggedInUser.uid
                  ? 'Outgoing video call'
                  : 'Incoming video call';
            } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
              message =
                call.sender.uid === loggedInUser.uid
                  ? 'Call rejected'
                  : `${call.sender.name} rejected call`;
            }
          }
        }
        break;
      }
      case CometChat.CALL_STATUS.ONGOING: {
        if (call.receiverType === 'user') {
          message = 'Call accepted';
        } else if (call.receiverType === 'group') {
          if (call.action === CometChat.CALL_STATUS.ONGOING) {
            message =
              call.sender.uid === loggedInUser.uid ? 'Call accepted' : `${call.sender.name} joined`;
          } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
            message =
              call.sender.uid === loggedInUser.uid
                ? 'Call rejected'
                : `${call.sender.name} rejected call`;
          } else if (call.action === 'left') {
            message =
              call.sender.uid === loggedInUser.uid
                ? 'You left the call'
                : `${call.sender.name} left the call`;
          }
        }

        break;
      }
      case CometChat.CALL_STATUS.UNANSWERED: {
        message = 'Call unanswered';
        if (
          call.type === 'audio' &&
          (call.receiverType === 'user' || call.receiverType === 'group')
        ) {
          message =
            call.callInitiator.uid === loggedInUser.uid
              ? 'Unanswered audio call'
              : 'Missed audio call';
        } else if (
          call.type === 'video' &&
          (call.receiverType === 'user' || call.receiverType === 'group')
        ) {
          message =
            call.callInitiator.uid === loggedInUser.uid
              ? 'Unanswered video call'
              : 'Missed video call';
        }
        break;
      }
      case CometChat.CALL_STATUS.REJECTED: {
        message = 'Call rejected';
        break;
      }
      case CometChat.CALL_STATUS.ENDED:
        message = 'Call ended';
        break;
      case CometChat.CALL_STATUS.CANCELLED:
        message = 'Call cancelled';
        break;
      case CometChat.CALL_STATUS.BUSY:
        message = 'Call busy';
        break;
      default:
        break;
    }

    return <Text style={style.callMessageTxtStyle}>{message}</Text>;
  }, [props]);

  return <View style={style.callMessageStyle}>{getMessage()}</View>;
};
