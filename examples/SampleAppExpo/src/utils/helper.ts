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
      // Fallback to tag if message parsing fails
      if (!messageId && remoteMessage.data?.tag) {
        messageId = remoteMessage.data.tag;
      }
    } catch (error) {
      console.log('Error parsing message data:', error);
      // Use tag as fallback
      if (remoteMessage.data?.tag) {
        messageId = remoteMessage.data.tag;
      }
    }

    const notificationData = {
      receiverType: remoteMessage.data?.receiverType,
      sender: remoteMessage.data?.sender,
      conversationId: remoteMessage.data?.conversationId,
      ...(messageId && { messageId }),
      ...(parentId && { parentId }),
    };

    await notifee.displayNotification({
      title: title || 'New Message',
      body: body || 'You received a new message.',
      android: {
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
      },
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
export async function checkInitialNotificationIOS() {
  if (Platform.OS !== 'ios') return;

  try {
    const notification = await PushNotificationIOS.getInitialNotification();
    if (notification) {
      const data = notification.getData();
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

        if (data.receiverType === 'group') {
          try {
            const group = await CometChat.getGroup(data.receiver);
            const params: any = { group };
            if (parentId) {
              params.parentMessageId = parentId;
            }
            navigate(SCREEN_CONSTANTS.MESSAGES, params);
          } catch (error) {
            console.log('Error fetching group details:', error);
          }
        } else if (data.receiverType === 'user') {
          try {
            const user = await CometChat.getUser(data.sender);
            const params: any = { user };
            if (parentId) {
              params.parentMessageId = parentId;
            }
            navigate(SCREEN_CONSTANTS.MESSAGES, params);
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
  const isClicked = notification.getData().userInteraction === 1;
  if (isClicked) {
    const data = notification.getData();
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

      if (data.receiverType === 'group') {
        try {
          const group = await CometChat.getGroup(data.receiver);
          const params: any = { group };
          if (parentId) {
            params.parentMessageId = parentId;
          }
          navigate(SCREEN_CONSTANTS.MESSAGES, params);
        } catch (error) {
          console.log('Error fetching group details:', error);
        }
      } else if (data.receiverType === 'user') {
        try {
          const user = await CometChat.getUser(data.sender);
          const params: any = { user };
          if (parentId) {
            params.parentMessageId = parentId;
          }
          navigate(SCREEN_CONSTANTS.MESSAGES, params);
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
          `${CometChatUIKit.loggedInUser!.getName()} has left`,
        );
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

      // Navigate with parent message ID if available (for agentic conversations)
      const params: any = {group};
      if (data.parentId) {
        params.parentMessageId = data.parentId;
      }

      navigationRef.current?.dispatch(StackActions.push(SCREEN_CONSTANTS.MESSAGES, params));
    }

    // Handle user
    else if (data.receiverType === 'user') {
      const ccUser = await CometChat.getUser(data.sender);

      // Navigate with parent message ID if available (for agentic conversations)
      const params: any = {user: ccUser};
      if (data.parentId) {
        params.parentMessageId = data.parentId;
      }

      navigationRef.current?.dispatch(
        StackActions.push(SCREEN_CONSTANTS.MESSAGES, params),
      );
    }
  } catch (error) {
    console.log('Error in navigateToConversation:', error);
  }
}
