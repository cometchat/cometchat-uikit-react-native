import React from 'react';
import {
  CometChatMessageActions,
  CometChatThreadedMessageReplyCount,
  CometChatReadReceipt,
} from '../';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { CometChatMessageReactions } from '../Extensions';
import { CometChatAvatar } from '../../Shared';
import Styles from './style';
import { checkMessageForExtensionsData } from '../../../utils/common';
import * as actions from '../../../utils/actions';
import theme from '../../../resources/theme';

import callIcon from './resources/receivervideocall.png';

class CometChatReceiverDirectCallBubble extends React.Component {
  messageFrom = 'receiver';

  constructor(props) {
    super(props);

    const message = Object.assign({}, props.message, {
      messageFrom: this.messageFrom,
    });
    this.state = {
      message: message,
      isHovering: false,
    };
  }

  componentDidUpdate(prevProps) {
    const previousMessageStr = JSON.stringify(prevProps.message);
    const currentMessageStr = JSON.stringify(this.props.message);

    if (previousMessageStr !== currentMessageStr) {
      const message = Object.assign({}, this.props.message, {
        messageFrom: this.messageFrom,
      });
      this.setState({ message: message });
    }
  }

  render() {
    let senderAvatar = null,
      name = null;

    let messageReactions = null;
    const reactionsData = checkMessageForExtensionsData(
      this.state.message,
      'reactions',
    );
    if (reactionsData) {
      if (Object.keys(reactionsData).length) {
        messageReactions = (
          <View>
            <CometChatMessageReactions
              {...this.props}
              message={this.state.message}
              reaction={reactionsData}
            />
          </View>
        );
      }
    }

    if (this.state?.message?.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
      senderAvatar = { uri: this.state?.message?.sender.avatar };
    }

    return (
      <View style={Styles.mainContainer}>
        <View style={Styles.mainWrapper}>
          <CometChatAvatar
            cornerRadius={18}
            borderColor={theme.color.secondary}
            borderWidth={0}
            image={senderAvatar}
            name={this.state?.message?.sender.name}
          />
        </View>
        <View style={Styles.nameContainer}>
          {this.state?.message?.receiverType ===
          CometChat.RECEIVER_TYPE.GROUP ? (
            <View style={{ marginBottom: 5 }}>
              <Text style={{ color: theme.color.helpText }}>
                {this.state?.message?.sender.name}
              </Text>
            </View>
          ) : null}
          <View style={Styles.messageContainer}>
            <View style={Styles.imageContainer}>
              <Image source={callIcon} style={Styles.imageStyle} />
              <Text style={Styles.textStyle}>
                {`${this.state?.message?.sender?.name} have initiated a call`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                this.props.actionGenerated(
                  actions.JOIN_DIRECT_CALL,
                  this.state.message,
                )
              }
              style={Styles.buttonStyle}>
              <Text>Join</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', width: '100%' }}>
            <CometChatReadReceipt
              {...this.props}
              message={this.state.message}
            />
            <CometChatThreadedMessageReplyCount
              {...this.props}
              message={this.state.message}
            />
            {messageReactions}
          </View>
        </View>
      </View>
    );
  }
}

export default CometChatReceiverDirectCallBubble;
