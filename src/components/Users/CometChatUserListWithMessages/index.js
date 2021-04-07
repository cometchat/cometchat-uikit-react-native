/* eslint-disable react/no-unused-state */
import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';

import { CometChatOutgoingCall, CometChatIncomingCall } from '../../Calls';
import { CometChatUserList } from '../index';
import { CometChatManager } from '../../../utils/controller';
import { CometChatImageViewer } from '../../Messages';
import theme from '../../../resources/theme';
import * as actions from '../../../utils/actions';
import * as enums from '../../../utils/enums';
import { logger } from '../../../utils/common';
import DropDownAlert from '../../Shared/DropDownAlert';

class CometChatUserListWithMessages extends React.Component {
  loggedInUser = null;

  constructor(props) {
    super(props);

    this.state = {
      item: {},
      type: CometChat.RECEIVER_TYPE.USER,
      callMessage: {},
      incomingCall: null,
      outgoingCall: null,
      imageView: null,
      viewDetailScreen: false,
    };

    this.theme = { ...theme, ...this.props.theme };
  }

  componentDidMount() {
    if (!Object.keys(this.state.item).length) {
      this.toggleSideBar();
    }

    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
      })
      .catch(() => {});
  }

  /**
   * Handles actions sent from lower level components
   * @param action: action names
   * @param item: item to be updated
   * @param count
   */
  actionHandler = (action, item, count) => {
    switch (action) {
      case actions.BLOCK_USER:
        this.blockUser();
        break;
      case actions.UNBLOCK_USER:
        this.unblockUser();
        break;
      case actions.AUDIO_CALL:
        this.audioCall();
        break;
      case actions.VIDEO_CALL:
        this.videoCall();
        break;
      case actions.VIEW_DETAIL:
      case actions.CLOSE_DETAIL_CLICKED:
        this.toggleDetailView();
        break;
      case actions.MENU_CLICKED:
        this.toggleSideBar();
        this.setState({ item: {} });
        break;
      case actions.VIEW_MESSAGE_THREAD:
        break;
      case actions.CLOSE_THREAD_CLICKED:
        this.closeThreadMessages();
        break;
      case actions.THREAD_MESSAGE_COMPOSED:
        break;
      case actions.ACCEPT_INCOMING_CALL:
        this.acceptIncomingCall(item);
        break;
      case actions.ACCEPTED_INCOMING_CALL:
        this.callInitiated(item);
        break;
      case actions.REJECTED_INCOMING_CALL:
        this.rejectedIncomingCall(item, count);
        break;
      case actions.OUTGOING_CALL_REJECTED:
      case actions.OUTGOING_CALL_CANCELLED:
      case actions.CALL_ENDED:
        this.outgoingCallEnded(item);
        break;
      case actions.USER_JOINED_CALL:
      case actions.USER_LEFT_CALL:
        break;
      case actions.VIEW_ACTUAL_IMAGE:
        this.toggleImageView(item);
        break;
      default:
        break;
    }
  };

  /**
   * Handle blocking a user
   * @param
   */
  blockUser = () => {
    const usersList = [this.state.item.uid];
    CometChatManager.blockUsers(usersList)
      .then((response) => {
        if (response) {
          this.dropDownAlertRef?.showMessage('success', 'Blocked user');
          this.setState({ item: { ...this.state.item, blockedByMe: true } });
        } else {
          this.dropDownAlertRef?.showMessage('error', 'Failed to block user');
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('Blocking user fails with error', error);
      });
  };

  /**
   * Handle unblocking a user
   * @param
   */
  unblockUser = () => {
    const usersList = [this.state.item.uid];
    CometChatManager.unblockUsers(usersList)
      .then((response) => {
        if (response) {
          this.dropDownAlertRef?.showMessage('success', 'Unblocked user');
          this.setState({ item: { ...this.state.item, blockedByMe: false } });
        } else {
          this.dropDownAlertRef?.showMessage('error', 'Failed to unblock user');
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('unblocking user fails with error', error);
      });
  };

  /**
   * Handle toggling image view for a particular message
   * @param
   */
  toggleImageView = (message) => {
    this.setState({ imageView: message });
  };

  /**
   * Handle user list item clicked
   * @param
   */
  itemClicked = (item, type) => {
    this.setState({ item: { ...item }, type, viewDetailScreen: false }, () => {
      this.navigateToMessageListScreen(item, type);
    });
  };

  /**
   * Navigating to chat_messages screen with respective navigation params
   * @param item: User list item clicked
   * @param type: clicked item type
   */
  navigateToMessageListScreen = (item, type) => {
    this.props.navigation.navigate(
      enums.NAVIGATION_CONSTANTS.COMET_CHAT_MESSAGES,
      {
        type,
        item: { ...item },
        theme: this.theme,
        tab: this.state.tab,
        loggedInUser: this.loggedInUser,
        callMessage: this.state.callMessage,
        actionGenerated: this.actionHandler,
        composedThreadMessage: this.state.composedThreadMessage,
      },
    );
  };

  /**
   * Handle appending message on call initiated
   * @param message: call object
   */
  callInitiated = (message) => {
    this.appendCallMessage(message);
  };

  /**
   * Handle appending call message on call ending
   * @param message: call object
   */
  outgoingCallEnded = (message) => {
    this.setState({ outgoingCall: null, incomingCall: null }, () => {
      this.appendCallMessage(message);
    });
  };

  /**
   * Handle initiating an audio call
   * @param
   */
  audioCall = () => {
    try {
      let receiverId;
      let receiverType;
      if (this.state.type === CometChat.RECEIVER_TYPE.USER) {
        receiverId = this.state.item.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (this.state.type === CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.state.item.guid;
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      }

      CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.AUDIO)
        .then((call) => {
          this.appendCallMessage(call);
          this.setState({ outgoingCall: call });
        })
        .catch(() => {});
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle initiating a video call
   * @param
   */
  videoCall = () => {
    try {
      let receiverId;
      let receiverType;
      if (this.state.type === CometChat.RECEIVER_TYPE.USER) {
        receiverId = this.state.item.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (this.state.type === CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.state.item.guid;
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      }

      CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.VIDEO)
        .then((call) => {
          this.appendCallMessage(call);
          this.setState({ outgoingCall: call });
        })
        .catch((error) => {
          logger('Call initialization failed with exception:', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle accept incoming calls
   * @param call: call object
   */
  acceptIncomingCall = (call) => {
    try {
      this.setState({ incomingCall: call });

      const type = call.receiverType;
      const id =
        type === CometChat.RECEIVER_TYPE.USER
          ? call.sender.uid
          : call.receiverId;

      CometChat.getConversation(id, type)
        .then((conversation) => {
          this.itemClicked(conversation.conversationWith, type);
        })
        .catch((error) => {
          logger('error while fetching a conversation', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle rejecting an incoming call
   * @param incomingCallMessage: call object
   * @param rejectedCallMessage: call message object
   */
  rejectedIncomingCall = (incomingCallMessage, rejectedCallMessage) => {
    try {
      let { receiverType } = incomingCallMessage;
      let receiverId =
        receiverType === CometChat.RECEIVER_TYPE.USER
          ? incomingCallMessage.sender.uid
          : incomingCallMessage.receiverId;

      if (
        Object.prototype.hasOwnProperty.call(incomingCallMessage, 'readAt') ===
        false
      ) {
        CometChat.markAsRead(incomingCallMessage.id, receiverId, receiverType);
      }

      const { item, type } = this.state;

      receiverType = rejectedCallMessage.receiverType;
      receiverId = rejectedCallMessage.receiverId;

      if (
        (type === CometChat.RECEIVER_TYPE.GROUP &&
          receiverType === CometChat.RECEIVER_TYPE.GROUP &&
          receiverId === item.guid) ||
        (type === CometChat.RECEIVER_TYPE.USER &&
          receiverType === CometChat.RECEIVER_TYPE.USER &&
          receiverId === item.uid)
      ) {
        this.appendCallMessage(rejectedCallMessage);
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle appending call messages and navigating to message screen
   * @param call: call message object
   */
  appendCallMessage = (call) => {
    const { item, type } = this.state;
    // TODO update params in better way
    this.setState({ callMessage: call }, () => {
      this.navigateToMessageListScreen(item, type);
    });
  };

  /**
   * Handle toggling sidebar
   * @param
   */
  toggleSideBar = () => {
    const { sideBarView } = this.state;
    this.setState({ sideBarView: !sideBarView });
  };

  /**
   * Handle toggling detail view on header clicked
   * @param
   */
  toggleDetailView = () => {
    const viewDetail = !this.state.viewDetailScreen;
    this.setState({ viewDetailScreen: viewDetail, threadMessageView: false });
  };

  /**
   * Handle closing thread message component
   * @param
   */
  closeThreadMessages = () => {
    this.setState({ viewDetailScreen: false, threadMessageView: false });
  };

  render() {
    let imageView = null;
    if (this.state.imageView) {
      imageView = (
        <CometChatImageViewer
          open
          close={() => this.toggleImageView(null)}
          message={this.state.imageView}
        />
      );
    }
    return (
      <View style={{ backgroundColor: 'white' }}>
        <CometChatUserList
          theme={this.theme}
          item={this.state.item}
          type={this.state.type}
          onItemClick={this.itemClicked}
          actionGenerated={this.actionHandler}
          navigation={this.props.navigation}
        />
        {imageView}
        <CometChatIncomingCall
          showMessage={(type, message) => {
            this.dropDownAlertRef?.showMessage(type, message);
          }}
          theme={this.props.theme}
          loggedInUser={this.loggedInUser}
          outgoingCall={this.state.outgoingCall}
          actionGenerated={this.actionHandler}
        />
        <CometChatOutgoingCall
          theme={this.props.theme}
          item={this.state.item}
          type={this.state.type}
          incomingCall={this.state.incomingCall}
          outgoingCall={this.state.outgoingCall}
          loggedInUser={this.loggedInUser}
          lang={this.state.lang}
          actionGenerated={this.actionHandler}
        />
        <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
      </View>
    );
  }
}

export default CometChatUserListWithMessages;
