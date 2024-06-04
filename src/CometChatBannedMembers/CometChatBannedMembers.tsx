//@ts-ignore
import { View } from 'react-native';
import React, { useEffect, useRef } from 'react';
//@ts-ignore
import { ICONS } from './resources';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CometChatList,
  CometChatListActionsInterface,
  CometChatListProps,
  CometChatListStylesInterface,
  CometChatOptions,
} from '../shared';
import { localize, ImageType } from '../shared';
import { CometChatGroupsEvents } from '../shared/events';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { MessageTypeConstants } from '../shared/constants/UIKitConstants';

export interface CometChatBannedMembersInterface
  extends Omit<
    CometChatListProps,
    'requestBuilder' | 'listStyle' | 'title' | 'listItemKey' | 'options'
  > {
  bannedMembersRequestBuilder?: CometChat.BannedMembersRequestBuilder;
  group: CometChat.Group;
  bannedMemberStyle?: CometChatListStylesInterface;
  unbanIcon?: ImageType;
  title?: string;
  /**
   *
   *
   * @description function which returns an array of CometChatOptions
   */
  options?: (user: CometChat.User) => Array<CometChatOptions>;
}

export const CometChatBannedMembers = (
  props: CometChatBannedMembersInterface
) => {
  const userListenerId = 'userStatus_' + new Date().getTime();

  const {
    group,
    bannedMembersRequestBuilder,
    bannedMemberStyle,
    unbanIcon,
    onError,
    ...newProps
  } = props;

  const defaultBannedMembersRequestBuilder = group
    ? new CometChat.BannedMembersRequestBuilder(group?.['guid']).setLimit(20)
    : undefined;

  const listRef = useRef<CometChatListActionsInterface>(null);
  const loggedUserRef = useRef(null);
  const unbaned = (uid: any) => {
    CometChat.unbanGroupMember(group['guid'], uid).then(
      (response) => {
        let user = listRef.current.getListItem(uid);

        let action: CometChat.Action = new CometChat.Action(
          group['guid'],
          MessageTypeConstants.groupMember,
          CometChat.RECEIVER_TYPE.GROUP,
          CometChat.CATEGORY_ACTION as CometChat.MessageCategory
        );
        action.setActionBy(loggedUserRef.current);
        action.setMessage(`${loggedUserRef.current['name']} unbanned ${user['name']}}`)
        action.setActionFor(group);
        action.setSender(loggedUserRef.current);

        CometChatUIEventHandler.emitGroupEvent(
          CometChatGroupsEvents.ccGroupMemberUnBanned,
          {
            kickedUser: user,
            kickedBy: loggedUserRef.current,
            message: action, //Note: will add after the discusstion
            kickedFrom: group,
          }
        );
        listRef.current.removeItemFromList(uid);
        console.log('Group member unbanned successfully', response);
      },
      (error) => {
        console.log('Group member unbanning failed with error', error);
        onError && onError(error);
      }
    );
  };

  useEffect(() => {
    CometChat.getLoggedinUser().then(
      (loggedUser: CometChat.User) => {
        loggedUserRef.current = loggedUser;
      },
      (error: CometChat.CometChatException) => {
        onError && onError(error);
      }
    );
  }, []);

  useEffect(() => {
    CometChat.addUserListener(
      userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: any) => {
          /* when someuser/friend comes online, user will be received here */
          listRef.current.updateList(onlineUser);
        },
        onUserOffline: (offlineUser: any) => {
          /* when someuser/friend went offline, user will be received here */
          listRef.current.updateList(offlineUser);
        },
      })
    );
    return () => CometChat.removeUserListener(userListenerId);
  }, []);

  return (
    <View style={{ flex: 1, width: '100%', height: '100%' }}>
      <CometChatList
        ref={listRef}
        title={localize('BANNED_MEMBERS')}
        showBackButton
        hideSeparator
        requestBuilder={bannedMembersRequestBuilder ?? defaultBannedMembersRequestBuilder}
        listItemKey="uid"
        options={() => [
          {
            id: 'banned',
            icon: unbanIcon ? unbanIcon : ICONS.CLEAR,
            onPress: unbaned,
          },
        ]}
        listStyle={bannedMemberStyle}
        {...newProps}
      />
    </View>
  );
};
