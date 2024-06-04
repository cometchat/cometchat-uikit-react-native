//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatUIEvents } from '../shared/events';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';

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
    groupListener: ({ groupListenerId, handleGroupListener }) =>
      CometChat.addGroupListener(
        groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
            handleGroupListener(kickedFrom);
            CometChatUIEventHandler.emitGroupEvent(
              CometChatUIEvents.ccGroupMemberKicked,
              {message,
              kickedUser,
              kickedBy,
              kickedFrom}
            );
          },
          onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
            handleGroupListener(bannedFrom);
            CometChatUIEventHandler.emitGroupEvent(
              CometChatUIEvents.ccGroupMemberBanned,
              {message,
              bannedUser,
              bannedBy,
              bannedFrom}
            );
          },
          onMemberAddedToGroup: (
            message,
            userAdded,
            userAddedBy,
            userAddedIn
          ) => {
            handleGroupListener(userAddedIn);
            CometChatUIEventHandler.emitGroupEvent(
              CometChatUIEvents.ccGroupMemberBanned,
              {message,
              userAdded,
              userAddedBy,
              userAddedIn}
            );
          },
          onGroupMemberLeft: (message, leavingUser, group) => {
            handleGroupListener(group);
            CometChatUIEventHandler.emitGroupEvent(
              CometChatUIEvents.ccGroupMemberLeft,
              {message,
              leavingUser,
              group}
            );
          },
          onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
            handleGroupListener(joinedGroup);
            CometChatUIEventHandler.emitGroupEvent(
              CometChatUIEvents.ccGroupMemberJoined,
              {joinedUser,
              joinedGroup}
            );
          },
        })
      ),
  },
  removeListner: {
    removeUserListener: ({ userStatusListenerId }) =>
      CometChat.removeUserListener(userStatusListenerId),

    removeGroupListener: ({ groupListenerId }) =>
      CometChat.removeGroupListener(groupListenerId),
  },
};
