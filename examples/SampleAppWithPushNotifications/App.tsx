import './gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import {
  Platform,
  View,
  PlatformColor,
  AppState,
  AppStateStatus,
  Linking,
} from 'react-native';
import {
  CometChatI18nProvider,
  CometChatIncomingCall,
  CometChatTheme,
  CometChatThemeProvider,
  CometChatUIEventHandler,
  CometChatUIEvents,
  CometChatUIKit,
  UIKitSettings,
} from '@cometchat/chat-uikit-react-native';

import messaging from '@react-native-firebase/messaging';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import RootStackNavigator from './src/navigation/RootStackNavigator';
import { AppConstants } from './src/utils/AppConstants';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import VoipPushNotification from 'react-native-voip-push-notification';
import {
  displayLocalNotification,
  requestAndroidPermissions,
  checkInitialNotificationIOS,
  onRemoteNotificationIOS,
  getAndRegisterFCMToken,
  handleIosApnsToken,
  handleIosVoipToken,
  navigateToConversation,
} from './src/utils/helper';
import { registerPushToken } from './src/utils/PushNotification';
import { voipHandler } from './src/utils/VoipNotificationHandler';
import { navigationRef, navigate } from './src/navigation/NavigationService';
import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useActiveChat } from './src/utils/ActiveChatContext';
import RNCallKeep from 'react-native-callkeep';
import { consumePendingAnsweredCall, isPendingStale } from './src/utils/PendingCallManager';
import { useConfig } from './src/config/store';
import { DeepPartial } from '@cometchat/chat-uikit-react-native/src/shared/helper/types';
import { createTypography } from './src/utils/themeTypography';

// Listener ID for registering and removing CometChat listeners.
const listenerId = 'app';

const App = (): React.ReactElement => {
  const { activeChat } = useActiveChat();
  const [callReceived, setCallReceived] = useState(false);
  const incomingCall = useRef<CometChat.Call | CometChat.CustomMessage | null>(
    null,
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [currentToken, setCurrentToken] = useState('');
  const [isTokenRegistered, setIsTokenRegistered] = useState(false);
  const [hasValidAppCredentials, setHasValidAppCredentials] = useState(false);
  const [navigationReadyFlag, setNavigationReadyFlag] = useState(false);
  const styleConfig = useConfig(state => state?.settings?.style);

  const theme : { light:  DeepPartial<CometChatTheme>; dark: DeepPartial<CometChatTheme> } = {
  light: {
    color: {
      primary: styleConfig.color.brandColor,
      textPrimary: styleConfig.color.primaryTextLight,
      textSecondary: styleConfig.color.secondaryTextLight,
    },
    typography: createTypography(styleConfig.typography.font),
  },
  dark: {
    color: {
      primary: styleConfig.color.brandColor,
      textPrimary: styleConfig.color.primaryTextDark,
      textSecondary: styleConfig.color.secondaryTextDark,
    },
    typography: createTypography(styleConfig.typography.font),
  },
};

  /**
   * Initialize CometChat UIKit and configure Google Sign-In.
   * Retrieves credentials from AsyncStorage and uses fallback constants if needed.
   */
  useEffect(() => {
    async function init() {
      try {
        // Retrieve stored app credentials or default to an empty object.
        const AppData = (await AsyncStorage.getItem('appCredentials')) || '{}';
        const storedCredentials = JSON.parse(AppData);

        // Determine the final credentials (from AsyncStorage or AppConstants).
        const finalAppId = storedCredentials.appId || AppConstants.appId;
        const finalAuthKey = storedCredentials.authKey || AppConstants.authKey;
        const finalRegion = storedCredentials.region || AppConstants.region;

        // Set hasValidAppCredentials based on whether all values are available.
        if (finalAppId && finalAuthKey && finalRegion) {
          setHasValidAppCredentials(true);
        } else {
          setHasValidAppCredentials(false);
        }

        await CometChatUIKit.init({
          appId: finalAppId,
          authKey: finalAuthKey,
          region: finalRegion,
          subscriptionType: CometChat.AppSettings
            .SUBSCRIPTION_TYPE_ALL_USERS as UIKitSettings['subscriptionType'],
        });

        // If a user is already logged in, update the state.
        const loggedInUser = CometChatUIKit.loggedInUser;
        if (loggedInUser) {
          setIsLoggedIn(true);
        } else {
          // Clear badge on fresh install or when no user is logged in
          try {
            if (Platform.OS === 'ios') {
              PushNotificationIOS.setApplicationIconBadgeNumber(0);
            } else if (Platform.OS === 'android') {
              await notifee.cancelAllNotifications();
            }
          } catch (error) {
            console.error('Error :', error);
          }
        }

      } catch (error) {
        console.log('Error during initialization', error);
      } finally {
        // Mark initialization as complete.
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  // Track when navigation ref is ready (should be ready shortly after first render of navigator)
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigationRef.isReady()) {
        setNavigationReadyFlag(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // When user becomes logged in & navigation ready, check for any pending answered call
  useEffect(() => {
    async function maybeResumePendingCall() {
      if (!navigationReadyFlag || !isLoggedIn) return;
      const pending = await consumePendingAnsweredCall();
      if (pending && !isPendingStale(pending)) {
        try {
          console.log(
            '[App] Resuming pending answered call',
            pending.sessionId,
          );
          // Attempt acceptance (may already be joined)
          let acceptedCall: any = null;
          try {
            acceptedCall = await CometChat.acceptCall(pending.sessionId);
          } catch (err: any) {
            if (err?.code === 'ERR_CALL_USER_ALREADY_JOINED') {
              acceptedCall = CometChat.getActiveCall();
            } else {
              throw err;
            }
          }
          // Close native incoming UI now that we're resuming
          RNCallKeep.endAllCalls();
          const active = acceptedCall || CometChat.getActiveCall();
          const callTypeForNav =
            (typeof active?.getType === 'function'
              ? active.getType()
              : undefined) ??
            (pending.raw?.callType as any) ??
            (pending.raw?.type as any);

          voipHandler.msg = active || pending.raw || {};
          voipHandler.isAnswered = true;

          navigate('OngoingCallScreen', {
            sessionId: pending.sessionId,
            callType: callTypeForNav,
          });

        } catch (e) {
          console.log('[App] Failed resuming pending call', e);
        }
      }
    }
    maybeResumePendingCall();
  }, [navigationReadyFlag, isLoggedIn]);

  /**
   * Handle incoming call events.
   * iOS specific --> To disable the incoming call screen when the call is answered through the VOIP)
   * This effect listens for incoming calls and updates the state accordingly.
   */
  useEffect(() => {
    if (Platform.OS === 'ios') {
      RNCallKeep.addEventListener('didDisplayIncomingCall', () => {
        setCallReceived(false);
        incomingCall.current = null;
      });
    }
  }, []);

  /**
   * Monitor app state changes to verify the logged-in status and clear notifications.
   * When the app becomes active, it cancels Android notifications and checks the login status.
   */
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Request required Android permissions for notifications.
      requestAndroidPermissions();
    }
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Clear badge only for iOS when app becomes active
        if (Platform.OS === 'ios') {
          PushNotificationIOS.setApplicationIconBadgeNumber(0);
        } else if (Platform.OS === 'android') {
          // Clear all notifications when app becomes active (clears badge automatically)
          await notifee.cancelAllNotifications();
        }
        try {
          // Verify if there is a valid logged-in user.
          const chatUser = await CometChat.getLoggedinUser();
          setIsLoggedIn(!!chatUser);
        } catch (error) {
          console.log('Error verifying CometChat user on resume:', error);
        }
      }
    };
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, []);

  /**
   * Attach CometChat login listener to handle login and logout events.
   * Updates user login status accordingly.
   */
  useEffect(() => {
    CometChat.addLoginListener(
      listenerId,
      new CometChat.LoginListener({
        loginSuccess: () => {
          setUserLoggedIn(true);
        },
        loginFailure: (e: CometChat.CometChatException) => {
          console.log('LoginListener :: loginFailure', e.message);
        },
        logoutSuccess: () => {
          setUserLoggedIn(false);
          setIsTokenRegistered(false);
          // Clear badge on logout
          if (Platform.OS === 'ios') {
            PushNotificationIOS.setApplicationIconBadgeNumber(0);
          } else if (Platform.OS === 'android') {
            notifee.cancelAllNotifications();
          }
        },
        logoutFailure: (e: CometChat.CometChatException) => {
          console.log('LoginListener :: logoutFailure', e.message);
        },
      }),
    );

    // Clean up the login listener on component unmount.
    return () => {
      CometChat.removeLoginListener(listenerId);
    };
  }, []);

  /**
   * Attach CometChat call listeners to handle incoming, outgoing, and cancelled call events.
   * Also handles UI events for call end.
   */
  useEffect(() => {
    // Listener for call events.
    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: async (call: CometChat.Call) => {
          // Ignore self-initiated calls: when the same UID is logged in on
          // multiple devices, the caller's other device also receives this
          // event. Don't ring if the call is from ourselves.
          const callerUid = call.getSender()?.getUid();
          const me = await CometChat.getLoggedinUser();
          if (callerUid && callerUid === me?.getUid()) {
            return;
          }
          // Check if there's already an active call
          try {
            const activeCall = CometChat.getActiveCall();
            if (activeCall) {
              // If there's an active call, reject the incoming call with busy status
              setTimeout(() => {
                CometChat.rejectCall(
                  call.getSessionId(),
                  CometChat.CALL_STATUS.BUSY,
                )
                  .then(() => {
                    console.log('Incoming call rejected due to active call');
                  })
                  .catch(error => {
                    console.error(
                      'Error rejecting call with busy status:',
                      error,
                    );
                  });
              }, 2000);
            } else {
              // No active call, proceed with normal incoming call handling
              // Hide any bottom sheet UI before showing the incoming call screen.
              CometChatUIEventHandler.emitUIEvent(
                CometChatUIEvents.ccToggleBottomSheet,
                {
                  isBottomSheetVisible: false,
                },
              );
              // Store the incoming call and update state.
              incomingCall.current = call;
              setCallReceived(true);
            }
          } catch (error) {
            console.error('Error getting active call:', error);
            // If error getting active call, proceed with normal handling
            CometChatUIEventHandler.emitUIEvent(
              CometChatUIEvents.ccToggleBottomSheet,
              {
                isBottomSheetVisible: false,
              },
            );
            incomingCall.current = call;
            setCallReceived(true);
          }
        },
        onOutgoingCallRejected: () => {
          // Clear the call state if outgoing call is rejected.
          incomingCall.current = null;
          setCallReceived(false);
        },
        onIncomingCallCancelled: () => {
          // Clear the call state if the incoming call is cancelled.
          incomingCall.current = null;
          setCallReceived(false);
        },
      }),
    );

    // Additional listener to handle call end events.
    CometChatUIEventHandler.addCallListener(listenerId, {
      ccCallEnded: () => {
        incomingCall.current = null;
        setCallReceived(false);
      },
    });

    // Remove call listeners on cleanup.
    return () => {
      CometChatUIEventHandler.removeCallListener(listenerId);
      CometChat.removeCallListener(listenerId);
    };
  }, [userLoggedIn]);

  // Card Messages — single app-level dispatcher for card element actions.
  // The UI Kit forwards only the raw action; behavior lives here.
  useEffect(() => {
    const cardActionListenerId = 'cardAction_app';
    CometChatUIEventHandler.addUIListener(cardActionListenerId, {
      ccCardActionClicked: (event: { message: any; action: any }) => {
        const action = event?.action;
        if (!action) return;
        const actionType = action?.type ?? action?.action ?? '';
        switch (actionType) {
          case 'openUrl':
            if (action.url) {
              Linking.openURL(action.url).catch(() => {});
            }
            break;
          case 'copyToClipboard':
            if (action.value || action.text) {
              Clipboard.setString(action.value ?? action.text);
            }
            break;
          case 'downloadFile':
            if (action.url) {
              Linking.openURL(action.url).catch(() => {});
            }
            break;
          default:
            break;
        }
      },
    });
    return () => {
      CometChatUIEventHandler.removeUIListener(cardActionListenerId);
    };
  }, []);

  /**
   * Android only: Listen for incoming FCM messages while the app is in the foreground.
   * Displays a local notification when a message is received.
   */
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Subscribe to FCM messages.
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        // Handle badge count from push notification
        const unreadCount = remoteMessage.data?.unreadMessageCount;
        if (unreadCount !== undefined && unreadCount !== null) {
          const count = parseInt(unreadCount as string, 10);
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
        // Display local notification
        try {
          await displayLocalNotification(remoteMessage, activeChat);
        } catch (error) {
          console.log('Error displaying local notification:', error);
        }
      });
      return () => unsubscribe();
    }
  }, [activeChat]);

  /**
   * Android only: Listen to Notifee's foreground events to handle notification presses.
   * Navigates to the corresponding conversation based on the notification data.
   */
  useEffect(() => {
    if (Platform.OS === 'android') {
      const unsubscribeNotifee = notifee.onForegroundEvent(
        ({ type, detail }) => {
          try {
            if (type === EventType.PRESS) {
              const { notification } = detail;
              // Cancel the notification after it is pressed.
              if (notification?.id) {
                notifee.cancelNotification(notification.id);
              }
              // Retrieve notification data and navigate to the corresponding conversation.
              const data = detail?.notification?.data || {};
              navigateToConversation(navigationRef, data);
            }
          } catch (error) {
            console.log('Error handling notifee foreground event:', error);
          }
        },
      );
      return () => unsubscribeNotifee();
    }
  }, []);

  /**
   * Android only: Check if the app was launched from a notification.
   * Cancels the initial notification and navigates to the conversation if applicable.
   */
  useEffect(() => {
    async function checkAndNavigate() {
      if (Platform.OS === 'android') {
        // Get the initial notification if the app was opened via a notification.
        const initialNotification = await notifee.getInitialNotification();
        if (initialNotification) {
          const { notification } = initialNotification;
          if (notification?.id) {
            // Cancel the notification.
            await notifee.cancelNotification(notification.id);
          }
          // Navigate using the notification data.
          const data = notification?.data || {};
          if (navigationRef.isReady()) {
            navigateToConversation(navigationRef, data);
          }
        }
      }
    }
    checkAndNavigate();
  }, []);

  /**
   * Android only: Listen for FCM token refresh events.
   * When a new token is received and the user is logged in, register it with CometChat.
   */
  useEffect(() => {
    if (Platform.OS === 'android') {
      const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(
        async newToken => {
          try {
            console.log('FCM Token refreshed:', newToken);
            if (
              userLoggedIn &&
              newToken !== currentToken &&
              !isTokenRegistered
            ) {
              await registerPushToken(newToken, true, false);
              console.log('New token registered with CometChat (FCM).');
              setCurrentToken(newToken);
              setIsTokenRegistered(true);
            }
          } catch (error) {
            console.error(
              'Failed to register new token with CometChat:',
              error,
            );
          }
        },
      );
      return () => unsubscribeOnTokenRefresh();
    }
  }, [userLoggedIn, currentToken, isTokenRegistered]);

  /**
   * Android only: After user logs in, trigger initial FCM token retrieval.
   * Uses a small delay to ensure that the user login process has completed.
   */
  useEffect(() => {
    if (Platform.OS === 'android' && userLoggedIn && !isTokenRegistered) {
      const timer = setTimeout(() => {
        getAndRegisterFCMToken(
          userLoggedIn,
          currentToken,
          isTokenRegistered,
          setIsTokenRegistered,
          setCurrentToken,
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userLoggedIn, isTokenRegistered, currentToken]);

  /**
   * iOS only: Listen for VoIP token registration events.
   * Handles the registration of the VoIP token with CometChat.
   */
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const voipListener = VoipPushNotification.addEventListener(
        'register',
        async (voipToken: string) => {
          try {
            console.log('VoIP Token:', voipToken);
            await handleIosVoipToken(userLoggedIn, voipToken);
          } catch (error) {
            console.log('Error handling VoIP token:', error);
          }
        },
      );
      return () => {
        VoipPushNotification.removeEventListener('register');
      };
    }
  }, [userLoggedIn]);

  /**
   * iOS only: Listen for push notifications (both background and foreground)
   * and handle them accordingly.
   */
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Check if the app was launched from a push notification.
      checkInitialNotificationIOS();
      const onNotification = async (notification: any) => {
        try {
          await onRemoteNotificationIOS(notification);
        } catch (error) {
          console.log('Error in onRemoteNotificationIOS:', error);
        }
      };
      PushNotificationIOS.addEventListener('notification', onNotification);

      return () => {
        PushNotificationIOS.removeEventListener('notification');
      };
    }
  }, []);

  /**
   * Initialize the VoIP handler after the user logs in.
   * For iOS, initialization is immediate. For Android, a delay is used to ensure login completion.
   */
  useEffect(() => {
    try {
      if (Platform.OS === 'ios') {
        voipHandler.initialize();
      } else if (Platform.OS === 'android' && userLoggedIn) {
        const timer = setTimeout(() => {
          voipHandler.initialize();
        }, 3000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.log('Error initializing VoIP handler:', error);
    }
  }, [userLoggedIn]);

  /**
   * iOS only: Request push notification permissions and handle APNs token registration.
   * Also triggers VoIP token registration.
   */
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Request iOS push notification permissions.
      PushNotificationIOS.requestPermissions()
        .then(data => {
          console.log('PushNotificationIOS.requestPermissions:', data);
        })
        .catch(error => {
          console.error('PushNotificationIOS.requestPermissions error:', error);
        });

      // Function to handle APNs token registration.
      const handleApnsToken = async (deviceToken: string) => {
        try {
          console.log('iOS Device (APNs) Token:', deviceToken);
          // Register for VoIP notifications.
          VoipPushNotification.registerVoipToken();
          await handleIosApnsToken(
            userLoggedIn,
            deviceToken,
            currentToken,
            isTokenRegistered,
            setCurrentToken,
            setIsTokenRegistered,
          );
        } catch (err) {
          console.log('Error handling APNs token:', err);
        }
      };

      // Listen for the APNs token registration event.
      PushNotificationIOS.addEventListener('register', handleApnsToken);
      return () => {
        PushNotificationIOS.removeEventListener('register');
      };
    }
  }, [userLoggedIn, currentToken, isTokenRegistered]);

  // Show a blank/splash screen while the app is initializing.
  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Platform.select({
            ios: PlatformColor('systemBackgroundColor'),
            android: PlatformColor('?android:attr/colorBackground'),
          }),
        }}
      />
    );
  }

  // Once initialization is complete, render the main app UI.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      {/* Render the incoming call UI if the user is logged in and a call is received */}
      <CometChatThemeProvider theme={theme}>
        <CometChatI18nProvider>
            {isLoggedIn && callReceived && incomingCall.current ? (
              <CometChatIncomingCall
                call={incomingCall.current}
                onDecline={() => {
                  // Handle call decline by clearing the incoming call state.
                  incomingCall.current = null;
                  setCallReceived(false);
                }}
              />
            ) : null}
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            {/* Render the main navigation stack, passing the login status as a prop */}
            <RootStackNavigator
              isLoggedIn={isLoggedIn}
              hasValidAppCredentials={hasValidAppCredentials}
            />
          </SafeAreaView>
        </CometChatI18nProvider>
      </CometChatThemeProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;