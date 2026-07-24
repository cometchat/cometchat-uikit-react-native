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
import { enableScreens } from 'react-native-screens';
enableScreens();
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

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import RootStackNavigator from './src/navigation/RootStackNavigator';
import { AppConstants } from './src/utils/AppConstants';
import { requestAndroidPermissions } from './src/utils/helper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfig } from './src/config/store';
import { DeepPartial } from '@cometchat/chat-uikit-react-native/src/shared/helper/types';
import { createTypography } from './src/utils/themeTypography';

// Listener ID for registering and removing CometChat listeners.
const listenerId = 'app';

const App = (): React.ReactElement => {
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
