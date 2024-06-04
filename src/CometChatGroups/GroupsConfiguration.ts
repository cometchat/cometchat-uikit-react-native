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
    this.SubtitleView = props?.SubtitleView || undefined;
    this.ListItemView = props?.ListItemView || undefined;
    this.AppBarOption = props?.AppBarOption || undefined;
    this.hideSeparator = props?.hideSeparator || false;
    this.groupsStyle = props?.groupsStyle || new GroupsStyle({});
    this.searchPlaceholderText =
      props?.searchPlaceholderText || localize('SEARCH');
    this.backButton = props?.backButton || backIcon;
    this.showBackButton = props?.showBackButton || false;
    this.selectionMode = props?.selectionMode || 'none';
    this.onSelection = props?.onSelection || undefined;
    this.searchBoxIcon = props?.searchBoxIcon || searchIcon;
    this.hideSearch = props?.hideSearch || false;
    this.title = props?.title || localize('GROUPS');
    this.EmptyStateView = props?.EmptyStateView || undefined;
    this.ErrorStateView = props?.ErrorStateView || undefined;
    this.LoadingStateView = props?.LoadingStateView || undefined;
    this.groupsRequestBuilder = props?.groupsRequestBuilder || undefined;
    this.searchKeyword = props?.searchKeyword || '';
    this.privateGroupIcon = props?.privateGroupIcon || privateGroupIcon;
    this.passwordGroupIcon = props?.passwordGroupIcon || passwordGroupIcon;
    this.hideError = props?.hideError || false;
    this.onItemPress = props?.onItemPress || undefined;
    this.onItemLongPress = props?.onItemLongPress || undefined;
    this.onError = props?.onError || undefined;
    this.onBack = props?.onBack || undefined;
    this.listItemStyle = props.listItemStyle;
    this.avatarStyle = props.avatarStyle;
    this.statusIndicatorStyle = props.statusIndicatorStyle;
    this.searchRequestBuilder = props.searchRequestBuilder;
  }
}
