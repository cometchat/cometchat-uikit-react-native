import {
  AvatarStyleInterface,
  ImageType,
  ListItemStyleInterface,
} from '../shared';
import {
  CometChatMessageHeaderInterface,
  MessageHeaderStyleInterface,
} from './CometChatMessageHeader';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { StyleProp, ViewStyle } from 'react-native';
import { StatusIndicatorStyleInterface } from '../shared/views/CometChatStatusIndicator/StatusIndicatorStyle';

export interface MessageHeaderConfigurationInterface
  extends Omit<CometChatMessageHeaderInterface, 'user' | 'group'> {}

export class MessageHeaderConfiguration {
  SubtitleView?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  disableUsersPresence?: boolean;
  disableTyping?: boolean;
  protectedGroupIcon?: ImageType;
  privateGroupIcon?: ImageType;
  AppBarOptions?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  style?: MessageHeaderStyleInterface;
  backButtonIcon?: ImageType;
  hideBackIcon?: boolean;
  ListItemView?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  onBack?: () => void;
  listItemStyle?: ListItemStyleInterface;
  avatarStyle?: AvatarStyleInterface;
  statusIndicatorStyle?: StatusIndicatorStyleInterface;
  headViewContainerStyle?: StyleProp<ViewStyle>;
  bodyViewContainerStyle?: StyleProp<ViewStyle>;
  tailViewContainerStyle?: StyleProp<ViewStyle>;
  constructor(props: MessageHeaderConfigurationInterface) {
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
    }
  }
}
