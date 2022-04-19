/* eslint-disable react/no-unused-state */
/* eslint-disable react/jsx-fragments */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Text,
  Keyboard,
  Platform,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDIcon from 'react-native-vector-icons/AntDesign';
import { CometChat } from '@cometchat-pro/react-native-chat';
import Sound from 'react-native-sound';

import style from './styles';

import {
  CometChatCreatePoll,
  CometChatSmartReplyPreview,
} from '../../Messages/Extensions';
import CometChatStickerKeyboard from '../CometChatStickerKeyboard';
import ComposerActions from './composerActions';

import { outgoingMessageAlert } from '../../../resources/audio';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import { heightRatio } from '../../../utils/consts';
import { logger } from '../../../utils/common';
import { CometChatContext } from '../../../utils/CometChatContext';

export default class CometChatMessageComposer extends React.PureComponent {
  static contextType = CometChatContext;
  constructor(props) {
    super(props);

    this.imageUploaderRef = React.createRef();
    this.fileUploaderRef = React.createRef();
    this.audioUploaderRef = React.createRef();
    this.videoUploaderRef = React.createRef();
    this.messageInputRef = React.createRef();
    this.messageSending = false;

    this.node = React.createRef();
    this.isTyping = false;

    this.state = {
      showFilePicker: false,
      messageInput: '',
      messageType: '',
      emojiViewer: false,
      createPoll: false,
      messageToBeEdited: '',
      replyPreview: null,
      stickerViewer: false,
      composerActionsVisible: false,
      user: null,
      keyboardActivity: false,
      restrictions: null,
    };
    Sound.setCategory('Ambient', true);
    this.audio = new Sound(outgoingMessageAlert);
    CometChat.getLoggedinUser()
      .then((user) => (this.loggedInUser = user))
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.props?.showMessage('error', errorCode);
      });
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
    this.checkRestrictions();
  }

  checkRestrictions = async () => {
    let isLiveReactionsEnabled =
      await this.context.FeatureRestriction.isLiveReactionsEnabled();
    let isTypingIndicatorsEnabled =
      await this.context.FeatureRestriction.isTypingIndicatorsEnabled();
    let isSmartRepliesEnabled =
      await this.context.FeatureRestriction.isSmartRepliesEnabled();
    this.setState({
      restrictions: {
        isLiveReactionsEnabled,
        isTypingIndicatorsEnabled,
        isSmartRepliesEnabled,
      },
    });
  };

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow = () => {
    this.setState({ keyboardActivity: true });
  };

  _keyboardDidHide = () => {
    this.setState({ keyboardActivity: false });
  };

  componentDidUpdate(prevProps) {
    try {
      if (prevProps.messageToBeEdited !== this.props.messageToBeEdited) {
        const { messageToBeEdited } = this.props;
        this.setState({
          messageInput: messageToBeEdited.text,
          messageToBeEdited,
        });

        const element = this.messageInputRef.current;
        if (messageToBeEdited) {
          element.focus();
        } else {
          this.setState({
            messageInput: '',
          });
        }
      }

      if (prevProps.replyPreview !== this.props.replyPreview) {
        this.setState({ replyPreview: this.props.replyPreview });
      }

      if (prevProps.item !== this.props.item) {
        this.setState({ stickerViewer: false });
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handler for audio when message is sent
   * @param
   */
  playAudio = () => {
    this.audio.setCurrentTime(0);
    this.audio.play();
  };

  /**
   * Handler for change in TextInput(messageComposer)
   * @param text: TextInput's value
   */

  changeHandler = (text) => {
    this.startTyping();
    this.setState({ messageInput: text, messageType: 'text' });
  };

  /**
   * Fetches the receiver's details.
   * @param
   */

  getReceiverDetails = () => {
    let receiverId;
    let receiverType;

    if (this.props.type === CometChat.RECEIVER_TYPE.USER) {
      receiverId = this.props.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP) {
      receiverId = this.props.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    return { receiverId, receiverType };
  };

  /**
   * handler for sending and generating media message
   * @param messageInput: object messageInput
   * @param messageType: object messageType
   */

  sendMediaMessage = (messageInput, messageType) => {
    try {
      if (this.messageSending) {
        return false;
      }

      this.messageSending = true;

      const { receiverId, receiverType } = this.getReceiverDetails();
      const conversationId = this.props.getConversationId();
      const mediaMessage = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType,
      );
      if (this.props.parentMessageId) {
        mediaMessage.setParentMessageId(this.props.parentMessageId);
      }

      this.endTyping();
      // mediaMessage.setSender(this.loggedInUser);
      mediaMessage.setReceiver(receiverType);
      mediaMessage.setConversationId(conversationId);
      mediaMessage.setType(messageType);
      mediaMessage._composedAt = Math.round(+new Date() / 1000);
      mediaMessage._id = '_' + Math.random().toString(36).substr(2, 9);
      mediaMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput['name'],
        file: messageInput,
        url: messageInput['uri'],
        sender: this.loggedInUser,
      });
      this.props.actionGenerated(actions.MESSAGE_COMPOSED, [mediaMessage]);
      CometChat.sendMessage(mediaMessage)
        .then(async (response) => {
          this.messageSending = false;
          this.playAudio();

          const newMessageObj = {
            ...response,
            _id: mediaMessage._id,
            localFile: messageInput,
          };
          this.props.actionGenerated(actions.MESSAGE_SENT, newMessageObj);
        })
        .catch((error) => {
          const newMessageObj = { ...mediaMessage, error: error };
          const errorCode = error?.message || 'ERROR';
          this.props.actionGenerated(
            actions.ERROR_IN_SEND_MESSAGE,
            newMessageObj,
          );

          this.props?.showMessage('error', errorCode);
          this.messageSending = false;
          logger('Message sending failed with error: ', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for sending Text Message
   * @param
   */

  sendTextMessage = () => {
    try {
      if (this.state.emojiViewer) {
        this.setState({ emojiViewer: false });
      }

      if (!this.state.messageInput.trim().length) {
        return false;
      }

      if (this.messageSending) {
        return false;
      }

      this.messageSending = true;

      if (this.state.messageToBeEdited) {
        this.editMessage();
        return false;
      }
      this.endTyping();

      const { receiverId, receiverType } = this.getReceiverDetails();
      const messageInput = this.state.messageInput.trim();
      const conversationId = this.props.getConversationId();
      const textMessage = new CometChat.TextMessage(
        receiverId,
        messageInput,
        receiverType,
      );
      if (this.props.parentMessageId) {
        textMessage.setParentMessageId(this.props.parentMessageId);
      }

      textMessage.setSender(this.loggedInUser);
      textMessage.setReceiver(receiverType);
      textMessage.setText(messageInput);
      textMessage.setConversationId(conversationId);
      textMessage._composedAt = Date.now();
      textMessage._id = '_' + Math.random().toString(36).substr(2, 9);
      this.props.actionGenerated(actions.MESSAGE_COMPOSED, [textMessage]);
      this.setState({ messageInput: '', replyPreview: false });

      this.messageInputRef.current.textContent = '';
      this.playAudio();
      CometChat.sendMessage(textMessage)
        .then((message) => {
          const newMessageObj = { ...message, _id: textMessage._id };
          this.setState({ messageInput: '' });
          this.messageSending = false;
          this.messageInputRef.current.textContent = '';
          // this.playAudio();
          this.props.actionGenerated(actions.MESSAGE_SENT, newMessageObj);
        })
        .catch((error) => {
          const newMessageObj = { ...textMessage, error: error };
          this.props.actionGenerated(
            actions.ERROR_IN_SEND_MESSAGE,
            newMessageObj,
          );
          logger('Message sending failed with error:', error);
          const errorCode = error?.message || 'ERROR';
          this.props?.showMessage('error', errorCode);
          this.messageSending = false;
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handler for edit message
   * @param
   */

  editMessage = () => {
    try {
      const { messageToBeEdited } = this.props;

      const { receiverId, receiverType } = this.getReceiverDetails();

      const messageText = this.state.messageInput.trim();
      const textMessage = new CometChat.TextMessage(
        receiverId,
        messageText,
        receiverType,
      );
      textMessage.setId(messageToBeEdited.id);

      this.endTyping();

      CometChat.editMessage(textMessage)
        .then((message) => {
          this.setState({ messageInput: '' });
          this.messageSending = false;
          this.messageInputRef.current.textContent = '';
          this.playAudio();

          this.closeEditPreview();
          this.props.actionGenerated(actions.MESSAGE_EDITED, message);
        })
        .catch((error) => {
          this.messageSending = false;
          const errorCode = error?.message || 'ERROR';
          this.props?.showMessage('error', errorCode);
          logger('Message editing failed with error:', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for action -> CLEAR_EDIT_PREVIEW
   * @param
   */
  closeEditPreview = () => {
    this.props.actionGenerated(actions.CLEAR_EDIT_PREVIEW);
  };

  /**
   * Handler For Generating typing Notification
   * @param timer: typingInterval
   * @param metadata: metadata object
   */

  startTyping = (timer, metadata) => {
    try {
      const typingInterval = timer || 5000;
      if (!this.state.restrictions?.isTypingIndicatorsEnabled) {
        return false;
      }
      if (this.isTyping) {
        return false;
      }

      const { receiverId, receiverType } = this.getReceiverDetails();
      const typingMetadata = metadata || undefined;

      const typingNotification = new CometChat.TypingIndicator(
        receiverId,
        receiverType,
        typingMetadata,
      );
      CometChat.startTyping(typingNotification);

      this.isTyping = setTimeout(() => {
        this.endTyping();
      }, typingInterval);
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handler to end typing Notification
   * @param metadata: metadata object
   */

  endTyping = (metadata) => {
    try {
      const { receiverId, receiverType } = this.getReceiverDetails();

      const typingMetadata = metadata || undefined;

      const typingNotification = new CometChat.TypingIndicator(
        receiverId,
        receiverType,
        typingMetadata,
      );
      CometChat.endTyping(typingNotification);

      clearTimeout(this.isTyping);
      this.isTyping = null;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handler to toggle Sticker Picker screen
   * @param
   */

  toggleStickerPicker = () => {
    const { stickerViewer } = this.state;
    this.setState({
      composerActionsVisible: false,
      stickerViewer: !stickerViewer,
    });
  };

  /**
   * handler to toggle create poll screen
   * @param
   */
  toggleCreatePoll = () => {
    const { createPoll } = this.state;
    this.setState({ composerActionsVisible: false, createPoll: !createPoll });
  };

  /**
   * handler to close create poll screen
   * @param
   */
  closeCreatePoll = () => {
    this.toggleCreatePoll();
  };

  /**
   * handler for various action
   * @param action: action name
   * @param message: message object
   */
  actionHandler = (action, message) => {
    switch (action) {
      case actions.POLL_CREATED:
        this.toggleCreatePoll();
        if (this.props.type === enums.TYPE_USER) {
          this.props.actionGenerated(actions.POLL_CREATED, [message]);
        }
        // temporary check; custom data listener working for sender too\

        break;
      case actions.SEND_STICKER:
        this.sendSticker(message);
        break;
      case actions.CLOSE_STICKER:
        this.toggleStickerPicker();
        break;
      default:
        break;
    }
  };

  /**
   * handler for sending sticker message
   * @param stickerMessage: object stickerMessage
   */
  sendSticker = (stickerMessage) => {
    this.messageSending = true;

    const { receiverId, receiverType } = this.getReceiverDetails();

    const customData = {
      sticker_url: stickerMessage.stickerUrl,
      sticker_name: stickerMessage.stickerName,
    };
    const customType = enums.CUSTOM_TYPE_STICKER;
    const conversationId = this.props.getConversationId();
    const customMessage = new CometChat.CustomMessage(
      receiverId,
      receiverType,
      customType,
      customData,
    );
    if (this.props.parentMessageId) {
      customMessage.setParentMessageId(this.props.parentMessageId);
    }
    customMessage.setConversationId(conversationId);
    customMessage.setSender(this.loggedInUser);
    customMessage.setReceiver(receiverType);
    customMessage.setConversationId(conversationId);
    customMessage._composedAt = Date.now();
    customMessage._id = '_' + Math.random().toString(36).substr(2, 9);
    this.props.actionGenerated(actions.MESSAGE_COMPOSED, [customMessage]);
    CometChat.sendCustomMessage(customMessage)
      .then((message) => {
        this.messageSending = false;
        this.playAudio();
        const newMessageObj = { ...message, _id: customMessage._id };

        this.props.actionGenerated(actions.MESSAGE_SENT, newMessageObj);
      })
      .catch((error) => {
        const newMessageObj = { ...customMessage, error: error };
        this.props.actionGenerated(
          actions.ERROR_IN_SEND_MESSAGE,
          newMessageObj,
        );
        const errorCode = error?.message || 'ERROR';

        this.props?.showMessage('error', errorCode);
        this.messageSending = false;
        logger('custom message sending failed with error', error);
      });
  };

  /**
   * handler for sending reply message
   * @param messageInput: object messageInput
   */

  sendReplyMessage = (messageInput) => {
    try {
      const { receiverId, receiverType } = this.getReceiverDetails();
      const textMessage = new CometChat.TextMessage(
        receiverId,
        messageInput,
        receiverType,
      );
      if (this.props.parentMessageId) {
        textMessage.setParentMessageId(this.props.parentMessageId);
      }

      CometChat.sendMessage(textMessage)
        .then((message) => {
          this.playAudio();
          this.setState({ replyPreview: null });
          this.props.actionGenerated(actions.MESSAGE_COMPOSED, [message]);
        })
        .catch((error) => {
          const errorCode = error?.message || 'ERROR';
          this.props?.showMessage('error', errorCode);
          logger('Message sending failed with error:', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  clearReplyPreview = () => {
    this.setState({ replyPreview: null });
  };

  /**
   * handler for sending reactions
   * @param
   */
  sendReaction = (event) => {
    const typingInterval = 1000;
    try {
      const metadata = {
        type: enums.METADATA_TYPE_LIVEREACTION,
        reaction: this.props.reactionName || 'heart',
      };

      const { receiverId, receiverType } = this.getReceiverDetails();
      let transientMessage = new CometChat.TransientMessage(
        receiverId,
        receiverType,
        metadata,
      );
      CometChat.sendTransientMessage(transientMessage);
    } catch (err) {
      logger(err);
    }
    this.props.actionGenerated(actions.SEND_REACTION);
    event.persist();
    setTimeout(() => {
      this.props.actionGenerated(actions.STOP_REACTION);
    }, typingInterval);
  };

  render() {
    let disabled = false;
    if (this.props.item.blockedByMe) {
      disabled = true;
    }

    let liveReactionBtn = null;
    if (
      Object.prototype.hasOwnProperty.call(
        enums.LIVE_REACTIONS,
        this.props.reaction,
      )
    ) {
      const reactionName = this.props.reaction;
      liveReactionBtn = (
        <TouchableOpacity
          style={style.reactionBtnStyle}
          disabled={disabled}
          onPress={this.sendReaction}>
          <Icon name={`${reactionName}`} size={30} color="#de3a39" />
        </TouchableOpacity>
      );
    }

    let sendBtn = (
      <TouchableOpacity
        style={style.sendButtonStyle}
        onPress={() => this.sendTextMessage()}>
        <Icon name="send" size={20} color="#3299ff" />
      </TouchableOpacity>
    );

    if (
      !this.state.messageInput.length &&
      this.state.restrictions?.isLiveReactionsEnabled
    ) {
      sendBtn = null;
    } else {
      liveReactionBtn = null;
    }

    let editPreview = null;
    if (this.state.messageToBeEdited) {
      editPreview = (
        <View
          style={[
            style.editPreviewContainerStyle,
            {
              backgroundColor: `${this.props.theme.backgroundColor.white}`,
              borderColor: `${this.props.theme.borderColor.primary}`,
            },
          ]}>
          <View
            style={[
              style.previewHeadingContainer,
              {
                borderLeftColor: this.props.theme.color.secondary,
              },
            ]}>
            <View style={style.previewHeadingStyle}>
              <Text
                style={[
                  style.previewTextStyle,
                  {
                    color: `${this.props.theme.color.black}`,
                  },
                ]}>
                Edit message
              </Text>
              <TouchableOpacity
                style={style.previewCloseStyle}
                onPress={this.closeEditPreview}>
                <Icon
                  name="close"
                  size={23}
                  color={this.props.theme.color.secondary}
                />
              </TouchableOpacity>
            </View>
            <View>
              <Text
                style={{
                  color: `${this.props.theme.color.helpText}`,
                }}>
                {this.state.messageToBeEdited.text}
              </Text>
            </View>
          </View>
        </View>
      );
    }
    let blockedPreview = null;
    if (disabled) {
      blockedPreview = (
        <View
          style={[
            style.blockedPreviewContainer,
            {
              backgroundColor: this.props.theme.backgroundColor.blue,
            },
          ]}>
          <Text
            style={[
              style.blockedPreviewText1,
              {
                color: this.props.theme.color.white,
              },
            ]}>
            You have blocked this user
          </Text>
          <Text
            style={[
              style.blockedPreviewText2,
              {
                color: this.props.theme.color.white,
              },
            ]}>
            To start conversations, click on the user info and unblock the user
          </Text>
        </View>
      );
    }

    let smartReplyPreview = null;
    if (this.state.replyPreview) {
      const message = this.state.replyPreview;
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
              const smartReplyObject = extensionsObject['smart-reply'];

              const options = [
                smartReplyObject.reply_positive,
                smartReplyObject.reply_neutral,
                smartReplyObject.reply_negative,
              ];

              smartReplyPreview = (
                <CometChatSmartReplyPreview
                  {...this.props}
                  options={options}
                  clicked={this.sendReplyMessage}
                  close={this.clearReplyPreview}
                />
              );
            }
          }
        }
      }
    }

    if (!this.state.restrictions?.isSmartRepliesEnabled) {
      smartReplyPreview: false;
    }

    let stickerViewer = null;
    if (this.state.stickerViewer) {
      stickerViewer = (
        <CometChatStickerKeyboard
          theme={this.props.theme}
          item={this.props.item}
          type={this.props.type}
          actionGenerated={this.actionHandler}
        />
      );
    }

    const createPoll = (
      <CometChatCreatePoll
        theme={this.props.theme}
        item={this.props.item}
        type={this.props.type}
        open={this.state.createPoll}
        close={this.closeCreatePoll}
        actionGenerated={this.actionHandler}
      />
    );
    return (
      <View
        style={
          Platform.OS === 'android' && this.state.keyboardActivity
            ? {
                marginBottom: 21 * heightRatio,
                elevation: 5,
                backgroundColor: '#fff',
              }
            : { elevation: 5, backgroundColor: '#fff' }
        }>
        {blockedPreview}
        {editPreview}
        {createPoll}
        {stickerViewer}
        {smartReplyPreview}
        <ComposerActions
          visible={this.state.composerActionsVisible}
          close={() => {
            this.setState({ composerActionsVisible: false });
          }}
          toggleStickers={this.toggleStickerPicker}
          toggleCreatePoll={this.toggleCreatePoll}
          sendMediaMessage={this.sendMediaMessage}
        />
        <View style={style.mainContainer}>
          <TouchableOpacity
            style={style.plusCircleContainer}
            disabled={disabled}
            onPress={() => {
              this.setState({ composerActionsVisible: true });
            }}>
            <AntDIcon size={26} name="pluscircle" color="rgba(0,0,0,0.35)" />
          </TouchableOpacity>
          <View style={style.textInputContainer}>
            <TextInput
              style={style.messageInputStyle}
              editable={!disabled}
              value={this.state.messageInput}
              placeholder="Type a Message..."
              onChangeText={(text) => this.changeHandler(text)}
              onBlur={this.endTyping}
              ref={this.messageInputRef}
            />
            {sendBtn}
          </View>
          {liveReactionBtn}
        </View>
      </View>
    );
  }
}
