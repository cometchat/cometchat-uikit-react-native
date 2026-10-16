import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, LayoutChangeEvent, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CallingPackage } from "../CallingPackage";
import { useTheme } from "../../theme";
import { JSX } from "react";
import { NativeModules } from "react-native";
const { Proximity } = NativeModules;

const CometChatCalls = CallingPackage.CometChatCalls;

/** How long the call area must keep the same size before the Calls SDK is mounted into it. */
const CALL_AREA_SETTLE_MS = 150;

/**
 * Props for the CometChatOngoingCall component.
 *
 * @interface CometChatOngoingCallInterface
 */
export interface CometChatOngoingCallInterface {
  /** The session ID for the ongoing call */
  sessionID: string;
  /**
   * An instance of the CallSettingsBuilder used to configure the call.
   * This is typically built using CometChatCalls.CallSettingsBuilder.
   */
  callSettingsBuilder: typeof CometChatCalls.CallSettingsBuilder;
  /** Callback fired when an error occurs */
  onError?: (e: CometChat.CometChatException) => void;
}

/**
 * CometChatOngoingCall component.
 *
 * This component handles the ongoing call session by generating a call token and
 * rendering the CometChatCalls component with the appropriate call settings and token.
 *
 * @param {CometChatOngoingCallInterface} props - Component configuration props.
 * @returns {JSX.Element} The rendered ongoing call component.
 */
export const CometChatOngoingCall = (props: CometChatOngoingCallInterface): JSX.Element => {
  const { callSettingsBuilder, onError, sessionID } = props;

  const [callToken, setToken] = useState<string | undefined>(undefined);
  // Build call settings once using the provided builder.
  const callSettings = useRef(callSettingsBuilder?.build());
  const theme = useTheme();

  useEffect(() => {
    // Fetch the logged-in user and generate a token for the ongoing call session.
    CometChat.getLoggedinUser()
      .then((user) => {
        if (!user) {
          throw new Error('No logged in user found');
        }
        
        const authToken = user.getAuthToken();
        console.log('[CometChatOngoingCall] Got auth token, generating call token...');
        
        return CometChatCalls.generateToken(sessionID, authToken);
      })
      .then((token: any) => {
        console.log('[CometChatOngoingCall] Successfully generated call token');
        setToken(token.token);
      })
      .catch((rej: CometChat.CometChatException | Error) => {
        console.error('[CometChatOngoingCall] Failed to generate token for session:', sessionID, rej);
        setToken(undefined);
        onError && onError(rej instanceof Error ? 
          new CometChat.CometChatException({
            code: 'TOKEN_GENERATION_FAILED',
            message: rej.message
          }) : rej
        );
      });

    // Cleanup call settings on unmount.
    return () => {
      callSettings.current = null;
    };
  }, [sessionID, onError]);


  useEffect(() => {
    if (callToken) {
      Proximity?.setEnabled(true);
    }

    return () => {
      Proximity?.setEnabled(false);
    };
  }, [callToken]);

  // Size of the area the Calls SDK draws into, once it has stopped changing.
  const [callArea, setCallArea] = useState<{ width: number; height: number } | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  // The Calls SDK saves the size of its FIRST layout in a module-level variable and reuses it
  // for every later call in the app session. Mount it only after this area has settled — the
  // SafeAreaView below applies its padding a frame after the first layout — and hand it a box
  // of exactly that size, so the size it saves is the real one.
  const onCallAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setCallArea((prev) =>
        prev && prev.width === width && prev.height === height ? prev : { width, height }
      );
    }, CALL_AREA_SETTLE_MS);
  };

  // Keep the call inside the safe area: on RN 0.87 Android is edge-to-edge, and a full-screen
  // parent (the accepted CometChatIncomingCall, or the Modal of CometChatOutgoingCall) reaches
  // under the system bars. The native SafeAreaView pads only for the insets it overlaps.
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        backgroundColor: theme.color.background1,
      }}
    >
      <View style={{ flex: 1 }} onLayout={onCallAreaLayout}>
        {(callSettings.current && callToken && callArea && (
          <View style={{ width: callArea.width, height: callArea.height }}>
            <CometChatCalls.Component callSettings={callSettings.current} callToken={callToken} />
          </View>
        )) || (
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              backgroundColor: "transparent",
            }}
          >
            <ActivityIndicator size={"large"} color={theme.color.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
