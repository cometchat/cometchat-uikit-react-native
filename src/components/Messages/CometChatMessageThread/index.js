/* eslint-disable react/no-did-update-set-state */
/* eslint-disable react/no-unused-state */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import { MessageThreadManager } from './controller';
import {
  CometChatMessageActions,
  CometChatMessageComposer,
  CometChatMessageList,
  CometChatSenderTextMessageBubble,
  CometChatReceiverTextMessageBubble,
  CometChatSenderImageMessageBubble,
  CometChatReceiverImageMessageBubble,
  CometChatSenderFileMessageBubble,
  CometChatReceiverFileMessageBubble,
  CometChatSenderAudioMessageBubble,
  CometChatReceiverAudioMessageBubble,
  CometChatSenderVideoMessageBubble,
  CometChatReceiverVideoMessageBubble,
} from '../index';
import styles from './style';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';

import _ from 'lodash';
import Icon from 'react-native-vector-icons/Ionicons';
import { heightRatio, widthRatio } from '../../../utils/consts';
import { logger } from '../../../utils/common';

class CometChatMessageThread extends React.PureComponent {
  constructor(props) {
    super(props);

    this.MessageThreadManager = new MessageThreadManager();
    this.MessageThreadManager.attachListeners(this.listenerCallback);

    this.composerRef = React.createRef();
    this.loggedInUser = props.loggedInUser;

    this.state = {
      messageList: [],
      scrollToBottom: false,
      replyCount: 0,
      replyPreview: null,
      messageToBeEdited: null,
      parentMessage: props.parentMessage,
      keyboardActivity: false,
    };
  }

  componentDidMount() {
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow,
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide,
    );
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow = (e) => {
    this.setState({
      keyboardActivity: true,
      keyboardHeight: e.endCoordinates.height,
    });
  };

  _keyboardDidHide = () => {
    this.setState({ keyboardActivity: false });
  };

  componentDidUpdate(prevProps) {
    try {
      if (prevProps.parentMessage !== this.props.parentMessage) {
        if (prevProps.parentMessage.id !== this.props.parentMessage.id) {
          this.setState({
            messageList: [],
            scrollToBottom: true,
            parentMessage: this.props.parentMessage,
          });
        } else if (
          prevProps.parentMessage.data !== this.props.parentMessage.data
        ) {
          this.setState({ parentMessage: this.props.parentMessage });
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * initiated if parent message is edited
   * @param key:enums type
   * @param message: message object
   */
  listenerCallback = (key, message) => {
    switch (key) {
      case enums.MESSAGE_EDITED:
        this.parentMessageEdited(message);
        break;
      default:
        break;
    }
  };

  /**
   * handler implememted if the parent message of thread is edited and updates it.
   * @param
   */
  parentMessageEdited = (message) => {
    try {
      const parentMessage = { ...this.props.parentMessage };

      if (parentMessage.id === message.id) {
        const newMessageObj = { ...message };
        this.setState({ parentMessage: newMessageObj });
      }
    } catch (error) {
      logger(error);
    }
  };

  actionHandler = (action, messages) => {
    try {
      switch (action) {
        case actions.MESSAGE_RECEIVED:
          {
            const message = messages[0];
            if (
              Object.prototype.hasOwnProperty.call(
                message,
                'parentMessageId',
              ) &&
              message.parentMessageId === this.state.parentMessage.id
            ) {
              const replyCount = Object.prototype.hasOwnProperty.call(
                this.state.parentMessage,
                'replyCount',
              )
                ? this.state.parentMessage.replyCount
                : 0;
              const newReplyCount = replyCount + 1;

              const messageObj = { ...this.state.parentMessage };
              const newMessageObj = {
                ...messageObj,
                replyCount: newReplyCount,
              };
              this.setState({ parentMessage: newMessageObj });

              this.smartReplyPreview(messages);
              this.appendMessage(messages);
            }
          }
          break;

        case actions.MESSAGE_COMPOSED:
          {
            const replyCount = Object.prototype.hasOwnProperty.call(
              this.state.parentMessage,
              'replyCount',
            )
              ? this.state.parentMessage.replyCount
              : 0;
            const newReplyCount = replyCount + 1;

            const messageObj = { ...this.state.parentMessage };
            const newMessageObj = { ...messageObj, replyCount: newReplyCount };
            this.setState({ parentMessage: newMessageObj });

            this.appendMessage(messages);
            this.props.actionGenerated(
              actions.THREAD_MESSAGE_COMPOSED,
              messages,
            );
          }
          break;
        case 'messageSent':
        case 'errorSentInMessage':
          this.messageSent(messages);
          break;
        case actions.MESSAGE_UPDATED:
          this.updateMessages(messages);
          break;
        case actions.MESSAGE_FETCHED:
          this.prependMessages(messages);
          break;
        case actions.MESSAGE_DELETED:
          this.removeMessages(messages);
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
        case actions.DELETE_MESSAGE:
          this.setState({ messageToReact: null });
          this.deleteMessage(messages);
          break;
        case actions.CLOSE_MESSAGE_ACTIONS:
          this.setState({ messageToReact: null });
          break;
        case actions.VIEW_ACTUAL_IMAGE:
          this.props.actionGenerated(actions.VIEW_ACTUAL_IMAGE, messages);
          break;
        case actions.REACT_TO_MESSAGE:
          this.reactToMessage(messages);
          break;
        case actions.OPEN_MESSAGE_ACTIONS:
          this.setState({ messageToReact: messages });
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Updates messageToBeEdited with received message.
   * @param message: message object.
   */
  editMessage = (message) => {
    this.setState({ messageToBeEdited: message });
  };

  /**
   * Updates the messageList via newMessageObject if received message's id exists in messageList.
   *  Generates action -> UPDATE_THREAD_MESSAGE.
   * @param message: message object
   */

  messageEdited = (message) => {
    try {
      const messageList = [...this.state.messageList];
      const messageKey = messageList.findIndex((m) => m.id === message.id);
      if (messageKey > -1) {
        const messageObj = messageList[messageKey];

        const newMessageObj = { ...messageObj, ...message };

        messageList.splice(messageKey, 1, newMessageObj);
        this.updateMessages(messageList);

        if (messageList.length - messageKey === 1) {
          this.props.actionGenerated(actions.MESSAGE_EDITED, [newMessageObj]);
        }
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * sets messageToBeEdited to an empty string
   * @param
   */

  clearEditPreview = () => {
    this.setState({ messageToBeEdited: '' });
  };

  /**
   * handler implemented to delete message .
   * @param message: message object
   */

  deleteMessage = (message) => {
    try {
      const messageId = message.id;
      CometChat.deleteMessage(messageId)
        .then((deletedMessage) => {
          this.removeMessages([deletedMessage]);

          const messageList = [...this.state.messageList];
          const messageKey = messageList.findIndex((m) => m.id === message.id);

          if (messageList.length - messageKey === 1 && !message.replyCount) {
            this.props.actionGenerated(actions.THREAD_MESSAGE_DELETED, [
              deletedMessage,
            ]);
          }
        })
        .catch((error) => {
          logger('Message delete failed with error:', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for smart reply via checkMessageForExtensionsData()
   * @param messages: messages object
   */

  smartReplyPreview = (messages) => {
    try {
      const message = messages[0];

      if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
        const { metadata } = message;
        if (Object.prototype.hasOwnProperty.call(metadata, '@injected')) {
          const injectedObject = metadata['@injected'];
          if (
            Object.prototype.hasOwnProperty.call(injectedObject, 'extensions')
          ) {
            const extensionsObject = injectedObject.extensions;
            if (
              Object.prototype.hasOwnProperty.call(
                extensionsObject,
                'smart-reply',
              )
            ) {
              const smartReply = extensionsObject['smart-reply'];
              if (
                Object.prototype.hasOwnProperty.call(smartReply, 'error') ===
                false
              ) {
                this.setState({ replyPreview: message });
              } else {
                this.setState({ replyPreview: null });
              }
            }
          }
        }
      }
    } catch (error) {
      logger(error);
    }
  };

  // message is received or composed & sent
  appendMessage = (message) => {
    let messages = [...this.state.messageList];
    messages = messages.concat(message);
    messages = _.uniqBy(messages, 'id');
    this.setState({ messageList: messages, scrollToBottom: true });
  };

  // message status is updated
  updateMessages = (messages) => {
    this.setState({ messageList: messages });
  };

  messageSent = (message) => {
    const messageList = [...this.state.messageList];
    let messageKey = messageList.findIndex((m) => m._id === message._id);
    if (messageKey > -1) {
      const newMessageObj = { ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);
    }
  };

  // messages are fetched from backend
  prependMessages = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList, scrollToBottom: false });
  };

  // messages are deleted
  removeMessages = (messages) => {
    try {
      const deletedMessage = messages[0];
      const messageList = [...this.state.messageList];

      const messageKey = messageList.findIndex(
        (message) => message.id === deletedMessage.id,
      );
      if (messageKey > -1) {
        const messageObj = { ...messageList[messageKey] };
        const newMessageObj = { ...messageObj, ...deletedMessage };

        messageList.splice(messageKey, 1, newMessageObj);
        this.setState({ messageList: messageList, scrollToBottom: false });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for fetching sender message component of different types
   * @param message:message object
   * @param key
   */

  getSenderMessageComponent = (message, key) => {
    let component;
    try {
      switch (message.type) {
        case CometChat.MESSAGE_TYPE.TEXT:
          component = (
            <CometChatSenderTextMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = (
            <CometChatSenderImageMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = (
            <CometChatSenderFileMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = (
            <CometChatSenderVideoMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = (
            <CometChatSenderAudioMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
    return component;
  };

  /**
   * handler for fetching receiver message component of different types
   * @param message: message object
   * @param key: key object
   */

  getReceiverMessageComponent = (message, key) => {
    let component;
    try {
      switch (message.type) {
        case 'message':
        case CometChat.MESSAGE_TYPE.TEXT:
          component = (
            <CometChatReceiverTextMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = (
            <CometChatReceiverImageMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = (
            <CometChatReceiverFileMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = (
            <CometChatReceiverAudioMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = (
            <CometChatReceiverVideoMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.actionHandler}
            />
          );
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
    return component;
  };

  /**
   * handler for fetching receiver/sender message component of different types
   * @param message: message object
   */

  getMessageComponent = (message) => {
    let component = null;
    const key = 1;
    try {
      if (this.props.loggedInUser.uid === message.sender.uid) {
        component = this.getSenderMessageComponent(message, key);
      } else {
        component = this.getReceiverMessageComponent(message, key);
      }
    } catch (error) {
      logger(error);
    }
    return component;
  };

  reactToMessage = (message) => {
    this.setState({ messageToReact: message });
  };

  render() {
    const backIcon = (
      <Icon
        name="md-chevron-back"
        style={[
          styles.backIcon,
          { color: this.props.theme.backgroundColor.blue },
        ]}
      />
    );
    const parentMessage = this.getMessageComponent(this.state.parentMessage);
    let separator = <View style={styles.messageSeparatorStyle} />;
    if (
      Object.prototype.hasOwnProperty.call(
        this.state.parentMessage,
        'replyCount',
      )
    ) {
      const { replyCount } = this.state.parentMessage;
      const replyText =
        replyCount === 1 ? `${replyCount} reply` : `${replyCount} replies`;

      separator = (
        <View style={styles.messageSeparatorStyle}>
          <Text style={[styles.messageReplyStyle]}>{replyText}</Text>
          <View
            style={[
              styles.separatorLine,
              {
                borderColor: this.props.theme.backgroundColor.primary,
              },
            ]}
          />
        </View>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <CometChatMessageActions
          open={!!this.state.messageToReact}
          message={this.state.messageToReact}
          actionGenerated={this.actionHandler}
          close={() => {
            this.actionHandler(actions.CLOSE_MESSAGE_ACTIONS);
          }}
        />
        <View
          style={[
            styles.fullFlex,
            this.state.keyboardActivity && Platform.OS === 'ios'
              ? { marginBottom: this.state.keyboardHeight }
              : {},
          ]}>
          <View
            style={[
              styles.headerStyle,
              {
                backgroundColor: this.props.theme.backgroundColor.grey,
                borderColor: this.props.theme.backgroundColor.primary,
              },
            ]}>
            <View style={[styles.headerWrapperStyle]}>
              <TouchableOpacity
                style={[styles.headerCloseStyle]}
                onPress={() =>
                  this.props.actionGenerated(actions.CLOSE_THREAD_CLICKED)
                }>
                {backIcon}
                <Text
                  style={{
                    fontSize: 15,
                    color: this.props.theme.backgroundColor.blue,
                  }}>
                  Back
                </Text>
              </TouchableOpacity>

              <View style={styles.headerDetailStyle}>
                <Text style={[styles.headerTitleStyle]}>Thread</Text>
                <Text style={styles.headerNameStyle}>
                  {this.props.item.name}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.messageContainerStyle]}>
            <View style={styles.fullFlex}>
              <View style={styles.fullFlex}>
                <CometChatMessageList
                  theme={this.props.theme}
                  messages={this.state.messageList}
                  item={this.props.item}
                  type={this.props.type}
                  scrollToBottom={this.state.scrollToBottom}
                  config={this.props.config}
                  parentMessageId={this.props.parentMessage.id}
                  loggedInUser={this.props.loggedInUser}
                  actionGenerated={this.actionHandler}
                  parentMessageComponent={() => (
                    <>
                      <View style={styles.parentMessageStyle}>
                        {parentMessage}
                      </View>
                      <View
                        style={[
                          styles.separatorContainer,
                          {
                            borderColor: this.props.theme.backgroundColor
                              .primary,
                          },
                        ]}>
                        {separator}
                      </View>
                    </>
                  )}
                />
              </View>

              <View style={{}}>
                <CometChatMessageComposer
                  ref={(el) => {
                    this.composerRef = el;
                  }}
                  getConversationId={this.props.getConversationId}
                  theme={this.props.theme}
                  item={this.props.item}
                  type={this.props.type}
                  parentMessageId={this.props.parentMessage.id}
                  messageToBeEdited={this.state.messageToBeEdited}
                  replyPreview={this.state.replyPreview}
                  messageToReact={this.state.messageToReact}
                  actionGenerated={this.actionHandler}
                />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

export default CometChatMessageThread;
