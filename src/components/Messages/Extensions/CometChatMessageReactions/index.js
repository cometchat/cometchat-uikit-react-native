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
import styles from './styles';
import _ from 'lodash';
import { CometChat } from '@cometchat-pro/react-native-chat';
import {
  checkMessageForExtensionsData,
  logger,
} from '../../../../utils/common';
import * as enums from '../../../../utils/enums';
import { ModalPicker, Emoji } from 'emoji-mart-native';
import ReactionDetails from './reactionDetails';
import DropDownAlert from '../../../Shared/DropDownAlert';

class CometChatMessageReactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      pickerVisible: false,
      reactionsDetailContainer: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(prevProps.message) !== JSON.stringify(this.props.message)
    ) {
      this.setState({ message: this.props.message });
    }
  }

  reactToMessages = (emoji) => {
    try {
      this.setState({ pickerVisible: false });

      CometChat.callExtension('reactions', 'POST', 'v1/react', {
        msgId: this.state.message.id,
        emoji: emoji.colons,
      })
        .then(() => {
          // Reaction added successfully
        })
        .catch((error) => {
          const errorCode =
            error?.details?.message || error?.message || 'ERROR';
          this.props?.showMessage('error', errorCode);
          // Some error occured
        });
    } catch (error) {
      logger(error);
    }
  };

  getMessageReactions = (reaction) => {
    try {
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
              <View style={styles.emojiContainer}>
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
    } catch (error) {
      logger(error);
      return [];
    }
  };

  addMessageReaction = () => {
    const addReactionEmoji = (
      <TouchableWithoutFeedback
        onPress={() => this.setState({ pickerVisible: true })}
        key="AddReactionEmoji">
        <View style={styles.reactionContainer}>
          <Image
            source={require('./resources/add-reaction.png')}
            style={styles.addReactionImage}
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
      if (this.props.message.messageFrom === enums.MESSAGE_FROM_RECEIVER) {
        messageReactions.push(addReactionEmoji);
      } else {
        messageReactions.unshift(addReactionEmoji);
      }
    }
    if (this.props.item.blockedByMe) {
      return null;
    }
    return (
      // eslint-disable-next-line react/jsx-fragments
      <>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
        </View>

        <ModalPicker
          isVisible={pickerVisible}
          native={true}
          emojiSize={35}
          emojiMargin={18}
          style={styles.modalPickerStyle}
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
            alignSelf:
              this.props.message.messageFrom !== enums.MESSAGE_FROM_RECEIVER
                ? 'flex-end'
                : 'flex-start',
            marginTop: 4,
          }}>
          {messageReactions}
        </ScrollView>
      </>
    );
  }
}

export default CometChatMessageReactions;
