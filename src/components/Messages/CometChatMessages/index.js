/* eslint-disable react/no-unused-state */
/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import {
  View,
  SafeAreaView,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import * as actions from '../../../utils/actions';
import _ from 'lodash';
import {
  CometChatContextProvider,
  CometChatContext,
} from '../../../utils/CometChatContext';
import CometChatUserDetails from '../../Users/CometChatUserDetails';
import CometChatLiveReactions from '../CometChatLiveReactions';
import CometChatMessageHeader from '../CometChatMessageHeader';
import CometChatMessageList from '../CometChatMessageList';
import CometChatMessageComposer from '../CometChatMessageComposer';
import CometChatMessageActions from '../CometChatMessageActions';
import CometChatMessageThread from '../CometChatMessageThread';
import {
  CometChatIncomingCall,
  CometChatOutgoingCall,
  CometChatOutgoingDirectCall,
  CometChatIncomingDirectCall,
} from '../../Calls';
import CometChatGroupDetails from '../../Groups/CometChatGroupDetails';
import CometChatVideoViewer from '../CometChatVideoViewer';
import theme from '../../../resources/theme';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import { checkMessageForExtensionsData } from '../../../utils/common';
import DropDownAlert from '../../Shared/DropDownAlert';
import BottomSheet from 'reanimated-bottom-sheet';
import style from './styles';
import CometChatUserProfile from '../../Users/CometChatUserProfile';

class CometChatMessages extends React.PureComponent {
  static contextType = CometChatContext;

  loggedInUser = null;
  constructor(props) {
    super(props);
    const { route } = props;
    const params = route?.params || props;
    this.state = {
      messageList: [],
      scrollToBottom: true,
      messageToBeEdited: '',
      replyPreview: null,
      tab: 'conversations',
      item: params.item,
      liveReaction: false,
      messageToReact: null,
      threadMessageView: false,
      threadMessageType: null,
      threadMessageItem: {},
      threadMessageParent: {},
      userDetailVisible: false,
      groupDetailVisible: false,
      user: params.type === 'user' ? params.item : null,
      showProfile: false,
      ongoingDirectCall: false,
    };

    this.composerRef = React.createRef();
    this.sheetRef = React.createRef(null); /// //ref here

    this.reactionName = props.reaction || 'heart';
    this.theme = { ...theme, ...params.theme };
  }

  componentDidMount() {
    this.checkRestrictions();
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
      })
      .catch(() => {
        // console.log('[CometChatMessages] getLoggedInUser error', error);
      });
  }
  checkRestrictions = async () => {
    let context = this.contextProviderRef.state;
    let isGroupActionMessagesEnabled =
      await context.FeatureRestriction.isGroupActionMessagesEnabled();
    let isCallActionMessagesEnabled =
      await context.FeatureRestriction.isCallActionMessagesEnabled();
    let isOneOnOneChatEnabled =
      await context.FeatureRestriction.isOneOnOneChatEnabled();
    let isGroupChatEnabled =
      await context.FeatureRestriction.isGroupChatEnabled();
    let isHideDeletedMessagesEnabled =
      await context.FeatureRestriction.isHideDeletedMessagesEnabled();
    this.setState({
      restrictions: {
        isGroupActionMessagesEnabled,
        isCallActionMessagesEnabled,
        isOneOnOneChatEnabled,
        isGroupChatEnabled,
        isHideDeletedMessagesEnabled,
      },
    });
  };

  componentDidUpdate(prevProps, prevState) {
    const { route: prevRoute } = prevProps;
    const { route } = this.props;
    const params = route?.params || this.props;
    const prevParams = prevRoute?.params || prevProps;

    if (!prevState.threadMessageView && this.state.threadMessageView) {
      this.sheetRef.current.snapTo(0);
    }
    if (params.type === 'user' && prevParams.item.uid !== params.item.uid) {
      this.setState({
        messageList: [],
        scrollToBottom: true,
        messageToBeEdited: '',
      });
      // this.setUserDetails()
    } else if (
      params.type === 'group' &&
      prevParams.item.guid !== params.item.guid
    ) {
      this.setState({
        messageList: [],
        scrollToBottom: true,
        messageToBeEdited: '',
      });
    } else if (prevParams.type !== params.type) {
      this.setState({
        messageList: [],
        scrollToBottom: true,
        messageToBeEdited: '',
      });
    } else if (
      prevState.composedThreadMessage !== this.state.composedThreadMessage
    ) {
      this.updateReplyCount(this.state.composedThreadMessage);
    } else if (prevParams.callMessage !== params.callMessage) {
      if (prevParams.callMessage.id !== params.callMessage.id) {
        this.actionHandler('callUpdated', params.callMessage);
      }
    }
  }

  deleteGroup = (group) => {
    this.setState(
      {
        groupDetailVisible: false,
        groupToDelete: group,
        item: {},
        type: 'group',
        viewDetailScreen: false,
      },
      () => {
        this.props.route?.params?.actionGenerated('groupDeleted', group) ||
          (this.props.actionGenerated &&
            this.props.actionGenerated('groupDeleted', group));
        this.props.navigation?.goBack();
      },
    );
  };

  leaveGroup = (group) => {
    this.setState(
      {
        groupDetailVisible: false,
        groupToLeave: group,
        item: {},
        type: 'group',
        viewDetailScreen: false,
      },
      () => {
        this.props.navigation?.goBack();
      },
    );
  };

  updateMembersCount = (item, count) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const group = { ...this.state.item, membersCount: count };
    this.setState({ item: group, groupToUpdate: group });
    params.actionGenerated('membersUpdated', item, count);
  };

  actionHandler = (action, messages, key, group, options) => {
    const { route } = this.props;
    const params = route?.params || this.props;
    switch (action) {
      case actions.CUSTOM_MESSAGE_RECEIVED:
      case actions.MESSAGE_RECEIVED:
        {
          const message = messages[0];
          if (message.parentMessageId) {
            this.updateReplyCount(messages);
          } else {
            this.smartReplyPreview(messages);
            this.appendMessage(messages);
          }
        }
        break;
      case actions.GROUP_DELETED:
        this.deleteGroup(messages);
        break;
      case actions.LEFT_GROUP:
        this.leaveGroup(messages);
        break;
      case actions.MEMBERS_UPDATED:
        this.updateMembersCount(messages, key);
        break;
      case actions.MESSAGE_READ:
        params.actionGenerated(action, messages);
        break;
      case actions.MESSAGE_SENT:
      case actions.ERROR_IN_SEND_MESSAGE:
        this.messageSent(messages);
      case actions.MESSAGE_COMPOSED: {
        this.appendMessage(messages);
        break;
      }
      case actions.VIEW_MESSAGE_THREAD:
        this.setState({ messageToReact: null }, () => {
          this.viewMessageThread(messages);
          // route.params.actionGenerated('viewMessageThread', messages);
        });
        break;
      case actions.CLOSE_THREAD_CLICKED:
        this.closeThreadMessages();
        break;
      case actions.MESSAGE_UPDATED: {
        this.updateMessages(messages);
        break;
      }
      case actions.MESSAGE_FETCHED:
        this.prependMessages(messages);
        break;
      case actions.MESSAGE_FETCHED_AGAIN:
        this.prependMessagesAndScrollBottom(messages);
        break;
      case actions.MESSAGE_DELETED:
        this.removeMessages(messages);
        break;
      case actions.THREAD_MESSAGE_DELETED:
        params.actionGenerated(actions.MESSAGE_DELETED, messages);
        break;
      case actions.DELETE_MESSAGE:
        this.setState({ messageToReact: null });
        this.deleteMessage(messages);
        break;
      case actions.EDIT_MESSAGE:
        this.setState({ messageToReact: null });
        this.editMessage(messages);
        break;
      case actions.MESSAGE_EDITED:
        this.messageEdited(messages);
        break;
      case actions.CLEAR_EDIT_PREVIEW:
        this.clearEditPreview();
        break;
      case actions.GROUP_UPDATED:
        this.groupUpdated(messages, key, group, options);
        break;
      case actions.CALL_UPDATED:
        this.callUpdated(messages);
        break;
      case actions.POLL_ANSWERED:
        this.updatePollMessage(messages);
        break;
      case actions.POLL_CREATED:
        this.appendPollMessage(messages);
        break;
      case actions.VIEW_ACTUAL_IMAGE:
        params.actionGenerated(actions.VIEW_ACTUAL_IMAGE, messages);
        break;
      case actions.VIEW_ACTUAL_VIDEO:
        this.setState({ videoMessage: messages });
        break;
      case actions.AUDIO_CALL:
      case actions.VIDEO_CALL:
        if (params.type === CometChat.RECEIVER_TYPE.GROUP) {
          this.setState({ joinDirectCall: false, ongoingDirectCall: true });
        } else {
          params.actionGenerated(action, { ...params.item, type: params.type });
        }
        break;
      case actions.MENU_CLICKED:
        // case actions.JOIN_DIRECT_CALL:
        params.actionGenerated(action);
        break;
      case actions.SEND_REACTION:
        this.toggleReaction(true);
        break;

      case actions.SHOW_REACTION:
        this.showReaction(messages);
        break;
      case actions.STOP_REACTION:
        this.toggleReaction(false);
        break;
      case actions.REACT_TO_MESSAGE:
        this.reactToMessage(messages);
        break;
      case actions.GO_BACK:
        this.props.navigation?.goBack();
        break;
      case actions.CLOSE_DETAIL:
        this.setState({ userDetailVisible: false, groupDetailVisible: false });
        break;
      case actions.VIEW_DETAIL:
        if (params.type === CometChat.RECEIVER_TYPE.USER) {
          this.setState({ userDetailVisible: true });
        } else {
          this.setState({ groupDetailVisible: true });
        }
        break;
      case actions.BLOCK_USER:
        this.blockUser();
        break;
      case actions.UNBLOCK_USER:
        this.unblockUser();
        break;
      case actions.CLOSE_MESSAGE_ACTIONS:
        this.setState({ messageToReact: null });
        break;
      case actions.OPEN_MESSAGE_ACTIONS:
        this.setState({ messageToReact: messages });
        break;
      case actions.UPDATE_THREAD_MESSAGE:
        this.updateThreadMessage(messages[0], key);
        break;
      case actions.THREAD_MESSAGE_COMPOSED:
        this.onThreadMessageComposed(messages);
        params.actionGenerated(actions.THREAD_MESSAGE_COMPOSED, messages);
        // this.updateLastMessage(item[0]);
        break;
      case actions.MEMBER_SCOPE_CHANGED:
        this.memberScopeChanged(messages);
        break;
      case actions.MEMBERS_REMOVED:
        this.membersRemoved(messages);
        break;
      case actions.MEMBERS_ADDED:
        this.membersAdded(messages);
        break;
      case actions.MEMBER_BANNED:
        this.memberBanned(messages);
        break;
      case actions.MEMBER_UNBANNED:
        this.memberUnbanned(messages);
        break;
      case actions.SEND_MESSAGE:
        this.setState({ messageToReact: null });
        this.sendMessage(messages);
        break;
      case actions.SHOW_PROFILE:
        this.showProfile();
        break;
      case actions.JOIN_DIRECT_CALL:
        this.setState({ joinDirectCall: true }, () => {
          this.setState({ ongoingDirectCall: true });
        });
        break;
      case actions.DIRECT_CALL_ENDED:
        this.setState({ joinDirectCall: false, ongoingDirectCall: null });

        break;
      case enums.TRANSIENT_MESSAGE_RECEIVED:
        this.liveReactionReceived(messages);
        break;
      default:
        break;
    }
  };

  sendMessage = (message) => {
    const { route } = this.props;

    const params = route?.params || this.props;

    this.props.navigation.push(enums.NAVIGATION_CONSTANTS.COMET_CHAT_MESSAGES, {
      theme: params.theme,
      item: { ...message.sender },
      type: CometChat.RECEIVER_TYPE.USER,
      loggedInUser: params.loggedInUser,
      actionGenerated: params.actionGenerated,
    });
  };

  showProfile = () => {
    this.setState({
      userDetailVisible: false,
      groupDetailVisible: false,
      showProfile: true,
    });
  };

  messageSent = (message) => {
    const messageList = [...this.state.messageList];

    let messageKey = messageList.findIndex((m) => m._id === message._id);
    if (messageKey > -1) {
      const newMessageObj = { ...message };

      messageList.splice(messageKey, 1, newMessageObj);

      messageList.sort((a, b) => a.id - b.id);
      this.setState({ messageList: [...messageList] });
    }
  };

  memberUnbanned = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
    let filteredMembers = _.uniqBy(members, 'id');
    filteredMembers.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} unbanned ${eachMember.name}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message: message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt: sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ messageList: messageList });
  };

  liveReactionReceived = (reaction) => {
    try {
      const stopReaction = () => {
        this.toggleReaction(false);
      };

      if (reaction.data.type === enums['METADATA_TYPE_LIVEREACTION']) {
        const params = this.props?.route?.params || this.props;

        if (
          (params.type === CometChat.RECEIVER_TYPE.GROUP &&
            reaction.getReceiverId() === params.item.guid) ||
          (params.type === CometChat.RECEIVER_TYPE.USER &&
            reaction.getSender()?.uid === params.item.uid)
        ) {
          this.reactionName = reaction.data.reaction;
          this.toggleReaction(true);

          const liveReactionInterval = 1000;
          setTimeout(stopReaction, liveReactionInterval);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  membersAdded = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
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

    this.setState({ messageList: messageList });
  };

  membersRemoved = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
    let filteredMembers = _.uniqBy(members, 'id');
    filteredMembers.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} kicked ${eachMember.name}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message: message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt: sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ messageList: messageList });
  };

  memberScopeChanged = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
    let filteredMembers = _.uniqBy(members, 'id');
    filteredMembers.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} made ${eachMember.name} ${eachMember.scope}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message: message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt: sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ messageList: messageList });
  };

  memberBanned = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
    members.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} banned ${eachMember.name}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ messageList: messageList });
  };

  closeThreadMessages = () => {
    this.setState({ viewDetailScreen: false, threadMessageView: false });
  };

  viewMessageThread = (parentMessage) => {
    const { route } = this.props;
    const params = route?.params || this.props;
    const message = { ...parentMessage };
    const threadItem = { ...this.state.item };
    this.setState({
      threadMessageView: true,
      threadMessageParent: message,
      threadMessageItem: threadItem,
      threadMessageType: params.type,
      viewDetailScreen: false,
    });
  };

  onThreadMessageComposed = (composedMessage) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    if (params.type !== this.state.threadMessageType) {
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
  };

  blockUser = () => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const usersList = [this.state.item.uid];
    CometChatManager.blockUsers(usersList)
      .then((response) => {
        this.dropDownAlertRef?.showMessage('success', 'Blocked user');
        this.setState({ user: { ...this.state.item, blockedByMe: true } });
        params.actionGenerated('blockUser');
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        console.log('Blocking user fails with error', error);
      });
  };

  unblockUser = () => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const usersList = [this.state.item.uid];
    CometChatManager.unblockUsers(usersList)
      .then(() => {
        this.setState({ user: { ...this.state.item, blockedByMe: false } });
        params.actionGenerated('unblockUser');
      })
      .catch((error) => {
        console.log('unblocking user fails with error', error);
      });
  };

  toggleReaction = (flag) => {
    this.setState({ liveReaction: flag });
  };

  showReaction = (reaction) => {
    if (!Object.prototype.hasOwnProperty.call(reaction, 'metadata')) {
      return false;
    }

    if (
      !Object.prototype.hasOwnProperty.call(reaction.metadata, 'type') ||
      !Object.prototype.hasOwnProperty.call(reaction.metadata, 'reaction')
    ) {
      return false;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        enums.LIVE_REACTIONS,
        reaction.metadata.reaction,
      )
    ) {
      return false;
    }

    if (reaction.metadata.type === enums.LIVE_REACTION_KEY) {
      this.reactionName = reaction.metadata.reaction;
      this.setState({ liveReaction: true });
    }
  };

  updateThreadMessage = (message, action) => {
    if (this.state.threadMessageView === false) {
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

  deleteMessage = (message) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const messageId = message.id;
    CometChat.deleteMessage(messageId)
      .then((deletedMessage) => {
        this.removeMessages([deletedMessage]);

        const messageList = [...this.state.messageList];
        const messageKey = messageList.findIndex((m) => m.id === message.id);

        this.actionHandler('updateThreadMessage', [deletedMessage], 'delete');
        params.actionGenerated(
          'updateThreadMessage',
          [deletedMessage],
          'delete',
        );

        if (messageList.length - messageKey === 1 && !message.replyCount) {
          params.actionGenerated('messageDeleted', [deletedMessage]);
        }
      })
      .catch(() => {});
  };

  editMessage = (message) => {
    this.setState({ messageToBeEdited: message, replyPreview: null });
  };

  messageEdited = (message) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const messageList = [...this.state.messageList];
    const messageKey = messageList.findIndex((m) => m.id === message.id);
    if (messageKey > -1) {
      const messageObj = messageList[messageKey];

      const newMessageObj = { ...messageObj, ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);

      params.actionGenerated('updateThreadMessage', [newMessageObj], 'edit');

      if (messageList.length - messageKey === 1 && !message.replyCount) {
        params.actionGenerated('messageEdited', [newMessageObj]);
      }
    }
  };

  updatePollMessage = (message) => {
    const messageList = [...this.state.messageList];
    const messageId = message.poll.id;
    const messageKey = messageList.findIndex((m) => m.id === messageId);
    if (messageKey > -1) {
      const messageObj = messageList[messageKey];

      const metadataObj = {
        '@injected': { extensions: { polls: message.poll } },
      };

      const newMessageObj = { ...messageObj, metadata: metadataObj };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);
    }
  };

  appendPollMessage = (messages) => {
    this.appendMessage(messages);
  };

  // messages are deleted
  removeMessages = (messages) => {
    const deletedMessage = messages[0];
    const messageList = [...this.state.messageList];

    const messageKey = messageList.findIndex(
      (message) => message.id === deletedMessage.id,
    );
    if (messageKey > -1) {
      const messageObj = { ...messageList[messageKey] };
      const newMessageObj = { ...messageObj, ...deletedMessage };
      if (this.state.restrictions?.isHideDeletedMessagesEnabled) {
        messageList.splice(messageKey, 1);
      } else {
        messageList.splice(messageKey, 1, newMessageObj);
      }
      this.setState({ messageList: messageList, scrollToBottom: false });
    }
  };

  // messages are fetched from backend
  prependMessages = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList, scrollToBottom: false });
  };

  prependMessagesAndScrollBottom = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList, scrollToBottom: true });
  };

  // message is received or composed & sent
  appendMessage = (newMessages = []) => {
    if (
      this.state.messageList &&
      newMessages.length &&
      this.state.messageList.length &&
      this.state.messageList.length &&
      newMessages[newMessages.length - 1].id ===
        this.state.messageList[this.state.messageList.length - 1].id
    ) {
      return;
    }
    let messages = [...this.state.messageList];
    // messages = messages.reverse();
    messages = messages.concat(newMessages);
    messages = _.uniqBy(messages, 'id');

    this.setState({ messageList: messages, scrollToBottom: true });
  };

  // message status is updated
  updateMessages = (messages) => {
    this.setState({ messageList: messages, scrollToBottom: false });
  };

  groupUpdated = (message, key, group, options) => {
    const { route } = this.props;
    const params = route?.params || this.props;

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

    params.actionGenerated('groupUpdated', message, key, group, options);
  };

  callUpdated = (message) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    this.appendMessage([message]);
  };

  updateReplyCount = (messages) => {
    const receivedMessage = messages[0];

    const messageList = [...this.state.messageList];
    const messageKey = messageList.findIndex(
      (m) => m.id === receivedMessage.parentMessageId,
    );
    if (messageKey > -1) {
      const messageObj = messageList[messageKey];
      let replyCount = Object.prototype.hasOwnProperty.call(
        messageObj,
        'replyCount',
      )
        ? messageObj.replyCount
        : 0;
      replyCount += 1;
      const newMessageObj = { ...messageObj, replyCount };

      messageList.splice(messageKey, 1, newMessageObj);
      this.setState({ messageList, scrollToBottom: false });
    }
  };

  smartReplyPreview = (messages) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const message = messages[0];
    if (
      message.sender.uid === params.loggedInUser.uid ||
      message.category === CometChat.MESSAGE_TYPE.CUSTOM
    ) {
      return false;
    }

    const smartReplyData = checkMessageForExtensionsData(
      message,
      'smart-reply',
    );
    if (
      smartReplyData &&
      Object.prototype.hasOwnProperty.call(smartReplyData, 'error') === false
    ) {
      this.setState({ replyPreview: message });
    } else {
      this.setState({ replyPreview: null });
    }
  };

  clearEditPreview = () => {
    this.setState({ messageToBeEdited: '' });
  };

  reactToMessage = (message) => {
    this.setState({ messageToReact: message });
  };

  getConversationId = () => {
    const { route } = this.props;
    const params = route?.params || this.props;
    let conversationId = null;
    if (params.type === CometChat.RECEIVER_TYPE.USER) {
      const users = [this.loggedInUser.uid, params.item.uid];
      conversationId = users.sort().join('_user_');
    } else if (params.type === CometChat.RECEIVER_TYPE.GROUP) {
      conversationId = `group_${params.item.guid}`;
    }

    return conversationId;
  };

  render() {
    const { route } = this.props;
    const params = route?.params || this.props;

    let messageComposer = (
      <CometChatMessageComposer
        ref={(el) => {
          this.composerRef = el;
        }}
        theme={this.theme}
        item={
          params.type === CometChat.RECEIVER_TYPE.USER
            ? this.state.user
            : this.state.item
        }
        type={params.type}
        // widgetsettings={route.params.widgetsettings}
        loggedInUser={this.loggedInUser}
        messageToBeEdited={this.state.messageToBeEdited}
        replyPreview={this.state.replyPreview}
        reaction={this.reactionName}
        messageToReact={this.state.messageToReact}
        actionGenerated={this.actionHandler}
        getConversationId={this.getConversationId}
        showMessage={(type, message) => {
          this.DropDownAlertRef?.showMessage(type, message);
        }}
      />
    );

    if (
      (params.type === CometChat.RECEIVER_TYPE.USER &&
        this.state.restrictions?.isOneOnOneChatEnabled === false) ||
      (params.type === CometChat.RECEIVER_TYPE.GROUP &&
        this.state.restrictions?.isGroupChatEnabled === false)
    ) {
      messageComposer = null;
    }

    let liveReactionView = null;
    if (this.state.liveReaction) {
      liveReactionView = (
        <View style={style.reactionsWrapperStyle}>
          <CometChatLiveReactions
            reactionName={this.reactionName}
            theme={this.theme}
            type={params.type}
            item={
              params.type === CometChat.RECEIVER_TYPE.USER
                ? this.state.user
                : this.state.item
            }
          />
        </View>
      );
    }

    const threadMessageView = (
      <Modal
        transparent
        animated
        animationType="fade"
        visible={this.state.threadMessageView}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <BottomSheet
            ref={this.sheetRef}
            snapPoints={[Dimensions.get('window').height - 80, 0]}
            borderRadius={30}
            initialSnap={0}
            enabledInnerScrolling={true}
            enabledContentTapInteraction={false}
            overdragResistanceFactor={10}
            renderContent={() => {
              return (
                <View
                  style={{
                    backgroundColor: 'white',
                    height: Dimensions.get('window').height - 80,
                  }}>
                  <CometChatMessageThread
                    theme={this.theme}
                    tab={this.state.tab}
                    item={this.state.threadMessageItem}
                    type={this.state.threadMessageType}
                    parentMessage={this.state.threadMessageParent}
                    loggedInUser={this.loggedInUser}
                    actionGenerated={this.actionHandler}
                    getConversationId={this.getConversationId}
                  />
                </View>
              );
            }}
            onCloseEnd={() => {
              this.actionHandler('closeThreadClicked');
            }}
          />
        </View>
      </Modal>
    );

    return (
      <CometChatContextProvider ref={(el) => (this.contextProviderRef = el)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <SafeAreaView style={style.chatWrapperStyle}>
            {this.state.showProfile ? (
              <CometChatUserProfile
                open
                close={() => this.setState({ showProfile: null })}
                url={this.state.user?.link}
              />
            ) : null}
            {this.state.videoMessage ? (
              <CometChatVideoViewer
                open
                close={() => this.setState({ videoMessage: null })}
                message={this.state.videoMessage}
              />
            ) : null}
            {this.state.userDetailVisible ? (
              <CometChatUserDetails
                open={this.state.userDetailVisible}
                theme={this.theme}
                item={
                  params.type === CometChat.RECEIVER_TYPE.USER
                    ? this.state.user
                    : this.state.item
                }
                type={params.type}
                actionGenerated={this.actionHandler}
              />
            ) : null}
            {threadMessageView}
            {this.state.groupDetailVisible ? (
              <CometChatGroupDetails
                theme={this.theme}
                open={this.state.groupDetailVisible}
                item={this.state.item}
                type={params.type}
                actionGenerated={this.actionHandler}
                loggedInUser={this.loggedInUser}
              />
            ) : null}
            <CometChatMessageActions
              item={
                params.type === CometChat.RECEIVER_TYPE.USER
                  ? this.state.user
                  : this.state.item
              }
              loggedInUser={this.loggedInUser}
              open={!!this.state.messageToReact}
              message={this.state.messageToReact}
              actionGenerated={this.actionHandler}
              close={() => {
                this.actionHandler('closeMessageActions');
              }}
            />
            <CometChatMessageHeader
              sidebar={params.sidebar}
              theme={this.theme}
              item={
                params.type === CometChat.RECEIVER_TYPE.USER
                  ? this.state.user
                  : this.state.item
              }
              type={params.type}
              viewdetail={params.viewdetail !== false}
              audioCall={params.audioCall !== false}
              videoCall={params.videoCall !== false}
              // widgetsettings={route.params.widgetsettings}
              loggedInUser={params.loggedInUser}
              actionGenerated={this.actionHandler}
            />
            <CometChatMessageList
              theme={this.theme}
              messages={this.state.messageList}
              item={
                params.type === CometChat.RECEIVER_TYPE.USER
                  ? this.state.user
                  : this.state.item
              }
              type={params.type}
              scrollToBottom={this.state.scrollToBottom}
              messageConfig={params.messageconfig}
              showMessage={(type, message) => {
                this.DropDownAlertRef?.showMessage(type, message);
              }}
              // widgetsettings={route.params.widgetsettings}
              // widgetconfig={route.params.widgetconfig}
              loggedInUser={params.loggedInUser}
              actionGenerated={this.actionHandler}
            />
            {liveReactionView}
            {messageComposer}
          </SafeAreaView>
          <DropDownAlert ref={(ref) => (this.DropDownAlertRef = ref)} />
        </KeyboardAvoidingView>
        {this.state.ongoingDirectCall ? (
          <>
            <CometChatOutgoingDirectCall
              open
              close={() => this.actionHandler(actions.DIRECT_CALL_ENDED)}
              theme={this.theme}
              item={this.state.item}
              type={params.type}
              lang={this.state.lang}
              callType={CometChat.CALL_TYPE.VIDEO}
              joinDirectCall={this.state.joinDirectCall}
              loggedInUser={params.loggedInUser}
              actionGenerated={this.actionHandler}
            />
          </>
        ) : null}
      </CometChatContextProvider>
    );
  }
}

export default CometChatMessages;
