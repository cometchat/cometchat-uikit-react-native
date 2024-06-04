import React, { useContext } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CometChatContext } from "../../CometChatContext";
import { Styles } from './style';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { ReactionsStyle, ReactionsStyleInterface } from './ReactionsStyle';
import { MessageBubbleAlignmentType } from '../../base/Types';

export interface CometChatReactionsInterface {
  messageObject?: CometChat.BaseMessage;
  style?: ReactionsStyleInterface;
  onReactionPress?: (reaction: CometChat.ReactionCount, messageObject: CometChat.BaseMessage) => void;
  onReactionLongPress?: (reaction: CometChat.ReactionCount, messageObject: CometChat.BaseMessage) => void;
  alignment?: MessageBubbleAlignmentType;
}
const CometChatReactions = (props: CometChatReactionsInterface) => {
  const {
    messageObject,
    style,
    onReactionPress,
    onReactionLongPress,
    alignment,
  } = props;

  const { theme } = useContext(CometChatContext);
  const [reactionList, setReactionList] = React.useState([]);
  const reactionRef = React.useRef([]);

  const _style = new ReactionsStyle({
    emojiFont: style?.emojiFont || theme?.typography?.text1,
    countColor: style?.countColor || theme?.palette?.getAccent(),
    countFont: style?.countFont || theme?.typography?.text1,
    backgroundColor: style?.backgroundColor || theme?.palette?.getAccent100(),
    primaryBackgroundColor: style?.primaryBackgroundColor || theme?.palette?.getPrimary150(),
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

  const reactionView = (reactionObj, index) => {
    let count: number = reactionObj?.count;
    let Emoji: string = reactionObj?.reaction;
    let Count: JSX.Element = <Text
      style={[
        Styles.reactionCountStyle,
        { color: countColor },
        countFont,
      ]}
    >
      {count}
    </Text>;

    return count >= 1 ? (
      <View key={index} style={[
        Styles.messageReactionsStyle,
        {
          backgroundColor: reactionObj?.reactedByMe ? primaryBackgroundColor : backgroundColor,
          paddingVertical: 0, paddingHorizontal: 0,
        },
        { backgroundColor: theme.palette.getBackgroundColor() }]}>
        <TouchableOpacity
          onPress={() => {
            onReactionPress(reactionObj, messageObject);
          }}
          onLongPress={() => {
            onReactionLongPress(reactionObj, messageObject);
          }}
          key={Math.random()}
          style={[
            Styles.messageReactionsStyle,
            {
              backgroundColor: reactionObj?.reactedByMe ? primaryBackgroundColor : backgroundColor,
              marginRight: 0, marginBottom: 0,
              ...(reactionObj?.reactedByMe ? primaryBorder : border),
            }
          ]}
        >
          <Text style={[Styles.reactionListStyle, emojiFont]}>
            {Emoji}&nbsp;{Count}
          </Text>
        </TouchableOpacity>
      </View>
    ) : null;
  };

  const extraEmojisView = (numberOfExtraEmojis: number) => {
    let extraEmojis = reactionRef.current.slice(reactionRef.current.length - numberOfExtraEmojis);
    let hasReactedByMe = extraEmojis.some((reaction) => reaction.reactedByMe);

    let totalCount = reactionRef.current.reduce((acc, curr) => acc + curr.count, 0);
    let AllObj = new CometChat.ReactionCount("All", totalCount, false); // { reaction: "All", count: totalCount };

    return (
      <View key={new Date().getTime()} style={[
        Styles.messageReactionsStyle,
        {
          paddingVertical: 0, paddingHorizontal: 0,
        },
        { backgroundColor: theme.palette.getBackgroundColor() }]}>
        <TouchableOpacity
          onPress={() => {
            onReactionLongPress(AllObj, messageObject);
          }}
          onLongPress={() => {
            onReactionLongPress(AllObj, messageObject);
          }}
          key={Math.random()}
          style={[
            Styles.messageReactionsStyle,
            {
              backgroundColor: hasReactedByMe ? primaryBackgroundColor : backgroundColor,
              ...(hasReactedByMe ? primaryBorder : border),
              marginRight: 0, marginBottom: 0,
              paddingHorizontal: 6,
            },
          ]}
        >
          <Text style={[Styles.reactionListStyle, emojiFont]}>
            +{numberOfExtraEmojis}
          </Text>
        </TouchableOpacity>
      </View>)
  }

  React.useEffect(() => {
    reactionRef.current = messageObject?.getReactions() || [];
    const messageReactions = reactionRef.current.map(reactionView) || [];
    if (messageReactions.length > 0) {
      if (messageReactions.length > 4) {
        let newMessageReactions = [...messageReactions].slice(0, 3);
        newMessageReactions.push(extraEmojisView(reactionRef.current.length - 3));
        setReactionList(newMessageReactions);
      } else setReactionList(messageReactions);
    }
  }, [messageObject]);

  return reactionList.length ? (
    <View style={[Styles.messageReactionListStyle, { alignSelf: alignment === "right" ? "flex-end" : alignment === "center" ? "center" : "flex-start" }]}>
      {reactionList}
    </View>
  ) : null;
};

// Specifies the default values for props:
CometChatReactions.defaultProps = {
  messageObject: null,
  style: {},
};

export { CometChatReactions };
