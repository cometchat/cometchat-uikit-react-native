//@ts-ignore
import React from 'react';
import {
  AvatarStyleInterface,
  CometChatOptions,
  ImageType,
  ListItemStyleInterface,
} from '../shared';
import { GroupsStyle, GroupsStyleInterface } from './GroupsStyle';
import {
  backIcon,
  searchIcon,
  passwordGroupIcon,
  privateGroupIcon,
} from './resources';
import { localize } from '../shared';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { StatusIndicatorStyleInterface } from '../shared/views/CometChatStatusIndicator/StatusIndicatorStyle';

export interface GroupsConfigurationInterface {
  SubtitleView?: (item: CometChat.Group) => JSX.Element;
  ListItemView?: (item: CometChat.Group) => JSX.Element;
  AppBarOption?: () => JSX.Element;
  options?: (item: CometChat.Group) => CometChatOptions[];
  hideSeparator?: boolean;
  groupsStyle?: GroupsStyleInterface;
  searchPlaceholderText?: string;
  backButton?: ImageType;
  showBackButton?: boolean;
  selectionMode?: 'none' | 'single' | 'multiple';
  onSelection?: (items: Array<CometChat.Group>) => void;
  searchBoxIcon?: ImageType;
  hideSearch?: boolean;
  title?: string;
  EmptyStateView?: () => JSX.Element;
  ErrorStateView?: () => JSX.Element;
  LoadingStateView?: () => JSX.Element;
  groupsRequestBuilder?: CometChat.GroupsRequestBuilder;
  searchKeyword?: string;
  privateGroupIcon?: ImageType;
  passwordGroupIcon?: ImageType;
  hideError?: boolean;
  onItemPress?: (item: CometChat.Group) => void;
  onItemLongPress?: (item: CometChat.Group) => void;
  onError?: (e: CometChat.CometChatException) => void;
  onBack?: () => void;
  listItemStyle?: ListItemStyleInterface;
  avatarStyle?: AvatarStyleInterface;
  statusIndicatorStyle?: StatusIndicatorStyleInterface;
  searchRequestBuilder?: CometChat.GroupsRequestBuilder;
}

/**
 * @class GroupConfiguration
 * @description GroupConfiguration class is used for defining the GroupConfiguration template.
 */
export class GroupsConfiguration implements GroupsConfigurationInterface {
  SubtitleView: (item: CometChat.Group) => JSX.Element;
  ListItemView: (item: CometChat.Group) => JSX.Element;
  AppBarOption: () => JSX.Element;
  options: (item: CometChat.Group) => CometChatOptions[];
  hideSeparator: boolean;
  searchPlaceholderText: string;
  backButton: ImageType;
  showBackButton: boolean;
  selectionMode: 'none' | 'single' | 'multiple';
  onSelection: (items: Array<CometChat.Group>) => void;
  searchBoxIcon: ImageType;
  hideSearch: boolean;
  title: string;
  EmptyStateView: () => JSX.Element;
  ErrorStateView: () => JSX.Element;
  LoadingStateView: () => JSX.Element;
  groupsRequestBuilder: CometChat.GroupsRequestBuilder;
  searchKeyword: string;
  privateGroupIcon: ImageType;
  passwordGroupIcon: ImageType;
  hideError: boolean;
  onItemPress?: (item: CometChat.Group) => void;
  onItemLongPress?: (item: CometChat.Group) => void;
  onError?: (e: CometChat.CometChatException) => void;
  onBack?: () => void;
  groupsStyle?: GroupsStyleInterface;
  listItemStyle?: ListItemStyleInterface;
  avatarStyle?: AvatarStyleInterface;
  statusIndicatorStyle?: StatusIndicatorStyleInterface;
  searchRequestBuilder?: CometChat.GroupsRequestBuilder;

  constructor(props: GroupsConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
