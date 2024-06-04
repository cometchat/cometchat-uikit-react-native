import React, { useContext } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { FontStyleInterface } from '../../../shared/base';
import { CometChatContext } from "../../../shared/CometChatContext";
import { localize } from "../../../shared/resources/CometChatLocalize";
import { CometChatBottomSheet } from "../../../shared/views";
import { Styles } from './style';
import { MetadataConstants } from '../../../shared/constants/UIKitConstants';
import { getExtentionData } from '../../ExtensionModerator';
import { ICONS } from '../resources';
import { CometChatEmojiKeyboard } from '../../../shared/views/CometChatEmojiKeyboard';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';

export interface MessageReactionsInterface {
  messageObject?: CometChat.BaseMessage;
  loggedInUser?: CometChat.User;
  updateReaction?: (messageObject, emoji) => void;
  style?: { iconTint?: string; textFont?: FontStyleInterface };
  onReactionClick?: (emoji, messageObject) => void;
}
const CometChatMessageReactions = (props: MessageReactionsInterface) => {
  const {
    messageObject,
    loggedInUser,
    updateReaction,
    style,
    onReactionClick,
    // theme,
  } = props;
  const { theme } = useContext(CometChatContext);
  const [reactionList, setReactionList] = React.useState([]);
  const [isVisible, setIsVisible] = React.useState(false);
  const reactionRef = React.useRef([]);
  const reactionData = React.useRef({});

  const getAddReactionButton = () => {
    let addReactionButtonbackgroundColor = theme?.palette?.getAccent100();
    if (messageObject?.['sender']?.['uid'] === loggedInUser?.['uid']) {
      addReactionButtonbackgroundColor = 'rgba(255, 255, 255, 0.23)';
    }
    let addReactionbackgroundColor = theme?.palette?.getAccent700();
    if (messageObject?.['type'] === 'text') {
      if (messageObject?.['sender']?.['uid'] === loggedInUser?.['uid']) {
        if (reactionData.current?.hasOwnProperty(loggedInUser?.['uid'])) {
          addReactionbackgroundColor = theme?.palette?.getBackgroundColor();
        }
      }
    }
    return (
      <TouchableOpacity
        onPress={() => {
          setIsVisible(true);
        }}
        style={[
          Styles.messageAddReactionStyle,
          {
            borderRadius: 20,
            backgroundColor: theme.palette.getAccent200(),
          },
        ]}
      >
        <View>
          <Image
            source={ICONS.ADDREACTION}
            style={{
              height: 16,
              width: 16,
              tintColor: style?.iconTint || addReactionbackgroundColor,
            }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const reactionView = (reactionObject, reactionData) => {
    const userList = [];
    let count;

    for (const reaction in reactionObject) {
      const tempReactionData = reactionObject[reaction];
      count = Object.keys(tempReactionData).length;
      for (const user in tempReactionData) {
        userList.push(tempReactionData[user]['name']);
      }
    }

    let reactionTitle = '';
    if (userList.length) {
      reactionTitle = userList.join(',');
      reactionTitle = reactionTitle.concat(' ', localize('REACTED'));
    }

    let Emoji = Object.keys(reactionObject)[0];
    let countcolor = theme?.palette?.getBackgroundColor();
    if (messageObject?.['type'] === 'text') {
      if (messageObject?.['sender']?.['uid'] === loggedInUser?.['uid']) {
        if (reactionData?.hasOwnProperty(loggedInUser?.['uid'])) {
          countcolor = theme?.palette?.getPrimary();
        }
      } else {
        if (reactionData?.hasOwnProperty(loggedInUser?.['uid'])) {
          countcolor = theme?.palette?.getBackgroundColor();
        } else {
          countcolor = theme?.palette?.getAccent700();
        }
      }
    } else {
      if (reactionData?.hasOwnProperty(loggedInUser?.['uid'])) {
        countcolor =
          messageObject?.['sender']?.['uid'] == loggedInUser?.['uid']
            ? theme?.palette?.getPrimary()
            : theme?.palette?.getBackgroundColor();
      } else {
        countcolor = theme?.palette?.getAccent700();
      }
    }
    let Count = (
      <Text
        style={[
          Styles.reactionCountStyle,
          { color: countcolor },
          theme?.typography?.caption1,
        ]}
      >
        {count}
      </Text>
    );

    let messageReactionsbackgroundColor = { backgroundColor: 'transparent' },
      border = {
        borderWidth: 1,
        borderColor: theme?.palette?.getAccent200(),
      };
    if (messageObject?.['type'] === 'text') {
      if (messageObject?.['sender']?.['uid'] === loggedInUser?.['uid']) {
        if (reactionData?.hasOwnProperty(loggedInUser?.['uid'])) {
          messageReactionsbackgroundColor = {
            backgroundColor: theme?.palette?.getBackgroundColor(),
          };
        }
      } else {
        if (reactionData?.hasOwnProperty(loggedInUser?.['uid'])) {
          messageReactionsbackgroundColor = {
            backgroundColor: theme?.palette?.getPrimary(),
          };
          border = {
            borderWidth: 1,
            borderColor: theme?.palette?.getAccent200(),
          };
        } else {
          messageReactionsbackgroundColor = { backgroundColor: 'transparent' };
          border = {
            borderWidth: 1,
            borderColor: theme?.palette?.getAccent200(),
          };
        }
      }
    } else {
      if (reactionData?.hasOwnProperty(loggedInUser?.['uid'])) {
        messageReactionsbackgroundColor = {
          backgroundColor:
            messageObject?.['sender']?.['uid'] === loggedInUser?.['uid']
              ? theme?.palette?.getBackgroundColor()
              : theme?.palette?.getPrimary(),
        };
        border = {
          borderWidth: 1,
          borderColor: theme?.palette?.getAccent200(),
        };
      } else {
        messageReactionsbackgroundColor = {
          backgroundColor: theme?.palette?.getAccent100(),
        };
        border = {
          borderWidth: 1,
          borderColor: theme?.palette?.getAccent200(),
        };
      }
    }
    return count >= 1 ? (
      <TouchableOpacity
        onPress={() => {
          onReactionClick(Emoji, messageObject);
        }}
        key={Math.random()}
        style={[
          Styles.messageReactionsStyle,
          messageReactionsbackgroundColor,
          border,
        ]}
      >
        <Text style={[Styles.reactionListStyle, style.textFont]}>
          {Emoji}&nbsp;{Count}
        </Text>
      </TouchableOpacity>
    ) : null;
  };

  React.useEffect(() => {
    reactionRef.current = getExtentionData(
      messageObject,
      MetadataConstants.extensions.reactions
    );
    let isEmpty = false;
    if (reactionRef.current) {
      const messageReactions = Object.keys(reactionRef.current).map((data) => {
        if (Object.keys(reactionRef.current[data]).length) {
          isEmpty = true;
          reactionData.current = reactionRef.current[data];
          return reactionView(
            { [data]: reactionData.current },
            reactionData.current
          );
        } else {
          isEmpty = false;
        }
        return false;
      });
      if (isEmpty) {
        setReactionList(messageReactions);
      }
    }
  }, [messageObject]);

  return reactionList.length ? (
    <View style={Styles.messageReactionListStyle}>
      <CometChatBottomSheet isOpen={isVisible} onClose={() => {}}>
        <CometChatEmojiKeyboard
          onClick={(item) => {
            onReactionClick(item, messageObject);
          }}
        />
      </CometChatBottomSheet>
      {reactionList}
      {getAddReactionButton()}
    </View>
  ) : null;
};

// Specifies the default values for props:
CometChatMessageReactions.defaultProps = {
  messageObject: null,
  loggedInUser: null,
  style: {},
};

export { CometChatMessageReactions };
