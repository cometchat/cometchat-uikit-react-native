import {CometChat} from '@cometchat/chat-sdk-react-native';
import {CometChatUIKit} from '@cometchat/chat-uikit-react-native';

export const listners = {
  addListener: {
    groupListener: ({groupListenerId, handleGroupListener}: any) =>
      CometChat.addGroupListener(
        groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberKicked: (
            message: any,
            kickedUser: any,
            kickedBy: any,
            kickedFrom: any,
          ) => {
            handleGroupListener(kickedFrom);
          },
          onGroupMemberBanned: (
            message: any,
            bannedUser: any,
            bannedBy: any,
            bannedFrom: any,
          ) => {
            handleGroupListener(bannedFrom);
          },
          onMemberAddedToGroup: (
            message: any,
            userAdded: any,
            userAddedBy: any,
            userAddedIn: any,
          ) => {
            handleGroupListener(userAddedIn);
          },
          onGroupMemberLeft: (message: any, leavingUser: any, group: any) => {
            handleGroupListener(group);
          },
          onGroupMemberScopeChanged: (
            message: any,
            changedUser: CometChat.User,
            newScope: any,
            oldScope: any,
            changedGroup: CometChat.Group,
          ) => {
            console.log('changedGroup: ', message, changedGroup);
            if (changedUser.getUid() == CometChatUIKit.loggedInUser?.getUid()) {
              changedGroup.setScope(newScope);
              handleGroupListener(changedGroup);
            }
          },
        }),
      ),
  },
  removeListner: {
    removeUserListener: ({userStatusListenerId}: any) =>
      CometChat.removeUserListener(userStatusListenerId),

    removeGroupListener: ({groupListenerId}: any) =>
      CometChat.removeGroupListener(groupListenerId),
  },
};
