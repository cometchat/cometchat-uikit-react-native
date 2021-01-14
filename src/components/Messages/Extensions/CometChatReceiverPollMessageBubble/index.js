import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import theme from '../../../../resources/theme';
import { CometChatReadReceipt, CometChatThreadedMessageReplyCount } from '../../';
import style from './styles';
import { CometChatAvatar } from '../../../Shared';
import { CometChatMessageReactions } from '../index';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default (props) => {
  const ViewTheme = { ...theme, ...props.theme };
  const message = { ...props.message, messageFrom: 'receiver' };

  let pollId = null;
  let senderAvatar = null;
  if (message.receiverType === 'group') {
    senderAvatar = message.sender.avatar;
  }
  const answerPollQuestion = (selectedOption) => {
    CometChat.callExtension('polls', 'POST', 'v2/vote', {
      vote: selectedOption,
      id: pollId,
    })
      .then((response) => {
        props.actionGenerated('pollAnswered', response);
      })
      .catch(() => {
        // console.log('error', error);
      });
  };
  if (!Object.prototype.hasOwnProperty.call(props.message, 'metadata')) {
    return null;
  }

  if (!Object.prototype.hasOwnProperty.call(props.message.metadata, '@injected')) {
    return null;
  }

  if (!Object.prototype.hasOwnProperty.call(props.message.metadata['@injected'], 'extensions')) {
    return null;
  }

  if (
    !Object.prototype.hasOwnProperty.call(props.message.metadata['@injected'].extensions, 'polls')
  ) {
    return null;
  }

  const pollExtensionData = props.message.metadata['@injected'].extensions.polls;

  pollId = pollExtensionData.id;
  const { total } = pollExtensionData.results;

  const totalText = total === 1 ? `${total} vote` : `${total} votes`;
  const arrayOfVotes = Object.entries(pollExtensionData.results.options).map((e) => e[1]);
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
          width = String(fraction * 100)+"%";
        }
        return (
          <TouchableOpacity
            style={[style.pollAnswerStyle, { backgroundColor: ViewTheme.backgroundColor.white }]}
            onPress={() => answerPollQuestion(index + 1)}
            key={item}>
            <View
              style={[
                style.pollPercentStyle,
                {
                  backgroundColor: ViewTheme.backgroundColor.primary,
                  width,
                  borderTopRightRadius: width === '100%' ? 8 : 0,
                  borderBottomRightRadius: width === '100%' ? 8 : 0,
                },
              ]}
            />
            <View style={style.answerWrapperStyle}>
              {Object.prototype.hasOwnProperty.call(item, 'voters') &&
              Object.prototype.hasOwnProperty.call(item.voters, props.loggedInUser.uid) ? (
                <Icon
                  name="check-circle-outline"
                  size={17}
                  color="#000000"
                  style={{ marginRight: 5 }}
                />
              ) : null}
              <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{width}</Text>
              <Text style={{ fontSize: 14, width: '70%', textAlign: 'right' }}>{item.text}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {props.message.receiverType === 'group' ? (
          <View style={style.avatarStyle}>
            <CometChatAvatar
              cornerRadius={18}
              borderColor={ViewTheme.color.secondary}
              borderWidth={0}
              image={senderAvatar}
              name={message.sender.name}
            />
          </View>
        ) : null}
        <View>
          {props.message.receiverType === 'group' ? (
            <View style={{ marginBottom: 5 }}>
              <Text>{message.sender.name}</Text>
            </View>
          ) : null}

          <View style={style.messageWrapperStyle}>
            <Text style={{ fontSize: 14, textAlign: 'left' }}>{pollExtensionData.question}</Text>
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
        </View>
      </View>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatReadReceipt {...props} message={message} />

        <CometChatThreadedMessageReplyCount {...props} message={message} />
      </View>
      <CometChatMessageReactions theme={props.theme} {...props} message={message} />
    </View>
  );
};
