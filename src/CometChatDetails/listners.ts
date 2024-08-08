//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatUIKit, CometChatUIEvents, CometChatUIEventHandler } from '../shared';
const actionPerformedByMe = (message: any) => {
  return message?.getActionBy && message?.getActionBy().getUid() === CometChatUIKit.loggedInUser?.getUid();
}
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
    groupListener: ({ groupListenerId, handleGroupListener }: any) =>
      CometChat.addGroupListener(
        groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberKicked: (message: any, kickedUser: any, kickedBy: any, kickedFrom: any) => {
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
          onGroupMemberBanned: (message: any, bannedUser: any, bannedBy: any, bannedFrom: any) => {
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
            message: any,
            userAdded: any,
            userAddedBy: any,
            userAddedIn: any
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
          onGroupMemberLeft: (message: any, leavingUser: any, group: any) => {
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
          onGroupMemberJoined: (message: any, joinedUser: any, joinedGroup: any) => {
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
    removeUserListener: ({ userStatusListenerId }: any) =>
      CometChat.removeUserListener(userStatusListenerId),

    removeGroupListener: ({ groupListenerId }: any) =>
      CometChat.removeGroupListener(groupListenerId),
  },
};
