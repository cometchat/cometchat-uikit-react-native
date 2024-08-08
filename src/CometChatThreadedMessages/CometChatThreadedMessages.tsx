import { View, Text, Image, ViewStyle, Platform, ScrollView, TextStyle } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import Header from './Header';
import { ICONS } from './resources';
import {
  BorderStyleInterface,
  CometChatContext,
  FontStyleInterface,
  ImageType,
  localize,
} from '../shared';
import {
  CometChatMessageComposer,
  MessageComposerConfigurationInterface,
} from '../CometChatMessageComposer';
import { CometChatMessageList } from '../CometChatMessageList';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { styles } from './style';
import { MessageListConfigurationInterface } from '../CometChatMessageList/MessageListConfiguration';
import { messageStatus } from '../shared/utils/CometChatMessageHelper';
import { CometChatContextType } from '../shared/base/Types';
import { useKeyboard } from '../shared/helper/useKeyboard';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { commonVars } from '../shared/base/vars';

const uiEventId = 'ccUiEvent' + new Date().getTime();
export interface CometChatThreadedMessagesInterface {
  /**
   *
   *
   * @type {CometChat.BaseMessage}
   * @description CometChat SDK’s message object
   */
  parentMessage: CometChat.BaseMessage;
  /**
   *
   *
   * @type {string}
   * @description Title of the component
   */
  title?: string;
  /**
   *
   *
   * @type {ImageType}
   * @description Icon for the close icon
   */
  closeIcon?: ImageType;
  /**
   *
   *
   * @description callback(messageObject) —> bubble view (combination of header+content+footer)
   */
  BubbleView: (messageObject: CometChat.BaseMessage) => JSX.Element | null;
  /**
   *
   *
   * @description callback(messageObject) —> reply count + (share, forward) view
   */
  MessageActionView?: (messageObject: CometChat.BaseMessage) => JSX.Element;
  /**
   *
   *
   * @type {MessageListConfigurationInterface}
   * @description Configurable properties of MessageList Component
   */
  messageListConfiguration?: MessageListConfigurationInterface;
  /**
   *
   *
   * @type {MessageComposerConfigurationInterface}
   * @description Configurable properties of MessageComposer Component
   */
  messageComposerConfiguration?: MessageComposerConfigurationInterface;
  /**
   *
   *
   * @description callBack invoked upon clicking the close button
   */
  onClose?: () => void;
  /**
   *
   *
   * @description callBack invoked upon encountering an error in the component
   */
  onError?: (error: CometChat.CometChatException) => void;
  /**
   *
   *
   * @type {ThreadedMessagesStyleInterface}
   * @description Styling properties of the compone
   */
  threadedMessagesStyle?: ThreadedMessagesStyleInterface;
  /**
   * Hide the MessageComposer
   * @type {boolean}
  */
  hideMessageComposer?: boolean,
  /**
   * Override the default MessageComposerView
   * @returns JSX.Element 
  */
  MessageComposerView?: ({ user, group, parentMessage }: { user?: CometChat.User, group?: CometChat.Group, parentMessage: CometChat.BaseMessage }) => JSX.Element,
  /**
   * Override the default MessageListView
   * @returns JSX.Element 
  */
  MessageListView?: ({ user, group, parentMessage }: { user?: CometChat.User, group?: CometChat.Group, parentMessage: CometChat.BaseMessage }) => JSX.Element,
}

export interface ThreadedMessagesStyleInterface {
  width?: number | string;
  height?: number | string;
  background?: number | string;
  border?: BorderStyleInterface;
  borderRadius?: number;
  titleStyle: FontStyleInterface;
  closeIconTint?: string;
}
export const CometChatThreadedMessages = (
  props: CometChatThreadedMessagesInterface
) => {
  const { theme } = useContext<CometChatContextType>(CometChatContext);

  const {
    parentMessage,
    title,
    closeIcon,
    BubbleView,
    MessageActionView,
    messageListConfiguration,
    messageComposerConfiguration,
    onClose,
    onError,
    threadedMessagesStyle,
    hideMessageComposer,
    MessageComposerView,
    MessageListView
  } = props;

  const loggedInUser = useRef<CometChat.User | null>(null);
  const [group, setGroup] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [message, setMessage] = useState<any>(parentMessage);
  const [replyCount, setReplyCount] = useState(
    parentMessage.getReplyCount() || 0
  );

  const keyboardHeight = useKeyboard();

  let limit: number = 30;

  const checkMessageBelongsToSameThread = (updatedMessage: CometChat.BaseMessage) => {

    return (updatedMessage.getParentMessageId() == message.getId());
  }

  const checkAndUpdateRepliesCount = (updatedMessage: CometChat.BaseMessage) => {
    if (checkMessageBelongsToSameThread(updatedMessage)) {
      setReplyCount((prev: number) => prev + 1);
    }
  }

  const ccMessageSentFunc = ({ message: msg, status }: any) => {
    if (status === messageStatus.success) {
      checkAndUpdateRepliesCount(msg)
      if (message.getId() == msg.id) setMessage(message);
    }
  };
  const ccMessageEditedFunc = ({ message: msg, status }: any) => {
    if (message.getId() == msg.id && status == messageStatus.success)
      setMessage(message);
  };
  const ccMessageDeletedFunc = ({ message: msg }: any) => {
    if (message.getId() == msg.id) setMessage(message);
  };
  const ccMessageReadFunc = ({ message: msg }: any) => {
    if (message.getId() == msg.id) setMessage(message);
  };



  useEffect(() => {
    CometChatUIEventHandler.addMessageListener(uiEventId, {
      ccMessageSent: (item: any) => ccMessageSentFunc(item),
      ccMessageEdited: (item: any) => ccMessageEditedFunc(item),
      ccMessageDeleted: (item: any) => ccMessageDeletedFunc(item),
      ccMessageRead: (item: any) => ccMessageReadFunc(item),
      onTextMessageReceived: (textMessage: any) => {
        checkAndUpdateRepliesCount(textMessage)
      },
      onMediaMessageReceived: (mediaMessage: any) => {
        checkAndUpdateRepliesCount(mediaMessage)
      },
      onCustomMessageReceived: (customMessage: any) => {
        checkAndUpdateRepliesCount(customMessage)
      },
      onFormMessageReceived: (formMessage: any) => {
        checkAndUpdateRepliesCount(formMessage)
      },
      onCardMessageReceived: (cardMessage: any) => {
        checkAndUpdateRepliesCount(cardMessage)
      },
      onSchedulerMessageReceived: (schedulerMessage: any) => {
        checkAndUpdateRepliesCount(schedulerMessage)
      },
      onCustomInteractiveMessageReceived: (customInteractiveMessage: any) => {
        checkAndUpdateRepliesCount(customInteractiveMessage)
      }
    });

    return () => {
      CometChatUIEventHandler.removeMessageListener(uiEventId);
    };
  }, []);

  useEffect(() => {
    CometChat.getLoggedinUser().then((loggedUser: any) => {
      loggedInUser.current = loggedUser;
      if (message.getSender()!.getUid() == loggedUser?.getUid()) {
        if (message?.getReceiverType() == 'group') {
          setGroup(message.getReceiver());
        } else {
          setUser(message.getReceiver());
        }
      } else {
        if (message?.getReceiverType() == 'group') {
          setGroup(message.getReceiver());
        } else {
          setUser(message.getSender());
        }
      }
    });
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          width: threadedMessagesStyle?.width ?? '100%',
          height: threadedMessagesStyle?.height ?? '100%',
          backgroundColor:
            threadedMessagesStyle?.background ??
            theme.palette.getBackgroundColor(),
          border: threadedMessagesStyle?.border ?? {},
          borderRadius: threadedMessagesStyle?.borderRadius ?? 0,
        } as ViewStyle,
      ]}
    >
      <Header
        title={title}
        showCloseButton
        closeButtonIcon={closeIcon ?? ICONS.CLOSE}
        onPress={onClose}
        titleStyle={({
            ...theme.typography.heading,
            color: theme.palette.getAccent(),
            ...threadedMessagesStyle.titleStyle
          }) as TextStyle
        }
        closeIconTint={
          threadedMessagesStyle?.closeIconTint ?? theme.palette.getPrimary()
        }
      />
      <View style={styles.msgBubbleContainer}>
        <ScrollView>
          {BubbleView && BubbleView(message)}
        </ScrollView>
      </View>
      {MessageActionView ? (
        MessageActionView(message)
      ) : (
        <View
          style={[
            styles.actionViewContainer,
            {
              borderColor: theme.palette.getAccent200(),
            },
          ]}
        >
          <Text
            style={[
              theme.typography.text1,
              {
                color: theme.palette.getAccent600(),
              },
            ] as TextStyle}
          >
            {replyCount ?? 0} {replyCount > 1 ? localize("REPLIES") : localize("REPLY")}
          </Text>
        </View>
      )}
      <View style={{ flex: 1, paddingHorizontal: 8 }}>
        {(user !== null || group !== null) && (
          MessageListView ?
            <MessageListView user={user} group={group} parentMessage={message} /> :
            <CometChatMessageList
              messageRequestBuilder={new CometChat.MessagesRequestBuilder()
                .setLimit(limit)
                .setParentMessageId(message.getId())}
              parentMessageId={message.getId().toString()}
              user={user}
              group={group}
              onError={onError && onError}
              {...(messageListConfiguration ? messageListConfiguration : {})}
            />
        )}
      </View>

      <View style={styles.composerContainer}>
        {hideMessageComposer ?
          null :
          MessageComposerView ?
            <MessageComposerView group={group} user={user} parentMessage={message} /> :
            <CometChatMessageComposer
              parentMessageId={message.getId()}
              messageComposerStyle={{
                borderRadius: 10,
                // backgroundColor: theme.palette.getAccent100(),
              }}
              user={user}
              group={group}
              onError={onError && onError}
              {...messageComposerConfiguration}
            />
        }
      </View>
      {Platform.OS === 'ios' && (
        <View
          style={{
            width: '100%',
            height:
              keyboardHeight -
              (Number.isInteger(commonVars.safeAreaInsets.bottom)
                ? commonVars.safeAreaInsets.bottom as number
                : 35),
          }}
        />
      )}
    </View>
  );
};
CometChatThreadedMessages.defaultProps = {
  title: localize('THREAD'),
  threadedMessagesStyle: {},
  parentMessage: {},
};
