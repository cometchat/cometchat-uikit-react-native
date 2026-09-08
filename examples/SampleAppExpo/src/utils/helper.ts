import {Platform, PermissionsAndroid} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {CometChat} from '@cometchat/chat-sdk-react-native';
import {navigate} from '../navigation/NavigationService';
import Ironman from '../assets/icons/ironman.png';
import Captainamerica from '../assets/icons/captainamerica.png';
import Wolverine from '../assets/icons/wolverine.png';
import Spiderman from '../assets/icons/spiderman.png';
import Cyclops from '../assets/icons/cyclops.png';
import {registerPushToken} from './PushNotification';
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

interface NotifeeData {
  receiverType?: 'user' | 'group';
  conversationId?: string;
  sender?: string;
  messageId?: string;
  parentId?: string;
  [key: string]: any;
}

/**
 * Display a local notification (Android) using Notifee.
 * This is triggered when the app is in the foreground.
 * Uses notification grouping with summary to show unread count.
 */
export async function displayLocalNotification(
  remoteMessage: any,
  activeChat?: any,
) {
  try {
    if (remoteMessage?.data?.type !== 'chat') {
      return;
    }
    if (
      activeChat &&
      ((activeChat.type === 'user' &&
        String(activeChat.id) === String(remoteMessage?.data?.sender)) ||
        (activeChat.type === 'group' &&
          String(activeChat.id) === String(remoteMessage?.data?.receiver)))
    ) {
      return;
    }

    const {title, body, senderAvatar} = remoteMessage.data || {};
    const skey = remoteMessage.sentTime.toString();
    const channelId = await notifee.createChannel({
      id: 'chat-messages',
      name: 'Chat Messages',
      vibration: true,
      importance: AndroidImportance.HIGH,
    });

    // Extract parent ID for agentic messages
    let parentId: string | undefined;
    let messageId: string | undefined;
    
    try {
      if (remoteMessage.data?.message) {
        const parsedMessage = JSON.parse(remoteMessage.data.message);
        parentId = parsedMessage.parentId;
        messageId = parsedMessage.id;
      }
      // Fallbacks to the TOP-LEVEL data fields.
      //
      // Verified against a real staging push (2026-08-10): the payload carries `parentId` and
      // `tag` at the top level of `data` and has NO `data.message` blob at all, so the branch
      // above never runs. messageId survived on the `tag` fallback; parentId had none, so it
      // stayed undefined and a tapped thread notification deep-linked to the conversation
      // instead of the thread.
      //
      //   {"type":"chat","sender":"cometchat-uid-2","tag":"4104","parentId":"4103", …}
      if (!messageId && remoteMessage.data?.tag) {
        messageId = remoteMessage.data.tag;
      }
      if (!parentId && remoteMessage.data?.parentId) {
        parentId = remoteMessage.data.parentId;
      }
    } catch (error) {
      console.log('Error parsing message data:', error);
      // Same top-level fallbacks — a malformed data.message must not cost us the deep link.
      if (remoteMessage.data?.tag) {
        messageId = remoteMessage.data.tag;
      }
      if (remoteMessage.data?.parentId) {
        parentId = remoteMessage.data.parentId;
      }
    }

    const notificationData = {
      receiverType: remoteMessage.data?.receiverType,
      sender: remoteMessage.data?.sender,
      conversationId: remoteMessage.data?.conversationId,
      ...(messageId && { messageId }),
      ...(parentId && { parentId }),
    };

    // Get badge count from payload
    const unreadCount = remoteMessage.data?.unreadMessageCount;
    const parsedCount = unreadCount != null ? parseInt(String(unreadCount), 10) : NaN;
    const badgeCount = !isNaN(parsedCount) && parsedCount >= 0 ? parsedCount : undefined;

    // Add unread count to title if more than 1
    const displayTitle = badgeCount && badgeCount > 1
      ? `${title || 'New Message'} (${badgeCount} unread)`
      : title || 'New Message';

    // Set badge count directly from backend unreadMessageCount
    if (badgeCount != null && badgeCount > 0) {
      await notifee.setBadgeCount(badgeCount);
    }

    // Build android config — only include badgeCount if it's a valid number
    const androidConfig: any = {
      channelId,
      sortKey: skey,
      autoCancel: true,
      smallIcon: 'ic_notification',
      largeIcon:
        senderAvatar ||
        'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
    };
    if (badgeCount != null) {
      androidConfig.badgeCount = badgeCount;
    }

    // Use fixed notification ID so Samsung doesn't add badge counts from multiple notifications
    // This ensures badge shows exact unreadMessageCount from backend
    await notifee.displayNotification({
      id: 'chat-notification',
      title: displayTitle,
      body: body || 'You received a new message.',
      android: androidConfig,
      data: notificationData,
    });
  } catch (error) {
    console.error('displayLocalNotification error:', error);
  }
}

/**
 * Request common Android permissions (notifications, camera, etc.)
 * Only needed on Android.
 */
export async function requestAndroidPermissions() {
  if (Platform.OS !== 'android') return;

  try {
    // Ask for push‑notification permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Notification permission denied (FCM).');
    }
  } catch (error) {
    console.warn('FCM permission request error:', error);
  }

  try {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ]);
  } catch (err) {
    console.warn('Android permissions error:', err);
  }
}

/**
 * Retrieve the initial iOS push notification (if the user tapped on one
 * to open the app) and navigate to the correct screen. (iOS only)
 */
/**
 * iOS twin of pushThreadIfReply(). `navigate()` here is the app's imperative helper rather
 * than a StackActions dispatch, so the two cannot share an implementation — but the rule is
 * identical: a reply notification must end up in the thread, not just its conversation.
 */
async function openThreadFromNotification(
  parentId: string | undefined,
  entity: {user?: any; group?: any},
  data: any,
): Promise<void> {
  if (!parentId) return;
  try {
    const parentMessage = await CometChat.getMessageDetails(parentId as any);
    if (!parentMessage) return;
    navigate(SCREEN_CONSTANTS.THREAD_VIEW, {
      message: parentMessage,
      ...entity,
      highlightMessageId: data?.tag ? String(data.tag) : undefined,
    });
  } catch (error) {
    console.log('Could not open thread for parentId', parentId, error);
  }
}

export async function checkInitialNotificationIOS() {
  if (Platform.OS !== 'ios') return;

  try {
    const notification = await PushNotificationIOS.getInitialNotification();
    if (notification) {
      const data = notification.getData();
      if (data && data.type === 'chat') {
        // Extract the parent id. The real staging payload carries `parentId` at the TOP
        // level of data and has no `data.message` blob, so the parse below never fires —
        // it stays only for payload shapes that do send one. Without the fallback this was
        // always undefined and iOS could not deep-link into a thread at all.
        let parentId: string | undefined;
        try {
          if (data.message) {
            const parsedMessage = JSON.parse(data.message);
            parentId = parsedMessage.parentId;
          }
        } catch (error) {
          console.log('Error parsing iOS message data:', error);
        }
        if (!parentId && data.parentId) {
          parentId = String(data.parentId);
        }

        if (data.receiverType === 'group') {
          try {
            const group = await CometChat.getGroup(data.receiver);

            // Mark conversation as read when opening from push notification
            CometChat.markConversationAsRead(data.receiver, CometChat.RECEIVER_TYPE.GROUP)
              .then(() => {
                CometChat.getConversation(data.receiver, CometChat.RECEIVER_TYPE.GROUP)
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
              .catch((e) => console.log('Error marking group conversation as read from iOS notification:', e));

            const params: any = { group };
            if (parentId) {
              params.parentMessageId = parentId;
            }
            navigate(SCREEN_CONSTANTS.MESSAGES, params);
            await openThreadFromNotification(parentId, {group}, data);
          } catch (error) {
            console.log('Error fetching group details:', error);
          }
        } else if (data.receiverType === 'user') {
          try {
            const user = await CometChat.getUser(data.sender);

            // Mark conversation as read when opening from push notification
            CometChat.markConversationAsRead(data.sender, CometChat.RECEIVER_TYPE.USER)
              .then(() => {
                CometChat.getConversation(data.sender, CometChat.RECEIVER_TYPE.USER)
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
              .catch((e) => console.log('Error marking user conversation as read from iOS notification:', e));

            const params: any = { user };
            if (parentId) {
              params.parentMessageId = parentId;
            }
            navigate(SCREEN_CONSTANTS.MESSAGES, params);
            await openThreadFromNotification(parentId, {user}, data);
          } catch (error) {
            console.log('Error fetching user details:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('checkInitialNotificationIOS error:', error);
  }
}

/**
 * Handle remote notification in iOS. If the user taps on it,
 * navigate accordingly. (Foreground or background scenario)
 */
export async function onRemoteNotificationIOS(notification: any) {
  // Handle badge count from push notification
  const data = notification.getData();
  const unreadCount = data?.unreadMessageCount;
  if (unreadCount !== undefined && unreadCount !== null) {
    const count = parseInt(unreadCount, 10);
    if (!isNaN(count) && count >= 0) {
      PushNotificationIOS.setApplicationIconBadgeNumber(count);
    }
  } else {
    console.log('No unreadMessageCount in payload - check dashboard settings');
  }

  const isClicked = data?.userInteraction === 1;
  if (isClicked) {
    if (data && data.type === 'chat') {
      // Extract parent ID for agentic messages
      let parentId: string | undefined;
      try {
        if (data.message) {
          const parsedMessage = JSON.parse(data.message);
          parentId = parsedMessage.parentId;
        }
      } catch (error) {
        console.log('Error parsing iOS message data:', error);
      }
      // Top-level fallback. The real staging payload has no `data.message` blob — parentId
      // rides at the top level of data. Without this the tap path could never deep-link.
      if (!parentId && data.parentId) {
        parentId = String(data.parentId);
      }

      if (data.receiverType === 'group') {
        try {
          const group = await CometChat.getGroup(data.receiver);

          // Mark conversation as read when opening from push notification
          CometChat.markConversationAsRead(data.receiver, CometChat.RECEIVER_TYPE.GROUP)
            .then(() => {
              CometChat.getConversation(data.receiver, CometChat.RECEIVER_TYPE.GROUP)
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
            .catch((e) => console.log('Error marking group conversation as read from iOS notification:', e));

          const params: any = { group };
          if (parentId) {
            params.parentMessageId = parentId;
          }
          navigate(SCREEN_CONSTANTS.MESSAGES, params);
          await openThreadFromNotification(parentId, {group}, data);
        } catch (error) {
          console.log('Error fetching group details:', error);
        }
      } else if (data.receiverType === 'user') {
        try {
          const user = await CometChat.getUser(data.sender);

          // Mark conversation as read when opening from push notification
          CometChat.markConversationAsRead(data.sender, CometChat.RECEIVER_TYPE.USER)
            .then(() => {
              CometChat.getConversation(data.sender, CometChat.RECEIVER_TYPE.USER)
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
            .catch((e) => console.log('Error marking user conversation as read from iOS notification:', e));

          const params: any = { user };
          if (parentId) {
            params.parentMessageId = parentId;
          }
          navigate(SCREEN_CONSTANTS.MESSAGES, params);
          await openThreadFromNotification(parentId, {user}, data);
        } catch (error) {
          console.log('Error fetching user details:', error);
        }
      }
    }
  }
  // Must call finish to let iOS know we're done processing the notification
  notification.finish(PushNotificationIOS.FetchResult.NoData);
}



/**
 * Retrieve and register the FCM token with CometChat (Android only).
 */
export async function getAndRegisterFCMToken(
  user: boolean,
  currentToken: string,
  isTokenRegistered: boolean,
  setIsTokenRegistered: (val: boolean) => void,
  setCurrentToken: (token: string) => void,
) {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    if (user && !isTokenRegistered) {
      if (token !== currentToken) {
        await registerPushToken(token, true, false);
        setIsTokenRegistered(true);
        setCurrentToken(token);
      }
    }
  } catch (error) {
    console.error('Failed to get FCM Token:', error);
  }
}

/**
 * Register iOS's APNs (non-VoIP) token with CometChat.
 */
export async function handleIosApnsToken(
  user: boolean,
  deviceToken: string,
  currentToken: string,
  isTokenRegistered: boolean,
  setCurrentToken: (token: string) => void,
  setIsTokenRegistered: (val: boolean) => void,
) {
  if (user && deviceToken !== currentToken && !isTokenRegistered) {
    try {
      await registerPushToken(deviceToken, false, false);
      console.log('APNs device token registered successfully with CometChat.');
      setCurrentToken(deviceToken);
      setIsTokenRegistered(true);
    } catch (err) {
      console.error('APNs device token registration failed:', err);
    }
  }
}

/**
 * Register iOS VoIP token with CometChat.
 */
export async function handleIosVoipToken(user: boolean, voipToken: string) {
  if (user) {
    try {
      await registerPushToken(voipToken, false, true);
      console.log('APNs VOIP token registered successfully with CometChat.');
    } catch (err) {
      console.error('APNs VOIP token registration failed:', err);
    }
  }
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
  data: NotifeeData,
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
  data?: NotifeeData,
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
