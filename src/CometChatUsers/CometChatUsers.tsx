//@ts-ignore
import { View, ListRenderItem } from 'react-native';
import React, { useRef, useEffect } from 'react';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CometChatList,
  CometChatListActionsInterface,
  CometChatListProps,
  CometChatListStylesInterface,
  CometChatOptions,
} from '../shared';
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
   * @type {CometChatListStylesInterface}
   * pass custom styling for user
   */
  usersStyle?: CometChatListStylesInterface;
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
  ListItemView?: ListRenderItem<CometChat.User>;
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

  const { usersRequestBuilder, usersStyle, ...newProps } = props;
  const userRef = useRef<CometChatUsersActionsInterface>(null);

  useEffect(() => {
    CometChat.addUserListener(
      userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: any) => {
          /* when someuser/friend comes online, user will be received here */
          userRef.current.updateList(onlineUser);
        },
        onUserOffline: (offlineUser: any) => {
          /* when someuser/friend went offline, user will be received here */
          userRef.current.updateList(offlineUser);
        },
      })
    );
    return CometChat.removeUserListener(userListenerId);
  }, []);

  const handleccUserBlocked = ({ user }) => {
    userRef.current.updateList({
      ...user,
      blockedByMe: true,
      hasBlockedMe: true,
    });
  };
  const handleccUserUnBlocked = ({ user }) => {
    userRef.current.updateList({
      ...user,
      blockedByMe: false,
      hasBlockedMe: false,
    });
  };

  useEffect(() => {
    CometChatUIEventHandler.addUserListener(userListenerId, {
      ccUserBlocked: (item) => handleccUserBlocked(item),
      ccUserUnBlocked: (item) => handleccUserUnBlocked(item),
    });
    return () => {
      CometChatUIEventHandler.removeUserListener(userListenerId);
    };
  }, []);

  return (
    <View style={{ flex: 1, width: '100%', height: '100%' }}>
      <CometChatList
        listItemKey="uid"
        ref={ref}
        title={'Users'}
        requestBuilder={usersRequestBuilder}
        listStyle={usersStyle}
        {...newProps}
      />
    </View>
  );
});

CometChatUsers.defaultProps = {
  usersRequestBuilder: new CometChat.UsersRequestBuilder()
    .setLimit(30)
    .hideBlockedUsers(true)
    .setRoles([])
    .friendsOnly(false)
    .setStatus('')
    .setTags([])
    .setUIDs([]),
};
