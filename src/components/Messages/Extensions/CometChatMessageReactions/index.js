/* eslint-disable react/no-did-update-set-state */
import React, { Component } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
// import theme from '../../resources/theme';
import styles from './styles';
import _ from 'lodash';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { checkMessageForExtensionsData, validateWidgetSettings } from '../../../../utils/common';

import { ModalPicker, Emoji } from 'emoji-mart-native';
import ReactionDetails from './reactionDetails';

class CometChatMessageReactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      // reaction: props.reaction,
      pickerVisible: false,
      reactionsDetailContainer: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.message !== this.props.message) {
      this.setState({ message: this.props.message });
    }
  }

  reactToMessages = (emoji) => {
    this.setState({ pickerVisible: false });

    CometChat.callExtension('reactions', 'POST', 'v1/react', {
      msgId: this.state.message.id,
      emoji: emoji.colons,
    })
      .then(() => {
        // Reaction added successfully
      })
      .catch(() => {
        // Some error occured
      });
  };

  getMessageReactions = (reaction) => {
    if (reaction === null) {
      return [];
    }

    const messageReactions = Object.keys(reaction).map((data, key) => {
      const reactionData = reaction[data];
      const reactionName = _.trim(data, ':');
      const reactionCount = Object.keys(reactionData).length;

      if (!reactionCount) {
        return null;
      }

      const userList = [];

      Object.keys(reactionData).forEach((user) => {
        if (reactionData[user].name) userList.push(reactionData[user].name);
      });
      return (
        <TouchableOpacity
          onPress={() => this.reactToMessages({ colons: data })}
          key={key}
          onLongPress={() => {
            this.setState({ reactionsDetailContainer: true });
          }}
          activeOpacity={1}>
          <View style={styles.reactionContainer}>
            <View style={{ marginTop: 11 }}>
              <Emoji
                emoji={{ id: reactionName }}
                size={14}
                native
                onPress={this.reactToMessages}
                onLongPress={() => {
                  this.setState({ reactionsDetailContainer: true });
                }}
              />
            </View>
            <Text style={styles.reactionText}>{reactionCount}</Text>
          </View>
        </TouchableOpacity>
      );
    });

    return messageReactions;
  };

  addMessageReaction = () => {
    // if message reactions are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, 'allow_message_reactions') === false) {
      return null;
    }

    const addReactionEmoji = (
      <TouchableWithoutFeedback
        onPress={() => this.setState({ pickerVisible: true })}
        key="AddReactionEmoji">
        <View style={styles.reactionContainer}>
          <Image
            source={require('./resources/add-reaction.png')}
            style={{ width: 16, height: 16, resizeMode: 'contain' }}
          />
        </View>
      </TouchableWithoutFeedback>
    );

    return addReactionEmoji;
  };

  render() {
    const { pickerVisible, message, reactionsDetailContainer } = this.state;
    const reaction = checkMessageForExtensionsData(message, 'reactions');
    const messageReactions = this.getMessageReactions(reaction);
    const addReactionEmoji = this.addMessageReaction();
    if (addReactionEmoji !== null) {
      if (this.props.message.messageFrom === 'receiver') {
        messageReactions.push(addReactionEmoji);
      } else {
        messageReactions.unshift(addReactionEmoji);
      }
    }
    // _reactNative.Dimensions.get('window').width - 30
    return (
      // eslint-disable-next-line react/jsx-fragments
      <>
        <ModalPicker
          isVisible={pickerVisible}
          emojiSize={35}
          emojiMargin={18}
          style={{ borderRadius: 20, overflow: 'hidden' }}
          skinEmoji=":+1:"
          showCloseButton
          onPressClose={() => {
            this.setState({ pickerVisible: false });
          }}
          onSelect={this.reactToMessages}
        />
        <ReactionDetails
          message={message}
          visible={reactionsDetailContainer}
          close={() => {
            this.setState({ reactionsDetailContainer: false });
          }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            flexDirection: 'row',
            alignSelf: this.props.message.messageFrom !== 'receiver' ? 'flex-end' : 'flex-start',
            marginTop: 4,
          }}>
          {messageReactions}
        </ScrollView>
      </>
    );
  }
}

export default CometChatMessageReactions;
