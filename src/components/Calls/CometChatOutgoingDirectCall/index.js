import React from 'react';
import { Text, View, Modal, TouchableOpacity } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import * as actions from '../../../utils/actions';
import KeepAwake from 'react-native-keep-awake';
import * as enums from '../../../utils/enums';
import { theme } from '../../../resources/theme';

class CometChatOutgoingDirectCall extends React.Component {
  sessionID;

  constructor(props) {
    super(props);
    this.sessionID = `${props.item.guid}`;
    this.state = {
      callSettings: null,
    };
  }

  componentDidMount() {
    this.startCall();
  }

  getReceiverDetails = () => {
    let receiverId;
    let receiverType;

    if (this.props.type === CometChat.RECEIVER_TYPE.USER) {
      receiverId = this.props.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP) {
      receiverId = this.props.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    return { receiverId: receiverId, receiverType: receiverType };
  };

  sendCustomMessage = () => {
    const { receiverId, receiverType } = this.getReceiverDetails();

    const customData = {
      sessionID: this.sessionID,
      callType: this.props.callType,
    };
    const customType = enums.CUSTOM_TYPE_MEETING;

    let conversationId = null;
    if (this.props.type === CometChat.RECEIVER_TYPE.USER) {
      const users = [this.props.loggedInUser.uid, this.props.item.uid];
      conversationId = users.sort().join('_user_');
    } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP) {
      conversationId = `group_${this.props.item.guid}`;
    }

    const customMessage = new CometChat.CustomMessage(
      receiverId,
      receiverType,
      customType,
      customData,
    );
    customMessage.setSender(this.props.loggedInUser);
    customMessage.setReceiver(this.props.type);
    customMessage.setConversationId(conversationId);
    customMessage._composedAt = Math.round(+new Date() / 1000);
    customMessage._id = '_' + Math.random().toString(36).substr(2, 9);

    this.props.actionGenerated(actions['MESSAGE_COMPOSED'], [customMessage]);
    CometChat.sendCustomMessage(customMessage)
      .then((message) => {
        const newMessageObj = { ...message, _id: customMessage._id };
        this.props.actionGenerated(actions['MESSAGE_SENT'], newMessageObj);
      })
      .catch((error) => {
        console.log('custom message sending failed with error', error);

        const newMessageObj = { ...customMessage, error: error };
        this.props.actionGenerated(
          enums.ACTIONS['ERROR_IN_SENDING_MESSAGE'],
          newMessageObj,
        );
      });
  };

  startCall = () => {
    let sessionID = `${this.props.item.guid}`;
    let audioOnly = false;
    let defaultLayout = true;
    let callListener = new CometChat.OngoingCallListener({
      onCallEnded: (call) => {
        this.props.actionGenerated(actions.DIRECT_CALL_ENDED, call);
        this.setState({
          outgoingCallScreen: false,
          callInProgress: null,
          callSettings: null,
        });
      },
      onError: (error) => {
        console.log('Call Error: ', error);
      },
    });

    let callSettings = new CometChat.CallSettingsBuilder()
      .enableDefaultLayout(defaultLayout)
      .setSessionID(sessionID)
      .setIsAudioOnlyCall(audioOnly)
      .setCallEventListener(callListener)
      .build();
    this.setState({ callSettings });
    //send custom message only when someone starts a direct call
    if (this.props.joinDirectCall === false) {
      this.sendCustomMessage();
    }
  };

  render() {
    return (
      <Modal animated animationType="fade">
        <View style={{ height: '100%', width: '100%', position: 'relative' }}>
          <KeepAwake />
          {this.state.callSettings ? (
            <CometChat.CallingComponent
              callsettings={this.state.callSettings}
            />
          ) : null}
        </View>
      </Modal>
    );
  }
}

export default CometChatOutgoingDirectCall;
