//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatUIEventHandler } from '../shared';

export const listners = {
  addListener: {
    userListener: ({ userStatusListenerId, handleUserStatus }: any) =>
      CometChat.addUserListener(
        userStatusListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: any) => {
            handleUserStatus(onlineUser);
            /* when someuser/friend comes online, user will be received here */
          },
          onUserOffline: (offlineUser: any) => {
            handleUserStatus(offlineUser);
            /* when someuser/friend went offline, user will be received here */
          },
        })
      ),
    messageListener: ({ msgTypingListenerId, msgTypingIndicator }: any) =>
      CometChatUIEventHandler.addMessageListener(
        msgTypingListenerId,
        {
          onTypingStarted: (typistDetails: any) => {

            msgTypingIndicator(typistDetails, 'typing');
          },
          onTypingEnded: (typistDetails: any) => {
            msgTypingIndicator(typistDetails, '');
          },
        }
      ),
    groupListener: ({ groupListenerId, handleGroupListener }: any) =>
      CometChat.addGroupListener(
        groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberKicked: (message: any, kickedUser: any, kickedBy: any, kickedFrom: any) => {
            handleGroupListener(kickedFrom);
          },
          onGroupMemberBanned: (message: any, bannedUser: any, bannedBy: any, bannedFrom: any) => {
            handleGroupListener(bannedFrom);
          },
          onMemberAddedToGroup: (
            message: any,
            userAdded: any,
            userAddedBy: any,
            userAddedIn: any
          ) => {
            console.log('onMemberAddedToGroup', userAddedIn);
            handleGroupListener(userAddedIn);
          },
          onGroupMemberLeft: (message: any, leavingUser: any, group: any) => {
            handleGroupListener(group);
          },
          onGroupMemberJoined: (message: any, joinedUser: any, joinedGroup: any) => {
            handleGroupListener(joinedGroup);
          },
        })
      ),
  },
  removeListner: {
    removeUserListener: ({ userStatusListenerId }: any) =>
      CometChat.removeUserListener(userStatusListenerId),

    removeMessageListener: ({ msgTypingListenerId }: any) =>
    CometChatUIEventHandler.removeMessageListener(msgTypingListenerId),

    removeGroupListener: ({ groupListenerId }: any) =>
      CometChat.removeGroupListener(groupListenerId),
  },
};
