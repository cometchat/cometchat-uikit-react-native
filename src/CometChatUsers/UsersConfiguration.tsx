import { ListRenderItem, StyleProp, ViewStyle } from 'react-native';
import {
  AvatarStyleInterface,
  CometChatListStylesInterface,
  CometChatOptions,
  ImageType,
  ListItemStyleInterface,
} from '../shared';
import { StatusIndicatorStyleInterface } from '../shared/views/CometChatStatusIndicator/StatusIndicatorStyle';
import { CometChatUsersInterface } from './CometChatUsers';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';

export interface UsersConfigurationInterface
  extends Omit<
    CometChatUsersInterface,
    'title' | 'emptyStateText' | 'errorStateText' | 'listItemKey'
  > {}
export class UsersConfiguration {
  AppBarOptions?: React.FC;
  avatarStyle?: AvatarStyleInterface;
  backButtonIcon?: ImageType;
  bodyViewContainerStyle?: StyleProp<ViewStyle>;
  disableUsersPresence?: boolean;
  EmptyStateView?: React.FC;
  ErrorStateView?: React.FC;
  headViewContainerStyle?: StyleProp<ViewStyle>;
  hideError?: boolean;
  hideSearch?: boolean;
  hideSeparator?: boolean;
  listItemStyle?: ListItemStyleInterface;
  ListItemView?: ListRenderItem<any>;
  LoadingStateView?: React.FC;
  onBack?: () => void;
  onError?: (error: CometChat.CometChatException) => void;
  onItemPress?: (user: CometChat.User) => void;
  onItemLongPress?: (user: CometChat.User) => void;
  onSelection?: (list: CometChat.User[]) => void;
  options?: (user: CometChat.User) => Array<CometChatOptions>;
  searchBoxIcon?: ImageType;
  searchPlaceholderText?: string;
  searchRequestBuilder?: CometChat.UsersRequestBuilder;
  selectionIcon?: ImageType;
  selectionMode?: 'none' | 'single' | 'multiple';
  showBackButton?: boolean;
  statusIndicatorStyle?: StatusIndicatorStyleInterface;
  SubtitleView?: (item: CometChat.User) => JSX.Element;
  TailView?: (item: CometChat.User) => JSX.Element;
  tailViewContainerStyle?: StyleProp<ViewStyle>;
  usersRequestBuilder?: CometChat.UsersRequestBuilder;
  usersStyle?: CometChatListStylesInterface;
  constructor(props: UsersConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
