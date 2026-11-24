import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatUIEventHandler, CometChatUIKit } from "../shared";
import { OfflineHub } from "../shared/offline/OfflineHub";
import { dispatchSweptGroupAction } from "../shared/offline/groupActions";

/** Hub subscriptions for swept group actions, per header group listener id. */
const sweptGroupActionSubscriptions = new Map<string, { unsubscribe(): void }>();

/** The header's GroupListener handlers, shared by the live listener and swept actions. */
export const groupListenerHandlers = (handleGroupListener: (group: CometChat.Group) => void) => ({
  onGroupMemberKicked: (
    message: any,
    kickedUser: CometChat.User,
    kickedBy: CometChat.User,
    kickedFrom: CometChat.Group
  ) => {
    handleGroupListener(kickedFrom);
  },
  onGroupMemberBanned: (
    message: any,
    bannedUser: CometChat.User,
    bannedBy: CometChat.User,
    bannedFrom: CometChat.Group
  ) => {
    handleGroupListener(bannedFrom);
  },
  onMemberAddedToGroup: (
    message: any,
    userAdded: CometChat.User,
    userAddedBy: CometChat.User,
    userAddedIn: CometChat.Group
  ) => {
    console.log("onMemberAddedToGroup", userAddedIn);
    handleGroupListener(userAddedIn);
  },
  onGroupMemberLeft: (
    message: any,
    leavingUser: CometChat.User,
    group: CometChat.Group
  ) => {
    handleGroupListener(group);
  },
  onGroupMemberJoined: (
    message: any,
    joinedUser: CometChat.User,
    joinedGroup: CometChat.Group
  ) => {
    handleGroupListener(joinedGroup);
  },
  onGroupMemberScopeChanged: (
    message: CometChat.Action,
    changedUser: CometChat.GroupMember,
    newScope: CometChat.GroupMemberScope,
    oldScope: CometChat.GroupMemberScope,
    changedGroup: CometChat.Group
  ) => {
    if (changedUser.getUid() !== CometChatUIKit.loggedInUser?.getUid()) return;
    changedGroup.setScope(newScope);
    handleGroupListener(changedGroup);
  },
});

export const listners = {
  addListener: {
    userListener: ({ userStatusListenerId, handleUserStatus }: any) =>
      CometChat.addUserListener(
        userStatusListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: CometChat.User) => {
            handleUserStatus(onlineUser);
            /* when someuser/friend comes online, user will be received here */
          },
          onUserOffline: (offlineUser: CometChat.User) => {
            handleUserStatus(offlineUser);
            /* when someuser/friend went offline, user will be received here */
          },
        })
      ),
    messageListener: ({ msgTypingListenerId, msgTypingIndicator }: any) =>
      CometChatUIEventHandler.addMessageListener(msgTypingListenerId, {
        onTypingStarted: (typistDetails: CometChat.TypingIndicator) => {
          msgTypingIndicator(typistDetails, "typing");
        },
        onTypingEnded: (typistDetails: CometChat.TypingIndicator) => {
          msgTypingIndicator(typistDetails, "");
        },
      }),
    groupListener: ({ groupListenerId, handleGroupListener }: any) => {
      const handlers = groupListenerHandlers(handleGroupListener);
      CometChat.addGroupListener(groupListenerId, new CometChat.GroupListener(handlers));
      // Offline (ON path): a group action the catch-up sweep delivered fires no GroupListener
      // callback; run the same handlers for it (UIT-SYNC-13). Inert with offline off.
      sweptGroupActionSubscriptions.get(groupListenerId)?.unsubscribe();
      sweptGroupActionSubscriptions.set(
        groupListenerId,
        OfflineHub.getInstance().groupActionSwept$.subscribe((event) => {
          if (event.gen !== OfflineHub.getInstance().gen) return;
          dispatchSweptGroupAction(event.message, handlers);
        })
      );
    },
  },
  removeListner: {
    removeUserListener: ({ userStatusListenerId }: any) =>
      CometChat.removeUserListener(userStatusListenerId),

    removeMessageListener: ({ msgTypingListenerId }: any) =>
      CometChatUIEventHandler.removeMessageListener(msgTypingListenerId),

    removeGroupListener: ({ groupListenerId }: any) => {
      sweptGroupActionSubscriptions.get(groupListenerId)?.unsubscribe();
      sweptGroupActionSubscriptions.delete(groupListenerId);
      return CometChat.removeGroupListener(groupListenerId);
    },
  },
};
