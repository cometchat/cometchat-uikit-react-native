import React, {useEffect} from 'react';
import 'react-native-gesture-handler';
import {CometChat} from '@cometchat-pro/react-native-chat';
import {Provider} from 'react-redux';
import {store, persistor} from './src/store/store';
import StackNavigator from './StackNavigator';
import {COMETCHAT_CONSTANTS} from './src/CONSTS';
import {
  LogBox,
  PermissionsAndroid,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import {PersistGate} from 'redux-persist/integration/react';
import theme from './src/cometchat-chat-uikit-react-native/CometChatWorkspace/src/resources/theme'

const styles = StyleSheet.create({
  defaultFontFamily: {
    fontFamily: theme.fontFamily,
  },
});

const customProps = {style: styles.defaultFontFamily};

// To set default font family, avoiding issues with specific android fonts like OnePlus Slate
function setDefaultFontFamily() {
  const TextRender = Text.render;
  const initialDefaultProps = Text.defaultProps;
  Text.defaultProps = {
    ...initialDefaultProps,
    ...customProps,
  };
  Text.render = function render(props) {
    let oldProps = props;
    props = {...props, style: [customProps.style, props.style]};
    try {
      return TextRender.apply(this, arguments);
    } finally {
      props = oldProps;
    }
  };
}

const App = () => {
  LogBox.ignoreAllLogs();
  var appSetting = new CometChat.AppSettingsBuilder()
    .subscribePresenceForAllUsers()
    .setRegion(COMETCHAT_CONSTANTS.REGION)
    .build();

  useEffect(() => {
    CometChat.init(COMETCHAT_CONSTANTS.APP_ID, appSetting)
      .then(() => {
        if (CometChat.setSource) {
          CometChat.setSource('ui-kit', Platform.OS, 'react-native');
        }
      })
      .catch(() => {
        return null;
      });

    if (Platform.OS === 'android') {
      setDefaultFontFamily();
    }

    const getPermissions = async () => {
      if (Platform.OS === 'android') {
        let granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ]);
        }
      }
    };
    getPermissions();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StackNavigator />
      </PersistGate>
    </Provider>
  );
};

export default App;
