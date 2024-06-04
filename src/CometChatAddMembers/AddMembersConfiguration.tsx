import { ListRenderItem, StyleProp, ViewStyle } from 'react-native';
import {
  AvatarStyleInterface,
  CometChatListStylesInterface,
  CometChatOptions,
  ImageType,
  ListItemStyleInterface,
} from '../shared';
import { CometChatAddMembersInterface } from './CometChatAddMembers';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { StatusIndicatorStyleInterface } from '../shared/views/CometChatStatusIndicator/StatusIndicatorStyle';
export interface AddMembersConfigurationInterface
  extends Omit<
    CometChatAddMembersInterface,
    'backButtonIcon' | 'emptyStateText' | 'errorStateText' | 'group'
  > {}
export class AddMembersConfiguration {
  AppBarOptions?: React.FC;
  avatarStyle?: AvatarStyleInterface;
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
  onItemLongPress?: Function;
  onItemPress?: Function;
  onSelection?: Function;
  options?: CometChatOptions[];
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
  title?: string;
  usersRequestBuilder?: CometChat.UsersRequestBuilder;
  usersStyle?: CometChatListStylesInterface;
  constructor(props: AddMembersConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
