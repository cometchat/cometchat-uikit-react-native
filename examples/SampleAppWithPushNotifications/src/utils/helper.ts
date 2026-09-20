import {CometChat} from '@cometchat/chat-sdk-react-native';
import Ironman from '../assets/icons/ironman.png';
import Captainamerica from '../assets/icons/captainamerica.png';
import Wolverine from '../assets/icons/wolverine.png';
import Spiderman from '../assets/icons/spiderman.png';
import Cyclops from '../assets/icons/cyclops.png';
import {
  CometChatUIEventHandler,
  CometChatUIEvents,
  CometChatUIKit,
  MessageEvents,
} from '@cometchat/chat-uikit-react-native';
import {
  NavigationContainerRefWithCurrent,
  StackActions,
} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/types';
import {SCREEN_CONSTANTS} from './AppConstants';
import dayjs from 'dayjs';

interface Translations {
  lastSeen: string;
  minutesAgo: (minutes: number) => string;
  hoursAgo: (hours: number) => string;
}

interface NotificationData {
  receiverType?: 'user' | 'group';
  conversationId?: string;
  sender?: string;
  messageId?: string;
  parentId?: string;
  [key: string]: any;
}

/**
 * getLastSeenTime UserInfoSection.
 */
export function getLastSeenTime(
  timestamp: number | null,
  translations: Translations,
): string {
  if (timestamp === null) {
    return `${translations.lastSeen} Unknown`;
  }

  // If timestamp is in seconds (length = 10), convert to milliseconds.
  if (String(timestamp).length === 10) {
    timestamp *= 1000;
  }

  const now = new Date();
  const lastSeen = new Date(timestamp);

  // Calculate the time differences
  const diffInMillis = now.getTime() - lastSeen.getTime();
  const diffInMinutes = Math.floor(diffInMillis / (1000 * 60));
  const diffInHours = Math.floor(diffInMillis / (1000 * 60 * 60));

  // Check if within last hour
  if (diffInMinutes === 0) {
    return `${translations.lastSeen} ${translations.minutesAgo(1)}`;
  } else if (diffInMinutes < 60) {
    return `${translations.lastSeen} ${translations.minutesAgo(diffInMinutes)}`;
  }

  // Check if within the last 24 hours
  if (diffInHours < 24) {
    return `${translations.lastSeen} ${translations.hoursAgo(diffInHours)}`;
  }

  // Determine if timestamp is within the current year
  const isSameYear = lastSeen.getFullYear() === now.getFullYear();

  // Options for date formatting
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    ...(isSameYear ? {} : { year: 'numeric' }),
  };

  // Options for time formatting
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  const formattedDate = lastSeen.toLocaleDateString(undefined, dateOptions);
  const formattedTime = lastSeen.toLocaleTimeString(undefined, timeOptions);
  if (formattedDate === 'Invalid Date' || formattedTime === 'Invalid Date') {
    return `Offline`;
  }

  return `${translations.lastSeen} ${formattedDate} at ${formattedTime}`;
}

/**
 * UNBLOCK
 */
export const unblock = async (
  uid: string,
  user: CometChat.User,
  setBlocked: React.Dispatch<React.SetStateAction<boolean>>,
  setUserObj: React.Dispatch<React.SetStateAction<CometChat.User>>,
): Promise<void> => {
  try {
    const response = await CometChat.unblockUsers([uid]);
    const unBlockedUser = await CometChat.getUser(uid);
    if (response) {
      CometChatUIEventHandler.emitUserEvent(CometChatUIEvents.ccUserUnBlocked, {
        user: unBlockedUser,
      });
      setBlocked(false);
      setUserObj(unBlockedUser);
    } else {
      console.log(
        `Failed to unblock user with UID ${uid}. Response:`,
        response,
      );
    }
  } catch (error) {
    console.error('Error unblocking user:', error);
  }
};

/**
 * BLOCK
 */
export const blockUser = async (
  uid: string,
  user: CometChat.User,
  setBlocked: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<void> => {
  try {
    const response = await CometChat.blockUsers([uid]);
    if (response) {
      user.setBlockedByMe(true);
      setBlocked(true);
      CometChatUIEventHandler.emitUserEvent(CometChatUIEvents.ccUserBlocked, {
        user,
      });
    } else {
      console.log(`Failed to block user with UID ${uid}. Response:`, response);
    }
  } catch (error) {
    console.error('Error blocking user:', error);
  }
};

/**
 * LEAVE GROUP
 */
export const leaveGroup = (
  group: CometChat.Group,
  navigation: any,
  pop: number,
) => {
  if (group) {
    const groupID = group.getGuid();
    CometChat.leaveGroup(groupID).then(
      () => {
        let actionMessage: CometChat.Action = new CometChat.Action(
          groupID,
          CometChat.MESSAGE_TYPE.TEXT,
          CometChat.RECEIVER_TYPE.GROUP,
          CometChat.CATEGORY_ACTION as CometChat.MessageCategory,
        );
        actionMessage.setMessage(
          `${CometChatUIKit.loggedInUser?.getName()} has left`,
        );
        // Initialize data to prevent crash when SDK accesses getData().metadata during render
        actionMessage.setData({ metadata: {} });
        CometChatUIEventHandler.emitGroupEvent(CometChatUIEvents.ccGroupLeft, {
          message: actionMessage, //Note: Add Action message after discussion
          leftUser: CometChatUIKit.loggedInUser,
          leftGroup: group,
        });
        navigation.pop(pop);
      },
      error => {
        console.log('Group leaving failed:', error);
      },
    );
  } else {
    console.log('Group is not defined');
  }
};

/**
 * Sample Users Data
 */
export const sampleData = {
  users: [
    {uid: 'superhero1', name: 'Iron Man', avatar: Ironman},
    {uid: 'superhero2', name: 'Captain America', avatar: Captainamerica},
    {uid: 'superhero3', name: 'Spiderman', avatar: Spiderman},
    {uid: 'superhero4', name: 'Wolverine', avatar: Wolverine},
    {uid: 'superhero5', name: 'Cyclops', avatar: Cyclops},
  ],
};


/**
 * A thread notification must land INSIDE the thread, not merely in the conversation.
 *
 * `parentId` arrives at the top level of the push payload (verified on staging 2026-08-10:
 * `{"tag":"4121","parentId":"4120",…}`). Before this, a thread reply pushed the Messages screen
 * with `parentMessageId` set, which filtered the list but never opened ThreadView — so tapping a
 * reply notification dropped the user in the parent conversation and left them to find it.
 *
 * Pushes Messages FIRST so Back returns to the conversation rather than the conversation list —
 * the same stack shape the Saved and Pinned panels build when a row turns out to be a reply.
 */
async function pushThreadIfReply(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  data: NotificationData,
  entity: {user?: any; group?: any},
): Promise<boolean> {
  const parentId = data.parentId;
  if (!parentId) return false;
  try {
    const parentMessage = await CometChat.getMessageDetails(parentId as any);
    if (!parentMessage) return false;
    navigationRef.current?.dispatch(
      StackActions.push(SCREEN_CONSTANTS.THREAD_VIEW, {
        message: parentMessage,
        ...entity,
        // `tag` is the REPLY's own id — highlight the message the notification was about.
        highlightMessageId: data.tag ? String(data.tag) : undefined,
      }),
    );
    return true;
  } catch (error) {
    // A deleted or inaccessible parent must not strand the user on a blank screen; the
    // conversation we already pushed is a correct, if less precise, destination.
    console.log('Could not open thread for parentId', parentId, error);
    return false;
  }
}

/**
 * Navigate to conversation based on notification data.
 */
export async function navigateToConversation(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  data?: NotificationData,
) {
  if (!data || !navigationRef.current) {
    return;
  }
  
  try {
    // Handle group
    if (data.receiverType === 'group') {
      const extractedId =
        typeof data.conversationId === 'string'
          ? data.conversationId.split('_').slice(1).join('_')
          : '';
      const group = await CometChat.getGroup(extractedId);

      // Mark conversation as read immediately when opening from push notification
      // and emit ccMessageRead event so the conversation list clears the unread badge
      CometChat.markConversationAsRead(extractedId, CometChat.RECEIVER_TYPE.GROUP)
        .then(() => {
          // Fetch the conversation to get the last message for the event
          CometChat.getConversation(extractedId, CometChat.RECEIVER_TYPE.GROUP)
            .then((conversation) => {
              const lastMessage = conversation.getLastMessage();
              if (lastMessage) {
                CometChatUIEventHandler.emitMessageEvent(
                  MessageEvents.ccMessageRead,
                  { message: lastMessage }
                );
              }
            })
            .catch((e) => console.log('Error fetching conversation after markAsRead:', e));
        })
        .catch((e) => {
          console.log('Error marking group conversation as read from notification:', e);
        });

      // Navigate with parent message ID if available (for agentic conversations)
      const params: any = {group};
      if (data.parentId) {
        params.parentMessageId = data.parentId;
      }

      navigationRef.current?.dispatch(StackActions.push(SCREEN_CONSTANTS.MESSAGES, params));
      await pushThreadIfReply(navigationRef, data, {group});
    }

    // Handle user
    else if (data.receiverType === 'user') {
      const ccUser = await CometChat.getUser(data.sender);

      // Mark conversation as read immediately when opening from push notification
      // and emit ccMessageRead event so the conversation list clears the unread badge
      CometChat.markConversationAsRead(data.sender!, CometChat.RECEIVER_TYPE.USER)
        .then(() => {
          // Fetch the conversation to get the last message for the event
          CometChat.getConversation(data.sender!, CometChat.RECEIVER_TYPE.USER)
            .then((conversation) => {
              const lastMessage = conversation.getLastMessage();
              if (lastMessage) {
                CometChatUIEventHandler.emitMessageEvent(
                  MessageEvents.ccMessageRead,
                  { message: lastMessage }
                );
              }
            })
            .catch((e) => console.log('Error fetching conversation after markAsRead:', e));
        })
        .catch((e) => {
          console.log('Error marking user conversation as read from notification:', e);
        });

      // Navigate with parent message ID if available (for agentic conversations)
      const params: any = {user: ccUser};
      if (data.parentId) {
        params.parentMessageId = data.parentId;
      }

      navigationRef.current?.dispatch(
        StackActions.push(SCREEN_CONSTANTS.MESSAGES, params),
      );
      await pushThreadIfReply(navigationRef, data, {user: ccUser});
    }
  } catch (error) {
    console.log('Error in navigateToConversation:', error);
  }
}
