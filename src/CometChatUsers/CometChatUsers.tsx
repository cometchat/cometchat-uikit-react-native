//@ts-ignore
import { View, ListRenderItem } from 'react-native';
import React, { useRef, useEffect, useImperativeHandle } from 'react';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  BorderStyle,
  CometChatContext,
  CometChatContextType,
  CometChatList,
  CometChatListActionsInterface,
  CometChatListProps,
  CometChatListStylesInterface,
  CometChatOptions,
} from '../shared';
import { UsersStyle, UsersStyleInterface } from './UsersStyle';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';

export interface CometChatUsersInterface
  extends Omit<
    CometChatListProps,
    | 'requestBuilder'
    | 'listStyle'
    | 'SubtitleView'
    | 'TailView'
    | 'disableUsersPresence'
    | 'ListItemView'
    | 'onItemPress'
    | 'onItemLongPress'
    | 'options'
    | 'listItemKey'
    | 'onSelection'
  > {
  /**
   *
   *
   * @description function which returns an array of CometChatOptions
   */
  options?: (user: CometChat.User) => Array<CometChatOptions>;
  /**
   *
   *
   * @description callback function when user press a list item
   */
  onItemPress?: (user: CometChat.User) => void;
  /**
   *
   *
   * @description callback function when user long press a list item
   */
  onItemLongPress?: (user: CometChat.User) => void;
  /**
   *
   *
   * @description Selected Users list
   */
  onSelection?: (list: CometChat.User[]) => void;
  /**
   *
   * @type {CometChat.UsersRequestBuilder}
   * pass user request object
   */
  usersRequestBuilder?: CometChat.UsersRequestBuilder;
  /**
   *
   * @type {UsersStyleInterface}
   * pass custom styling for user
   */
  usersStyle?: UsersStyleInterface;
  /**
   *
   * Function which have user object as prop and takes a to render in place of subtitle view in list item
   *
   */
  SubtitleView?: (item: CometChat.User) => JSX.Element;
  /**
   *
   * Function which have user object as prop and returns a JSX Element to render in place of tail view in list item
   *
   */
  TailView?: (item: CometChat.User) => JSX.Element;
  /**
   *
   * @type {boolean}
   * To disable user presence indicator
   */
  disableUsersPresence?: boolean;
  /**
   *
   * Function which have {item: userObject, index: number } as prop and returns a JSX Element to render in place of tail view in list item
   *
   */
  ListItemView?: (item: any) => JSX.Element | null;
}

export interface CometChatUsersActionsInterface
  extends CometChatListActionsInterface {}

export const CometChatUsers = React.forwardRef<
  CometChatUsersActionsInterface,
  CometChatUsersInterface
>((props, ref) => {
  const userListenerId = 'userStatus_' + new Date().getTime();
  const ccUserBlockedId = 'ccUserBlocked_' + new Date().getTime();
  const ccUserUnBlockedId = 'ccUserBlocked_' + new Date().getTime();

  const {
    usersRequestBuilder = new CometChat.UsersRequestBuilder()
      .setLimit(30)
      .hideBlockedUsers(false)
      .setRoles([])
      .friendsOnly(false)
      .setStatus('')
      .setTags([])
      .setUIDs([]),
    usersStyle,
    ...newProps
  } = props;

  //context values
  const { theme } = React.useContext<CometChatContextType>(CometChatContext);

  const userRef = useRef<CometChatUsersActionsInterface>(null);

  const _usersStyle = new UsersStyle({
    backgroundColor: theme?.palette.getBackgroundColor(),
    backIconTint: theme?.palette.getPrimary(),
    emptyTextColor: theme?.palette.getAccent400(),
    emptyTextFont: theme?.typography.caption2,
    errorTextColor: theme?.palette.getError(),
    errorTextFont: theme?.typography.subtitle1,
    searchBackgroundColor: theme?.palette.getAccent600(),
    searchBorder: new BorderStyle({
      borderColor: theme?.palette.getAccent700(),
      ...usersStyle?.border,
    }),
    separatorColor: theme?.palette.getAccent100(),
    subtitleTextColor: theme?.palette.getAccent600(),
    subtitleTextFont: theme?.typography.text1,
    titleColor: theme?.palette.getAccent(),
    titleFont: theme?.typography.title1,
    loadingIconTint: theme?.palette.getPrimary(),
    ...usersStyle,
  });

  useImperativeHandle(ref, () => {
    return {
      updateList: userRef.current!.updateList,
      addItemToList: userRef.current!.addItemToList,
      removeItemFromList: userRef.current!.removeItemFromList,
      getListItem: userRef.current!.getListItem,
      updateAndMoveToFirst: userRef.current!.updateAndMoveToFirst,
      getSelectedItems: userRef.current!.getSelectedItems,
      getAllListItems: userRef.current!.getAllListItems,
      clearSelection: userRef.current!.clearSelection,
    };
  });

  useEffect(() => {
    CometChat.addUserListener(
      userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: any) => {
          /* when someuser/friend comes online, user will be received here */
          userRef.current?.updateList(onlineUser);
        },
        onUserOffline: (offlineUser: any) => {
          /* when someuser/friend went offline, user will be received here */
          userRef.current?.updateList(offlineUser);
        },
      })
    );
    return () => CometChat.removeUserListener(userListenerId);
  }, []);

  const handleccUserBlocked = ({ user }: any) => {
    userRef.current?.updateList({
      ...user,
      blockedByMe: true,
      hasBlockedMe: true,
    });
  };
  const handleccUserUnBlocked = ({ user }: any) => {
    userRef.current?.updateList({
      ...user,
      blockedByMe: false,
      hasBlockedMe: false,
    });
  };

  useEffect(() => {
    CometChatUIEventHandler.addUserListener(userListenerId, {
      ccUserBlocked: (item: any) => handleccUserBlocked(item),
      ccUserUnBlocked: (item: any) => handleccUserUnBlocked(item),
    });
    return () => {
      CometChatUIEventHandler.removeUserListener(userListenerId);
    };
  }, []);

  return (
    <View style={{ flex: 1, width: '100%', height: '100%' }}>
      <CometChatList
        ref={userRef}
        title={'Users'}
        requestBuilder={usersRequestBuilder}
        listStyle={{
          ..._usersStyle,
          background: _usersStyle.backgroundColor,
        }}
        {...(newProps as CometChatListProps)}
        listItemKey="uid"
      />
    </View>
  );
});
