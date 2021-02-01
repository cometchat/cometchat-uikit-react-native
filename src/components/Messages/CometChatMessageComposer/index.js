/* eslint-disable react/no-unused-state */
/* eslint-disable react/jsx-fragments */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import { View, TouchableOpacity, TextInput, Text,Keyboard, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDIcon from 'react-native-vector-icons/AntDesign';
import { CometChat } from '@cometchat-pro/react-native-chat';
import Sound from 'react-native-sound';

import style from './styles';

import { CometChatCreatePoll, CometChatSmartReplyPreview } from '../../Messages/Extensions';
import CometChatStickerKeyboard from '../CometChatStickerKeyboard';
import ComposerActions from './composerActions';

import { outgoingMessageAlert } from '../../../resources/audio';
import { validateWidgetSettings } from '../../../utils/common';
import * as enums from '../../../utils/enums';
import { heightRatio } from '../../../utils/consts';

export default class CometChatMessageComposer extends React.PureComponent {
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
    };

    this.audio = new Sound(outgoingMessageAlert);
  }

  componentDidMount(){
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }

  componentWillUnmount () {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow =()=> {
    this.setState({ keyboardActivity :true})
  }

  _keyboardDidHide =() =>{
    this.setState({ keyboardActivity: false });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.messageToBeEdited !== this.props.messageToBeEdited) {
      const { messageToBeEdited } = this.props;
      this.setState({
        messageInput: messageToBeEdited.text,
        messageToBeEdited,
      });

      const element = this.messageInputRef.current;
      if (messageToBeEdited) {
        element.focus();
        // this.pasteHtmlAtCaret(messageToBeEdited.text, false);
      } else {
        this.setState({
          messageInput: '',
        });
      }
    }

    if (prevProps.replyPreview !== this.props.replyPreview) {
      // const message = this.props.replyPreview;
      this.setState({ replyPreview: this.props.replyPreview });
    }

    if (prevProps.item !== this.props.item) {
      // const message = this.props.replyPreview;
      this.setState({ stickerViewer: false });
    }
  }

  playAudio = () => {
    // if message sound is disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, 'enable_sound_for_messages') === false) {
      return false;
    }

    this.audio.setCurrentTime(0);
    this.audio.play();
  };

  changeHandler = (text) => {
    this.startTyping();

    // const elem = event.currentTarget;
    // const messageInput = elem.textContent.trim();

    // if (!messageInput.length) {
    //   // eslint-disable-next-line no-param-reassign
    //   event.currentTarget.textContent = messageInput;
    //   // return false;
    // }

    // this.setState({ messageInput: text, messageType: 'text' });
    this.setState({ messageInput: text, messageType: 'text' });
  };

  getReceiverDetails = () => {
    let receiverId;
    let receiverType;

    if (this.props.type === 'user') {
      receiverId = this.props.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.props.type === 'group') {
      receiverId = this.props.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    return { receiverId, receiverType };
  };

  sendMediaMessage = (messageInput, messageType) => {
    // this.toggleFilePicker();

    if (this.messageSending) {
      return false;
    }

    this.messageSending = true;

    const { receiverId, receiverType } = this.getReceiverDetails();

    const mediaMessage = new CometChat.MediaMessage(
      receiverId,
      messageInput,
      messageType,
      receiverType
    );
    if (this.props.parentMessageId) {
      mediaMessage.setParentMessageId(this.props.parentMessageId);
    }

    this.endTyping();
    CometChat.sendMessage(mediaMessage)
      .then((response) => {
        this.messageSending = false;
        this.playAudio();
        this.props.actionGenerated('messageComposed', [response]);
      })
      .catch(() => {
        this.messageSending = false;
        // console.log('Message sending failed with error:', error);
      });
  };

  sendTextMessage = () => {
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

    const { receiverId, receiverType } = this.getReceiverDetails();
    const messageInput = this.state.messageInput.trim();
    const textMessage = new CometChat.TextMessage(receiverId, messageInput, receiverType);
    if (this.props.parentMessageId) {
      textMessage.setParentMessageId(this.props.parentMessageId);
    }

    this.endTyping();

    CometChat.sendMessage(textMessage)
      .then((message) => {
        this.setState({ messageInput: '' });
        this.messageSending = false;
        this.messageInputRef.current.textContent = '';
        this.playAudio();
        this.props.actionGenerated('messageComposed', [message]);
      })
      .catch(() => {
        // console.log('Message sending failed with error:', error);
        this.messageSending = false;
      });
  };

  editMessage = () => {
    const { messageToBeEdited } = this.props;

    const { receiverId, receiverType } = this.getReceiverDetails();

    const messageText = this.state.messageInput.trim();
    const textMessage = new CometChat.TextMessage(receiverId, messageText, receiverType);
    textMessage.setId(messageToBeEdited.id);

    this.endTyping();

    CometChat.editMessage(textMessage)
      .then((message) => {
        this.setState({ messageInput: '' });
        this.messageSending = false;
        this.messageInputRef.current.textContent = '';
        this.playAudio();

        this.closeEditPreview();
        this.props.actionGenerated('messageEdited', message);
      })
      .catch(() => {
        this.messageSending = false;
        // console.log('Message editing failed with error:', error);
      });
  };

  closeEditPreview = () => {
    this.props.actionGenerated('clearEditPreview');
  };

  startTyping = (timer, metadata) => {
    const typingInterval = timer || 5000;

    // if typing indicator is disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, 'show_typing_indicators') === false) {
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
      typingMetadata
    );
    CometChat.startTyping(typingNotification);

    this.isTyping = setTimeout(() => {
      this.endTyping();
    }, typingInterval);
  };

  endTyping = (metadata) => {
    // if typing indicator is disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, 'show_typing_indicators') === false) {
      return false;
    }

    const { receiverId, receiverType } = this.getReceiverDetails();

    const typingMetadata = metadata || undefined;

    const typingNotification = new CometChat.TypingIndicator(
      receiverId,
      receiverType,
      typingMetadata
    );
    CometChat.endTyping(typingNotification);

    clearTimeout(this.isTyping);
    this.isTyping = null;
  };

  toggleStickerPicker = () => {
    const { stickerViewer } = this.state;
    this.setState({
      composerActionsVisible: false,
      stickerViewer: !stickerViewer,
    });
  };

  toggleCreatePoll = () => {
    const { createPoll } = this.state;
    this.setState({ composerActionsVisible: false, createPoll: !createPoll });
  };

  closeCreatePoll = () => {
    this.toggleCreatePoll();
    // this.toggleFilePicker();
  };

  actionHandler = (action, message) => {
    switch (action) {
      case 'pollCreated':
        this.toggleCreatePoll();

        // temporary check; custom data listener working for sender too
        if (this.props.type === 'user') {
          this.props.actionGenerated('pollCreated', [message]);
        }

        break;
      case 'sendSticker':
        this.sendSticker(message);
        break;
      case 'closeSticker':
        this.toggleStickerPicker();
        break;
      default:
        break;
    }
  };

  sendSticker = (stickerMessage) => {
    this.messageSending = true;

    const { receiverId, receiverType } = this.getReceiverDetails();

    const customData = {
      sticker_url: stickerMessage.stickerUrl,
      sticker_name: stickerMessage.stickerName,
    };
    const customType = enums.CUSTOM_TYPE_STICKER;

    const customMessage = new CometChat.CustomMessage(
      receiverId,
      receiverType,
      customType,
      customData
    );
    if (this.props.parentMessageId) {
      customMessage.setParentMessageId(this.props.parentMessageId);
    }
    CometChat.sendCustomMessage(customMessage)
      .then((message) => {
        this.messageSending = false;
        this.playAudio();
        this.props.actionGenerated('messageComposed', [message]);
      })
      .catch(() => {
        this.messageSending = false;
        // console.log('custom message sending failed with error', error);
      });
  };

  sendReplyMessage = (messageInput) => {
    const { receiverId, receiverType } = this.getReceiverDetails();
    const textMessage = new CometChat.TextMessage(receiverId, messageInput, receiverType);
    if (this.props.parentMessageId) {
      textMessage.setParentMessageId(this.props.parentMessageId);
    }

    CometChat.sendMessage(textMessage)
      .then((message) => {
        this.playAudio();
        this.setState({ replyPreview: null });
        this.props.actionGenerated('messageComposed', [message]);
      })
      .catch(() => {
        // console.log('Message sending failed with error:', error);
      });
  };

  clearReplyPreview = () => {
    this.setState({ replyPreview: null });
  };

  sendReaction = (event) => {
    const typingInterval = 1000;

    const typingMetadata = {
      type: enums.LIVE_REACTION_KEY,
      reaction: this.props.reaction,
    };

    this.startTyping(typingInterval, typingMetadata);
    this.props.actionGenerated('sendReaction');
    event.persist();
    setTimeout(() => {
      this.endTyping(typingMetadata);
      this.props.actionGenerated('stopReaction');
    }, typingInterval);
  };

  render() {
    let disabled = false;
    if (this.props.item.blockedByMe) {
      disabled = true;
    }

    let liveReactionBtn = null;
    if (Object.prototype.hasOwnProperty.call(enums.LIVE_REACTIONS, this.props.reaction)) {
      const reactionName = this.props.reaction;
      // const imgSrc = enums.LIVE_REACTIONS[reactionName];
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
      <TouchableOpacity style={style.sendButtonStyle} onPress={() => this.sendTextMessage()}>
        <Icon name="send" size={20} color="#3299ff" />
      </TouchableOpacity>
    );

    if (!this.state.messageInput.length) {
      sendBtn = null;
    }

    // //if live reactions is disabled for chat wigdet in dashboard
    if (
      validateWidgetSettings(this.props.widgetsettings, 'share_live_reactions') === false ||
      this.state.messageInput.length
    ) {
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
            style={{
              borderLeftColor: this.props.theme.color.secondary,
              borderLeftWidth: 3,
              paddingLeft: 8,
            }}>
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
              <TouchableOpacity style={style.previewCloseStyle} onPress={this.closeEditPreview}>
                <Icon name="close" size={23} color={this.props.theme.color.secondary} />
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
          if (Object.prototype.hasOwnProperty.call(injectedObject, 'extensions')) {
            const extensionsObject = injectedObject.extensions;
            if (Object.prototype.hasOwnProperty.call(extensionsObject, 'smart-reply')) {
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

    let stickerViewer = null;
    if (this.state.stickerViewer) {
      stickerViewer = (
        <CometChatStickerKeyboard
          theme={this.props.theme}
          item={this.props.item}
          type={this.props.type}
          widgetsettings={this.props.widgetsettings}
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
        widgetsettings={this.props.widgetsettings}
        actionGenerated={this.actionHandler}
      />
    );
    return (
      <View style={Platform.OS==="android"&&this.state.keyboardActivity?{ marginBottom: 21*heightRatio }:{}}>
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
        <View
          style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
          <TouchableOpacity
            style={{ marginRight: 10 }}
            disabled={disabled}
            onPress={() => {
              this.setState({ composerActionsVisible: true });
            }}>
            <AntDIcon size={26} name="pluscircle" color="rgba(0,0,0,0.35)" />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
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
      // <View
      // style={style.chatComposerStyle}
      // >
      // {/* {editPreview} */}
      //
      //   {stickerViewer}
      //   <View
      //   style={style.composerInputStyle}
      //   >
      //     <View
      //     style={style.inputInnerStyle}
      //     >
      //
      //       <View
      //       style={style.inputStickyStyle}
      //       >
      //         {/* {attach} */}
      //         <View
      //           style={style.stickyButtonStyle}
      //           ref={(node) => {
      //             this.node = node;
      //           }}>
      //           {stickerBtn}
      //           {/* {emojiPicker}
      //           {emojiBtn} */}
      //
      //
      //         </View>
      //       </View>
      //     </View>
      //   </View>
      //   {/* {createPoll} */}
      // </View>
    );
  }
}
