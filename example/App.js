import React, { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, SafeAreaView, Appearance, ActivityIndicator } from 'react-native';
import { CometChat } from "@cometchat-pro/react-native-chat";
import { COMETCHAT_CONSTANTS } from './src/CONSTS';
import { CometChatContextProvider } from '@cometchat/chat-uikit-react-native';
import { CometChatTheme } from '@cometchat/chat-uikit-react-native';
import { CometChatUIKit } from '@cometchat/chat-uikit-react-native';
import StackNavigator from './src/StackNavigator';
import { UserContextProvider } from './UserContext';
import { CometChatIncomingCall } from '@cometchat/chat-uikit-react-native';
import { CometChatUIEventHandler } from '@cometchat/chat-uikit-react-native';
import { VideoRecorderOption } from './src/VideoRecorderOption';
var listnerID = "UNIQUE_LISTENER_ID";

const App = () => {

  const getPermissions = () => {
    if (Platform.OS == "android") {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    }
  }

  const [callRecevied, setCallReceived] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const incomingCall = useRef(null);

  useEffect(() => {
    getPermissions();
    CometChatUIKit.init({
      appId: COMETCHAT_CONSTANTS.APP_ID,
      authKey: COMETCHAT_CONSTANTS.AUTH_KEY,
      region: COMETCHAT_CONSTANTS.REGION,
    })
      .then(() => {
        if (CometChat.setSource) {
          CometChat.setSource('ui-kit', Platform.OS, 'react-native');
          setInitialized(true);
        }
      })
      .catch(() => {
        return null;
      });

    CometChat.addCallListener(
      listnerID,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          incomingCall.current = call;
          setCallReceived(true);
        },
        onOutgoingCallRejected: (call) => {
          incomingCall.current = null;
          setCallReceived(false);
        },
        onIncomingCallCancelled: (call) => {
          incomingCall.current = null;
          setCallReceived(false);
        }
      })
    );

    CometChatUIEventHandler.addCallListener(listnerID, {
      ccCallEnded: () => {
        incomingCall.current = null;
        setCallReceived(false);
      },
    });

    return () => {
      CometChatUIEventHandler.removeCallListener(listnerID);
      CometChat.removeCallListener(listnerID)
    }

  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {
        callRecevied &&
        <CometChatIncomingCall
          call={incomingCall.current}
          onDecline={(call) => {
            setCallReceived(false)
          }}
        />
      }
      <UserContextProvider>
        <CometChatContextProvider theme={new CometChatTheme({palette: {mode: Appearance.getColorScheme() == "light" ? "light" : "dark"}})}>
          {
            initialized ?
            <StackNavigator /> :
            <ActivityIndicator style={{flex: 1, alignSelf: "center"}} size={"large"} />
          }
        </CometChatContextProvider>
      </UserContextProvider>
    </SafeAreaView>
  );
};

export default App;
