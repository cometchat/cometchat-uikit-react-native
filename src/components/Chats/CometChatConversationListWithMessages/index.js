/* eslint-disable react/no-unused-state */
/* eslint-disable no-bitwise */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import DropDownAlert from '../../Shared/DropDownAlert';
import * as actions from '../../../utils/actions';
import { CometChatConversationList } from '../index';
import {
  CometChatIncomingCall,
  CometChatOutgoingCall,
  CometChatOutgoingDirectCall,
  CometChatIncomingDirectCall,
} from '../../Calls';
import { CometChatImageViewer } from '../../Messages';
import theme from '../../../resources/theme';
import { View } from 'react-native';
import { logger } from '../../../utils/common';

const readAt = 'readAt';

class CometChatConversationListWithMessages extends React.Component {
  loggedInUser = null;

  constructor(props) {
    super(props);
    this.state = {
      darkTheme: false,
      viewDetailScreen: false,
      item: {},
      type: '',
      tab: 'conversations',
      groupToDelete: {},
      groupToLeave: {},
      groupToUpdate: {},
      composedThreadMessage: {},
      incomingCall: null,
      outgoingCall: null,
      messageToMarkRead: {},
      callMessage: {},
      sideBarView: false,
      imageView: null,
      groupMessage: {},
      lastMessage: {},
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
      .catch((error) => {
        logger(
          '[CometChatConversationListWithMessages] getLoggedInUser error',
          error,
        );
      });
  }

  changeTheme = () => {
    const theme = this.state.darkTheme;
    this.setState({ darkTheme: !theme });
  };

  /**
   * Handle clicking on the item
   * - navigate to COMET_CHAT_MESSAGES screen
   * @param item: conversation item clicked
   * @param type: clicked conversation type - "user" or "group"
   */
  itemClicked = (item, type) => {
    this.setState({ item: { ...item }, type, viewDetailScreen: false }, () => {
      this.props.navigation.navigate(
        enums.NAVIGATION_CONSTANTS.COMET_CHAT_MESSAGES,
        {
          theme: this.theme,
          item: { ...item },
          tab: this.state.tab,
          type,
          composedThreadMessage: this.state.composedThreadMessage,
          callMessage: this.state.callMessage,
          loggedInUser: this.loggedInUser,
          actionGenerated: this.actionHandler,
        },
      );
    });
  };

  /**
   * Handles actions from components
   * @param action: action names
   * @param item: item to be updated
   * @param count
   * @param otherProps: for some of the functions
   */
  actionHandler = (action, item, count, ...otherProps) => {
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
        this.setState({ joinDirectCall: false }, () => {
          this.videoCall(true);
        });
        break;
      case actions.VIEW_DETAIL:
      case actions.CLOSE_DETAIL_CLICKED:
        this.toggleDetailView();
        break;
      case actions.MENU_CLICKED:
        this.toggleSideBar();
        this.setState({ item: {} });
        break;
      case actions.GROUP_UPDATED:
        this.groupUpdated(item, count, ...otherProps);
        break;
      case actions.GROUP_DELETED:
        this.deleteGroup(item);
        break;
      case actions.LEFT_GROUP:
        this.leaveGroup(item, ...otherProps);
        break;
      case actions.MEMBERS_UPDATED:
        this.updateMembersCount(item, count);
        break;
      case actions.THREAD_MESSAGE_COMPOSED:
        this.updateLastMessage(item[0]);
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
        this.appendCallMessage(item);
        break;
      case actions.VIEW_ACTUAL_IMAGE:
        this.toggleImageView(item);
        break;
      case actions.MEMBERS_ADDED:
        this.membersAdded(item);
        break;
      case actions.MEMBER_UNBANNED:
        this.memberUnbanned(item);
        break;
      case actions.MEMBER_SCOPE_CHANGED:
        this.memberScopeChanged(item);
        break;
      case actions.MESSAGE_COMPOSED:
      case actions.MESSAGE_EDITED:
      case actions.MESSAGE_DELETED:
        this.updateLastMessage(item[0]);
        break;
      case actions.JOIN_DIRECT_CALL:
        this.setState({ joinDirectCall: true }, () => {
          this.videoCall(true);
        });
        break;
      case actions.DIRECT_CALL_ENDED:
        this.setState(
          { joinDirectCall: false, ongoingDirectCall: null },
          () => {
            this.props.navigation.navigate(
              enums.NAVIGATION_CONSTANTS.COMET_CHAT_MESSAGES,
              {
                theme: this.theme,
                item: { ...this.state.item },
                tab: this.state.tab,
                type: this.state.type,
                composedThreadMessage: this.state.composedThreadMessage,
                callMessage: this.state.callMessage,
                loggedInUser: this.loggedInUser,
                actionGenerated: this.actionHandler,
              },
            );
          },
        );

        break;
      case actions.ACCEPT_DIRECT_CALL:
        this.setState({ joinDirectCall: true }, () => {
          this.videoCall(true);
        });
      default:
        break;
    }
  };

  /**
   * Update last message
   * @param message: message object
   */
  updateLastMessage = (message) => {
    this.setState({ lastMessage: message });
  };

  /**
   * Handle blocking a user
   * @param
   */
  blockUser = () => {
    try {
      const usersList = [this.state.item.uid];
      CometChatManager.blockUsers(usersList)
        .then((response) => {
          this.setState({ item: { ...this.state.item, blockedByMe: true } });
        })
        .catch((error) => {
          logger('Blocking user fails with error', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle unblocking a user
   * @param
   */
  unblockUser = () => {
    try {
      const usersList = [this.state.item.uid];
      CometChatManager.unblockUsers(usersList)
        .then((response) => {
          if (response) {
            this.dropDownAlertRef?.showMessage('success', 'Unblocked user');
            this.setState({
              item: { ...this.state.item, blockedByMe: false },
            });
          } else {
            this.dropDownAlertRef?.showMessage(
              'success',
              'Failed to unblocked user',
            );
          }
        })
        .catch((error) => {
          logger('unblocking user fails with error', error);
          const errorCode = error?.message || 'ERROR';
          this.dropDownAlertRef?.showMessage('error', errorCode);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle initiating an audio call
   * @param
   */
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
        .catch((error) => {
          logger('Call initialization failed with exception:', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle initiating a video call
   * @param
   */

  videoCall = (flag) => {
    try {
      let receiverId;
      let receiverType;
      if (this.state.type === CometChat.RECEIVER_TYPE.GROUP) {
        this.setState({ ongoingDirectCall: flag });

        return;
      }
      receiverId = this.state.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;

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
   * Toggle detail view
   * @param
   */
  toggleDetailView = () => {
    const viewDetail = !this.state.viewDetailScreen;
    this.setState({ viewDetailScreen: viewDetail, threadMessageView: false });
  };

  /**
   * Toggle side bar
   * @param
   */
  toggleSideBar = () => {
    const { sideBarView } = this.state;
    this.setState({ sideBarView: !sideBarView });
  };

  /**
   * Handle deleting a group
   * @param
   */
  deleteGroup = (group) => {
    this.setState({
      groupToDelete: group,
      item: {},
      type: 'group',
      viewDetailScreen: false,
    });
  };

  /**
   * Handle leaving a group
   * @param
   */
  leaveGroup = (group) => {
    this.setState({
      groupToLeave: group,
      item: {},
      type: 'group',
      viewDetailScreen: false,
    });
  };

  /**
   * Handle updating members count
   * @param
   */
  updateMembersCount = (item, count) => {
    const group = { ...this.state.item, membersCount: count };
    this.setState({ item: group, groupToUpdate: group });
  };

  /**
   * Handle changes related to groups
   * @param message: message object
   * @param key: action name
   * @param group: group object
   * @param options: details for certain actions
   */
  groupUpdated = (message, key, group, options) => {
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
  };

  /**
   * Accept an incoming call
   * @param call: call object
   */
  acceptIncomingCall = (call) => {
    try {
      this.setState({ incomingCall: call });

      const type = call.receiverType;
      const id = type === 'user' ? call.sender.uid : call.receiverId;

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
   * Handle call initiated
   * @param
   */
  callInitiated = (message) => {
    this.appendCallMessage(message);
  };

  /**
   * Handle rejecting incoming call and append call message
   * @param
   */
  rejectedIncomingCall = (incomingCallMessage, rejectedCallMessage) => {
    try {
      let { receiverType } = incomingCallMessage;
      let receiverId =
        receiverType === 'user'
          ? incomingCallMessage.sender.uid
          : incomingCallMessage.receiverId;

      // marking the incoming call message as read
      if (
        Object.prototype.hasOwnProperty.call(incomingCallMessage, readAt) ===
        false
      ) {
        CometChat.markAsRead(incomingCallMessage.id, receiverId, receiverType);
      }

      // updating unread count in chats list
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
    } catch (error) {
      logger(error);
    }
  };

  /**
   * On outgoing call ended
   * - append call message
   * @param message: message object
   */
  outgoingCallEnded = (message) => {
    this.setState({ outgoingCall: null, incomingCall: null });
    this.appendCallMessage(message);
  };

  /**
   * Append call message
   * @param call: call object
   */
  appendCallMessage = (call) => {
    this.setState({ callMessage: call });
  };

  /**
   * Toggle image view
   * @param
   */
  toggleImageView = (message) => {
    this.setState({ imageView: message });
  };

  /**
   * Add message on member added to a group
   * @param members: array of member objects
   */
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

    this.setState({ groupMessage: messageList });
  };

  /**
   * Add message on member unbanned from a group
   * @param members: array of member objects
   */
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

    this.setState({ groupMessage: messageList });
  };

  /**
   * Add message on member scope changed from a group
   * @param members: array of member objects
   */
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

    this.setState({ groupMessage: messageList });
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
      <View style={{}}>
        <View style={{}}>
          <CometChatConversationList
            theme={this.theme}
            item={this.state.item}
            type={this.state.type}
            groupToDelete={this.state.groupToDelete}
            groupToLeave={this.state.groupToLeave}
            groupToUpdate={this.state.groupToUpdate}
            messageToMarkRead={this.state.messageToMarkRead}
            onItemClick={this.itemClicked}
            lastMessage={this.state.lastMessage}
            actionGenerated={this.actionHandler}
            enableCloseMenu={Object.keys(this.state.item).length}
            navigation={this.props.navigation}
          />
        </View>
        {imageView}
        <CometChatIncomingCall
          showMessage={(type, message) => {
            this.dropDownAlertRef?.showMessage(type, message);
          }}
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

        <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />

        <CometChatIncomingDirectCall
          theme={this.props.theme}
          lang={this.state.lang}
          actionGenerated={this.actionHandler}
        />
        {this.state.ongoingDirectCall ? (
          <CometChatOutgoingDirectCall
            open
            close={() => this.actionHandler(actions.DIRECT_CALL_ENDED)}
            theme={this.props.theme}
            item={this.state.item}
            type={this.state.type}
            lang={this.state.lang}
            callType={CometChat.CALL_TYPE.VIDEO}
            joinDirectCall={this.state.joinDirectCall}
            loggedInUser={this.loggedInUser}
            actionGenerated={this.actionHandler}
          />
        ) : null}
      </View>
    );
  }
}

export default CometChatConversationListWithMessages;
