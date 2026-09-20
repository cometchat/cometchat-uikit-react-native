import React, { useMemo, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { navigate, navigationRef } from '../../../navigation/NavigationService';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';
import { CometChatOngoingCall } from '@cometchat/chat-uikit-react-native';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';
import type { RouteProp } from '@react-navigation/native';
import { CallType, RootStackParamList } from '../../../navigation/types';

type Props = {
  navigation: any;
  route: RouteProp<RootStackParamList, 'OngoingCallScreen'>;
};

const OngoingCallScreen = ({ navigation, route }: Props) => {
  const params = route.params;

  // 1) Normalize sessionId
  const sessionID: string | undefined = useMemo(() => {
    if ('sessionId' in params) return params.sessionId;
    const c = (params as { call: any }).call;
    return c?.sessionId ?? c?.getSessionId?.();
  }, [params]);

  // 2) Normalize/derive callType
  const callType: CallType | undefined = useMemo(() => {
    if ('callType' in params) return params.callType;

    const c = (params as { call: any }).call;
    if (!c) return undefined;

    // Prefer public getter if available
    if (typeof c?.getType === 'function') {
      const t = c.getType();
      if (t === CometChat.CALL_TYPE.AUDIO) return 'audio';
      if (t === CometChat.CALL_TYPE.VIDEO) return 'video';
    }

    // Fallbacks for raw payloads
    if (c?.callType === 'audio') return 'audio';
    if (c?.data?.type === CometChat.CALL_TYPE.AUDIO) return 'audio';
    if (c?.data?.type === CometChat.CALL_TYPE.VIDEO) return 'video';

    return undefined;
  }, [params]);

  const isAudioOnly = callType === 'audio';

  const callListener = useRef<any>(
    new CometChatCalls.OngoingCallListener({
      onCallEnded: () => {
        CometChat.clearActiveCall();
        CometChatCalls.endSession();
        navigate('BottomTabNavigator', undefined as any);
        navigationRef.reset({
          index: 0,
          routes: [{ name: SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR }],
        });
      },
      onCallEndButtonPressed: () => {
        if (sessionID) CometChat.endCall(sessionID);
        navigate('BottomTabNavigator', undefined as any);
        navigationRef.reset({
          index: 0,
          routes: [{ name: SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR }],
        });
      },
    }),
  );

  const callSettings = useMemo(() => {
    return new CometChatCalls.CallSettingsBuilder()
      .enableDefaultLayout(true)
      .setCallEventListener(callListener.current)
      .setIsAudioOnlyCall(!!isAudioOnly);
  }, [isAudioOnly]);

  if (!sessionID) {
    // Belt & suspenders: try to recover from active call if param missing
    const active: any = CometChat.getActiveCall?.();
    const recovered =
      typeof active?.getSessionId === 'function'
        ? active.getSessionId()
        : undefined;
    if (!recovered) return null; // or render a fallback/loading
  }

  return (
    <CometChatOngoingCall
      sessionID={sessionID!}
      callSettingsBuilder={callSettings}
    />
  );
};

export default OngoingCallScreen;
