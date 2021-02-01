/* eslint-disable react/no-did-update-set-state */
/* eslint-disable react/no-unused-state */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import * as enums from '../../../utils/enums';
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
  }

  listenerCallback = (key, message) => {
    switch (key) {
      case enums.MESSAGE_EDITED:
        this.parentMessageEdited(message);
        break;
      default:
        break;
    }
  };

  parentMessageEdited = (message) => {
    const parentMessage = { ...this.props.parentMessage };

    if (parentMessage.id === message.id) {
      const newMessageObj = { ...message };
      this.setState({ parentMessage: newMessageObj });
    }
  };

  actionHandler = (action, messages) => {
    switch (action) {
      case 'messageReceived':
        {
          const message = messages[0];
          if (
            Object.prototype.hasOwnProperty.call(message, 'parentMessageId') &&
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
            const newMessageObj = { ...messageObj, replyCount: newReplyCount };
            this.setState({ parentMessage: newMessageObj });

            this.smartReplyPreview(messages);
            this.appendMessage(messages);
          }
        }
        break;

      case 'messageComposed':
        {
          // let replyCount = this.state.replyCount;
          // this.setState({replyCount: ++replyCount});

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
          this.props.actionGenerated('threadMessageComposed', messages);
        }
        break;
      case 'messageUpdated':
        this.updateMessages(messages);
        break;
      case 'messageFetched':
        this.prependMessages(messages);
        break;
      case 'messageDeleted':
        this.removeMessages(messages);
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
      case 'deleteMessage':
        this.setState({ messageToReact: null });
        this.deleteMessage(messages);
        break;
      case 'closeMessageActions':
        this.setState({ messageToReact: null });
        break;
      case 'viewActualImage':
        this.props.actionGenerated('viewActualImage', messages);
        break;
      case 'reactToMessage':
        this.reactToMessage(messages);
        break;
      case 'openMessageActions':
        this.setState({ messageToReact: messages });
        // this.props.actionGenerated('openMessageActions',messages);
        break;
      default:
        break;
    }
  };

  editMessage = (message) => {
    this.setState({ messageToBeEdited: message });
  };

  messageEdited = (message) => {
    const messageList = [...this.state.messageList];
    const messageKey = messageList.findIndex((m) => m.id === message.id);
    if (messageKey > -1) {
      const messageObj = messageList[messageKey];

      const newMessageObj = { ...messageObj, ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);

      if (messageList.length - messageKey === 1) {
        this.props.actionGenerated('messageEdited', [newMessageObj]);
      }
    }
  };

  clearEditPreview = () => {
    this.setState({ messageToBeEdited: '' });
  };

  deleteMessage = (message) => {
    const messageId = message.id;
    CometChat.deleteMessage(messageId)
      .then((deletedMessage) => {
        this.removeMessages([deletedMessage]);

        const messageList = [...this.state.messageList];
        const messageKey = messageList.findIndex((m) => m.id === message.id);

        if (messageList.length - messageKey === 1 && !message.replyCount) {
          this.props.actionGenerated('threadMessageDeleted', [deletedMessage]);
        }
      })
      .catch(() => {
        // console.log('Message delete failed with error:', error);
      });
  };

  smartReplyPreview = (messages) => {
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

  // messages are fetched from backend
  prependMessages = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList, scrollToBottom: false });
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

  getSenderMessageComponent = (message, key) => {
    let component;

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
            widgetsettings={this.props.widgetsettings}
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
            widgetsettings={this.props.widgetsettings}
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
            widgetsettings={this.props.widgetsettings}
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
            widgetsettings={this.props.widgetsettings}
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
            widgetsettings={this.props.widgetsettings}
            actionGenerated={this.actionHandler}
          />
        );
        break;
      default:
        break;
    }

    return component;
  };

  getReceiverMessageComponent = (message, key) => {
    let component;
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
            // widgetsettings={this.props.widgetsettings}
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
            // widgetsettings={this.props.widgetsettings}
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
            widgetsettings={this.props.widgetsettings}
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
            widgetsettings={this.props.widgetsettings}
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
            widgetsettings={this.props.widgetsettings}
            actionGenerated={this.actionHandler}
          />
        );
        break;
      default:
        break;
    }
    return component;
  };

  getMessageComponent = (message) => {
    let component = null;
    const key = 1;
    if (this.props.loggedInUser.uid === message.sender.uid) {
      component = this.getSenderMessageComponent(message, key);
    } else {
      component = this.getReceiverMessageComponent(message, key);
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
    let seperator = <View style={styles.messageSeparatorStyle} />;
    if (
      Object.prototype.hasOwnProperty.call(
        this.state.parentMessage,
        'replyCount',
      )
    ) {
      const { replyCount } = this.state.parentMessage;
      const replyText =
        replyCount === 1 ? `${replyCount} reply` : `${replyCount} replies`;

      seperator = (
        <View style={styles.messageSeparatorStyle}>
          <Text style={[styles.messageReplyStyle]}>{replyText}</Text>
          <View
            style={{
              borderWidth: 0.5,
              borderColor: this.props.theme.backgroundColor.primary,
              flex: 1,
              alignSelf: 'center',
            }}
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
            this.actionHandler('closeMessageActions');
          }}
        />
        <View
          style={[
            { flex: 1 },
            this.state.keyboardActivity && Platform.OS==="ios"
              ? { marginBottom: this.state.keyboardHeight }
              : {},
          ]}>
          <View
            style={[
              styles.headerStyle,
              {
                backgroundColor: this.props.theme.backgroundColor.grey,
                borderWidth: 1,
                borderColor: this.props.theme.backgroundColor.primary,
              },
            ]}>
            <View style={[styles.headerWrapperStyle]}>
              <TouchableOpacity
                style={[styles.headerCloseStyle]}
                onPress={() =>
                  this.props.actionGenerated('closeThreadClicked')
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

          <View
            style={[
              styles.messageContainerStyle,
              {
                paddingHorizontal: 5 * widthRatio,
                flex: 1,
              },
            ]}>
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <CometChatMessageList
                  theme={this.props.theme}
                  messages={this.state.messageList}
                  item={this.props.item}
                  type={this.props.type}
                  scrollToBottom={this.state.scrollToBottom}
                  config={this.props.config}
                  widgetsettings={this.props.widgetsettings}
                  parentMessageId={this.props.parentMessage.id}
                  loggedInUser={this.props.loggedInUser}
                  actionGenerated={this.actionHandler}
                  parentMessageComponent={() => (
                    <>
                      <View style={{ paddingTop: 5 * heightRatio }}>
                        {parentMessage}
                      </View>
                      <View
                        style={[
                          {
                            paddingTop: 5 * heightRatio,
                            paddingBottom: 5 * heightRatio,
                            justifyContent: 'center',
                            borderColor: this.props.theme.backgroundColor
                              .primary,
                          },
                        ]}>
                        {seperator}
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
                  theme={this.props.theme}
                  item={this.props.item}
                  type={this.props.type}
                  widgetsettings={this.props.widgetsettings}
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
