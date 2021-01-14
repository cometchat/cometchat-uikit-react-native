/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import { Text, View, Modal, TouchableOpacity } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sound from 'react-native-sound';

import { outgoingCallAlert } from '../../../resources/audio';
import { CometChatManager } from '../../../utils/controller';
import { CallScreenManager } from './controller';

import { CometChatAvatar } from '../../Shared';

import * as enums from '../../../utils/enums';
import theme from '../../../resources/theme';

import style from './styles';

class CometChatOutgoingCall extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      callSettings: null,
      errorScreen: false,
      errorMessage: null,
      callInProgress: null,
      outgoingCallScreen: false,
    };

    this.callScreenManager = null;
    this.theme = { ...theme, ...this.props.theme };
    this.outgoingAlert = new Sound(outgoingCallAlert);
  }

  componentDidMount() {
    this.callScreenManager = new CallScreenManager();
    this.callScreenManager.attachListeners(this.callScreenUpdated);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.outgoingCall !== this.props.outgoingCall && this.props.outgoingCall) {
      this.playOutgoingAlert();

      const call = this.props.outgoingCall;

      this.setState({
        outgoingCallScreen: true,
        callInProgress: call,
        errorScreen: false,
        errorMessage: null,
      });
    }

    if (prevProps.incomingCall !== this.props.incomingCall && this.props.incomingCall) {
      this.acceptCall();
    }

    if (!this.props.outgoingCall && !this.props.incomingCall) {
      this.setState({
        outgoingCallScreen: false,
        callInProgress: null,
        errorScreen: false,
        errorMessage: null,
        callSettings: null,
      });
    }
  }

  componentWillUnmount() {
    this.callScreenManager.removeListeners();
    this.callScreenManager = null;
  }

  callScreenUpdated = (key, call) => {
    switch (key) {
      case enums.INCOMING_CALL_CANCELLED:
        this.incomingCallCancelled(call);
        break;
      case enums.OUTGOING_CALL_ACCEPTED: // occurs at the caller end
        this.outgoingCallAccepted(call);
        break;
      case enums.OUTGOING_CALL_REJECTED: // occurs at the caller end, callee rejects the call
        this.outgoingCallRejected(call);
        break;
      default:
        break;
    }
  };

  incomingCallCancelled = () => {
    this.setState({
      outgoingCallScreen: false,
      callInProgress: null,
      callSettings: null,
    });
  };

  outgoingCallAccepted = (call) => {
    if (this.state.outgoingCallScreen === true) {
      this.pauseOutgoingAlert();

      this.setState({ outgoingCallScreen: false, callInProgress: call });
      this.startCall(call);
    }
  };

  outgoingCallRejected = (call) => {
    this.pauseOutgoingAlert();

    if (
      Object.prototype.hasOwnProperty.call(call, 'status') &&
      call.status === CometChat.CALL_STATUS.BUSY
    ) {
      // show busy message.
      const errorMessage = `${call.sender.name} is on another call.`;
      this.setState({ errorScreen: true, errorMessage });
    } else {
      this.props.actionGenerated('outgoingCallRejected', call);
    }
    this.setState({
      outgoingCallScreen: false,
      callInProgress: null,
      callSettings: null,
    });
  };

  acceptCall = () => {
    CometChatManager.acceptCall(this.props.incomingCall.sessionId)
      .then((response) => {
        const call = { ...response };

        this.props.actionGenerated('acceptedIncomingCall', call);
        this.setState({
          outgoingCallScreen: false,
          callInProgress: call,
          errorScreen: false,
          errorMessage: null,
        });

        this.startCall(call);
      })
      .catch((error) => {
        // console.log('[CallScreen] acceptCall -- error', error);
        this.props.actionGenerated('callError', error);
      });
  };

  startCall = (call) => {
    const { sessionId } = call;
    const callType = call.type;
    const audioOnly = callType === 'audio';

    const callListener = new CometChat.OngoingCallListener({
      onUserJoined: (user) => {
        if (
          call.callInitiator.uid !== this.props.loggedInUser.uid &&
          call.callInitiator.uid !== user.uid
        ) {
          this.markMessageAsRead(call);

          const callMessage = {
            category: call.category,
            type: call.type,
            action: call.action,
            status: call.status,
            callInitiator: call.callInitiator,
            callReceiver: call.callReceiver,
            receiverId: call.receiverId,
            receiverType: call.receiverType,
            sentAt: call.sentAt,
            sender: { ...user },
          };
          this.props.actionGenerated('userJoinedCall', callMessage);
        }
      },
      onUserLeft: (user) => {
        if (
          call.callInitiator.uid !== this.props.loggedInUser.uid &&
          call.callInitiator.uid !== user.uid
        ) {
          this.markMessageAsRead(call);

          const callMessage = {
            category: call.category,
            type: call.type,
            action: 'left',
            status: call.status,
            callInitiator: call.callInitiator,
            callReceiver: call.callReceiver,
            receiverId: call.receiverId,
            receiverType: call.receiverType,
            sentAt: call.sentAt,
            sender: { ...user },
          };

          this.props.actionGenerated('userLeftCall', callMessage);
        }
      },
      onCallEnded: (endedCall) => {
        this.setState({
          outgoingCallScreen: false,
          callInProgress: null,
          callSettings: null,
        });

        this.markMessageAsRead(endedCall);
        this.props.actionGenerated('callEnded', endedCall);
      },
      onError: (error) => {
        // console.log('[OngoingCallListener] Call Error: ', error);
        this.props.actionGenerated('callError', error);
      },
    });

    const callSettings = new CometChat.CallSettingsBuilder()
      .setSessionID(sessionId)
      .enableDefaultLayout(true)
      .setIsAudioOnlyCall(audioOnly)
      .setCallEventListener(callListener)
      .build();

    this.setState({ callSettings });
  };

  markMessageAsRead = (message) => {
    const type = message.receiverType;
    const id = type === 'user' ? message.sender.uid : message.receiverId;

    if (Object.prototype.hasOwnProperty.call(message, 'readAt') === false) {
      CometChat.markAsRead(message.id, id, type);
    }
  };

  playOutgoingAlert = () => {
    if (
      Object.prototype.hasOwnProperty.call(this.props, 'widgetsettings') &&
      this.props.widgetsettings &&
      Object.prototype.hasOwnProperty.call(this.props.widgetsettings, 'main') &&
      (Object.prototype.hasOwnProperty.call(
        this.props.widgetsettings.main,
        'enable_sound_for_calls'
      ) === false ||
        (Object.prototype.hasOwnProperty.call(
          this.props.widgetsettings.main,
          'enable_sound_for_calls'
        ) &&
          this.props.widgetsettings.main.enable_sound_for_calls === false))
    ) {
      return false;
    }

    this.outgoingAlert.setCurrentTime(0);
    this.outgoingAlert.setNumberOfLoops(-1);
    this.outgoingAlert.play();
  };

  pauseOutgoingAlert = () => {
    if (
      Object.prototype.hasOwnProperty.call(this.props, 'widgetsettings') &&
      this.props.widgetsettings &&
      Object.prototype.hasOwnProperty.call(this.props.widgetsettings, 'main') &&
      (Object.prototype.hasOwnProperty.call(
        this.props.widgetsettings.main,
        'enable_sound_for_calls'
      ) === false ||
        (Object.prototype.hasOwnProperty.call(
          this.props.widgetsettings.main,
          'enable_sound_for_calls'
        ) &&
          this.props.widgetsettings.main.enable_sound_for_calls === false))
    ) {
      return false;
    }

    this.outgoingAlert.pause();
  };

  cancelCall = () => {
    this.pauseOutgoingAlert();

    CometChatManager.rejectCall(
      this.state.callInProgress.sessionId,
      CometChat.CALL_STATUS.CANCELLED
    )
      .then((call) => {
        this.props.actionGenerated('outgoingCallCancelled', call);
        this.setState({
          outgoingCallScreen: false,
          callInProgress: null,
          callSettings: null,
        });
      })
      .catch((error) => {
        this.props.actionGenerated('callError', error);
        this.setState({
          outgoingCallScreen: false,
          callInProgress: null,
          callSettings: null,
        });
      });
  };

  render() {
    if (this.state.callSettings) {
      return (
        <Modal animated animationType="fade">
          <View style={{ height: '100%', width: '100%', position: 'relative' }}>
            <CometChat.CallingComponent callsettings={this.state.callSettings} />
          </View>
        </Modal>
      );
    }

    let callScreen = null;
    let errorScreen = null;

    if (this.state.callInProgress) {
      if (this.state.errorScreen) {
        errorScreen = (
          <View>
            <Text>{this.state.errorMessage}</Text>
          </View>
        );
      }

      if (this.state.outgoingCallScreen) {
        callScreen = (
          <Modal animated animationType="fade">
            <View style={style.container}>
              <View style={style.header}>
                <Text style={style.headerLabel}>Calling...</Text>
                <Text style={style.headerName}>{this.state.callInProgress.receiver.name}</Text>
              </View>
              <View style={style.thumbnail}>
                <CometChatAvatar
                  cornerRadius={1000}
                  borderColor={this.theme.color.secondary}
                  borderWidth={0}
                  textFontSize={60}
                  image={{ uri: this.state.callInProgress.receiver.avatar }}
                  name={this.state.callInProgress.receiver.name}
                />
              </View>
              {errorScreen}
              <View style={style.iconWrapper}>
                <TouchableOpacity onPress={this.cancelCall}>
                  <View style={style.cancelBtn}>
                    <Icon name="call-end" color="#FFFFFF" size={32} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      }
    }

    if (this.state.callInProgress) {
      return callScreen;
    }

    return null;
  }
}

export default CometChatOutgoingCall;
