import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import DropDownAlert from '../../../Shared/DropDownAlert';
import theme from '../../../../resources/theme';
import {
  CometChatReadReceipt,
  CometChatThreadedMessageReplyCount,
} from '../../';
import style from './styles';
import { CometChatAvatar } from '../../../Shared';
import { CometChatMessageReactions } from '../index';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as actions from '../../../../utils/actions';
import * as enums from '../../../../utils/enums';
import { logger } from '../../../../utils/common';

const CometChatReceiverPollMessageBubble = (props) => {
  const viewTheme = { ...theme, ...props.theme };
  const message = {
    ...props.message,
    messageFrom: enums.MESSAGE_FROM_RECEIVER,
  };

  let pollId = null;
  let senderAvatar = null;
  if (message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
    senderAvatar = message.sender.avatar;
  }

  /**
   * Handler for implementing the selected option from poll options.
   * @param selectedOption: selectedOption object
   */

  const answerPollQuestion = (selectedOption) => {
    CometChat.callExtension('polls', 'POST', 'v2/vote', {
      vote: selectedOption,
      id: pollId,
    })
      .then((response) => {
        // props.actionGenerated(actions.POLL_ANSWERED, message);
      })
      .catch((error) => {
        const errorCode = error?.details?.message || error?.message || 'ERROR';
        props?.showMessage('error', errorCode);
        logger('here', error);
      });
  };
  if (!Object.prototype.hasOwnProperty.call(props.message, 'metadata')) {
    return null;
  }

  if (
    !Object.prototype.hasOwnProperty.call(props.message.metadata, '@injected')
  ) {
    return null;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      props.message.metadata['@injected'],
      'extensions',
    )
  ) {
    return null;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      props.message.metadata['@injected'].extensions,
      'polls',
    )
  ) {
    return null;
  }

  const pollExtensionData =
    props.message.metadata['@injected'].extensions.polls;

  pollId = pollExtensionData.id;
  const { total } = pollExtensionData.results;

  const totalText = total === 1 ? `${total} vote` : `${total} votes`;
  const arrayOfVotes = Object.entries(pollExtensionData.results.options).map(
    (e) => e[1],
  );
  const list = (
    <FlatList
      style={{ flexGrow: 0 }}
      scrollEnabled={false}
      data={arrayOfVotes}
      renderItem={({ item, index }) => {
        const vote = item.count;
        let width = '0%';
        if (total) {
          const fraction = vote / total;
          width = String(fraction * 100) + '%';
        }
        return (
          <TouchableOpacity
            style={[
              style.pollAnswerStyle,
              { backgroundColor: viewTheme.backgroundColor.white },
            ]}
            onPress={() => answerPollQuestion(index + 1)}
            key={item}>
            <View
              style={[
                style.pollPercentStyle,
                {
                  backgroundColor: viewTheme.backgroundColor.primary,
                  width,
                  borderTopRightRadius: width === '100%' ? 8 : 0,
                  borderBottomRightRadius: width === '100%' ? 8 : 0,
                },
              ]}
            />
            <View style={style.answerWrapperStyle}>
              {Object.prototype.hasOwnProperty.call(item, 'voters') &&
              Object.prototype.hasOwnProperty.call(
                item.voters,
                props.loggedInUser.uid,
              ) ? (
                <Icon
                  name="check-circle-outline"
                  size={17}
                  color="#000000"
                  style={{ marginRight: 5 }}
                />
              ) : null}
              <Text style={style.answerWrapperWidthText}>{width}</Text>
              <Text style={style.answerWrapperItemText}>{item.text}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
  return (
    <View style={style.container}>
      <View style={style.innerContainer}>
        {props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP ? (
          <View style={style.avatarStyle}>
            <CometChatAvatar
              cornerRadius={18}
              borderColor={viewTheme.color.secondary}
              borderWidth={0}
              image={senderAvatar}
              name={message.sender.name}
            />
          </View>
        ) : null}
        <View>
          {props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP ? (
            <View style={{ marginBottom: 5 }}>
              <Text style={{ color: viewTheme.color.helpText }}>
                {message.sender.name}
              </Text>
            </View>
          ) : null}

          <View style={style.messageWrapperStyle}>
            <Text style={{ fontSize: 14, textAlign: 'left' }}>
              {pollExtensionData.question}
            </Text>
            {list}
            <Text
              style={{
                fontSize: 14,
                textAlign: 'right',
                marginTop: 10,
              }}>
              {totalText}
            </Text>
          </View>
          <View style={style.messageInfoWrapperStyle}>
            <CometChatReadReceipt {...props} message={message} />

            <CometChatThreadedMessageReplyCount {...props} message={message} />
            <CometChatMessageReactions
              theme={props.theme}
              {...props}
              message={message}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
export default CometChatReceiverPollMessageBubble;
