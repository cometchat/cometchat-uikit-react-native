//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AvatarStyleInterface, CometChatMentionsFormatter, CometChatTextFormatter, CometChatUrlsFormatter, ImageType } from '../shared';
import { DateStyle } from '../shared';
import { AvatarStyle } from '../shared';
import { MessageBubbleStyle } from '../shared/views/CometChatMessageBubble/MessageBubbleStyle';
import {
  MessageListStyle,
  MessageListStyleInterface,
} from './MessageListStyle';
import { ActionSheetStyles } from '../shared';
import { CometChatMessageTemplate } from '../shared/modals/CometChatMessageTemplate';
import { DatePattern, MessageListAlignmentType, MessageTimeAlignmentType } from '../shared/base/Types';
import {
  MessageStyle,
  MessageStyleInterface,
} from '../CometChatMessages/MessageStyle';
import { DateStyleInterface } from '../shared/views/CometChatDate/DateStyle';
import { ActionSheetStylesInterface } from '../shared/views/CometChatActionSheet/ActionSheetStyle';
import { ReactionsConfigurationInterface } from '../shared/views/CometChatReactions';
import { ReactionListConfigurationInterface } from '../shared/views/CometChatReactionList';
import { QuickReactionsConfigurationInterface } from '../shared/views/CometChatQuickReactions';
import { EmojiKeyboardStyle } from '../shared/views/CometChatEmojiKeyboard';
import { CometChatMessageInformationConfigurationInterface } from '../CometChatMessageInformation/MessageInformationConfiguration';

export interface MessageListConfigurationInterface {
  ErrorStateView?: (e: CometChat.CometChatException) => JSX.Element;
  errorStateText?: String;
  hideError?: boolean,
  EmptyStateView?: () => JSX.Element;
  emptyStateText?: String;
  LoadingStateView?: () => JSX.Element;
  /**
    * @deprecated
    * 
    * This property is deprecated as of version 4.3.18 due to newer property 'hideReceipt'. It will be removed in subsequent versions.
  */
  disableReceipt?: boolean;
  hideReceipt?: boolean;
  readIcon?: ImageType;
  deliveredIcon?: ImageType;
  sentIcon?: ImageType;
  waitIcon?: ImageType;
  errorIcon?: ImageType;
  alignment?: MessageListAlignmentType;
  showAvatar?: boolean;
  /**
   * This function returns a string for custom date representation based on the provided message object.
   * 
   * @param baseMessage - The message object.
   * @returns The string for custom date representation.
   */
  datePattern?: (baseMessage: CometChat.BaseMessage) => string;
  timestampAlignment?: MessageTimeAlignmentType;
  templates?: CometChatMessageTemplate[];
  messageRequestBuilder?: CometChat.MessagesRequestBuilder;
  /**
   * @deprecated
   * 
   * This property is deprecated as of version 4.3.18 due to newer property 'scrollToBottomOnNewMessages'. It will be removed in subsequent versions.
  */
  scrollToBottomOnNewMessage?: boolean;
  scrollToBottomOnNewMessages?: boolean;
  onThreadRepliesPress?: (
    messageObject: CometChat.BaseMessage,
    messageBubbleView: () => JSX.Element | null
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
  dateSeparatorPattern?: (message: number) => DatePattern;
  avatarStyle?: AvatarStyleInterface;
  dateSeperatorStyle?: DateStyleInterface;
  wrapperMessageBubbleStyle?: MessageStyleInterface;
  actionSheetStyle?: ActionSheetStylesInterface;
  messageListStyle?: MessageListStyleInterface;
  /**
   * Hides the header of the action sheet
   */
  /**
   * @deprecated
   * 
   * This property is deprecated as of version 4.3.20, as it is no longer needed. It will be removed in subsequent versions.
  */
  hideActionSheetHeader?: boolean;
  /**
   * Message Reaction Configuration @ReactionsConfigurationInterface
   */
  reactionsConfiguration?: ReactionsConfigurationInterface;
  /**
   * Message Reaction List Configuration @ReactionListConfigurationInterface
   */
  reactionListConfiguration?: ReactionListConfigurationInterface;
  /**
   * Quick Reaction Configuration @QuickReactionsConfigurationInterface
   */
  quickReactionConfiguration?: QuickReactionsConfigurationInterface;
  /**
   * Emoji Keyboard Style @EmojiKeyboardConfiguration
   */
  emojiKeyboardStyle?: EmojiKeyboardStyle;
  /**
   * Disables the reactions functionality
   */
  disableReactions?: boolean;
  disableMentions?: boolean;
  /**
   * Collection of text formatter class
   * @type {Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>}
  */
  textFormatters?: Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>;

  /**
   * Message Information Configuration @CometChatMessageInformationConfigurationInterface
  */
  messageInformationConfiguration?: CometChatMessageInformationConfigurationInterface;
}
export class MessageListConfiguration
  implements MessageListConfigurationInterface {
  ErrorStateView!: (e: CometChat.CometChatException) => JSX.Element;
  errorStateText?: String;
  hideError?: boolean;
  EmptyStateView!: () => JSX.Element;
  emptyStateText?: String;
  LoadingStateView!: () => JSX.Element;
  readIcon!: ImageType;
  deliveredIcon!: ImageType;
  sentIcon!: ImageType;
  waitIcon!: ImageType;
  errorIcon!: ImageType;
  alignment!: MessageListAlignmentType;
  showAvatar!: boolean;
  /**
   * This function returns a string for custom date representation based on the provided message object.
   * 
   * @param baseMessage - The message object.
   * @returns The string for custom date representation.
   */
  datePattern!: (baseMessage: CometChat.BaseMessage) => string;
  timestampAlignment!: MessageTimeAlignmentType;
  templates!: CometChatMessageTemplate[];
  messageRequestBuilder!: CometChat.MessagesRequestBuilder;
  /**
     * @deprecated
     * 
     * This property is deprecated as of version 4.3.18 due to newer property 'scrollToBottomOnNewMessages'. It will be removed in subsequent versions.
    */
  scrollToBottomOnNewMessage!: boolean;
  scrollToBottomOnNewMessages!: boolean;
  onThreadRepliesPress?: (
    messageObject: CometChat.BaseMessage,
    messageBubbleView: () => JSX.Element | null
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
  avatarStyle!: AvatarStyleInterface;
  dateSeperatorStyle!: DateStyleInterface;
  wrapperMessageBubbleStyle!: MessageStyleInterface;
  actionSheetStyle!: ActionSheetStylesInterface;
  messageListStyle!: MessageListStyleInterface;
  /**
    * @deprecated
    * 
    * This property is deprecated as of version 4.3.18 due to newer property 'hideReceipt'. It will be removed in subsequent versions.
  */
  disableReceipt?: boolean;
  hideReceipt?: boolean;
  dateSeparatorPattern!: (item: number) => DatePattern;
  /**
   * Hides the header of the action sheet
   */
  /**
   * @deprecated
   * 
   * This property is deprecated as of version 4.3.20, as it is no longer needed. It will be removed in subsequent versions.
  */
  hideActionSheetHeader?: boolean;
  /**
   * Message Reaction Configuration @ReactionsConfigurationInterface
   */
  reactionsConfiguration?: ReactionsConfigurationInterface;
  /**
   * Message Reaction List Configuration @ReactionListConfigurationInterface
   */
  reactionListConfiguration?: ReactionListConfigurationInterface;
  /**
   * Quick Reaction Configuration @QuickReactionsConfigurationInterface
   */
  quickReactionConfiguration?: QuickReactionsConfigurationInterface;
  /**
   * Emoji Keyboard Style @EmojiKeyboardConfiguration
   */
  emojiKeyboardStyle?: EmojiKeyboardStyle;
  /**
   * Disables the reactions functionality
   */
  disableReactions?: boolean;

  disableMentions!: boolean;
  /**
   * Collection of text formatter class
   * @type {Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>}
  */
  textFormatters?: Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>;

  /**
   * Message Information Configuration @CometChatMessageInformationConfigurationInterface
  */
  messageInformationConfiguration?: CometChatMessageInformationConfigurationInterface;

  constructor(props: MessageListConfigurationInterface) {
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        //@ts-ignore
        this[key] = value;
      }
    }
  }
}
