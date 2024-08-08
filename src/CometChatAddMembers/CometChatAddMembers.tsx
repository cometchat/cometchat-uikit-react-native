//@ts-ignore
import { View } from 'react-native';
import React, { useEffect, useRef } from 'react';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CometChatUsers,
  CometChatUsersInterface,
  CometChatUsersActionsInterface,
} from '../CometChatUsers';
import { CometChatListStylesInterface, localize } from '../shared';
import { CometChatGroupsEvents } from '../shared/events';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { MessageTypeConstants } from '../shared/constants/UIKitConstants';

export interface CometChatAddMembersInterface
  extends Omit<CometChatUsersInterface, 'title' | 'listItemKey' | 'listStyle'> {
  group: CometChat.Group;
  title?: string;
  addMembersStyle?: CometChatListStylesInterface;
}
//Note: Add userConfiguration

export const CometChatAddMembers = (props: CometChatAddMembersInterface) => {
  const userListenerId = 'userlist_' + new Date().getTime();
  const { group, addMembersStyle, ...newProps } = props;
  const userRef = useRef<CometChatUsersActionsInterface>(null);
  const loggedInUser = useRef<any>(null);
  const addMembersToGroup = (res: any) => {
    if(!res.length) return
    userRef.current?.clearSelection()
    let membersList = res.map((item: any) => {
      let groupMember = new CometChat.GroupMember(
        item['uid'],
        CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
      );
      groupMember.setName(item['name'])
      return groupMember
    });

    CometChat.addMembersToGroup(props.group['guid'], membersList, []).then(
      (response: any) => {
        let addedUIDs: any[] = [];
        Object.keys(response).forEach(key => {
          if (response[key] === "success") {
            addedUIDs.push(key)
          }
        })
        let addedMembers = membersList.filter((item: any) => addedUIDs.includes(item.uid));
        if (addedMembers.length) {
          let action: CometChat.Action = new CometChat.Action(
            (group as any)['guid'],
            MessageTypeConstants.groupMember,
            CometChat.RECEIVER_TYPE.GROUP,
            CometChat.CATEGORY_ACTION as CometChat.MessageCategory
          );
          action.setConversationId((group as any)['conversationId'])
          action.setActionBy(loggedInUser.current);
          action.setActionFor(group);
          action.setSender(loggedInUser.current);
          (group as any)['membersCount'] = (group as any)['membersCount'] + addedMembers.length; // increase members count
          CometChatUIEventHandler.emitGroupEvent(
            CometChatGroupsEvents.ccGroupMemberAdded,
            {
              addedBy: loggedInUser.current,
              message: action,
              usersAdded: addedMembers,
              userAddedIn: group,
            }
          );
        }
        props.onBack && props.onBack();
      },
      (error: any) => {
        console.log('Something went wrong', error);
      }
    );
  };

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
    CometChat.getLoggedinUser()
      .then((u: any) => (loggedInUser.current = u))
      .catch((e: any) => { });
    return CometChat.removeUserListener(userListenerId);
  }, []);

  return (
    <View style={{ flex: 1, width: '100%', height: '100%' }}>
      <CometChatUsers
        ref={userRef}
        onSelection={addMembersToGroup}
        title={localize('ADD_MEMBERS')}
        showBackButton
        selectionMode="multiple"
        usersStyle={addMembersStyle}
        {...newProps}
      />
    </View>
  );
};
