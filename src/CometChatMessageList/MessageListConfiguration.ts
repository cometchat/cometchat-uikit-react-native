//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AvatarStyleInterface, ImageType } from '../shared';
import { DateStyle } from '../shared';
import { AvatarStyle } from '../shared';
import {
  MessageListAlignmentType,
  MessageTimeAlignmentType,
} from '../shared/constants/UIKitConstants';
import { MessageBubbleStyle } from '../shared/views/CometChatMessageBubble/MessageBubbleStyle';
import {
  MessageListStyle,
  MessageListStyleInterface,
} from './MessageListStyle';
import { ActionSheetStyles } from '../shared';
import { CometChatMessageTemplate } from '../shared/modals/CometChatMessageTemplate';
import { DatePattern } from '../shared/base/Types';
import {
  MessageStyle,
  MessageStyleInterface,
} from '../CometChatMessages/MessageStyle';
import { DateStyleInterface } from '../shared/views/CometChatDate/DateStyle';
import { ActionSheetStylesInterface } from '../shared/views/CometChatActionSheet/ActionSheetStyle';

export interface MessageListConfigurationInterface {
  ErrorStateView?: (e: CometChat.CometChatException) => JSX.Element;
  errorStateText?: String;
  EmptyStateView?: () => JSX.Element;
  emptyStateText?: String;
  LoadingStateView?: () => JSX.Element;
  disableReceipt?: boolean;
  readIcon?: ImageType;
  deliveredIcon?: ImageType;
  sentIcon?: ImageType;
  waitIcon?: ImageType;
  errorIcon?: ImageType;
  alignment?: MessageListAlignmentType;
  showAvatar?: boolean;
  datePattern?: (baseMessage: CometChat.BaseMessage) => DatePattern;
  timestampAlignment?: MessageTimeAlignmentType;
  templates?: CometChatMessageTemplate[];
  messageRequestBuilder?: CometChat.MessagesRequestBuilder;
  scrollToBottomOnNewMessage?: boolean;
  onThreadRepliesPress?: (
    messageObject: CometChat.BaseMessage,
    messageBubbleView: () => JSX.Element
  ) => void;
  HeaderView?: ({
    user,
    group,
    id,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    id?: { uid?: string; guid?: string; parentMessageId?: string };
  }) => JSX.Element;
  FooterView?: ({
    user,
    group,
    id,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    id?: { uid?: string; guid?: string; parentMessageId?: string };
  }) => JSX.Element;
  dateSeperatorPattern?: (message: number) => DatePattern;
  avatarStyle?: AvatarStyleInterface;
  dateSeperatorStyle?: DateStyleInterface;
  wrapperMessageBubbleStyle?: MessageStyleInterface;
  actionSheetStyle?: ActionSheetStylesInterface;
  messageListStyle?: MessageListStyleInterface;
}
export class MessageListConfiguration
  implements MessageListConfigurationInterface
{
  ErrorStateView: (e: CometChat.CometChatException) => JSX.Element;
  errorStateText?: String;
  EmptyStateView: () => JSX.Element;
  emptyStateText?: String;
  LoadingStateView: () => JSX.Element;
  readIcon: ImageType;
  deliveredIcon: ImageType;
  sentIcon: ImageType;
  waitIcon: ImageType;
  errorIcon: ImageType;
  alignment: MessageListAlignmentType;
  showAvatar: boolean;
  datePattern: (baseMessage: any) => DatePattern;
  timestampAlignment: MessageTimeAlignmentType;
  templates: CometChatMessageTemplate[];
  messageRequestBuilder: CometChat.MessagesRequestBuilder;
  scrollToBottomOnNewMessage: boolean;
  onThreadRepliesPress?: (
    messageObject: CometChat.BaseMessage,
    messageBubbleView: ()=>JSX.Element
  ) => void;
  HeaderView?: ({
    user,
    group,
    id,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    id?: { uid?: string; guid?: string; parentMessageId?: string };
  }) => JSX.Element;
  FooterView?: ({
    user,
    group,
    id,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    id?: { uid?: string; guid?: string; parentMessageId?: string };
  }) => JSX.Element;
  avatarStyle: AvatarStyleInterface;
  dateSeperatorStyle: DateStyleInterface;
  wrapperMessageBubbleStyle: MessageStyleInterface;
  actionSheetStyle: ActionSheetStylesInterface;
  messageListStyle: MessageListStyleInterface;
  disableReceipt: boolean;
  dateSeperatorPattern: (item: number) => DatePattern;
  
  constructor(props: MessageListConfigurationInterface) {
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
    }
  }
}
