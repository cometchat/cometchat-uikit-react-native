/* eslint-disable react/no-unused-state */
/* eslint-disable no-shadow */
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';

import { CometChatManager } from '../../../utils/controller';
import { MessageListManager } from './controller';

import * as enums from '../../../utils/enums';
import { validateWidgetSettings } from '../../../utils/common';

import {
  CometChatSenderPollMessageBubble,
  CometChatSenderStickerMessageBubble,
  CometChatReceiverPollMessageBubble,
  CometChatReceiverStickerMessageBubble,
} from '../../Messages/Extensions';
import {
  CometChatActionMessageBubble,
  CometChatDeleteMessageBubble,
  CometChatReceiverVideoMessageBubble,
  CometChatSenderVideoMessageBubble,
  CometChatSenderFileMessageBubble,
  CometChatReceiverFileMessageBubble,
  CometChatSenderAudioMessageBubble,
  CometChatReceiverAudioMessageBubble,
  CometChatSenderImageMessageBubble,
  CometChatReceiverImageMessageBubble,
  CometChatSenderTextMessageBubble,
  CometChatReceiverTextMessageBubble,
} from '../index';
import styles from './styles';

let cDate = null;


class CometChatMessageList extends React.PureComponent {
  loggedInUser = null;

  lastScrollTop = 0;

  times = 0;

  decoratorMessage = 'Loading...';

  constructor(props) {
    super(props);
    this.state = {
      onItemClick: null,
    };

    this.loggedInUser = props.loggedInUser;
    this.messagesEnd = React.createRef();
    this.flatlistRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.parentMessageId) {
      this.MessageListManager = new MessageListManager(
        this.props.widgetsettings,
        this.props.item,
        this.props.type,
        this.props.parentMessageId,
      );
    } else {
      this.MessageListManager = new MessageListManager(
        this.props.widgetsettings,
        this.props.item,
        this.props.type,
      );
    }

    this.getMessages();
    this.MessageListManager.attachListeners(this.messageUpdated);
  }

  componentDidUpdate(prevProps) {
    const previousMessageStr = JSON.stringify(prevProps.messages);
    const currentMessageStr = JSON.stringify(this.props.messages);

    if (
      this.props.type === 'user' &&
      prevProps.item.uid !== this.props.item.uid
    ) {
      this.decoratorMessage = 'Loading...';
      this.MessageListManager.removeListeners();

      if (this.props.parentMessageId) {
        this.MessageListManager = new MessageListManager(
          this.props.widgetsettings,
          this.props.item,
          this.props.type,
          this.props.parentMessageId,
        );
      } else {
        this.MessageListManager = new MessageListManager(
          this.props.widgetsettings,
          this.props.item,
          this.props.type,
        );
      }

      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);
    } else if (
      this.props.type === 'group' &&
      prevProps.item.guid !== this.props.item.guid
    ) {
      this.decoratorMessage = 'Loading...';
      this.MessageListManager.removeListeners();

      if (this.props.parentMessageId) {
        this.MessageListManager = new MessageListManager(
          this.props.widgetsettings,
          this.props.item,
          this.props.type,
          this.props.parentMessageId,
        );
      } else {
        this.MessageListManager = new MessageListManager(
          this.props.widgetsettings,
          this.props.item,
          this.props.type,
        );
      }

      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);
    } else if (prevProps.parentMessageId !== this.props.parentMessageId) {
      this.decoratorMessage = 'Loading...';
      this.MessageListManager.removeListeners();
      this.MessageListManager = new MessageListManager(
        this.props.widgetsettings,
        this.props.item,
        this.props.type,
        this.props.parentMessageId,
      );
      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);
    } else if (previousMessageStr !== currentMessageStr) {
      // if (this.props.scrollToBottom) {
      //   this.scrollToBottom();
      // } else {
      //   this.scrollToBottom(this.lastScrollTop);
      // }
    }
  }

  componentWillUnmount() {
    this.MessageListManager.removeListeners();
    this.MessageListManager = null;
  }

  scrollToBottom = (scrollHeight = 0) => {
    if (this.messagesEnd) {
      this.messagesEnd.scrollTop = this.messagesEnd.scrollHeight - scrollHeight;
    }
  };

  getMessages = (scrollToBottom = false) => {
    /// ///getMessages() here...
    const actionMessages = [];
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        // this.loggedInUser = user;
        this.MessageListManager.fetchPreviousMessages()
          .then((messageList) => {
            if (messageList.length === 0) {
              this.decoratorMessage = 'No messages found';
            }

            messageList.forEach((message) => {
              if (
                message.category === 'action' &&
                message.sender.uid === 'app_system'
              ) {
                actionMessages.push(message);
              }

              // if the sender of the message is not the loggedin user, mark it as read.
              if (
                message.getSender().getUid() !== user.getUid() &&
                !message.getReadAt()
              ) {
                if (message.getReceiverType() === 'user') {
                  CometChat.markAsRead(
                    message.getId().toString(),
                    message.getSender().getUid(),
                    message.getReceiverType(),
                  );
                } else if (message.getReceiverType() === 'group') {
                  CometChat.markAsRead(
                    message.getId().toString(),
                    message.getReceiverId(),
                    message.getReceiverType(),
                  );
                }
              }
              this.props.actionGenerated('messageRead', message);
            });

            let actionGenerated = 'messageFetched';
            if (scrollToBottom === true) {
              actionGenerated = 'messageFetchedAgain';
            }

            ++this.times;

            if (
              (this.times === 1 && actionMessages.length > 5) ||
              (this.times > 1 && actionMessages.length === 30)
            ) {
              this.props.actionGenerated('messageFetched', messageList);
              this.getMessages(true);
            } else {
              // this.lastScrollTop = this.messagesEnd.scrollHeight;
              this.props.actionGenerated(actionGenerated, messageList);
            }
          })
          .catch(() => {
            // TODO Handle the erros in contact list.
            // console.error('[CometChatMessageList] getMessages fetchPrevious error', error);
            this.decoratorMessage = 'Error';
          });
      })
      .catch(() => {
        // console.log('[CometChatMessageList] getMessages getLoggedInUser error', error);
        this.decoratorMessage = 'Error';
      });
  };

  // callback for listener functions
  messageUpdated = (key, message, group, options,actionBy) => {
    switch (key) {
      case enums.MESSAGE_DELETED:
        this.messageDeleted(message);
        break;
      case enums.MESSAGE_EDITED:
        this.messageEdited(message);
        break;
      case enums.MESSAGE_DELIVERED:
      case enums.MESSAGE_READ:
        this.messageReadAndDelivered(message);
        break;
      case enums.TEXT_MESSAGE_RECEIVED:
      case enums.MEDIA_MESSAGE_RECEIVED:
        this.messageReceived(message);
        break;
      case enums.CUSTOM_MESSAGE_RECEIVED:
        this.customMessageReceived(message);
        break;
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
      case enums.GROUP_MEMBER_JOINED:
        case enums.GROUP_MEMBER_LEFT:
        this.groupUpdated(key, message, group, options);
        break;
      case enums.GROUP_MEMBER_ADDED:
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_UNBANNED:
        if (this.loggedInUser.uid !== actionBy.uid)
          this.groupUpdated(key, message, group, options);
        break;
      case enums.INCOMING_CALL_RECEIVED:
      case enums.INCOMING_CALL_CANCELLED:
      case enums.OUTGOING_CALL_ACCEPTED:
      case enums.OUTGOING_CALL_REJECTED:
        this.callUpdated(message);
        break;
      default:
        break;
    }
  };

  messageDeleted = (message) => {
    if (
      this.props.type === 'group' &&
      message.getReceiverType() === 'group' &&
      message.getReceiver().guid === this.props.item.guid
    ) {
      this.props.actionGenerated('messageDeleted', [message]);
    } else if (
      this.props.type === 'user' &&
      message.getReceiverType() === 'user' &&
      message.getSender().uid === this.props.item.uid
    ) {
      this.props.actionGenerated('messageDeleted', [message]);
    }
  };

  messageEdited = (message) => {
    const messageList = [...this.props.messages];
    const updateEditedMessage = (message) => {
      const messageKey = messageList.findIndex((m) => m.id === message.id);

      if (messageKey > -1) {
        const messageObj = messageList[messageKey];
        const newMessageObj = { ...messageObj, ...message };

        messageList.splice(messageKey, 1, newMessageObj);
        this.props.actionGenerated('messageUpdated', messageList);
      }
    };

    if (
      this.props.type === 'group' &&
      message.getReceiverType() === 'group' &&
      message.getReceiver().guid === this.props.item.guid
    ) {
      updateEditedMessage(message);
    } else if (
      this.props.type === 'user' &&
      message.getReceiverType() === 'user' &&
      this.loggedInUser.uid === message.getReceiverId() &&
      message.getSender().uid === this.props.item.uid
    ) {
      updateEditedMessage(message);
    } else if (
      this.props.type === 'user' &&
      message.getReceiverType() === 'user' &&
      this.loggedInUser.uid === message.getSender().uid &&
      message.getReceiverId() === this.props.item.uid
    ) {
      updateEditedMessage(message);
    }
  };

  updateEditedMessage = (message) => {
    const messageList = [...this.props.messages];
    const messageKey = messageList.findIndex((m) => m.id === message.id);

    if (messageKey > -1) {
      const messageObj = messageList[messageKey];
      const newMessageObj = { ...messageObj, ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.props.actionGenerated('messageUpdated', messageList);
    }
  };

  messageReadAndDelivered = (message) => {
    // read receipts
    if (
      message.getReceiverType() === 'user' &&
      message.getSender().getUid() === this.props.item.uid &&
      message.getReceiver() === this.loggedInUser.uid
    ) {
      const messageList = [...this.props.messages];

      if (message.getReceiptType() === 'delivery') {
        // search for message
        const messageKey = messageList.findIndex(
          (m) => m.id === message.messageId,
        );

        if (messageKey > -1) {
          const messageObj = { ...messageList[messageKey] };
          const newMessageObj = {
            ...messageObj,
            deliveredAt: message.getDeliveredAt(),
          };
          messageList.splice(messageKey, 1, newMessageObj);

          this.props.actionGenerated('messageUpdated', messageList);
        }
      } else if (message.getReceiptType() === 'read') {
        // search for message
        const messageKey = messageList.findIndex(
          (m) => m.id === message.messageId,
        );

        if (messageKey > -1) {
          const messageObj = { ...messageList[messageKey] };
          const newMessageObj = { ...messageObj, readAt: message.getReadAt() };
          messageList.splice(messageKey, 1, newMessageObj);

          this.props.actionGenerated('messageUpdated', messageList);
        }
      }
    } else if (
      message.getReceiverType() === 'group' &&
      message.getReceiver().guid === this.props.item.guid
    ) {
      // not implemented
    }
  };

  messageReceived = (message) => {
    // new messages
    if (
      this.props.type === 'group' &&
      message.getReceiverType() === 'group' &&
      message.getReceiverId() === this.props.item.guid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getReceiverId(),
          message.getReceiverType(),
        );
      }

      this.props.actionGenerated('messageReceived', [message]);
    } else if (
      this.props.type === 'user' &&
      message.getReceiverType() === 'user' &&
      message.getSender().uid === this.props.item.uid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getSender().uid,
          message.getReceiverType(),
        );
      }

      this.props.actionGenerated('messageReceived', [message]);
    }
  };

  customMessageReceived = (message) => {
    // new messages
    if (
      this.props.type === 'group' &&
      message.getReceiverType() === 'group' &&
      message.getReceiverId() === this.props.item.guid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getReceiverId(),
          message.getReceiverType(),
        );
      }

      if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
        this.props.actionGenerated('customMessageReceived', [message]);
      } else if (message.type === enums.CUSTOM_TYPE_STICKER) {
        this.props.actionGenerated('customMessageReceived', [message]);
      } else if (message.type === enums.CUSTOM_TYPE_POLL) {
        // customdata (poll extension) does not have metadata

        const newMessage = this.addMetadataToCustomData(message);
        this.props.actionGenerated('customMessageReceived', [newMessage]);
      }
    } else if (
      this.props.type === 'user' &&
      message.getReceiverType() === 'user' &&
      message.getSender().uid === this.props.item.uid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getSender().uid,
          message.getReceiverType(),
        );
      }

      if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
        this.props.actionGenerated('customMessageReceived', [message]);
      } else if (message.type === enums.CUSTOM_TYPE_STICKER) {
        this.props.actionGenerated('customMessageReceived', [message]);
      } else if (message.type === enums.CUSTOM_TYPE_POLL) {
        // customdata (poll extension) does not have metadata

        const newMessage = this.addMetadataToCustomData(message);
        this.props.actionGenerated('customMessageReceived', [newMessage]);
      }
    }
  };

  addMetadataToCustomData = (message) => {
    const { customData } = message.data;
    const { options } = customData;

    const resultOptions = {};
    // for (const option in options) {
    // resultOptions[option] = {
    //   text: options[option],
    //   count: 0,
    //   };
    // }

    options.map((option) => {
      resultOptions[option] = {
        text: options[option],
        count: 0,
      };
    });

    const polls = {
      id: message.id,
      options,
      results: {
        total: 0,
        options: resultOptions,
        question: customData.question,
      },
      question: customData.question,
    };

    return {
      ...message,
      metadata: { '@injected': { extensions: { polls } } },
    };
  };

  callUpdated = (message) => {
    if (
      validateWidgetSettings(
        this.props.widgetsettings,
        'show_call_notifications',
      ) === false
    ) {
      return false;
    }

    if (
      this.props.type === 'group' &&
      message.getReceiverType() === 'group' &&
      message.getReceiverId() === this.props.item.guid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getReceiverId(),
          message.getReceiverType(),
        );
      }

      this.props.actionGenerated('callUpdated', message);
    } else if (
      this.props.type === 'user' &&
      message.getReceiverType() === 'user' &&
      message.getSender().uid === this.props.item.uid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getSender().uid,
          message.getReceiverType(),
        );
      }

      this.props.actionGenerated('callUpdated', message);
    }
  };

  groupUpdated = (key, message, group, options) => {
    if (
      this.props.type === 'group' &&
      message.getReceiverType() === 'group' &&
      message.getReceiver().guid === this.props.item.guid
    ) {
      if (!message.getReadAt()) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getReceiverId(),
          message.getReceiverType(),
        );
      }

      this.props.actionGenerated('groupUpdated', message, key, group, options);
    }
  };

  // handleScroll = (e) => {                                                           ///////scroll handler here.

  //   const scrollTop = e.currentTarget.scrollTop;
  //   this.lastScrollTop = this.messagesEnd.scrollHeight - scrollTop;

  //   const top = Math.round(scrollTop) === 0;
  //   if (top && this.props.messages.length) {
  //     this.getMessages();
  //   }
  // }

  handleClick = (message) => {
    this.props.onItemClick(message, 'message');
  };

  getSenderMessageComponent = (message, key) => {
    let component;

    if (Object.prototype.hasOwnProperty.call(message, 'deletedAt')) {
      component = (
        <CometChatDeleteMessageBubble
          theme={this.props.theme}
          key={key}
          item={this.props.item}
          type={this.props.type}
          message={message}
          messageOf="sender"
        />
      );
    } else {
      switch (message.type) {
        case CometChat.MESSAGE_TYPE.TEXT:
          component = message.text ? (
            <CometChatSenderTextMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = message.data.url ? (
            <CometChatSenderImageMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = message.data.attachments ? (
            <CometChatSenderFileMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = message.data.url ? (
            <CometChatSenderVideoMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = message.data.url ? (
            <CometChatSenderAudioMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        default:
          break;
      }
    }

    return component;
  };

  getReceiverMessageComponent = (message, key) => {
    let component;

    if (Object.prototype.hasOwnProperty.call(message, 'deletedAt')) {
      component = (
        <CometChatDeleteMessageBubble
          theme={this.props.theme}
          key={key}
          message={message}
          messageOf="receiver"
        />
      );
    } else {
      switch (message.type) {
        case 'message':
        case CometChat.MESSAGE_TYPE.TEXT:
          component = message.text ? (
            <CometChatReceiverTextMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = message.data.url ? (
            <CometChatReceiverImageMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = message.data.attachments ? (
            <CometChatReceiverFileMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = message.data.url ? (
            <CometChatReceiverAudioMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = message.data.url ? (
            <CometChatReceiverVideoMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
            />
          ) : null;
          break;
        default:
          break;
      }
    }
    return component;
  };

  getSenderCustomMessageComponent = (message, key) => {
    let component;
    if (Object.prototype.hasOwnProperty.call(message, 'deletedAt')) {
      component = (
        <CometChatDeleteMessageBubble
          theme={this.props.theme}
          key={key}
          item={this.props.item}
          type={this.props.type}
          message={message}
          messageOf="sender"
        />
      );
    } else {
      switch (message.type) {
        case enums.CUSTOM_TYPE_POLL:
          component = (
            <CometChatSenderPollMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              actionGenerated={this.props.actionGenerated}
            />
          );
          break;
        case enums.CUSTOM_TYPE_STICKER:
          component = (
            <CometChatSenderStickerMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              actionGenerated={this.props.actionGenerated}
            />
          );
          break;
        default:
          break;
      }
    }
    return component;
  };

  getReceiverCustomMessageComponent = (message, key) => {
    let component;
    if (Object.prototype.hasOwnProperty.call(message, 'deletedAt')) {
      component = (
        <CometChatDeleteMessageBubble
          theme={this.props.theme}
          key={key}
          item={this.props.item}
          type={this.props.type}
          message={message}
          messageOf="receiver"
        />
      );
    } else {
      switch (message.type) {
        case enums.CUSTOM_TYPE_POLL:
          component = (
            <CometChatReceiverPollMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              actionGenerated={this.props.actionGenerated}
            />
          );
          break;
        case enums.CUSTOM_TYPE_STICKER:
          component = (
            <CometChatReceiverStickerMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetsettings={this.props.widgetsettings}
              actionGenerated={this.props.actionGenerated}
            />
          );
          break;
        default:
          break;
      }
    }

    return component;
  };

  getCallMessageComponent = (message, key) => {
    return (
      <CometChatActionMessageBubble
        message={message}
        key={key}
        theme={this.props.theme}
        loggedInUser={this.loggedInUser}
      />
    );
  };

  getActionMessageComponent = (message, key) => {
    let component = null;
    // console.log("getActionMessageComponent message", message);
    if (message.message) {
      component = (
        <View style={styles.actionMessageStyle} key={key}>
          <Text style={styles.actionMessageTxtStyle}>{message.message}</Text>
        </View>
      );

      // if action messages are set to hide in config
      if (this.props.messageconfig) {
        const found = this.props.messageconfig.find((cfg) => {
          return (
            cfg.action === message.action && cfg.category === message.category
          );
        });

        if (found && found.enabled === false) {
          component = null;
        }
      }
    }

    return component;
  };

  getComponent = (message, key) => {
    let component;

    switch (message.category) {
      case 'action':
        component = this.getActionMessageComponent(message, key);
        break;
      case 'call':
        component = this.getCallMessageComponent(message, key);
        break;
      case 'message':
        if (this.loggedInUser.uid === message.sender.uid) {
          component = this.getSenderMessageComponent(message, key);
        } else {
          component = this.getReceiverMessageComponent(message, key);
        }
        break;
      case 'custom':
        if (this.loggedInUser.uid === message.sender.uid) {
          component = this.getSenderCustomMessageComponent(message, key);
        } else {
          component = this.getReceiverCustomMessageComponent(message, key);
        }
        break;
      default:
        break;
    }

    return component;
  };

  listEmptyComponent = () => {
    return (
      <View style={[styles.chatListStyle]}>
        <View style={styles.decoratorMessageStyle}>
          <Text
            style={[
              styles.decoratorMessageTxtStyle,
              {
                color: `${this.props.theme.color.secondary}`,
              },
            ]}>
            {this.decoratorMessage}
          </Text>
        </View>
      </View>
    );
  };

  renderItem = ({ item, index }) => {
    let messages = [...this.props.messages];
    if (messages.length) {
      messages = messages.reverse();
      if(!cDate){
      cDate = new Date(messages[0].sentAt * 1000).toLocaleDateString();
      }
    }

    const message = item;
    let dateSeparator = null;
    const nextMessage = messages[index + 1];
    const messageSentDate = nextMessage
      ? new Date(nextMessage.sentAt * 1000).toLocaleDateString()
      : null;
    if (cDate !== messageSentDate) {
      dateSeparator = (
        <View
          style={[
            styles.messageDateContainerStyle,
            {
              backgroundColor: `${this.props.theme.backgroundColor.grey}`,
            },
          ]}>
          <Text
            style={[
              styles.messageDateStyle,
              {
                color: `${this.props.theme.color.primary}`,
              },
            ]}>
            {cDate}
          </Text>
        </View>
      );
    }
    cDate =
    messageSentDate ||
    new Date(messages[0].sentAt * 1000).toLocaleDateString();
    return (
      <View>
        {index ? dateSeparator : null}
        {this.getComponent(message)}
      </View>
    );
  };

  render() {
    let messages = [...this.props.messages];
    if (messages.length) {
      messages = messages.reverse();
    }

    return (
        <FlatList
          ref={this.flatlistRef}
          ListEmptyComponent={this.listEmptyComponent}
          onEndReached={() => this.getMessages(true)}
          onEndReachedThreshold={0.3}
          inverted={-1}
          style={{ flex: 1, paddingHorizontal: 5 }}
          contentContainerStyle={!messages.length ? { flex: 1 } : {}}
          ListFooterComponent={
            messages.length && this.props.parentMessageComponent
              ? this.props.parentMessageComponent
              : null
          }
          data={messages}
          renderItem={this.renderItem}
        />
    );
  }
}
export default CometChatMessageList;
