import { useState, useEffect, useRef } from 'react';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatUIEventHandler } from '@cometchat/chat-uikit-react-native';

/**
 * Hook that detects whether the logged-in user is no longer a member
 * of the given group (kicked or banned).
 *
 * - On mount: checks current membership via CometChat.getGroup()
 * - Real-time: listens to SDK + UI events for kicked/banned/re-added
 *
 * @param group - The CometChat group object (pass undefined for 1-on-1 chats)
 * @returns `true` when the current user is no longer a member
 */
export const useGroupMemberStatus = (group?: CometChat.Group): boolean => {
  const [isNoLongerMember, setIsNoLongerMember] = useState(false);
  const loggedInUser = useRef<CometChat.User | null>(null);

  // Fetch logged-in user once
  useEffect(() => {
    CometChat.getLoggedinUser().then((u: CometChat.User | null) => {
      if (u) loggedInUser.current = u;
    });
  }, []);

  // Check membership on mount by fetching fresh group data
  useEffect(() => {
    if (!group) return;

    CometChat.getGroup(group.getGuid())
      .then((freshGroup: CometChat.Group) => {
        if (!freshGroup.getHasJoined()) {
          console.log('useGroupMemberStatus: Error fetching group details:', error);
        }
      })
      .catch((error: any) => {
        console.log('useGroupMemberStatus: Error fetching group details:', error);
      });
  }, [group]);

  useEffect(() => {
    if (!group) return;

    const uiListenerId = 'composer_group_status_' + new Date().getTime();
    const sdkListenerId = 'composer_sdk_group_status_' + new Date().getTime();

    CometChatUIEventHandler.addGroupListener(uiListenerId, {
      ccGroupMemberKicked: ({ kickedUser }: any) => {
        if (kickedUser?.getUid?.() === loggedInUser.current?.getUid?.()) {
          console.log('useGroupMemberStatus: Error fetching group details:', error);
        }
      },
      ccGroupMemberBanned: ({ kickedUser, bannedUser }: any) => {
        const affected = bannedUser || kickedUser;
        if (affected?.getUid?.() === loggedInUser.current?.getUid?.()) {
          console.log('useGroupMemberStatus: Error fetching group details:', error);
        }
      },
      ccGroupMemberAdded: ({ usersAdded }: any) => {
        if (Array.isArray(usersAdded)) {
          const wasReAdded = usersAdded.some(
            (u: any) =>
              u?.getUid?.() === loggedInUser.current?.getUid?.() ||
              u?.uid === loggedInUser.current?.getUid?.()
          );
          if (wasReAdded) {
            setIsNoLongerMember(false);
          }
        }
      },
    });

    CometChat.addGroupListener(
      sdkListenerId,
      new CometChat.GroupListener({
        onGroupMemberKicked: (
          _message: any,
          kickedUser: any,
          _kickedBy: any,
          kickedFrom: any
        ) => {
          if (
            kickedFrom?.getGuid?.() === group.getGuid() &&
            kickedUser?.getUid?.() === loggedInUser.current?.getUid?.()
          ) {
            console.log('useGroupMemberStatus: Error fetching group details:', error);
          }
        },
        onGroupMemberBanned: (
          _message: any,
          bannedUser: any,
          _bannedBy: any,
          bannedFrom: any
        ) => {
          if (
            bannedFrom?.getGuid?.() === group.getGuid() &&
            bannedUser?.getUid?.() === loggedInUser.current?.getUid?.()
          ) {
            console.log('useGroupMemberStatus: Error fetching group details:', error);
          }
        },
        onMemberAddedToGroup: (
          _message: any,
          addedUser: any,
          _addedBy: any,
          addedTo: any
        ) => {
          if (
            addedTo?.getGuid?.() === group.getGuid() &&
            addedUser?.getUid?.() === loggedInUser.current?.getUid?.()
          ) {
            setIsNoLongerMember(false);
          }
        },
      })
    );

    return () => {
      CometChatUIEventHandler.removeGroupListener(uiListenerId);
      CometChat.removeGroupListener(sdkListenerId);
    };
  }, [group]);

  return isNoLongerMember;
};
