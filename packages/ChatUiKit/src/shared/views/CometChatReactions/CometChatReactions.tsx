let __listenerIdCounter = 0;
import React, { JSX, useLayoutEffect } from "react";
import { PixelRatio, Text, TouchableOpacity, View } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageBubbleAlignmentType } from "../../base/Types";
import { CometChatTheme } from "../../../theme/type";
import { DeepPartial } from "../../helper/types";

/**
 * Props for rendering reactions on a message bubble.
 */
export interface CometChatReactionsInterface {
  /**
   * The message object for which reactions will be displayed.
   */
  messageObject: CometChat.BaseMessage;
  /**
   * Custom styles for the reaction bubble.
   */
  style?: DeepPartial<CometChatTheme["messageBubbleReactionStyles"]>;
  /**
   * Callback invoked when a reaction is pressed.
   *
   * @param reaction - The reaction count object that was pressed.
   * @param messageObject - The message object associated with the reaction.
   */
  onReactionPress?: (
    reaction: CometChat.ReactionCount,
    messageObject: CometChat.BaseMessage
  ) => void;
  /**
   * Callback invoked when a reaction is long pressed.
   *
   * @param reaction - The reaction count object that was long pressed.
   * @param messageObject - The message object associated with the reaction.
   */
  onReactionLongPress?: (
    reaction: CometChat.ReactionCount,
    messageObject: CometChat.BaseMessage
  ) => void;
  /**
   * Alignment of the reaction bubble.
   */
  alignment?: MessageBubbleAlignmentType;
  /**
   * Maximum width for the content inside the reaction bubble.
   */
  maxContentWidth?: number;
}

const CometChatReactions = (props: CometChatReactionsInterface) => {
  const { messageObject, style, onReactionPress, onReactionLongPress, alignment, maxContentWidth } =
    props;

  const [reactionList, setReactionList] = React.useState<(JSX.Element | null)[]>([]);
  const reactionRef = React.useRef<CometChat.ReactionCount[]>([]);

  const reactionView = (reactionObj: CometChat.ReactionCount, index : any) => {
    let count: number = reactionObj?.getCount();
    let Emoji: string = reactionObj?.getReaction();
    const reactedByme = reactionObj.getReactedByMe();
    return count >= 1 ? (
      <TouchableOpacity
        key={index}
        onPress={() => {
          onReactionPress && onReactionPress(reactionObj, messageObject!);
        }}
        onLongPress={() => {
          onReactionLongPress && onReactionLongPress(reactionObj, messageObject!);
        }}
        style={
          reactedByme ? style?.activeEmojiStyle?.containerStyle : style?.emojiStyle?.containerStyle
        }
      >
        <Text
          style={
            reactedByme ? style?.activeEmojiStyle?.emojitextStyle : style?.emojiStyle?.emojitextStyle
          }
        >
          {Emoji}
        </Text>
        <Text
          style={
            reactedByme
              ? style?.activeEmojiStyle?.emojiCountTextStyle
              : style?.emojiStyle?.emojiCountTextStyle
          }
        >
          {count}
        </Text>
      </TouchableOpacity>
    ) : null;
  };

  const extraEmojisView = (numberOfExtraEmojis: number) => {
    let extraEmojis = reactionRef.current.slice(reactionRef.current.length - numberOfExtraEmojis);
    let reactedByMe = extraEmojis.some((reaction) => reaction.getReactedByMe());

    let totalCount = reactionRef.current.reduce((acc, curr) => acc + curr.getCount(), 0);
    let AllObj = new CometChat.ReactionCount("All", totalCount, false); // { reaction: "All", count: totalCount };

    return (
      <TouchableOpacity
        onPress={() => {
          onReactionPress && onReactionPress(AllObj, messageObject);
        }}
        onLongPress={() => {
          onReactionLongPress && onReactionLongPress(AllObj, messageObject);
        }}
        key={"extra_reactions_view"}
        style={
          reactedByMe
            ? style?.extraReactionStyle?.activeContainerStyle
            : style?.extraReactionStyle?.containerStyle
        }
      >
        <Text
          style={
            reactedByMe
              ? style?.extraReactionStyle?.activeCountTextStyle
              : style?.extraReactionStyle?.countTextStyle
          }
        >
          +{numberOfExtraEmojis}
        </Text>
      </TouchableOpacity>
    );
  };

  useLayoutEffect(() => {
    reactionRef.current = messageObject?.getReactions()!;
    let countEmoji = maxContentWidth ? 0 : 3;

    // Scale width estimates by the system font scale so that when the user
    // increases the device font/display size the layout calculation still
    // fits reactions correctly and avoids cropping.
    const fontScale = PixelRatio.getFontScale();

    if (maxContentWidth) {
      let remainingWidth = maxContentWidth;
      for (let i = 0; i < reactionRef.current.length; i++) {
        const currentReactionCount = reactionRef.current[i].getCount();
        let widthToReduce = 0;
        if (currentReactionCount < 10) {
          widthToReduce = 45 * fontScale;
        } else if (currentReactionCount < 100) {
          widthToReduce = 55 * fontScale;
        } else if (currentReactionCount < 1000) {
          widthToReduce = 65 * fontScale;
        }
        if (remainingWidth > 30 * fontScale + widthToReduce) {
          remainingWidth = remainingWidth - widthToReduce;
          countEmoji++;
          continue;
        }

        break;
      }

      countEmoji = countEmoji ? countEmoji : 1;
    }
    const messageReactions = reactionRef.current.slice(0, countEmoji).map(reactionView);

    if (reactionRef.current.length > 0) {
      if (reactionRef.current.length > countEmoji) {
        messageReactions.push(extraEmojisView(reactionRef.current.length - countEmoji));
        setReactionList(messageReactions);
      } else setReactionList(messageReactions);
    }
  }, [messageObject, maxContentWidth]);

  return reactionList.length ? (
    <View
      style={[
        style?.reactionContainerStyle,
        {
          alignSelf:
            alignment === "right" ? "flex-end" : alignment === "center" ? "center" : "flex-start",
        },
      ]}
    >
      {reactionList}
    </View>
  ) : null;
};

export { CometChatReactions };