/* eslint-disable no-bitwise */
/* eslint-disable react/no-unused-state */
import React from 'react';
import { SafeAreaView } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import { CometChatIncomingCall, CometChatOutgoingCall } from '../../Calls';
import { CometChatGroupList } from '../index';
import { CometChatImageViewer } from '../../Messages';

import theme from '../../../resources/theme';

class CometChatGroupListWithMessages extends React.Component {
  loggedInUser = null;

  constructor(props) {
    super(props);

    this.state = {
      darktheme: false,
      viewdetailscreen: false,
      item: {},
      type: 'group',
      tab: 'groups',
      groupToDelete: {},
      groupToLeave: {},
      groupToUpdate: {},
      threadmessageview: false,
      threadmessagetype: null,
      threadmessageitem: {},
      threadmessageparent: {},
      composedthreadmessage: {},
      incomingCall: null,
      outgoingCall: null,
      callmessage: {},
      sidebarview: false,
      imageView: null,
      groupmessage: {},
    };

    this.theme = { ...theme, ...this.props.theme };
  }

  componentDidMount() {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
      })
      .catch(() => {
        // console.log('[CometChatGroupListWithMessages] getLoggedInUser error', error);
      });
  }

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

  actionHandler = (action, item, count, ...otherProps) => {
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
      // eslint-disable-next-line no-lone-blocks
      case 'menuClicked': {
        this.toggleSideBar();
        this.setState({ item: {} });
        break;
      }
      case 'closeMenuClicked':
        this.toggleSideBar();
        break;
      case 'viewDetail':
      case 'closeDetailClicked':
        this.toggleDetailView();
        break;
      case 'groupUpdated':
        this.groupUpdated(item, count, ...otherProps);
        break;
      case 'groupDeleted':
        this.deleteGroup(item);
        break;
      case 'leftGroup':
        this.leaveGroup(item, ...otherProps);
        break;
      case 'membersUpdated':
        this.updateMembersCount(item, count);
        break;
      case 'viewMessageThread':
        this.viewMessageThread(item);
        break;
      case 'closeThreadClicked':
        this.closeThreadMessages();
        break;
      case 'threadMessageComposed':
        this.onThreadMessageComposed(item);
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
        this.appendCallMessage(item);
        break;
      case 'viewActualImage':
        this.toggleImageView(item);
        break;
      case 'membersAdded':
        this.membersAdded(item);
        break;
      case 'memberUnbanned':
        this.memberUnbanned(item);
        break;
      case 'memberScopeChanged':
        this.memberScopeChanged(item);
        break;
      case 'updateThreadMessage':
        this.updateThreadMessage(item[0], count);
        break;
      default:
        break;
    }
  };

  updateThreadMessage = (message, action) => {
    if (
      this.state.threadmessageview === false ||
      message.id !== this.state.threadmessageparent.id
    ) {
      return false;
    }

    if (action === 'delete') {
      this.setState({ threadmessageparent: { ...message }, threadmessageview: false });
    } else {
      this.setState({ threadmessageparent: { ...message } });
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
      .catch(() => {
        // console.log('Call initialization failed with exception:', error);
      });
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

  toggleSideBar = () => {
    const { sidebarview } = this.state;
    this.setState({ sidebarview: !sidebarview });
  };

  toggleDetailView = () => {
    const viewdetail = !this.state.viewdetailscreen;
    this.setState({ viewdetailscreen: viewdetail, threadmessageview: false });
  };

  deleteGroup = (group) => {
    this.setState({ groupToDelete: group, item: {}, type: 'group', viewdetailscreen: false });
  };

  leaveGroup = (group) => {
    this.setState({ groupToLeave: group, item: {}, type: 'group', viewdetailscreen: false });
  };

  updateMembersCount = (item, count) => {
    const group = { ...this.state.item, membersCount: count };
    this.setState({ item: group, groupToUpdate: group });
  };

  groupUpdated = (message, key, group, options) => {
    switch (key) {
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_KICKED: {
        if (options.user.uid === this.loggedInUser.uid) {
          this.setState({ item: {}, type: 'group', viewdetailscreen: false });
        }
        break;
      }
      case enums.GROUP_MEMBER_SCOPE_CHANGED: {
        if (options.user.uid === this.loggedInUser.uid) {
          const newObj = { ...this.state.item, scope: options.scope };
          this.setState({ item: newObj, type: 'group', viewdetailscreen: false });
        }
        break;
      }
      default:
        break;
    }
  };

  closeThreadMessages = () => {
    this.setState({ viewdetailscreen: false, threadmessageview: false });
  };

  viewMessageThread = (parentMessage) => {
    const message = { ...parentMessage };
    const threaditem = { ...this.state.item };
    this.setState({
      threadmessageview: true,
      threadmessageparent: message,
      threadmessageitem: threaditem,
      threadmessagetype: this.state.type,
      viewdetailscreen: false,
    });
  };

  onThreadMessageComposed = (composedMessage) => {
    if (this.state.type !== this.state.threadmessagetype) {
      return false;
    }

    if (
      (this.state.threadmessagetype === 'group' &&
        this.state.item.guid !== this.state.threadmessageitem.guid) ||
      (this.state.threadmessagetype === 'user' &&
        this.state.item.uid !== this.state.threadmessageitem.uid)
    ) {
      return false;
    }

    const message = { ...composedMessage };
    this.setState({ composedthreadmessage: message });
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

  outgoingCallEnded = (message) => {
    this.setState({ outgoingCall: null, incomingCall: null });
    this.appendCallMessage(message);
  };

  toggleImageView = (message) => {
    this.setState({ imageView: message });
  };

  membersAdded = (members) => {
    const messageList = [];
    members.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} added ${eachMember.name}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  };

  memberUnbanned = (members) => {
    const messageList = [];
    members.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} unbanned ${eachMember.name}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  };

  memberScopeChanged = (members) => {
    const messageList = [];

    members.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} made ${eachMember.name} ${eachMember.scope}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  };

  appendCallMessage = (call) => {
    const { item, type } = this.state;
    // TODO update params in better way
    this.setState({ callmessage: call }, () => {
      this.navigateToMessageListScreen(item, type);
    });
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
      <SafeAreaView style={{ backgroundColor: 'white',flex:1 }}>
        <CometChatGroupList
          theme={this.theme}
          item={this.state.item}
          type={this.state.type}
          onItemClick={this.itemClicked}
          actionGenerated={this.actionHandler}
          groupToDelete={this.state.groupToDelete}
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

export default CometChatGroupListWithMessages;
