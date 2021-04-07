/* eslint-disable no-bitwise */
/* eslint-disable react/no-unused-state */
import React from 'react';
import { SafeAreaView } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import {
  CometChatIncomingCall,
  CometChatOutgoingCall,
  CometChatOutgoingDirectCall,
  CometChatIncomingDirectCall,
} from '../../Calls';
import { CometChatGroupList } from '../index';
import { CometChatImageViewer } from '../../Messages';

import DropDownAlert from '../../Shared/DropDownAlert';
import theme from '../../../resources/theme';
import style from './styles';
import { logger } from '../../../utils/common';

class CometChatGroupListWithMessages extends React.Component {
  loggedInUser = null;

  constructor(props) {
    super(props);

    this.state = {
      darkTheme: false,
      viewDetailScreen: false,
      item: {},
      type: CometChat.RECEIVER_TYPE.GROUP,
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
      ongoingDirectCall: false,
    };

    this.theme = { ...theme, ...this.props.theme };
  }

  componentDidMount() {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
      })
      .catch((error) => {
        logger('[CometChatGroupListWithMessages] getLoggedInUser error', error);
      });
  }

  /**
   * Update item, viewDetailScreen when a group from groupList is clicked.
   * @param item: item object
   * @param type: group type
   */

  itemClicked = (item, type) => {
    this.setState({ item: { ...item }, type, viewDetailScreen: false }, () => {
      this.navigateToMessageListScreen(item, type);
    });
  };

  /**
   * Navigate to CometChatMessages on clicking of the group item and checking of validations.
   * @param item:item object
   * @param type:group type
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
   * On call initiated by a member
   * @param
   */

  callInitiated = (message) => {
    this.appendCallMessage(message);
  };

  /**
   * On outgoing call end
   * @param
   */

  outgoingCallEnded = (message) => {
    this.setState({ outgoingCall: null, incomingCall: null }, () => {
      this.appendCallMessage(message);
    });
  };

  /**
   * handles various actions related to the updation in groups.
   * @param action: action name
   * @param item: item object
   * @param count: members count
   * @param ...otherProps: props received
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
      // eslint-disable-next-line no-lone-blocks
      case actions.MENU_CLICKED: {
        this.toggleSideBar();
        this.setState({ item: {} });
        break;
      }
      case actions.VIEW_DETAIL:
      case actions.CLOSE_DETAIL_CLICKED:
        this.toggleDetailView();
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
      case actions.VIEW_MESSAGE_THREAD:
        this.viewMessageThread(item);
        break;
      case actions.CLOSE_THREAD_CLICKED:
        this.closeThreadMessages();
        break;
      case actions.THREAD_MESSAGE_COMPOSED:
        this.onThreadMessageComposed(item);
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
      case actions.UPDATE_THREAD_MESSAGE:
        this.updateThreadMessage(item[0], count);
        break;
      case actions.MESSAGE_COMPOSED:
        this.callInitiated(item);
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
   * updation of thread messages on message fetch.
   * @param message: message object
   * @param action: action name
   */

  updateThreadMessage = (message, action) => {
    if (
      this.state.threadMessageView === false ||
      message.id !== this.state.threadMessageParent.id
    ) {
      return false;
    }

    if (action === 'delete') {
      this.setState({
        threadMessageParent: { ...message },
        threadMessageView: false,
      });
    } else {
      this.setState({ threadMessageParent: { ...message } });
    }
  };

  /**
   * block users by logged in user.
   * @param
   */

  blockUser = () => {
    try {
      const usersList = [this.state.item.uid];
      CometChatManager.blockUsers(usersList)
        .then((response) => {
          if (response) {
            this.dropDownAlertRef?.showMessage('success', 'Blocked User');
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
    } catch (error) {
      logger(error);
    }
  };

  /**
   * unblock users by logged in user.
   * @param
   */

  unblockUser = () => {
    try {
      const usersList = [this.state.item.uid];
      CometChatManager.unblockUsers(usersList)
        .then((response) => {
          if (response) {
            this.dropDownAlertRef?.showMessage('success', 'Unblocked user');
            this.setState({ item: { ...this.state.item, blockedByMe: false } });
          } else {
            this.dropDownAlertRef?.showMessage(
              'error',
              'Failed to unblock user',
            );
          }
        })
        .catch((error) => {
          const errorCode = error?.message || 'ERROR';
          this.dropDownAlertRef?.showMessage('error', errorCode);
          logger('unblocking user fails with error', error);
        });
    } catch (error) {
      const errorCode = error?.message || 'ERROR';
      this.dropDownAlertRef?.showMessage('error', errorCode);
      logger(error);
    }
  };

  /**
   * handles audio call to a user/group.
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
        .catch((error) => {
          logger('Call initialization failed with exception:', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handles video call to a user/group.
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

  toggleSideBar = () => {
    const { sidebarView } = this.state;
    this.setState({ sidebarView: !sidebarView });
  };

  /**
   * toggle viewDetailScreen
   * @param
   */

  toggleDetailView = () => {
    const viewDetail = !this.state.viewDetailScreen;
    this.setState({ viewDetailScreen: viewDetail, threadMessageView: false });
  };

  /**
   * handles deletion of group
   * @param group: group object
   */

  deleteGroup = (group) => {
    this.setState({
      groupToDelete: group,
      item: {},
      type: CometChat.RECEIVER_TYPE.GROUP,
      viewDetailScreen: false,
    });
  };

  /**
   * handles the updation when logged in user leaves the group
   * @param group: group object
   */

  leaveGroup = (group) => {
    this.setState({
      groupToLeave: group,
      item: {},
      type: CometChat.RECEIVER_TYPE.GROUP,
      viewDetailScreen: false,
    });
  };

  /**
   * updation of member count of group.
   * @param item:item object
   * @param count: member count
   */

  updateMembersCount = (item, count) => {
    const group = { ...this.state.item, membersCount: count };
    this.setState({ item: group, groupToUpdate: group });
  };

  /**
   * handles the updation of group based on key
   * @param key: action name
   * @param message: message object
   * @param group: group object
   * @param options: options object for member
   */

  groupUpdated = (message, key, group, options) => {
    try {
      switch (key) {
        case enums.GROUP_MEMBER_BANNED:
        case enums.GROUP_MEMBER_KICKED: {
          if (options.user.uid === this.loggedInUser.uid) {
            this.setState({
              item: {},
              type: CometChat.RECEIVER_TYPE.GROUP,
              viewDetailScreen: false,
            });
          }
          break;
        }
        case enums.GROUP_MEMBER_SCOPE_CHANGED: {
          if (options.user.uid === this.loggedInUser.uid) {
            const newObj = { ...this.state.item, scope: options.scope };
            this.setState({
              item: newObj,
              type: CometChat.RECEIVER_TYPE.GROUP,
              viewDetailScreen: false,
            });
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Close thread messages, updation of viewDetailScreen
   * @param
   */

  closeThreadMessages = () => {
    this.setState({ viewDetailScreen: false, threadMessageView: false });
  };

  /**
   * View message thread via parentMessage
   * @param parentMessage: message object
   */
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

  /**
   * Sets composedThreadMessage via composed message param.
   * @param composedMessage: message object
   */

  onThreadMessageComposed = (composedMessage) => {
    try {
      if (this.state.type !== this.state.threadMessageType) {
        return false;
      }

      if (
        (this.state.threadMessageType === CometChat.RECEIVER_TYPE.GROUP &&
          this.state.item.guid !== this.state.threadMessageItem.guid) ||
        (this.state.threadMessageType === CometChat.RECEIVER_TYPE.USER &&
          this.state.item.uid !== this.state.threadMessageItem.uid)
      ) {
        return false;
      }

      const message = { ...composedMessage };
      this.setState({ composedThreadMessage: message });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handles the incoming call when user hits accept
   * @param call
   */

  acceptIncomingCall = (call) => {
    this.setState({ incomingCall: call });

    const type = call.receiverType;
    const id =
      type === CometChat.RECEIVER_TYPE.USER ? call.sender.uid : call.receiverId;

    CometChat.getConversation(id, type)
      .then((conversation) => {
        this.itemClicked(conversation.conversationWith, type);
      })
      .catch((error) => {
        logger('error while fetching a conversation', error);
      });
  };

  /**
   * handles the imcoming call when user hits reject
   * @param incomingCallMessage: incomingCallMessage object
   * @param rejectedCallMessage: rejectedCallMessage object
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
   * on outgoing call end
   * @param message: message object
   */
  outgoingCallEnded = (message) => {
    this.setState({ outgoingCall: null, incomingCall: null });
    this.appendCallMessage(message);
  };

  /**
   * image view when clicked on image
   * @param message: message object
   */
  toggleImageView = (message) => {
    this.setState({ imageView: message });
  };

  /**
   * handler for member added to the group by a user and updation of groupMessage.
   * @param members: members object
   */

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
      logger(error);
    }
  };

  /**
   * handler for member unbanned from the group by a user and updation of groupMessage.
   * @param members: members object
   */

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
      logger(error);
    }
  };

  /**
   * handler for member scope changed in the group by a user and updation of groupMessage.
   * @param members: members object
   */
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
      logger(error);
    }
  };

  /**
   * update callMessage and navigate to cometChatMessages
   * @param call: call object
   */
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
      <SafeAreaView style={style.container}>
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
          showMessage={(type, message) => {
            this.dropDownAlertRef?.showMessage(type, message);
          }}
          theme={this.props.theme}
          loggedInUser={this.loggedInUser}
          outgoingCall={this.state.outgoingCall}
          actionGenerated={this.actionHandler}
        />
        {/* <CometChatOutgoingCall
          theme={this.props.theme}
          item={this.state.item}
          type={this.state.type}
          incomingCall={this.state.incomingCall}
          outgoingCall={this.state.outgoingCall}
          loggedInUser={this.loggedInUser}
          lang={this.state.lang}
          actionGenerated={this.actionHandler}
        /> */}
        <CometChatIncomingDirectCall
          theme={this.props.theme}
          lang={this.state.lang}
          actionGenerated={this.actionHandler}
        />
        <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
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
      </SafeAreaView>
    );
  }
}

export default CometChatGroupListWithMessages;
