//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatUIKit, CometChatUIEvents, CometChatUIEventHandler } from '../shared';
const actionPerformedByMe = (message) => {
  return message?.getActionBy && message?.getActionBy().getUid() === CometChatUIKit.loggedInUser.uid;
}
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
            if (actionPerformedByMe(message)) {
              CometChatUIEventHandler.emitGroupEvent(
                CometChatUIEvents.ccGroupMemberKicked,
                {
                  message,
                  kickedUser,
                  kickedBy,
                  kickedFrom
                }
              );
            }
          },
          onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
            handleGroupListener(bannedFrom);
            if (actionPerformedByMe(message)) {
              CometChatUIEventHandler.emitGroupEvent(
                CometChatUIEvents.ccGroupMemberBanned,
                {
                  message,
                  bannedUser,
                  bannedBy,
                  bannedFrom
                }
              );
            }
          },
          onMemberAddedToGroup: (
            message,
            userAdded,
            userAddedBy,
            userAddedIn
          ) => {
            handleGroupListener(userAddedIn);
            if (actionPerformedByMe(message)) {
              CometChatUIEventHandler.emitGroupEvent(
                CometChatUIEvents.ccGroupMemberAdded,
                {
                  message,
                  userAdded,
                  userAddedBy,
                  userAddedIn
                }
              );
            }
          },
          onGroupMemberLeft: (message, leavingUser, group) => {
            handleGroupListener(group);
            if (actionPerformedByMe(message)) {
              CometChatUIEventHandler.emitGroupEvent(
                CometChatUIEvents.ccGroupMemberLeft,
                {
                  message,
                  leavingUser,
                  group
                }
              );
            }
          },
          onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
            handleGroupListener(joinedGroup);
            if (actionPerformedByMe(message)) {
              CometChatUIEventHandler.emitGroupEvent(
                CometChatUIEvents.ccGroupMemberJoined,
                {
                  joinedUser,
                  joinedGroup
                }
              );
            }
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
