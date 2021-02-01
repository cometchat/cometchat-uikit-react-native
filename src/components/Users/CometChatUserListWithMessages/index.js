/* eslint-disable react/no-unused-state */
import React from 'react';
import { SafeAreaView } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';

import { CometChatOutgoingCall, CometChatIncomingCall } from '../../Calls';
import { CometChatUserList } from '../index';
import { CometChatManager } from '../../../utils/controller';
import { CometChatImageViewer } from '../../Messages';
import theme from '../../../resources/theme';

class CometChatUserListWithMessages extends React.Component {
  loggedInUser = null;

  constructor(props) {
    super(props);

    this.state = {
      item: {},
      type: 'user',
      callmessage: {},
      incomingCall: null,
      outgoingCall: null,
      imageView: null,
      viewdetailscreen: false,
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

  actionHandler = (action, item, count) => {
    switch (action) {
      case 'blockUser':
        this.blockUser();
        break;
      case 'unblockUser':
        this.unblockUser();
        break;
      case 'audioCall':
        this.audioCall();
        break;
      case 'videoCall':
        this.videoCall();
        break;
      case 'viewDetail':
      case 'closeDetailClicked':
        this.toggleDetailView();
        break;
      case 'menuClicked':
        this.toggleSideBar();
        this.setState({ item: {} });
        break;
      case 'closeMenuClicked':
        this.toggleSideBar();
        break;
      case 'viewMessageThread':
        // this.viewMessageThread(item);
        break;
      case 'closeThreadClicked':
        this.closeThreadMessages();
        break;
      case 'threadMessageComposed':
        // this.onThreadMessageComposed(item);
        break;
      case 'acceptIncomingCall':
        this.acceptIncomingCall(item);
        break;
      case 'acceptedIncomingCall':
        this.callInitiated(item);
        break;
      case 'rejectedIncomingCall':
        this.rejectedIncomingCall(item, count);
        break;
      case 'outgoingCallRejected':
      case 'outgoingCallCancelled':
      case 'callEnded':
        this.outgoingCallEnded(item);
        break;
      case 'userJoinedCall':
      case 'userLeftCall':
        // this.appendCallMessage(item);
        break;
      case 'viewActualImage':
        this.toggleImageView(item);
        break;
      default:
        break;
    }
  };

  blockUser = () => {
    const usersList = [this.state.item.uid];
    CometChatManager.blockUsers(usersList)
      .then(() => {
        this.setState({ item: { ...this.state.item, blockedByMe: true } });
      })
      .catch(() => {
        // console.log('Blocking user fails with error', error);
      });
  };

  unblockUser = () => {
    const usersList = [this.state.item.uid];
    CometChatManager.unblockUsers(usersList)
      .then(() => {
        this.setState({ item: { ...this.state.item, blockedByMe: false } });
      })
      .catch(() => {
        // console.log('unblocking user fails with error', error);
      });
  };

  toggleImageView = (message) => {
    this.setState({ imageView: message });
  };

  itemClicked = (item, type) => {
    this.setState({ item: { ...item }, type, viewdetailscreen: false }, () => {
      this.navigateToMessageListScreen(item, type);
    });
  };

  navigateToMessageListScreen = (item, type) => {
    this.props.navigation.navigate('CometChatMessages', {
      type,
      item: { ...item },
      theme: this.theme,
      tab: this.state.tab,
      loggedInUser: this.loggedInUser,
      callmessage: this.state.callmessage,
      actionGenerated: this.actionHandler,
      composedthreadmessage: this.state.composedthreadmessage,
    });
  };

  callInitiated = (message) => {
    this.appendCallMessage(message);
  };

  outgoingCallEnded = (message) => {
    this.setState({ outgoingCall: null, incomingCall: null }, () => {
      this.appendCallMessage(message);
    });
  };

  audioCall = () => {
    let receiverId;
    let receiverType;
    if (this.state.type === 'user') {
      receiverId = this.state.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.state.type === 'group') {
      receiverId = this.state.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.AUDIO)
      .then((call) => {
        this.appendCallMessage(call);
        this.setState({ outgoingCall: call });
      })
      .catch(() => {});
  };

  videoCall = () => {
    let receiverId;
    let receiverType;
    if (this.state.type === 'user') {
      receiverId = this.state.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.state.type === 'group') {
      receiverId = this.state.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.VIDEO)
      .then((call) => {
        this.appendCallMessage(call);
        this.setState({ outgoingCall: call });
      })
      .catch(() => {
        // console.log('Call initialization failed with exception:', error);
      });
  };

  acceptIncomingCall = (call) => {
    this.setState({ incomingCall: call });

    const type = call.receiverType;
    const id = type === 'user' ? call.sender.uid : call.receiverId;

    CometChat.getConversation(id, type)
      .then((conversation) => {
        this.itemClicked(conversation.conversationWith, type);
      })
      .catch(() => {
        // console.log('error while fetching a conversation', error);
      });
  };

  rejectedIncomingCall = (incomingCallMessage, rejectedCallMessage) => {
    let { receiverType } = incomingCallMessage;
    let receiverId =
      receiverType === 'user' ? incomingCallMessage.sender.uid : incomingCallMessage.receiverId;

    if (Object.prototype.hasOwnProperty.call(incomingCallMessage, 'readAt') === false) {
      CometChat.markAsRead(incomingCallMessage.id, receiverId, receiverType);
    }

    // this.setState({ messageToMarkRead: incomingCallMessage });

    const { item, type } = this.state;

    receiverType = rejectedCallMessage.receiverType;
    receiverId = rejectedCallMessage.receiverId;

    if (
      (type === 'group' && receiverType === 'group' && receiverId === item.guid) ||
      (type === 'user' && receiverType === 'user' && receiverId === item.uid)
    ) {
      this.appendCallMessage(rejectedCallMessage);
    }
  };

  appendCallMessage = (call) => {
    const { item, type } = this.state;
    // TODO update params in better way
    this.setState({ callmessage: call }, () => {
      this.navigateToMessageListScreen(item, type);
    });
  };

  toggleSideBar = () => {
    const { sidebarview } = this.state;
    this.setState({ sidebarview: !sidebarview });
  };

  toggleDetailView = () => {
    const viewdetail = !this.state.viewdetailscreen;
    this.setState({ viewdetailscreen: viewdetail, threadmessageview: false });
  };

  closeThreadMessages = () => {
    this.setState({ viewdetailscreen: false, threadmessageview: false });
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
      <SafeAreaView style={{ backgroundColor: 'white' }}>
        <CometChatUserList
          theme={this.theme}
          item={this.state.item}
          type={this.state.type}
          onItemClick={this.itemClicked}
          actionGenerated={this.actionHandler}
          navigation={this.props.navigation}
          // enableCloseMenu={Object.keys(this.state.item).length}
        />
        {imageView} 
        <CometChatIncomingCall
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
      </SafeAreaView>
    );
  }
}

export default CometChatUserListWithMessages;
