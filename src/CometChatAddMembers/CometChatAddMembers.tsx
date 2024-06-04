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
  const { group, ...newProps } = props;
  const userRef = useRef<CometChatUsersActionsInterface>(null);
  const loggedInUser = useRef(null);
  const addMembersToGroup = (res: any) => {
    let membersList = res.map((item: any) => {
      let groupMember = new CometChat.GroupMember(
        item['uid'],
        CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
      );
      groupMember.setName(item['name'])
      return groupMember
    });

    CometChat.addMembersToGroup(props.group['guid'], membersList, []).then(
      (response) => {
        let action: CometChat.Action = new CometChat.Action(
          group['guid'],
          MessageTypeConstants.groupMember,
          CometChat.RECEIVER_TYPE.GROUP,
          CometChat.CATEGORY_ACTION as CometChat.MessageCategory
        );
        action.setConversationId(group['conversationId'])
        action.setActionBy(loggedInUser.current);
        action.setActionFor(group);
        action.setSender(loggedInUser.current);
        group['membersCount'] = group['membersCount'] + membersList.length; // increase members count
        CometChatUIEventHandler.emitGroupEvent(
          CometChatGroupsEvents.ccGroupMemberAdded,
          {
            addedBy: loggedInUser.current,
            message: action,
            usersAdded: membersList,
            userAddedIn: group,
          }
        );
      },
      (error) => {
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
          userRef.current.updateList(onlineUser);
        },
        onUserOffline: (offlineUser: any) => {
          /* when someuser/friend went offline, user will be received here */
          userRef.current.updateList(offlineUser);
        },
      })
    );
    CometChat.getLoggedinUser()
      .then((u) => (loggedInUser.current = u))
      .catch((e) => {});
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
        {...newProps}
      />
    </View>
  );
};
