import {AppRegistry, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';
import {voipHandler} from './src/utils/VoipNotificationHandler';
import {CometChat} from '@cometchat/chat-sdk-react-native';
import {navigationRef} from './src/navigation/NavigationService';
import {displayLocalNotification} from './src/utils/helper';
import notifee, {EventType} from '@notifee/react-native';
import {StackActions} from '@react-navigation/native';
import AppErrorBoundary from './AppErrorBoundary';
import {ActiveChatProvider} from './src/utils/ActiveChatContext';

if (global?.ErrorUtils) {
  const defaultHandler = global.ErrorUtils.getGlobalHandler();

  function globalErrorHandler(error, isFatal) {
    console.log(
      '[GlobalErrorHandler]:',
      isFatal ? 'Fatal:' : 'Non-Fatal:',
      error,
    );
    defaultHandler?.(error, isFatal);
  }

  global.ErrorUtils.setGlobalHandler(globalErrorHandler);
}

if (typeof process === 'object' && process.on) {
  process.on('unhandledRejection', (reason, promise) => {
    console.log('[Unhandled Promise Rejection]:', reason);
  });
}

const Root = () => (
  <AppErrorBoundary>
    <ActiveChatProvider>
      <App />
    </ActiveChatProvider>
  </AppErrorBoundary>
);

// Run Notifee background event handler only on Android
if (Platform.OS === 'android') {
  notifee.onBackgroundEvent(async ({type, detail}) => {
    try {
      if (type === EventType.PRESS) {
        const {notification} = detail;
        if (notification?.id) {
          await notifee.cancelNotification(notification.id);
        }
        const data = detail?.notification?.data || {};

        if (data.receiverType === 'group') {
          const extractedId =
            typeof data.conversationId === 'string'
              ? data.conversationId.split('_').slice(1).join('_')
              : '';
          CometChat.getGroup(extractedId).then(
            group => {
              // Mark conversation as read when opening from push notification
              CometChat.markConversationAsRead(extractedId, CometChat.RECEIVER_TYPE.GROUP).catch(
                e => console.log('Error marking group conversation as read:', e),
              );

              navigationRef.current?.dispatch(
                StackActions.push('Messages', {
                  group,
                  parentMessageId: data.parentId,
                }),
              );
            },
            error => console.log('Error fetching group details:', error),
          );
        } else if (data.receiverType === 'user') {
          CometChat.getUser(data.sender).then(
            ccUser => {
              // Mark conversation as read when opening from push notification
              CometChat.markConversationAsRead(data.sender, CometChat.RECEIVER_TYPE.USER).catch(
                e => console.log('Error marking user conversation as read:', e),
              );

              navigationRef.current?.dispatch(
                StackActions.push('Messages', {
                  user: ccUser,
                  parentMessageId: data.parentId,
                }),
              );
            },
            error => console.log('Error fetching user details:', error),
          );
        }
      }
    } catch (error) {
      console.log('Error handling notifee background event:', error);
    }
  });
}

// This runs for background/killed states on Android.
if (Platform.OS === 'android') {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    try {
      const data = remoteMessage.data || {};
      if (data.type === 'call') {
        await voipHandler.initialize();
        switch (data.callAction) {
          case 'initiated':
            voipHandler.msg = data;
            await voipHandler.displayCallAndroid();
            break;
          case 'ended':
            CometChat.clearActiveCall();
            await voipHandler.endCall({callUUID: voipHandler.callerId});
            break;
          case 'unanswered':
            CometChat.clearActiveCall();
            if (voipHandler?.callerId) {
              voipHandler.removeCallDialerWithUUID(voipHandler.callerId);
            } else {
              console.warn('Caller ID is missing. Cannot remove call dialer.');
            }
            break;
          case 'busy':
            CometChat.clearActiveCall();
            if (voipHandler?.callerId) {
              voipHandler.removeCallDialerWithUUID(voipHandler.callerId);
            } else {
              console.warn('Caller ID is missing. Cannot remove call dialer.');
            }
            break;
          case 'ongoing':
            voipHandler.displayNotification({
              title: data?.receiverName || '',
              body: 'ongoing call',
            });
            break;
          case 'rejected':
            CometChat.clearActiveCall();
            if (voipHandler?.callerId) {
              voipHandler.removeCallDialerWithUUID(voipHandler.callerId);
            } else {
              console.warn('Caller ID is missing. Cannot remove call dialer.');
            }
            break;
          case 'cancelled':
            CometChat.clearActiveCall();
            if (voipHandler?.callerId) {
              voipHandler.removeCallDialerWithUUID(voipHandler.callerId);
            } else {
              console.warn('Caller ID is missing. Cannot remove call dialer.');
            }
            break;
          default:
            break;
        }
        return;
      } else {
        // Handle badge count from push notification
        const unreadCount = data?.unreadMessageCount;
        if (unreadCount !== undefined && unreadCount !== null) {
          const count = parseInt(unreadCount, 10);
          if (!isNaN(count) && count >= 0) {
            try {
              await notifee.setBadgeCount(count);
            } catch (error) {
              console.error('Error setting badge:', error);
            }
          }
        } else {
          console.log('No unreadMessageCount in payload - check dashboard settings');
        }
        await displayLocalNotification(remoteMessage);
      }
    } catch (error) {
      console.error('Error in background message handler:', error);
    }
  });
}
AppRegistry.registerComponent(appName, () => Root);