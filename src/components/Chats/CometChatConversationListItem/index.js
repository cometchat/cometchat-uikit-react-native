/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import * as enums from '../../../utils/enums';
import {
  CometChatUserPresence,
  CometChatBadgeCount,
  CometChatAvatar,
} from '../../Shared';

import styles from './styles';
import { View, TouchableOpacity, Text } from 'react-native';
import { Platform } from 'react-native';

class CometChatConversationListItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      lastMessage: '',
      lastMessageTimestamp: '',
    };
  }

  componentDidMount() {
    const message = this.getLastMessage();
    const timestamp = this.getLastMessageTimestamp();

    this.setState({ lastMessage: message, lastMessageTimestamp: timestamp });
  }

  componentDidUpdate(prevProps) {
    const previousItem = JSON.stringify(prevProps.conversation);
    const currentItem = JSON.stringify(this.props.conversation);

    if (previousItem !== currentItem) {
      const message = this.getLastMessage();
      const timestamp = this.getLastMessageTimestamp();

      this.setState({ lastMessage: message, lastMessageTimestamp: timestamp });
    }
  }

  getLastMessage = () => {
    if (
      Object.prototype.hasOwnProperty.call(this.props, 'conversation') === false
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        this.props.conversation,
        'lastMessage',
      ) === false
    ) {
      return false;
    }

    let message = null;
    const { lastMessage } = this.props.conversation;

    if (Object.prototype.hasOwnProperty.call(lastMessage, 'deletedAt')) {
      message =
        this.props.loggedInUser.uid === lastMessage.sender.uid
          ? '⚠ You deleted this message.'
          : '⚠ This message was deleted.';
    } else {
      switch (lastMessage.category) {
        case 'message':
          message = this.getMessage(lastMessage);
          break;
        case 'call':
          message = this.getCallMessage(lastMessage);
          break;
        case 'action':
          message = lastMessage.message;
          break;
        case 'custom':
          message = this.getCustomMessage(lastMessage);
          break;
        default:
          break;
      }
    }

    return message;
  };

  getLastMessageTimestamp = () => {
    if (
      Object.prototype.hasOwnProperty.call(this.props, 'conversation') === false
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        this.props.conversation,
        'lastMessage',
      ) === false
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        this.props.conversation.lastMessage,
        'sentAt',
      ) === false
    ) {
      return false;
    }

    let timestamp = null;

    const messageTimestamp = new Date(
      this.props.conversation.lastMessage.sentAt * 1000,
    );
    const currentTimestamp = Date.now();

    const diffTimestamp = currentTimestamp - messageTimestamp;

    if (diffTimestamp < 24 * 60 * 60 * 1000) {
      timestamp = messageTimestamp.toLocaleTimeString('en-US', {
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true,
      });
      if (Platform.OS === 'android' && timestamp !== 'Yesterday') {
        let time = timestamp.split(':'); // convert to array

        // fetch
        var hours = Number(time[0]);
        var minutes = Number(time[1]);

        // calculate
        var timeValue;

        if (hours > 0 && hours <= 12) {
          timeValue = '' + hours;
        } else if (hours > 12) {
          timeValue = '' + (hours - 12);
        } else if (hours == 0) {
          timeValue = '12';
        }

        timeValue += minutes < 10 ? ':0' + minutes : ':' + minutes; // get minutes
        timeValue += hours >= 12 ? ' PM' : ' AM'; // get AM/PM
        timestamp = timeValue;
      }
    } else if (diffTimestamp < 48 * 60 * 60 * 1000) {
      timestamp = 'Yesterday';
    } else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {
      timestamp = messageTimestamp.toLocaleString('en-US', { weekday: 'long' });
    } else {
      timestamp = messageTimestamp.toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      });
    }

    return timestamp;
  };

  getCustomMessage = (lastMessage) => {
    let message = null;
    switch (lastMessage.type) {
      case enums.CUSTOM_TYPE_POLL:
        message = 'Poll';
        break;
      case enums.CUSTOM_TYPE_STICKER:
        message = 'Sticker';
        break;
      default:
        break;
    }

    return message;
  };

  getMessage = (lastMessage) => {
    let message = null;
    switch (lastMessage.type) {
      case CometChat.MESSAGE_TYPE.TEXT:
        message = lastMessage.text;
        break;
      case CometChat.MESSAGE_TYPE.MEDIA:
        message = 'Media message';
        break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        message = '📷 Image ';
        break;
      case CometChat.MESSAGE_TYPE.FILE:
        message = '📁 File';
        break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        message = '🎥 Video';
        break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        message = '🎵 Audio';
        break;
      case CometChat.MESSAGE_TYPE.CUSTOM:
        message = 'Custom message';
        break;
      default:
        break;
    }

    return message;
  };

  getCallMessage = (lastMessage) => {
    let message = null;
    switch (lastMessage.type) {
      case CometChat.MESSAGE_TYPE.VIDEO:
        message = 'Video call';
        break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        message = 'Audio call';
        break;
      default:
        break;
    }

    return message;
  };

  getAvatar = () => {
    let avatar;
    if (this.props.conversation.conversationType === 'user') {
      avatar = { uri: this.props.conversation.conversationWith.avatar };
    } else if (this.props.conversation.conversationType === 'group') {
      avatar = { uri: this.props.conversation.conversationWith.icon };
    }
    return avatar;
  };

  render() {
    let lastMessageTimeStamp = null;
    if (this.state.lastMessage) {
      lastMessageTimeStamp = (
        <Text style={styles.itemLastMsgTimeStyle} numberOfLines={1}>
          {this.state.lastMessageTimestamp}
        </Text>
      );
    }

    let presence;
    if (this.props.conversation.conversationType === 'user') {
      const { status } = this.props.conversation.conversationWith;
      presence = (
        <CometChatUserPresence
          status={status}
          cornerRadius={18}
          borderColor={this.props.theme.color.darkSecondary}
          borderWidth={1}
        />
      );
    }
    return (
      <View>
        <TouchableOpacity
          underlayColor={this.props.theme.backgroundColor.listUnderlayColor}
          style={styles.listItem}
          onPress={() =>
            this.props.handleClick(
              this.props.conversation,
              this.props.conversationKey,
            )
          }>
          <View style={[styles.itemThumbnailStyle]}>
            <CometChatAvatar
              image={this.getAvatar()}
              cornerRadius={25}
              borderColor={this.props.theme.color.secondary}
              borderWidth={0}
              name={this.props.conversation.conversationWith.name}
            />
            {presence}
          </View>
          <View
            style={[
              styles.itemDetailsContainer,
              { borderBottomColor: this.props.theme.borderColor.primary },
            ]}>
            <View style={styles.itemMsgStyle}>
              <Text numberOfLines={1} style={styles.itemNameStyle}>
                {this.props.conversation.conversationWith.name}
              </Text>
              <Text numberOfLines={1} style={styles.itemLastMsgTimeStyle}>
                {this.state.lastMessage}
              </Text>
            </View>
            <View style={styles.itemRowStyle}>
              <View style={styles.itemLastMsgStyle}>
                {lastMessageTimeStamp}
              </View>
              <CometChatBadgeCount
                theme={this.props.theme}
                count={this.props.conversation.unreadMessageCount}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}
export default CometChatConversationListItem;
