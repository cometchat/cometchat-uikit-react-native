import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableWithoutFeedback } from 'react-native';
import theme from '../../../../resources/theme';
import { CometChatReadReceipt, CometChatThreadedMessageReplyCount } from '../../';
import { CometChatMessageReactions } from '../index';

import style from './styles';

export default (props) => {
  const ViewTheme = { ...theme, ...props.theme };
  let message = { ...props.message, messageFrom: 'sender' };
  useEffect(() => {
    message = { ...props.message, messageFrom: 'sender' };
  });
  useEffect(() => {
    message = { ...props.message, messageFrom: 'sender' };
  }, [props]);

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

  const { total } = pollExtensionData.results;
  const totalText = total === 1 ? `${total} vote` : `${total} votes`;
  const arrayOfVotes = Object.entries(pollExtensionData.results.options).map((e) => e[1]);
  const list = (
    <FlatList
      style={{ flexGrow: 0 }}
      data={arrayOfVotes}
      scrollEnabled={false}
      renderItem={({ item }) => {
        const vote = item.count;
        let width = '0%';
        if (total) {
          const fraction = vote / total;
          // width = fraction.toLocaleString('en', { style: 'percent' });
          width = String(fraction * 100) + '%';
        }
        return (
          <View
            style={[style.pollAnswerStyle, { backgroundColor: ViewTheme.backgroundColor.white }]}
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
              <Text style={{ marginRight: 5, fontWeight: 'bold', fontSize: 13 }}>{width}</Text>
              <Text style={{ fontSize: 14, width: '70%', textAlign: 'right' }}>{item.text}</Text>
            </View>
          </View>
        );
      }}
    />
  );
  return (
    <View style={{ marginBottom: 16 }}>
      <TouchableWithoutFeedback
        onLongPress={() => props.actionGenerated('openMessageActions', message)}>
        <View style={style.messageWrapperStyle}>
          <Text style={{ fontSize: 14, textAlign: 'left', color: 'white' }}>
            {pollExtensionData.question}
          </Text>
          {list}
          <Text
            style={{
              fontSize: 14,
              textAlign: 'left',
              color: 'white',
              marginTop: 10,
            }}>
            {totalText}
          </Text>
        </View>
      </TouchableWithoutFeedback>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatThreadedMessageReplyCount theme={props.theme} {...props} message={message} />
        <CometChatReadReceipt theme={props.theme} {...props} message={message} />
      </View>
      <CometChatMessageReactions theme={props.theme} {...props} message={message} />
    </View>
  );
};
