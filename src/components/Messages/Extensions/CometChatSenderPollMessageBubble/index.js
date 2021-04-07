import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableWithoutFeedback } from 'react-native';
import theme from '../../../../resources/theme';
import {
  CometChatReadReceipt,
  CometChatThreadedMessageReplyCount,
} from '../../';
import { CometChatMessageReactions } from '../index';

import style from './styles';
import * as enums from '../../../../utils/enums';
import * as actions from '../../../../utils/actions';

const CometChatSenderPollMessageBubble = (props) => {
  const viewTheme = { ...theme, ...props.theme };
  let message = { ...props.message, messageFrom: enums.MESSAGE_FROM_SENDER };
  useEffect(() => {
    message = { ...props.message, messageFrom: enums.MESSAGE_FROM_SENDER };
  });
  useEffect(() => {
    message = { ...props.message, messageFrom: enums.MESSAGE_FROM_SENDER };
  }, [props]);

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

  const { total } = pollExtensionData.results;
  const totalText = total === 1 ? `${total} vote` : `${total} votes`;
  const arrayOfVotes = Object.entries(pollExtensionData.results.options).map(
    (e) => e[1],
  );
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
          width = String(fraction * 100) + '%';
        }
        return (
          <View
            style={[
              style.pollAnswerStyle,
              { backgroundColor: viewTheme.backgroundColor.white },
            ]}
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
              <Text style={style.widthStyle}>{width}</Text>
              <Text style={style.itemTextStyle}>{item.text}</Text>
            </View>
          </View>
        );
      }}
    />
  );
  return (
    <View style={style.container}>
      <TouchableWithoutFeedback
        onLongPress={() =>
          props.actionGenerated(actions.OPEN_MESSAGE_ACTIONS, message)
        }>
        <View style={style.messageWrapperStyle}>
          <Text style={style.pollQuestionText}>
            {pollExtensionData.question}
          </Text>
          {list}
          <Text style={style.totalText}>{totalText}</Text>
        </View>
      </TouchableWithoutFeedback>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatThreadedMessageReplyCount
          theme={props.theme}
          {...props}
          message={message}
        />
        <CometChatReadReceipt
          theme={props.theme}
          {...props}
          message={message}
        />
      </View>
      <CometChatMessageReactions
        theme={props.theme}
        {...props}
        message={message}
        showMessage={props?.showMessage}
      />
    </View>
  );
};
export default CometChatSenderPollMessageBubble;
