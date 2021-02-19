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
      darkTheme: false,
      viewDetailScreen: false,
      item: {},
      type: 'group',
      tab: 'groups',
      groupToDelete: {},
      groupToLeave: {},
      groupToUpdate: {},
      threadMessageView: false,
      threadMessageType: null,
      threadMessageItem: {},
      threadMessageParent: {},
      composedThreadMessage: {},
      incomingCall: null,
      outgoingCall: null,
      callMessage: {},
      sidebarView: false,
      imageView: null,
      groupMessage: {},
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
    this.setState({ item: { ...item }, type, viewDetailScreen: false }, () => {
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
      callMessage: this.state.callMessage,
      actionGenerated: this.actionHandler,
      composedThreadMessage: this.state.composedThreadMessage,
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
      this.state.threadMessageView === false ||
      message.id !== this.state.threadMessageParent.id
    ) {
      return false;
    }

    if (action === 'delete') {
      this.setState({ threadMessageParent: { ...message }, threadMessageView: false });
    } else {
      this.setState({ threadMessageParent: { ...message } });
    }
  };

  blockUser = () => {
    try {
      const usersList = [this.state.item.uid];
      CometChatManager.blockUsers(usersList)
        .then(() => {
          this.setState({ item: { ...this.state.item, blockedByMe: true } });
        })
        .catch(() => {
          // console.log('Blocking user fails with error', error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  unblockUser = () => {
    try {
      const usersList = [this.state.item.uid];
      CometChatManager.unblockUsers(usersList)
        .then(() => {
          this.setState({ item: { ...this.state.item, blockedByMe: false } });
        })
        .catch(() => {
          // console.log('unblocking user fails with error', error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  audioCall = () => {
    try {
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
    } catch (error) {
      console.log(error);
    }
  };

  videoCall = () => {
    try {
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
    } catch (error) {
      console.log(error);
    }
  };

  toggleSideBar = () => {
    const { sidebarView } = this.state;
    this.setState({ sidebarView: !sidebarView });
  };

  toggleDetailView = () => {
    const viewDetail = !this.state.viewDetailScreen;
    this.setState({ viewDetailScreen: viewDetail, threadMessageView: false });
  };

  deleteGroup = (group) => {
    this.setState({ groupToDelete: group, item: {}, type: 'group', viewDetailScreen: false });
  };

  leaveGroup = (group) => {
    this.setState({ groupToLeave: group, item: {}, type: 'group', viewDetailScreen: false });
  };

  updateMembersCount = (item, count) => {
    const group = { ...this.state.item, membersCount: count };
    this.setState({ item: group, groupToUpdate: group });
  };

  groupUpdated = (message, key, group, options) => {
    try {
      switch (key) {
        case enums.GROUP_MEMBER_BANNED:
        case enums.GROUP_MEMBER_KICKED: {
          if (options.user.uid === this.loggedInUser.uid) {
            this.setState({ item: {}, type: 'group', viewDetailScreen: false });
          }
          break;
        }
        case enums.GROUP_MEMBER_SCOPE_CHANGED: {
          if (options.user.uid === this.loggedInUser.uid) {
            const newObj = { ...this.state.item, scope: options.scope };
            this.setState({
              item: newObj,
              type: 'group',
              viewDetailScreen: false,
            });
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  };

  closeThreadMessages = () => {
    this.setState({ viewDetailScreen: false, threadMessageView: false });
  };

  viewMessageThread = (parentMessage) => {
    const message = { ...parentMessage };
    const threadItem = { ...this.state.item };
    this.setState({
      threadMessageView: true,
      threadMessageParent: message,
      threadMessageItem: threadItem,
      threadMessageType: this.state.type,
      viewDetailScreen: false,
    });
  };

  onThreadMessageComposed = (composedMessage) => {
    try {
      if (this.state.type !== this.state.threadMessageType) {
        return false;
      }

      if (
        (this.state.threadMessageType === 'group' &&
          this.state.item.guid !== this.state.threadMessageItem.guid) ||
        (this.state.threadMessageType === 'user' &&
          this.state.item.uid !== this.state.threadMessageItem.uid)
      ) {
        return false;
      }

      const message = { ...composedMessage };
      this.setState({ composedThreadMessage: message });
    } catch (error) {
      console.log(error);
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

  rejectedIncomingCall = (incomingCallMessage, rejectedCallMessage) => {
    try {
      let { receiverType } = incomingCallMessage;
      let receiverId =
        receiverType === 'user'
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
        (type === 'group' &&
          receiverType === 'group' &&
          receiverId === item.guid) ||
        (type === 'user' && receiverType === 'user' && receiverId === item.uid)
      ) {
        this.appendCallMessage(rejectedCallMessage);
      }
    } catch (error) {
      console.log(error);
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
    try {
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

      this.setState({ groupMessage: messageList });
    } catch (error) {
      console.log(error);
    }
  };

  memberUnbanned = (members) => {
    try {
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

      this.setState({ groupMessage: messageList });
    } catch (error) {
      console.log(error);
    }
  };

  memberScopeChanged = (members) => {
    try {
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

      this.setState({ groupMessage: messageList });
    } catch (error) {
      console.log(error);
    }
  };

  appendCallMessage = (call) => {
    const { item, type } = this.state;
    this.setState({ callMessage: call }, () => {
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
