import { MessageComposerConfigurationInterface } from '../CometChatMessageComposer';
import { MessageListConfigurationInterface } from '../CometChatMessageList/MessageListConfiguration';
import { ImageType } from '../shared';
import {
  CometChatThreadedMessagesInterface,
  ThreadedMessagesStyleInterface,
} from './CometChatThreadedMessages';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
export interface ThreadedMessagesConfigurationInterface
  extends Omit<
    CometChatThreadedMessagesInterface,
    'parentMessage' | 'BubbleView' | 'title'
  > {}
export class ThreadedMessagesConfiguration {
  threadedMessagesStyle?: ThreadedMessagesStyleInterface;
  closeIcon?: ImageType;
  MessageActionView?: (messageObject: CometChat.BaseMessage) => JSX.Element;
  messageComposerConfiguration?: MessageComposerConfigurationInterface;
  messageListConfiguration?: MessageListConfigurationInterface;
  onClose?: () => void;
  onError?: (error: CometChat.CometChatException) => void;
  /**
   * Hide the MessageComposer
   * @type {boolean}
  */
  hideMessageComposer?: boolean;
  /**
   * Override the default MessageComposerView
   * @returns JSX.Element 
  */
  MessageComposerView?: ({ user, group, parentMessage }: { user?: CometChat.User, group?: CometChat.Group, parentMessage: CometChat.BaseMessage }) => JSX.Element;
  /**
   * Override the default MessageListView
   * @returns JSX.Element 
  */
  MessageListView?: ({ user, group, parentMessage }: { user?: CometChat.User, group?: CometChat.Group, parentMessage: CometChat.BaseMessage }) => JSX.Element;
  constructor(props: ThreadedMessagesConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
