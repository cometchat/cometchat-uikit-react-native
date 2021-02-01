/* eslint-disable react/no-unused-state */
/* eslint-disable no-bitwise */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import { CometChatConversationList } from '../index';
import { CometChatIncomingCall, CometChatOutgoingCall } from '../../Calls';
import { CometChatImageViewer } from '../../Messages';
import theme from '../../../resources/theme';
import styles from './styles';
import { View } from 'react-native';

class CometChatConversationListWithMessages extends React.Component {
  loggedInUser = null;

  constructor(props) {
    super(props);
    this.state = {
      darktheme: false,
      viewdetailscreen: false,
      item: {},
      type: '',
      tab: 'conversations',
      groupToDelete: {},
      groupToLeave: {},
      groupToUpdate: {},
      composedthreadmessage: {},
      incomingCall: null,
      outgoingCall: null,
      messageToMarkRead: {},
      callmessage: {},
      sidebarview: false,
      imageView: null,
      groupmessage: {},
      lastmessage: {},
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
      .catch(() => {
        // console.log('[CometChatConversationListWithMessages] getLoggedInUser error', error);
      });
  }

  changeTheme = () => {
    const themee = this.state.darktheme;
    this.setState({ darktheme: !themee });
  };

  itemClicked = (item, type) => {
    this.setState({ item: { ...item }, type, viewdetailscreen: false }, () => {
      this.props.navigation.navigate('CometChatMessages', {
        theme: this.theme,
        item: { ...item },
        tab: this.state.tab,
        type,
        composedthreadmessage: this.state.composedthreadmessage,
        callmessage: this.state.callmessage,
        loggedInUser: this.loggedInUser,
        actionGenerated: this.actionHandler,
      });
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
      case 'threadMessageComposed':
        // this.onThreadMessageComposed(item);
        this.updateLastMessage(item[0]);
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
      case 'messageComposed':
      case 'messageEdited':
      case 'messageDeleted':
        this.updateLastMessage(item[0]);
        break;
      default:
        break;
    }
  };

  updateLastMessage = (message) => {
    this.setState({ lastmessage: message });
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

  toggleDetailView = () => {
    const viewdetail = !this.state.viewdetailscreen;
    this.setState({ viewdetailscreen: viewdetail, threadmessageview: false });
  };

  toggleSideBar = () => {
    const { sidebarview } = this.state;
    this.setState({ sidebarview: !sidebarview });
  };

  deleteGroup = (group) => {
    // this.toggleSideBar();
    this.setState({
      groupToDelete: group,
      item: {},
      type: 'group',
      viewdetailscreen: false,
    });
  };

  leaveGroup = (group) => {
    // this.toggleSideBar();
    this.setState({
      groupToLeave: group,
      item: {},
      type: 'group',
      viewdetailscreen: false,
    });
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
          this.setState({
            item: newObj,
            type: 'group',
            viewdetailscreen: false,
          });
        }
        break;
      }
      default:
        break;
    }
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

  callInitiated = (message) => {
    this.appendCallMessage(message);
  };

  rejectedIncomingCall = (incomingCallMessage, rejectedCallMessage) => {
    let { receiverType } = incomingCallMessage;
    let receiverId =
      receiverType === 'user'
        ? incomingCallMessage.sender.uid
        : incomingCallMessage.receiverId;

    // marking the incoming call message as read
    if (
      Object.prototype.hasOwnProperty.call(incomingCallMessage, 'readAt') ===
      false
    ) {
      CometChat.markAsRead(incomingCallMessage.id, receiverId, receiverType);
    }

    // updating unreadcount in chats list
    this.setState({ messageToMarkRead: incomingCallMessage });

    const { item } = this.state;
    const { type } = this.state;

    receiverType = rejectedCallMessage.receiverType;
    receiverId = rejectedCallMessage.receiverId;

    if (
      (type === 'group' &&
        receiverType === 'group' &&
        receiverId === item.guid) ||
      (type === 'user' && receiverType === 'user' && receiverId === item.uid)
    ) {
      this.appendCallMessage(rejectedCallMessage);
    }
  };

  outgoingCallEnded = (message) => {
    this.setState({ outgoingCall: null, incomingCall: null });
    this.appendCallMessage(message);
  };

  appendCallMessage = (call) => {
    this.setState({ callmessage: call });
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
      <View style={styles.chatScreenStyle}>
        <View style={styles.chatScreenSidebarStyle}>
          <CometChatConversationList
            theme={this.theme}
            item={this.state.item}
            type={this.state.type}
            groupToDelete={this.state.groupToDelete}
            groupToLeave={this.state.groupToLeave}
            groupToUpdate={this.state.groupToUpdate}
            messageToMarkRead={this.state.messageToMarkRead}
            onItemClick={this.itemClicked}
            lastMessage={this.state.lastmessage}
            actionGenerated={this.actionHandler}
            enableCloseMenu={Object.keys(this.state.item).length}
            navigation={this.props.navigation}
          />
        </View>
        {/* {threadMessageView} */}
        {imageView}
        <CometChatIncomingCall
          theme={this.theme}
          loggedInUser={this.loggedInUser}
          actionGenerated={this.actionHandler}
          outgoingCall={this.state.outgoingCall}
        />
        <CometChatOutgoingCall
          theme={this.theme}
          item={this.state.item}
          type={this.state.type}
          incomingCall={this.state.incomingCall}
          outgoingCall={this.state.outgoingCall}
          loggedInUser={this.loggedInUser}
          actionGenerated={this.actionHandler}
        />
      </View>
    );
  }
}

export default CometChatConversationListWithMessages;
