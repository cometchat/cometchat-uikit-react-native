/**
 * NEW push wiring — JS-first `@cometchat/push-notifications-react-native`.
 *
 * The native display engine shows notifications / rings
 * the call UI and captures tokens; this file only reacts to its events and
 * reuses the app's existing navigation. Tokens register automatically (the
 * package calls CometChatNotifications.registerPushToken on the Chat SDK).
 *
 * NOTE: the app's foreground/WebSocket call ring (CometChat.addCallListener +
 * CometChatIncomingCall in App.tsx) is KEPT — this package handles the
 * background/killed push path only.
 */
import {CometChat} from '@cometchat/chat-sdk-react-native';
import {CometChatCalls} from '@cometchat/calls-sdk-react-native';
import {
  CometChatPushNotifications,
  CometChatPNHelper,
} from '@cometchat/push-notifications-react-native';

import {navigate, navigationRef} from '../navigation/NavigationService';
import {AppConstants} from './AppConstants';
import {navigateToConversation} from './helper';

/**
 * Resolve once the NavigationContainer is ready (React Navigation's documented
 * `isReady()` + `'ready'` event). A tap that cold-starts the app is delivered as soon
 * as setup runs, which can be before App has rendered the navigator; navigating then
 * is silently dropped. The container ref queues listeners added before it mounts.
 */
function whenNavigationReady(): Promise<void> {
  if (navigationRef.isReady()) {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const unsubscribe = navigationRef.addListener('ready', () => {
      unsubscribe();
      resolve();
    });
  });
}
/**
 * Subscribe the push handlers and start the package for the logged-in session.
 *
 * Returns a cleanup that removes the handlers. Call it from a `useEffect` keyed on the
 * logged-in state and return the cleanup, so React removes the handlers on logout (or
 * unmount). The package keeps handlers until they are removed — `unregister()` does not
 * clear them — so without this a logout → login cycle would fire every handler twice.
 */
export function setupPushOnLogin(): () => void {
  console.log('[CometChatPushV2] setup() — wiring JS-first push package');

  // Subscribe BEFORE init() so the tap / answered call that launched the app is delivered.
  const unsubscribes = [
    // Every push that reaches JS (foreground path) — data messages incl. calls.
    CometChatPushNotifications.onMessageReceived(data => {
      // Payloads carry message content: log them in dev builds only.
      if (__DEV__) console.log('[CometChatPushV2] onMessageReceived:', JSON.stringify(data));
    }),

    // Tap a chat notification → open the conversation, and the thread for a thread reply.
    // The helper marks the conversation read and pushes Messages before ThreadView, so
    // Back returns to the conversation.
    CometChatPushNotifications.onNotificationTap(async info => {
      if (__DEV__) console.log('[CometChatPushV2] onNotificationTap:', JSON.stringify(info));
      await whenNavigationReady();
      console.log('[CometChatPushV2] navigation ready — opening conversation');
      navigateToConversation(navigationRef, {
        receiverType: info.receiverType,
        sender: info.sender,
        conversationId: info.conversationId,
        parentId: info.parentMessageId,
        tag: info.messageId, // the reply to highlight in the thread
      });
    }),

    // A call answered from the system UI is already accepted (the package ran
    // CometChat.acceptCall) → just open the ongoing-call screen.
    CometChatPushNotifications.onCallAccepted(info => {
      if (__DEV__) console.log('[CometChatPushV2] onCallAccepted:', JSON.stringify(info));
      navigate('OngoingCallScreen', {
        sessionId: info.sessionId,
        callType: info.callType,
      });
    }),

    CometChatPushNotifications.onCallEnded(info => {
      if (__DEV__) console.log('[CometChatPushV2] onCallEnded:', JSON.stringify(info));
      // A call ended from the iOS CallKit UI is NOT seen by the Calls SDK's own
      // OngoingCallListener, so it never tears the call down. Do it here, mirroring the
      // in-app end button: end on the server, end the media session, leave the screen.
      if (info.sessionId) {
        CometChat.endCall(info.sessionId).catch(() => {});
      }
      try {
        CometChatCalls.endSession();
      } catch {}
      try {
        CometChat.clearActiveCall();
      } catch {}
      const onCallScreen =
        navigationRef.isReady?.() &&
        navigationRef.getCurrentRoute?.()?.name === 'OngoingCallScreen';
      if (onCallScreen) {
        navigate('BottomTabNavigator', undefined as never);
      }
    }),
  ];

  const start = async () => {
    // A permission failure must NOT abort setup: init() still has to run so the token
    // registers. The helper rejects when the OS could not be asked at all (no foreground
    // activity, a dialog already open) — recoverable, unlike the user declining.
    await CometChatPNHelper.requestNotificationPermission().catch(e => {
      console.log('[CometChatPushV2] notification permission not requested', e);
      return false;
    });
    // Mic + camera must be granted before a call connects: the Calls SDK's
    // ongoing-call foreground service requires them on Android 14+.
    await CometChatPNHelper.requestCallPermissions();

    await CometChatPushNotifications.init({
      fcmProviderId: AppConstants.fcmProviderId,
      apnsProviderId: AppConstants.apnsProviderId,
      // Monochrome status-bar icon; without it Android falls back to the launcher
      // icon, which renders as a solid square.
      notificationSmallIcon: 'ic_notification',
      // Show the chat notification while the app is open too. Android still hands the
      // payload to onMessageReceived; iOS does only when this is false.
      showInForeground: true,
      // The UI Kit shows its own incoming-call screen while the app is open, so the
      // system call UI doesn't ring too.
      ringInForeground: false,
    });
    console.log(
      '[CometChatPushV2] init() done — native engine active; FCM token auto-registers via Chat SDK',
    );
  };
  start().catch(e => console.log('[CometChatPushV2] setup error', e));

  return () => unsubscribes.forEach(unsubscribe => unsubscribe());
}
