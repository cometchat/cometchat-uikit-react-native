import React from 'react';
import {
  CometChatMessageActions,
  CometChatThreadedMessageReplyCount,
  CometChatReadReceipt,
} from '../';
import Styles from './style';
import * as actions from '../../../utils/actions';
import { CometChatMessageReactions } from '../Extensions';
import { checkMessageForExtensionsData } from '../../../utils/common';
import * as enums from '../../../utils/enums';
import theme from '../../../resources/theme';
import callIcon from './resources/sendervideocall.png';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';

class CometChatSenderDirectCallBubble extends React.Component {
  messageFrom = 'sender';

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

    return (
      <TouchableWithoutFeedback
        onLongPress={() => {
          this.props.actionGenerated(
            actions.OPEN_MESSAGE_ACTIONS,
            this.state?.message,
          );
        }}>
        <View style={Styles.container}>
          <View style={Styles.mainWrapper}>
            <View style={Styles.imageContainer}>
              <Image source={callIcon} style={Styles.imageStyle} />
              <Text
                style={Styles.textStyle}>{`You have initiated a call`}</Text>
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

            {messageReactions}
          </View>
          <View style={{ alignSelf: 'flex-end' }}>
            <CometChatThreadedMessageReplyCount
              {...this.props}
              message={this.state.message}
            />
            <CometChatReadReceipt
              {...this.props}
              message={this.state.message}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export default CometChatSenderDirectCallBubble;
