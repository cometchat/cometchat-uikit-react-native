import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {CometChat} from '@cometchat/chat-sdk-react-native';
import {AppConstants} from './AppConstants';
import {
  CometChatContextProvider,
  CometChatLocalize,
} from '@cometchat/chat-uikit-react-native';
import {CometChatTheme} from '@cometchat/chat-uikit-react-native';
import {CometChatUIKit} from '@cometchat/chat-uikit-react-native';
import StackNavigator from './src/StackNavigator';
import {UserContextProvider} from './UserContext';
import {CometChatIncomingCall} from '@cometchat/chat-uikit-react-native';
import {CometChatUIEventHandler} from '@cometchat/chat-uikit-react-native';
import {metaInfo} from './src/metaInfo';
import {SafeAreaView} from 'react-native-safe-area-context';
const listenerID = 'UNIQUE_LISTENER_ID';

const App = () => {
  const getPermissions = () => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ]);
    }
  };

  const [callReceived, setCallReceived] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const incomingCall = useRef<CometChat.Call | null>(null);

  useEffect(() => {
    getPermissions();
    CometChatUIKit.init({
      appId: AppConstants.APP_ID,
      authKey: AppConstants.AUTH_KEY,
      region: AppConstants.REGION,
    })
      .then(() => {
        CometChatLocalize.setLocale('en');
        try {
          CometChat.setDemoMetaInfo(metaInfo);
        } catch (err) {}
        if (CometChat.setSource) {
          CometChat.setSource('ui-kit', Platform.OS, 'react-native');
        }
        setIsInitialized(true);
      })
      .catch(() => {
        return null;
      });

    CometChat.addCallListener(
      listenerID,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          incomingCall.current = call;
          setCallReceived(true);
        },
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          incomingCall.current = null;
          setCallReceived(false);
        },
        onIncomingCallCancelled: (call: CometChat.Call) => {
          incomingCall.current = null;
          setCallReceived(false);
        }
      }),
    );

    CometChatUIEventHandler.addCallListener(listenerID, {
      ccCallEnded: () => {
        incomingCall.current = null;
        setCallReceived(false);
      },
    });

    return () => {
      CometChatUIEventHandler.removeCallListener(listenerID);
      CometChat.removeCallListener(listenerID);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {isInitialized ? (
        <>
          <StatusBar backgroundColor={'white'} barStyle={'dark-content'} />
          {callReceived && (
            <CometChatIncomingCall
              call={incomingCall.current}
              onDecline={call => {
                setCallReceived(false);
              }}
              onError={error => {
                setCallReceived(false);
              }}
              incomingCallStyle={{
                backgroundColor: 'white',
                titleColor: 'black',
                subtitleColor: 'gray',
                titleFont: {
                  fontSize: 20,
                  fontWeight: 'bold',
                },
              }}
            />
          )}
          <UserContextProvider>
            <CometChatContextProvider theme={new CometChatTheme({})}>
              <StackNavigator />
            </CometChatContextProvider>
          </UserContextProvider>
        </>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
