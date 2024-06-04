import { GroupMemberConfigurationInterface } from '../CometChatGroupMembers/GroupMemberConfiguration';
import { GroupMembersStyleInterface } from '../CometChatGroupMembers/GroupMemberStyle';
import { CometChatTransferOwnershipInterface } from './CometChatTransferOwnership';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  AvatarStyleInterface,
  CometChatListStylesInterface,
  ImageType,
  ListItemStyleInterface,
} from '../shared';
import { ListRenderItem, StyleProp, ViewStyle } from 'react-native';
import { StatusIndicatorStyleInterface } from '../shared/views/CometChatStatusIndicator/StatusIndicatorStyle';

export interface TransferOwnershipConfigurationInterface
  extends Omit<
    CometChatTransferOwnershipInterface,
    'group' | 'emptyStateText' | 'title' | 'errorStateText'
  > {}
export class TransferOwnershipConfiguration {
  onTransferOwnership?: (
    group: CometChat.Group,
    ownershipTransferredMember: CometChat.User
  ) => void;
  transferOwnershipStyle?: GroupMembersStyleInterface;
  groupMembersConfiguration?: GroupMemberConfigurationInterface;
  avatarStyle?: AvatarStyleInterface;
  backButtonIcon?: ImageType;
  bodyViewContainerStyle?: StyleProp<ViewStyle>;
  disableUsersPresence?: boolean;
  EmptyStateView?: React.FC;
  ErrorStateView?: React.FC;
  groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  groupMemberStyle?: GroupMembersStyleInterface;
  headViewContainerStyle?: StyleProp<ViewStyle>;
  hideSearch?: boolean;
  hideSeparator?: boolean;
  listItemStyle?: ListItemStyleInterface;
  ListItemView?: ListRenderItem<any>;
  listStyle?: CometChatListStylesInterface;
  LoadingStateView?: React.FC;
  onBack?: () => void;
  onError?: (error: CometChat.CometChatException) => void;
  searchBoxIcon?: ImageType;
  searchPlaceholderText?: string;
  searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  selectionIcon?: ImageType;
  showBackButton?: boolean;
  statusIndicatorStyle?: StatusIndicatorStyleInterface;
  SubtitleView?: (item: CometChat.GroupMember) => JSX.Element;
  tailViewContainerStyle?: (item: CometChat.GroupMember) => JSX.Element;
  
  constructor(props: TransferOwnershipConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
