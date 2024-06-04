//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatUIEventHandler } from '../shared';

export const listners = {
  addListener: {
    userListener: ({ userStatusListenerId, handleUserStatus }) =>
      CometChat.addUserListener(
        userStatusListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser) => {
            handleUserStatus(onlineUser);
            /* when someuser/friend comes online, user will be received here */
          },
          onUserOffline: (offlineUser) => {
            handleUserStatus(offlineUser);
            /* when someuser/friend went offline, user will be received here */
          },
        })
      ),
    messageListener: ({ msgTypingListenerId, msgTypingIndicator }) =>
      CometChatUIEventHandler.addMessageListener(
        msgTypingListenerId,
        {
          onTypingStarted: (typistDetails) => {
            console.log('onTypingStarted', typistDetails);

            msgTypingIndicator(typistDetails, 'typing');
          },
          onTypingEnded: (typistDetails) => {
            console.log('onTypingEnded', typistDetails);
            msgTypingIndicator(typistDetails, '');
          },
        }
      ),
    groupListener: ({ groupListenerId, handleGroupListener }) =>
      CometChat.addGroupListener(
        groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
            handleGroupListener(kickedFrom);
          },
          onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
            handleGroupListener(bannedFrom);
          },
          onMemberAddedToGroup: (
            message,
            userAdded,
            userAddedBy,
            userAddedIn
          ) => {
            console.log('onMemberAddedToGroup', userAddedIn);
            handleGroupListener(userAddedIn);
          },
          onGroupMemberLeft: (message, leavingUser, group) => {
            handleGroupListener(group);
          },
          onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
            handleGroupListener(joinedGroup);
          },
        })
      ),
  },
  removeListner: {
    removeUserListener: ({ userStatusListenerId }) =>
      CometChat.removeUserListener(userStatusListenerId),

    removeMessageListener: ({ msgTypingListenerId }) =>
    CometChatUIEventHandler.removeMessageListener(msgTypingListenerId),

    removeGroupListener: ({ groupListenerId }) =>
      CometChat.removeGroupListener(groupListenerId),
  },
};
