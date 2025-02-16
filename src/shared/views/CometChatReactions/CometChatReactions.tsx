import React, { useContext } from 'react';
import { Text, TextStyle, TouchableOpacity, View } from 'react-native';
import { CometChatContext } from '../../CometChatContext';
import { Styles } from './style';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { ReactionsStyle, ReactionsStyleInterface } from './ReactionsStyle';
import { MessageBubbleAlignmentType } from '../../base/Types';

export interface CometChatReactionsInterface {
  messageObject?: CometChat.BaseMessage;
  style?: ReactionsStyleInterface;
  onReactionPress?: (
    reaction: CometChat.ReactionCount,
    messageObject: CometChat.BaseMessage
  ) => void;
  onReactionLongPress?: (
    reaction: CometChat.ReactionCount,
    messageObject: CometChat.BaseMessage
  ) => void;
  alignment?: MessageBubbleAlignmentType;
}
const CometChatReactions = (props: CometChatReactionsInterface) => {
  const {
    onReactionPress,
    onReactionLongPress,
    alignment,

    messageObject = null,
    style = {},
  } = props;

  const { theme } = useContext(CometChatContext);
  const [reactionList, setReactionList] = React.useState<any[]>([]);
  const reactionRef = React.useRef<any[]>([]);

  const _style = new ReactionsStyle({
    emojiFont: style?.emojiFont || theme?.typography?.text1,
    countColor: style?.countColor || theme?.palette?.getAccent(),
    countFont: style?.countFont || theme?.typography?.text1,
    backgroundColor: style?.backgroundColor || theme?.palette?.getAccent100(),
    primaryBackgroundColor:
      style?.primaryBackgroundColor || theme?.palette?.getPrimary150(),
    primaryBorder: style?.primaryBorder || {
      borderWidth: 1,
      borderColor: theme?.palette?.getPrimary500(),
    },
    border: style?.border || {
      borderWidth: 0,
      borderColor: theme?.palette?.getAccent100(),
    },
  });

  const {
    emojiFont,
    countColor,
    countFont,
    primaryBackgroundColor,
    backgroundColor,
    border,
    primaryBorder,
  } = _style;

  const reactionView = (reactionObj: any, index: any) => {
    let count: number = reactionObj?.count;
    let Emoji: string = reactionObj?.reaction;
    let Count: JSX.Element = (
      <Text
        style={
          [
            Styles.reactionCountStyle,
            { color: countColor },
            countFont,
          ] as TextStyle[]
        }
      >
        {count}
      </Text>
    );

    return count >= 1 ? (
      <View
        key={index}
        style={[
          Styles.messageReactionsStyle,
          {
            backgroundColor: reactionObj?.reactedByMe
              ? primaryBackgroundColor
              : backgroundColor,
            paddingVertical: 0,
            paddingHorizontal: 0,
          },
          { backgroundColor: theme.palette.getBackgroundColor() },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            onReactionPress &&
              messageObject &&
              onReactionPress(reactionObj, messageObject);
          }}
          onLongPress={() => {
            onReactionLongPress &&
              messageObject &&
              onReactionLongPress(reactionObj, messageObject);
          }}
          key={Math.random()}
          style={[
            Styles.messageReactionsStyle,
            {
              backgroundColor: reactionObj?.reactedByMe
                ? primaryBackgroundColor
                : backgroundColor,
              marginRight: 0,
              marginBottom: 0,
              ...(reactionObj?.reactedByMe ? primaryBorder : border),
            },
          ]}
        >
          <Text style={[Styles.reactionListStyle, emojiFont] as TextStyle[]}>
            {Emoji}&nbsp;{Count}
          </Text>
        </TouchableOpacity>
      </View>
    ) : null;
  };

  const extraEmojisView = (numberOfExtraEmojis: number) => {
    let extraEmojis = reactionRef.current.slice(
      reactionRef.current.length - numberOfExtraEmojis
    );
    let hasReactedByMe = extraEmojis.some(
      (reaction: any) => reaction.reactedByMe
    );

    let totalCount = reactionRef.current.reduce(
      (acc: any, curr: any) => acc + curr.count,
      0
    );
    let AllObj = new CometChat.ReactionCount('All', totalCount, false); // { reaction: "All", count: totalCount };

    return (
      <View
        key={new Date().getTime()}
        style={[
          Styles.messageReactionsStyle,
          {
            paddingVertical: 0,
            paddingHorizontal: 0,
          },
          { backgroundColor: theme.palette.getBackgroundColor() },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            onReactionLongPress &&
              messageObject &&
              onReactionLongPress(AllObj, messageObject);
          }}
          onLongPress={() => {
            onReactionLongPress &&
              messageObject &&
              onReactionLongPress(AllObj, messageObject);
          }}
          key={Math.random()}
          style={[
            Styles.messageReactionsStyle,
            {
              backgroundColor: hasReactedByMe
                ? primaryBackgroundColor
                : backgroundColor,
              ...(hasReactedByMe ? primaryBorder : border),
              marginRight: 0,
              marginBottom: 0,
              paddingHorizontal: 6,
            },
          ]}
        >
          <Text style={[Styles.reactionListStyle, emojiFont] as TextStyle[]}>
            +{numberOfExtraEmojis}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  React.useEffect(() => {
    reactionRef.current = messageObject?.getReactions() || [];
    const messageReactions = reactionRef.current.map(reactionView) || [];
    if (messageReactions.length > 0) {
      if (messageReactions.length > 4) {
        let newMessageReactions: any[] = [...messageReactions].slice(0, 3);
        newMessageReactions.push(
          extraEmojisView(reactionRef.current.length - 3)
        );
        setReactionList(newMessageReactions);
      } else setReactionList(messageReactions);
    }
  }, [messageObject]);

  return reactionList.length ? (
    <View
      style={[
        Styles.messageReactionListStyle,
        {
          alignSelf:
            alignment === 'right'
              ? 'flex-end'
              : alignment === 'center'
              ? 'center'
              : 'flex-start',
        },
      ]}
    >
      {reactionList}
    </View>
  ) : null;
};

export { CometChatReactions };
