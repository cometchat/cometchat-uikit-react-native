//@ts-ignore
import React, { useState, useRef } from 'react';
//@ts-ignore
import { Text, TextStyle, View, ViewProps } from 'react-native';
import {
  backIcon,
  passwordGroupIcon as passwordGroupIconDefault,
  privateGroupIcon as privateGroupIconDefault,
  checkIcon,
} from './resources';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { GroupsStyle, GroupsStyleInterface } from './GroupsStyle';
import { Style } from './style';
import {
  CometChatContext,
  CometChatListActionsInterface,
  ListItemStyleInterface,
  localize,
} from '../shared';
import { BorderStyle, ImageType } from '../shared';
import {
  GroupTypeConstants,
  PASSWORD_GROUP_COLOR,
  PRIVATE_GROUP_COLOR,
} from '../shared/constants/UIKitConstants';
import { CometChatListItem, ListItemStyle } from '../shared';
import { AvatarStyle, StatusIndicatorStyle } from '../shared';
import { CometChatList } from '../shared';
import { CometChatContextType, SelectionMode } from '../shared/base/Types';
import { CometChatOptions } from '../shared/modals/CometChatOptions';
import { AvatarStyleInterface } from '../shared/views/CometChatAvatar/AvatarStyle';
import { StatusIndicatorStyleInterface } from '../shared/views/CometChatStatusIndicator/StatusIndicatorStyle';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';

const uiEventListener = 'uiEvents_' + new Date().getTime();

export interface CometChatGroupsInterface {
  /**
   * Custom subtitle view
   */
  SubtitleView?: (item: CometChat.Group) => JSX.Element;
  /**
   * Custom list item view
   */
  ListItemView?: (item: CometChat.Group) => JSX.Element;
  /**
   * pass compoent for menu, will be shown at top right side
   */
  AppBarOption?: () => JSX.Element;
  /**
   * Pass array of CometChatOptions type
   * Tobe shown on swipe of list item
   */
  options?: (item: CometChat.Group) => CometChatOptions[];
  /**
   * toggle the seperator
   */
  hideSeperator?: boolean;
  /**
   * hide selection icon
   */
  hideSubmitIcon?: boolean;
  /**
   * styles for groups
   */
  groupsStyle?: GroupsStyleInterface;
  /**
   * styles for list item
   */
  listItemStyle?: ListItemStyleInterface;
  /**
   * styles for avatar
   */
  avatarStyle?: AvatarStyleInterface;
  /**
   * styles for status indicator
   */
  statusIndicatorStyle?: StatusIndicatorStyleInterface;
  /**
   * search placeholder text
   */
  searchPlaceHolderText?: string;
  /**
   * back button icon
   */
  backButtonIcon?: ImageType;
  /**
   * toggle back button
   */
  showBackButton?: boolean;
  /**
   * select items pass "none" | "single" | "multitple"
   */
  selectionMode?: SelectionMode;
  /**
   * call back on seleciton is done
   */
  onSelection?: (items: Array<CometChat.Group>) => void;
  /**
   * icon for search box
   */
  searchBoxIcon?: ImageType;
  /**
   * toggle seearch box
   */
  hideSearch?: boolean;
  /**
   * title to be shown default "Groups"
   */
  title?: string;
  /**
   * Custom Functional component for empty state
   */
  EmptyStateView?: () => JSX.Element;
  /**
   * text to be shown in case no groups found.
   */
  emptyStateText?: string;
  /**
   * Custom functional component for error state.
   */
  ErrorStateView?: () => JSX.Element;
  /**
   * text to be shown in case error occured while fetching gounps for first time
   */
  errorStateText?: string;
  /**
   * Custom image for loading state.
   */
  LoadingStateView?: () => JSX.Element;
  /**
   * Request builder to fetch groups.
   */
  groupsRequestBuilder?: CometChat.GroupsRequestBuilder;
  /**
   * request builder for search
   */
  searchRequestBuilder?: CometChat.GroupsRequestBuilder;
  /**
   * pass icon for private group
   */
  privateGroupIcon?: ImageType;
  /**
   * pass icon for password group
   */
  passwordGroupIcon?: ImageType;
  /**
   * toogle error visibility
   */
  hideError?: boolean;
  /**
   * function tobe called on group pressed.
   */
  onItemPress?: (item: CometChat.Group) => void;
  /**
   * function tobe called on group long pressed.
   */
  onItemLongPress?: (item: CometChat.Group) => void;
  /**
   * function will be called when error occured.
   */
  onError?: (e: CometChat.CometChatException) => void;
  /**
   * function will be called when back button pressed.
   */
  onBack?: () => void;
}

const groupListenerId = 'grouplist_' + new Date().getTime();

export const CometChatGroups = React.forwardRef(
  (props: CometChatGroupsInterface, ref: any) => {
    const {
      SubtitleView,
      ListItemView,
      AppBarOption,
      options,
      hideSubmitIcon,
      groupsStyle,
      listItemStyle,
      avatarStyle,
      statusIndicatorStyle,
      onSelection,
      searchBoxIcon,
      EmptyStateView,
      emptyStateText,
      ErrorStateView,
      errorStateText,
      LoadingStateView,
      groupsRequestBuilder,
      searchRequestBuilder,
      onItemPress,
      onItemLongPress,
      onError,
      onBack,
      title = localize('GROUPS'),
      searchPlaceHolderText = localize('SEARCH'),
      showBackButton = false,
      hideSearch = false,
      hideSeperator = false,
      backButtonIcon = backIcon,
      selectionMode = 'none',
      privateGroupIcon = privateGroupIconDefault,
      passwordGroupIcon = passwordGroupIconDefault,
      hideError = false,
    } = props;

    //context values
    const { theme } = React.useContext<CometChatContextType>(CometChatContext);

    const groupListRef = useRef<CometChatListActionsInterface | null>(null);
    const activeSwipeRows = React.useRef<any>({});

    const [selecting, setSelecting] = useState(
      selectionMode != 'none' ? true : false
    );
    const [selectedGroups, setSelectedGroups] = useState<any[]>([]);

    const _groupsStyle = new GroupsStyle({
      backgroundColor: theme?.palette.getBackgroundColor(),
      backIconTint: theme?.palette.getPrimary(),
      emptyTextColor: theme?.palette.getAccent400(),
      emptyTextFont: theme?.typography.caption2,
      errorTextColor: theme?.palette.getError(),
      errorTextFont: theme?.typography.subtitle1,
      searchBackgroundColor: theme?.palette.getAccent600(),
      searchBorder: new BorderStyle({
        borderColor: theme?.palette.getAccent700(),
        ...groupsStyle?.border,
      }),
      separatorColor: theme?.palette.getAccent100(),
      subtitleTextColor: theme?.palette.getAccent600(),
      subtitleTextFont: theme?.typography.text1,
      titleColor: theme?.palette.getAccent(),
      titleFont: theme?.typography.title1,
      loadingIconTint: theme?.palette.getPrimary(),
      ...groupsStyle,
    });
    const _avatarStyle = new AvatarStyle({
      backgroundColor: theme?.palette.getAccent600(),
      nameTextColor: theme?.palette.getSecondary(),
      nameTextFont: theme?.typography.title1,
      ...avatarStyle,
    });
    const _statusIndicatorStyle = new StatusIndicatorStyle(
      statusIndicatorStyle || {
        borderRadius: 10,
        height: 15,
        width: 15,
      }
    );
    const _listItemStyle = new ListItemStyle({
      backgroundColor: theme?.palette?.getBackgroundColor(),
      titleColor: theme?.palette.getAccent(),
      titleFont: theme?.typography.name,
      ...listItemStyle,
    });

    // const listStyle = new CometChatListStyles({
    //     backgroundColor: theme?.palette?.getBackgroundColor(),
    //     titleColor: theme?.palette.getAccent(),
    //     titleFont: theme?.typography.name,
    // })

    React.useImperativeHandle(ref, () => ({
      addGroup: addGroup,
      updateGroup: updateGroup,
      removeGroup: removeGroup,
      getSelectedItems,
    }));

    const getSelectedItems = () => {
      return selectedGroups;
    };

    const ErrorView = () => {
      if (hideError) return null;

      if (ErrorStateView) return <ErrorStateView />;
      else
        return (
          <View style={Style.listContainer}>
            <Text
              style={
                {
                  ..._groupsStyle.errorTextFont,
                  color: _groupsStyle.errorTextColor,
                } as TextStyle
              }
            >
              {errorStateText || localize('SOMETHING_WRONG')}
            </Text>
          </View>
        );
    };

    const EmptyView = () => {
      if (EmptyStateView) return <EmptyStateView />;
      else
        return (
          <View style={Style.listContainer}>
            <Text
              style={
                {
                  ..._groupsStyle.emptyTextFont,
                  color: _groupsStyle.emptyTextColor,
                } as TextStyle
              }
            >
              {emptyStateText || localize('NO_GROUPS_FOUND')}
            </Text>
          </View>
        );
    };

    /**
     *
     * Listener callback when a member is kicked from / has left the group
     */
    const handleGroupMemberRemoval = (...options: any[]) => {
      const group = options[3];
      groupListRef.current?.updateList(group);
    };

    /**
     *
     * Listener callback when a member is banned from the group
     */
    const handleGroupMemberBan = (...options: any[]) => {
      const group = options[3];
      groupListRef.current?.updateList(group);
    };

    /**
     *
     * Listener callback when a user joins/added to the group
     */
    const handleGroupMemberAddition = (...options: any[]) => {
      const group = options[3];
      groupListRef.current?.updateList(group);
    };

    /**
     *
     * Listener callback when a group member scope is updated
     */
    const handleGroupMemberScopeChange = (...options: any[]) => {
      const group = options[4];
      groupListRef.current?.updateList(group);
    };

    /**
     * This will update group in the list if not found then
     * @param {object} group Group object
     */
    const updateGroup = (group: any) => {
      groupListRef.current?.updateList(
        (grp: any) => grp['guid'] == group['guid']
      );
    };

    /**
     * Add the group to the group list at first position.
     * @param {object} group group object
     */
    const addGroup = (group: any) => {
      groupListRef.current?.addItemToList(
        (grp: any) => grp['guid'] == group['guid'],
        0
      );
    };

    /**
     * removes the group from the list.
     * @param {object} group Group object
     */
    const removeGroup = (group: any) => {
      groupListRef.current?.removeItemFromList(group['guid']);
      //remove from selected items if present
      if (selecting) {
        let index: any = selectedGroups.find(
          (grp) => grp['guid'] == group['guid']
        );
        if (index > -1) {
          let selectedItems = [...selectedGroups];
          selectedItems.splice(index, 1);
          setSelectedGroups(selectedItems);
        }
      }
    };

    const groupClicked = (group: any) => {
      if (selecting) {
        if (selectionMode == 'single') {
          if (selectedGroups.length > 0 && selectedGroups[0].guid == group.guid)
            setSelectedGroups([]);
          else setSelectedGroups([group]);
          return;
        }
        const index: number = selectedGroups.findIndex(
          (value) => value.guid == group.guid
        );
        if (index >= 0) {
          let tmp = [...selectedGroups];
          tmp.splice(index, 1);
          setSelectedGroups([...tmp]);
        } else {
          setSelectedGroups([...selectedGroups, group]);
        }
        return;
      }
      onItemPress && onItemPress(group);
    };

    const groupLongPressed = (group: any) => {
      if (selectionMode != 'none') {
        setSelecting(true);
        if (selectionMode === 'multiple')
          setSelectedGroups([...selectedGroups, group]);
        else setSelectedGroups([group]);
      }
      onItemLongPress && onItemLongPress(group);
    };

    React.useEffect(() => {
      CometChat.addGroupListener(
        groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberScopeChanged: (
            message: any,
            changedUser: any,
            newScope: any,
            oldScope: any,
            changedGroup: any
          ) => {
            handleGroupMemberScopeChange(
              message,
              changedUser,
              newScope,
              oldScope,
              changedGroup
            );
          },
          onGroupMemberKicked: (
            message: any,
            kickedUser: any,
            kickedBy: any,
            kickedFrom: any
          ) => {
            handleGroupMemberRemoval(message, kickedUser, kickedBy, kickedFrom);
          },
          onGroupMemberLeft: (message: any, leavingUser: any, group: any) => {
            handleGroupMemberRemoval(message, leavingUser, null, group);
          },
          onGroupMemberBanned: (
            message: any,
            bannedUser: any,
            bannedBy: any,
            bannedFrom: any
          ) => {
            handleGroupMemberBan(message, bannedUser, bannedBy, bannedFrom);
          },
          onMemberAddedToGroup: (
            message: any,
            userAdded: any,
            userAddedBy: any,
            userAddedIn: any
          ) => {
            handleGroupMemberAddition(
              message,
              userAdded,
              userAddedBy,
              userAddedIn
            );
          },
          onGroupMemberJoined: (
            message: any,
            joinedUser: any,
            joinedGroup: any
          ) => {
            handleGroupMemberAddition(message, joinedUser, null, joinedGroup);
          },
        })
      );
      CometChatUIEventHandler.addGroupListener(uiEventListener, {
        ccGroupCreated: ({ group }: any) => {
          groupListRef.current?.addItemToList(group, 0);
        },
        ccGroupDeleted: ({ group }: any) => {
          groupListRef.current?.removeItemFromList(group.guid);
        },
        ccGroupLeft: ({ leftGroup }: any) => {
          leftGroup['hasJoined'] = false;
          leftGroup['membersCount'] = leftGroup['membersCount'] - 1;
          console.log(leftGroup);
          if (leftGroup['type'] == CometChat.GROUP_TYPE.PRIVATE) {
            groupListRef.current?.removeItemFromList(leftGroup.getGuid());
          } else {
            groupListRef.current?.updateList(leftGroup);
          }
        },
        ccGroupMemberKicked: ({ group }: any) => {
          if (group['type'] == CometChat.GROUP_TYPE.PRIVATE) {
            groupListRef.current?.removeItemFromList(group.getGuid());
          } else {
            group.setHasJoined(false);
            groupListRef.current?.updateList(group);
          }
        },
        ccOwnershipChanged: ({ group }: any) => {
          groupListRef.current?.updateList(group);
        },
        ccGroupMemberAdded: ({
          userAddedIn,
        }: {
          userAddedIn: CometChat.Group;
        }) => {
          groupListRef.current?.updateList(userAddedIn);
        },
        ccGroupMemberJoined: ({
          joinedGroup,
        }: {
          joinedGroup: CometChat.Group;
        }) => {
          joinedGroup['membersCount'] = joinedGroup['membersCount'] + 1;
          joinedGroup['scope'] = 'participant';
          joinedGroup['hasJoined'] = true;
          groupListRef.current?.updateList(joinedGroup);
        },
      });
      return () => {
        CometChat.removeGroupListener(groupListenerId);
        CometChatUIEventHandler.removeGroupListener(uiEventListener);
      };
    }, []);

    const GroupItemView = ({ item }: any) => {
      //custom view check
      if (ListItemView) return ListItemView(item);

      const { type, name, icon, membersCount } = item;
      let image: ImageType | undefined,
        backgroundColor: string = 'transparent';
      if (type == GroupTypeConstants.password) {
        image = passwordGroupIcon || passwordGroupIcon;
        backgroundColor = PASSWORD_GROUP_COLOR;
      }
      if (type == GroupTypeConstants.private) {
        image = privateGroupIcon || privateGroupIcon;
        backgroundColor = PRIVATE_GROUP_COLOR;
      }
      if (selecting) {
        let index: number = selectedGroups.findIndex(
          (value) => value.guid == item.guid
        );
        if (index >= 0) {
          image = checkIcon;
          backgroundColor = theme?.palette?.getBackgroundColor();
        }
      }

      return (
        <CometChatListItem
          id={item.guid}
          avatarName={name}
          avatarURL={icon}
          hideSeparator={hideSeperator}
          SubtitleView={() =>
            (SubtitleView && SubtitleView(item)) || (
              <Text style={{ color: theme.palette.getAccent600() }}>
                {membersCount} <Text>{localize('MEMBERS')}</Text>
              </Text>
            )
          }
          title={name}
          statusIndicatorIcon={image}
          statusIndicatorColor={backgroundColor}
          listItemStyle={_listItemStyle}
          avatarStyle={_avatarStyle}
          statusIndicatorStyle={_statusIndicatorStyle as ViewProps}
          onPress={groupClicked.bind(this, item)}
          onLongPress={groupLongPressed.bind(this, item)}
          options={() => (options && options(item)) || []}
          activeSwipeRows={activeSwipeRows.current}
          rowOpens={(id) => {
            Object.keys(activeSwipeRows.current).forEach((key) => {
              if (id !== key && activeSwipeRows.current[key]) {
                activeSwipeRows.current[key]?.current?.closeRow?.();
                delete activeSwipeRows.current[key];
              }
            });
          }}
        />
      );
    };

    const onSelectionClicked = () => {
      if (!selectedGroups.length) return;
      onSelection && onSelection(selectedGroups);

      setSelecting(false);
      setSelectedGroups([]);
    };

    return (
      <View
        style={[
          Style.container,
          { backgroundColor: _groupsStyle.backgroundColor },
        ]}
      >
        <CometChatList
          title={title}
          LoadingStateView={LoadingStateView}
          searchPlaceholderText={searchPlaceHolderText}
          ref={groupListRef}
          listItemKey="guid"
          ListItemView={GroupItemView}
          EmptyStateView={EmptyView}
          ErrorStateView={ErrorView}
          requestBuilder={
            groupsRequestBuilder ||
            new CometChat.GroupsRequestBuilder()
              .setLimit(30)
              .setSearchKeyword('')
          }
          searchRequestBuilder={searchRequestBuilder}
          AppBarOptions={AppBarOption}
          hideSeparator={hideSeperator}
          backButtonIcon={backButtonIcon}
          showBackButton={showBackButton}
          selectionMode={
            selectedGroups.length > 0 || selecting ? selectionMode : 'none'
          }
          onSelection={onSelectionClicked}
          searchBoxIcon={searchBoxIcon}
          hideSearch={hideSearch}
          hideSubmitIcon={hideSubmitIcon}
          onError={onError}
          onBack={onBack}
          listStyle={{
            ..._groupsStyle,
            background: _groupsStyle.backgroundColor,
          }}
          statusIndicatorStyle={_statusIndicatorStyle}
          avatarStyle={_avatarStyle}
          listItemStyle={_listItemStyle}
        />
      </View>
    );
  }
);
