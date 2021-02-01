/* eslint-disable react/no-unused-state */
/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import { View, SafeAreaView, Modal, Dimensions,KeyboardAvoidingView } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import _ from 'lodash';
import { CometChatUserDetails } from '../../Users';
import {
  CometChatLiveReactions,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
  CometChatMessageActions,
  CometChatMessageThread,
} from '../index';
import { CometChatGroupDetails } from '../../Groups';

import theme from '../../../resources/theme';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import { checkMessageForExtensionsData, validateWidgetSettings } from '../../../utils/common';

import BottomSheet from 'reanimated-bottom-sheet';
import style from './styles';

class CometChatMessages extends React.PureComponent {
  loggedInUser = null;

  constructor(props) {
    super(props);
    const { route } = props;

    this.state = {
      messageList: [],
      scrollToBottom: true,
      messageToBeEdited: '',
      replyPreview: null,
      tab: 'conversations',
      item: route.params.item,
      liveReaction: false,
      messageToReact: null,
      threadmessageview: false,
      threadmessagetype: null,
      threadmessageitem: {},
      threadmessageparent: {},
      userDetailVisible: false,
      groupDetailVisible: false,
      user: route.params.type === 'user' ? route.params.item : null,
    };

    this.composerRef = React.createRef();
    this.sheetRef = React.createRef(null); /// //ref here

    this.reactionName = props.reaction || 'heart';
    this.theme = { ...theme, ...route.params.theme };
  }

  componentDidMount() {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
      })
      .catch(() => {
        // console.log('[CometChatMessages] getLoggedInUser error', error);
      });
  }

  componentDidUpdate(prevProps, prevState) {
    const { route: prevRoute } = prevProps;
    const { route } = this.props;
    if (!prevState.threadmessageview && this.state.threadmessageview) {
      this.sheetRef.current.snapTo(0);
    }
    if (
      route.params.type === 'user' &&
      prevRoute.params.item.uid !== route.params.item.uid
    ) {
      this.setState({
        messageList: [],
        scrollToBottom: true,
        messageToBeEdited: '',
      });
      // this.setUserDetails()
    } else if (
      route.params.type === 'group' &&
      prevRoute.params.item.guid !== route.params.item.guid
    ) {
      this.setState({
        messageList: [],
        scrollToBottom: true,
        messageToBeEdited: '',
      });
    } else if (prevRoute.params.type !== route.params.type) {
      this.setState({
        messageList: [],
        scrollToBottom: true,
        messageToBeEdited: '',
      });
    } else if (
      prevState.composedthreadmessage !== this.state.composedthreadmessage
    ) {
      this.updateReplyCount(this.state.composedthreadmessage);
    } else if (prevRoute.params.callmessage !== route.params.callmessage) {
      if (prevRoute.params.callmessage.id !== route.params.callmessage.id) {
        this.actionHandler('callUpdated', route.params.callmessage);
      }
    } else if (prevRoute.params.groupmessage !== route.params.groupmessage) {
      if (
        validateWidgetSettings(
          route.params.widgetsettings,
          'hide_join_leave_notifications',
        ) !== true
      ) {
        this.appendMessage(route.params.groupmessage);
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
        viewdetailscreen: false,
      },
      () => {
        this.props.route.params.actionGenerated('groupDeleted', group);
        this.props.navigation.goBack();
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
        viewdetailscreen: false,
      },
      () => {
        this.props.navigation.goBack();
      },
    );
  };

  updateMembersCount = (item, count) => {
    const {route} = this.props;
    const group = { ...this.state.item, membersCount: count };
    this.setState({ item: group, groupToUpdate: group });
    route.params.actionGenerated('membersUpdated',item,count);
  };

  // groupUpdated = (message, key, group, options) => {
    
  // };

  actionHandler = (action, messages, key, group, options) => {
    const { route } = this.props;

    switch (action) {
      case 'customMessageReceived':
      case 'messageReceived':
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
      case 'groupDeleted':
        this.deleteGroup(messages);
        break;
      case 'leftGroup':
        this.leaveGroup(messages);
        break;
      case 'membersUpdated':
        this.updateMembersCount(messages, key);
        break;
      case 'messageRead':
        route.params.actionGenerated(action, messages);
        break;
      case 'messageComposed': {
        this.appendMessage(messages);
        route.params.actionGenerated('messageComposed', messages);
        break;
      }
      case 'viewMessageThread':
        this.setState({ messageToReact: null }, () => {
          this.viewMessageThread(messages);
          // route.params.actionGenerated('viewMessageThread', messages);
        });
        break;
      case 'closeThreadClicked':
        this.closeThreadMessages();
        break;
      case 'messageUpdated': {
        this.updateMessages(messages);
        break;
      }
      case 'messageFetched':
        this.prependMessages(messages);
        break;
      case 'messageFetchedAgain':
        this.prependMessagesAndScrollBottom(messages);
        break;
      case 'messageDeleted':
        this.removeMessages(messages);
        break;
      case 'threadMessageDeleted':
        route.params.actionGenerated('messageDeleted', messages);
        break;
      case 'deleteMessage':
        this.setState({ messageToReact: null });
        this.deleteMessage(messages);
        break;
      case 'editMessage':
        this.setState({ messageToReact: null });
        this.editMessage(messages);
        break;
      case 'messageEdited':
        this.messageEdited(messages);
        break;
      case 'clearEditPreview':
        this.clearEditPreview();
        break;
      case 'groupUpdated':
        this.groupUpdated(messages, key, group, options);
        break;
      case 'callUpdated':
        this.callUpdated(messages);
        break;
      case 'pollAnswered':
        this.updatePollMessage(messages);
        break;
      case 'pollCreated':
        this.appendPollMessage(messages);
        break;
      case 'viewActualImage':
        route.params.actionGenerated('viewActualImage', messages);
        break;
      case 'audioCall':
      case 'videoCall':
      case 'menuClicked':
        route.params.actionGenerated(action);
        break;
      case 'sendReaction':
        this.toggleReaction(true);
        break;
      case 'showReaction':
        this.showReaction(messages);
        break;
      case 'stopReaction':
        this.toggleReaction(false);
        break;
      case 'reactToMessage':
        this.reactToMessage(messages);
        break;
      case 'goBack':
        this.props.navigation.goBack();
        break;
      case 'closeDetail':
        this.setState({ userDetailVisible: false, groupDetailVisible: false });
        break;
      case 'viewDetail':
        if (route.params.type === 'user') {
          this.setState({ userDetailVisible: true });
        } else {
          this.setState({ groupDetailVisible: true });
        }
        break;
      case 'blockUser':
        this.blockUser();
        break;
      case 'unblockUser':
        this.unblockUser();
        break;
      case 'closeMessageActions':
        this.setState({ messageToReact: null });
        break;
      case 'openMessageActions':
        this.setState({ messageToReact: messages });
        break;
      case 'updateThreadMessage':
        this.updateThreadMessage(messages[0], key);
        break;
      case 'threadMessageComposed':
        this.onThreadMessageComposed(messages);
        route.params.actionGenerated('threadMessageComposed', messages);
        // this.updateLastMessage(item[0]);
        break;
      case 'memberScopeChanged':
        this.memberScopeChanged(messages);
        break;
      case 'membersRemoved':
        this.membersRemoved(messages);
        break;
      case 'membersAdded':
        this.membersAdded(messages);
        break;
      case 'memberBanned':
        this.memberBanned(messages);
        break;
      case 'memberUnbanned':
        this.memberUnbanned(messages);
        break;
      default:
        break;
    }
  };

  memberUnbanned = (members) => {
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

  membersAdded = (members) => {
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
    // const {route} = this.props;
    // route.params.actionGenerated('', { ...message, conversationId: item.guid });
  };

  membersRemoved = (members) => {
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
    const messageList = [...this.state.messageList];
    let filteredMembers = _.uniqBy(members, 'id');
    filteredMembers.forEach((eachMember) => {
      // console.log(this.loggedInUser.name,);
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

  // memberUnbanned = (members) => {
  //   const messageList = [...this.state.messageList];
  //   members.forEach((eachMember) => {
  //     const message = `${this.loggedInUser.name} unbanned ${eachMember.name}`;
  //     const sentAt = (new Date() / 1000) | 0;
  //     const messageObj = {
  //       category: 'action',
  //       message,
  //       type: enums.ACTION_TYPE_GROUPMEMBER,
  //       sentAt,
  //     };
  //     messageList.push(messageObj);
  //   });

  //   this.setState({ messageList: messageList });
  // };

  memberBanned = (members) => {
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
    this.setState({ viewdetailscreen: false, threadmessageview: false });
  };

  viewMessageThread = (parentMessage) => {
    const { route } = this.props;
    const message = { ...parentMessage };
    const threaditem = { ...this.state.item };
    this.setState({
      threadmessageview: true,
      threadmessageparent: message,
      threadmessageitem: threaditem,
      threadmessagetype: route.params.type,
      viewdetailscreen: false,
    });
  };

  onThreadMessageComposed = (composedMessage) => {
    const { route } = this.props;
    if (route.params.type !== this.state.threadmessagetype) {
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

  blockUser = () => {
    const { route } = this.props;
    const usersList = [this.state.item.uid];
    CometChatManager.blockUsers(usersList)
      .then(() => {
        this.setState({ user: { ...this.state.item, blockedByMe: true } });
        route.params.actionGenerated('blockUser');
      })
      .catch((error) => {
        console.log('Blocking user fails with error', error);
      });
  };

  unblockUser = () => {
    const { route } = this.props;
    const usersList = [this.state.item.uid];
    CometChatManager.unblockUsers(usersList)
      .then(() => {
        this.setState({ user: { ...this.state.item, blockedByMe: false } });
        route.params.actionGenerated('unblockUser');
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
    if (this.state.threadmessageview === false) {
      return false;
    }

    if (action === 'delete') {
      this.setState({
        threadmessageparent: { ...message },
        threadmessageview: false,
      });
    } else {
      this.setState({ threadmessageparent: { ...message } });
    }
  };

  deleteMessage = (message) => {
    const { route } = this.props;
    const messageId = message.id;
    CometChat.deleteMessage(messageId)
      .then((deletedMessage) => {
        this.removeMessages([deletedMessage]);

        const messageList = [...this.state.messageList];
        const messageKey = messageList.findIndex((m) => m.id === message.id);

        this.actionHandler('updateThreadMessage', [deletedMessage], 'delete');
        route.params.actionGenerated(
          'updateThreadMessage',
          [deletedMessage],
          'delete',
        );

        if (messageList.length - messageKey === 1 && !message.replyCount) {
          route.params.actionGenerated('messageDeleted', [deletedMessage]);
        }
      })
      .catch(() => {
        // console.log('Message delete failed with error:', error);
      });
  };

  editMessage = (message) => {
    this.setState({ messageToBeEdited: message, replyPreview: null });
  };

  messageEdited = (message) => {
    const { route } = this.props;
    const messageList = [...this.state.messageList];
    const messageKey = messageList.findIndex((m) => m.id === message.id);
    if (messageKey > -1) {
      const messageObj = messageList[messageKey];

      const newMessageObj = { ...messageObj, ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);

      route.params.actionGenerated(
        'updateThreadMessage',
        [newMessageObj],
        'edit',
      );

      if (messageList.length - messageKey === 1 && !message.replyCount) {
        route.params.actionGenerated('messageEdited', [newMessageObj]);
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
    const messagelist = [...this.state.messageList];

    const messageKey = messagelist.findIndex(
      (message) => message.id === deletedMessage.id,
    );
    if (messageKey > -1) {
      const messageObj = { ...messagelist[messageKey] };
      const newMessageObj = { ...messageObj, ...deletedMessage };

      messagelist.splice(messageKey, 1, newMessageObj);
      this.setState({ messageList: messagelist, scrollToBottom: false });
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
    if (
      validateWidgetSettings(
        route.params.widgetsettings,
        'hide_join_leave_notifications',
      ) !== true
    ) {
      this.appendMessage([message]);
    }

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

    route.params.actionGenerated('groupUpdated', message, key, group, options);
  };

  callUpdated = (message) => {
    const { route } = this.props;
    // if call actions messages are disabled in chat widget
    if (
      validateWidgetSettings(
        route.params.widgetsettings,
        'show_call_notifications',
      ) === false
    ) {
      return false;
    }

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

    const message = messages[0];
    if (
      message.sender.uid === route.params.loggedInUser.uid ||
      message.category === enums.CATEGORY_CUSTOM
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

    // if (this.composerRef) {
    //   this.composerRef.toggleEmojiPicker();
    // }
  };

  render() {
    const { route } = this.props;
    let messageComposer = (
      <CometChatMessageComposer
        ref={(el) => {
          this.composerRef = el;
        }}
        theme={this.theme}
        item={route.params.type === 'user' ? this.state.user : this.state.item}
        type={route.params.type}
        // widgetsettings={route.params.widgetsettings}
        loggedInUser={route.params.loggedInUser}
        messageToBeEdited={this.state.messageToBeEdited}
        replyPreview={this.state.replyPreview}
        reaction={this.reactionName}
        messageToReact={this.state.messageToReact}
        actionGenerated={this.actionHandler}
      />
    );

    // if sending messages are disabled for chat wigdet in dashboard
    if (
      validateWidgetSettings(
        route.params.widgetsettings,
        'enable_sending_messages',
      ) === false
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
          />
        </View>
      );
    }

    const threadMessageView = (
      <Modal
        transparent
        animated
        animationType="fade"
        visible={this.state.threadmessageview}>
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
                    item={this.state.threadmessageitem}
                    type={this.state.threadmessagetype}
                    parentMessage={this.state.threadmessageparent}
                    loggedInUser={this.loggedInUser}
                    actionGenerated={this.actionHandler}
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <SafeAreaView style={style.chatWrapperStyle}>
          {this.state.userDetailVisible ? (
            <CometChatUserDetails
              open={this.state.userDetailVisible}
              theme={this.theme}
              item={
                route.params.type === 'user' ? this.state.user : this.state.item
              }
              type={route.params.type}
              actionGenerated={this.actionHandler}
            />
          ) : null}
          {threadMessageView}
            <CometChatGroupDetails
              theme={this.theme}
              open={this.state.groupDetailVisible}
              item={this.state.item}
              type={route.params.type}
              actionGenerated={this.actionHandler}
              loggedInUser={this.loggedInUser}
            />
          <CometChatMessageActions
            open={!!this.state.messageToReact}
            message={this.state.messageToReact}
            actionGenerated={this.actionHandler}
            close={() => {
              this.actionHandler('closeMessageActions');
            }}
          />
          <CometChatMessageHeader
            sidebar={route.params.sidebar}
            theme={this.theme}
            item={
              route.params.type === 'user' ? this.state.user : this.state.item
            }
            type={route.params.type}
            viewdetail={route.params.viewdetail !== false}
            audiocall={route.params.audiocall !== false}
            videocall={route.params.videocall !== false}
            // widgetsettings={route.params.widgetsettings}
            loggedInUser={route.params.loggedInUser}
            actionGenerated={this.actionHandler}
          />
          <CometChatMessageList
            theme={this.theme}
            messages={this.state.messageList}
            item={
              route.params.type === 'user' ? this.state.user : this.state.item
            }
            type={route.params.type}
            scrollToBottom={this.state.scrollToBottom}
            messageconfig={route.params.messageconfig}
            // widgetsettings={route.params.widgetsettings}
            // widgetconfig={route.params.widgetconfig}
            loggedInUser={route.params.loggedInUser}
            actionGenerated={this.actionHandler}
          />
          {liveReactionView}
          {messageComposer}
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }
}

export default CometChatMessages;
