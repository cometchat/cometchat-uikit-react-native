import { AvatarConfigurationInterface } from '../shared/views/CometChatAvatar/AvatarConfiguration';
import { CometChatBannedMembersInterface } from './CometChatBannedMembers';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CometChatListStylesInterface,
  CometChatOptions,
  ImageType,
  ListItemStyleInterface,
} from '../shared';
import { ListRenderItem, StyleProp, ViewStyle } from 'react-native';
import { StatusIndicatorStyleInterface } from '../shared/views/CometChatStatusIndicator/StatusIndicatorStyle';

export interface BannedMembersConfigurationInterface
  extends Omit<
    CometChatBannedMembersInterface,
    'emptyStateText' | 'errorStateText' | 'group'
  > {}
export class BannedMembersConfiguration {
  AppBarOptions?: React.FC;
  avatarStyle?: AvatarConfigurationInterface;
  backButtonIcon?: boolean;
  bannedMembersRequestBuilder?: CometChat.BannedMembersRequestBuilder;
  bannedMemberStyle?: CometChatListStylesInterface;
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
  searchRequestBuilder?: CometChat.BannedMembersRequestBuilder;
  selectionIcon?: ImageType;
  selectionMode?: 'none' | 'single' | 'multiple';
  showBackButton?: boolean;
  statusIndicatorStyle?: StatusIndicatorStyleInterface;
  SubtitleView?: (item: CometChat.User) => JSX.Element;
  TailView?: (item: CometChat.User) => JSX.Element;
  tailViewContainerStyle?: StyleProp<ViewStyle>;
  title?: string;
  unbanIcon?: ImageType;
  constructor(props: BannedMembersConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
