import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  useColorScheme,
  Platform,
  Dimensions,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CometChatUIKit,
  UIKitSettings,
  useCometChatTranslation,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import {navigate, navigationRef} from '../../navigation/NavigationService';
import {SCREEN_CONSTANTS} from '../../utils/AppConstants';
import {CometChat} from '@cometchat/chat-sdk-react-native';
import {useFocusEffect} from '@react-navigation/native';

const AppCredentials: React.FC = () => {
  const [storedAppId, setStoredAppId] = useState<string>('');
  const [storedAuthKey, setStoredAuthKey] = useState<string>('');
  const [storedRegion, setStoredRegion] = useState<string>('US');

  // These are the *editable* states bound to the TextInput fields
  const [appId, setAppId] = useState<string>('');
  const [authKey, setAuthKey] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('US');

  // Toast state for showing error messages
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const theme = useTheme();
    const { t } = useCometChatTranslation();

  const {width} = Dimensions.get('window');
  const mode = useColorScheme();

  // Compute if form is valid (all fields provided)
  const isFormValid =
    appId.trim().length > 0 &&
    authKey.trim().length > 0 &&
    selectedRegion.trim().length > 0;

  // Load existing credentials if any
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigationRef.goBack();
        return true; // Prevent default behavior
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      async function loadCredentials() {
        try {
          const credentialsStr = await AsyncStorage.getItem('appCredentials');
          if (credentialsStr) {
            const credentials = JSON.parse(credentialsStr);
            // Update 'stored' states
            setStoredAppId(credentials.appId || '');
            setStoredAuthKey(credentials.authKey || '');
            setStoredRegion(credentials.region || 'US');

            // Also set the fields so user sees them pre-populated
            setAppId(credentials.appId || '');
            setAuthKey(credentials.authKey || '');
            setSelectedRegion(credentials.region || 'US');
          }
        } catch (error) {
          console.log('Error loading stored credentials:', error);
        }
      }

      loadCredentials();

      return () => backHandler.remove();
    }, []),
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleContinue = async (): Promise<void> => {
    // Validate the inputs.
    // If the user has modified a field and cleared it (i.e. the input becomes empty),
    // show a toast message.
    if (!appId.trim()) {
      showToast('Please enter App ID');
      return;
    }
    if (!authKey.trim()) {
      showToast('Please enter Auth Key');
      return;
    }
    if (!selectedRegion.trim()) {
      showToast('Please select a region');
      return;
    }

    // Since all fields are non-empty, use their current values.
    const newAppId = appId.trim();
    const newAuthKey = authKey.trim();
    const newRegion = selectedRegion.trim();

    try {
      const credentials = {
        region: newRegion,
        appId: newAppId,
        authKey: newAuthKey,
      };
      console.log('Saving credentials:', credentials);
      await AsyncStorage.setItem('appCredentials', JSON.stringify(credentials));

      // Re-initialize with updated credentials
      await CometChatUIKit.init({
        appId: newAppId,
        authKey: newAuthKey,
        region: newRegion,
        subscriptionType: CometChat.AppSettings
          .SUBSCRIPTION_TYPE_ALL_USERS as UIKitSettings['subscriptionType'],
      });
    } catch (error: any) {
      console.error('Failed to save credentials', error);
      showToast(error?.message ?? 'Could not initialise with these credentials');
      return;
    }

    // Navigate to the next screen.
    navigate('BottomTabNavigator');
    navigationRef.reset({
      index: 0,
      routes: [{name: SCREEN_CONSTANTS.SAMPLE_USER}],
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.color.background2}]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.contentContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Header/Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={
                  mode === 'dark'
                    ? require('../../assets/icons/Dark.png')
                    : require('../../assets/icons/Light.png')
                }
                style={{
                  width: width * 0.25,
                  height: width * 0.25,
                  resizeMode: 'contain',
                }}
              />
            </View>

            {/* Title */}
            <Text
              style={[
                theme.typography.heading2.bold,
                {
                  color: theme.color.textPrimary,
                  marginBottom: 20,
                  alignSelf: 'center',
                },
              ]}>
              {t('APP_CREDENTIALS')}
            </Text>

            {/* Region Selector */}
            <View style={styles.inputContainer}>
              <Text
                style={[
                  theme.typography.caption1.medium,
                  {color: theme.color.textPrimary, marginBottom: 10},
                ]}>
                {t('REGION')}
              </Text>
              <View style={styles.regionRow}>
                {/* US */}
                <TouchableOpacity
                  style={[
                    styles.flagContainer,
                    {
                      backgroundColor:
                        selectedRegion === 'US'
                          ? theme.color.extendedPrimary50
                          : theme.color.background1,
                      borderColor:
                        selectedRegion === 'US'
                          ? theme.color.borderHighlight
                          : theme.color.borderDefault,
                    },
                  ]}
                  onPress={() => setSelectedRegion('US')}>
                  <View style={styles.flagInnerContainer}>
                    <Image
                      source={require('../../assets/icons/US.png')}
                      style={styles.flagImage}
                    />
                    <Text
                      style={[
                        theme.typography.button.medium,
                        {color: theme.color.textSecondary},
                      ]}>
                      US
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* EU */}
                <TouchableOpacity
                  style={[
                    styles.flagContainer,
                    {
                      backgroundColor:
                        selectedRegion === 'EU'
                          ? theme.color.extendedPrimary50
                          : theme.color.background1,
                      borderColor:
                        selectedRegion === 'EU'
                          ? theme.color.borderHighlight
                          : theme.color.borderDefault,
                    },
                  ]}
                  onPress={() => setSelectedRegion('EU')}>
                  <View style={styles.flagInnerContainer}>
                    <Image
                      source={require('../../assets/icons/EU.png')}
                      style={styles.flagImage}
                    />
                    <Text
                      style={[
                        theme.typography.button.medium,
                        {color: theme.color.textSecondary},
                      ]}>
                      EU
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* IN */}
                <TouchableOpacity
                  style={[
                    styles.flagContainer,
                    {
                      backgroundColor:
                        selectedRegion === 'IN'
                          ? theme.color.extendedPrimary50
                          : theme.color.background1,
                      borderColor:
                        selectedRegion === 'IN'
                          ? theme.color.borderHighlight
                          : theme.color.borderDefault,
                    },
                  ]}
                  onPress={() => setSelectedRegion('IN')}>
                  <View style={styles.flagInnerContainer}>
                    <Image
                      source={require('../../assets/icons/India.png')}
                      style={styles.flagImage}
                    />
                    <Text
                      style={[
                        theme.typography.button.medium,
                        {color: theme.color.textSecondary},
                      ]}>
                      IN
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* App ID */}
            <View style={styles.inputContainer}>
              <Text
                style={[
                  theme.typography.caption1.medium,
                  {color: theme.color.textPrimary, paddingBottom: 5},
                ]}>
                APP ID
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.color.borderLight,
                    backgroundColor: theme.color.background2,
                    color: theme.color.textPrimary,
                  },
                ]}
                value={appId}
                onChangeText={setAppId}
                placeholder="Enter the App ID"
                placeholderTextColor={theme.color.textTertiary}
              />
            </View>

            {/* Auth Key */}
            <View style={styles.inputContainer}>
              <Text
                style={[
                  theme.typography.caption1.medium,
                  {color: theme.color.textPrimary, paddingBottom: 5},
                ]}>
                Auth Key
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.color.borderLight,
                    backgroundColor: theme.color.background2,
                    color: theme.color.textPrimary,
                  },
                ]}
                value={authKey}
                onChangeText={setAuthKey}
                placeholder="Enter the Auth Key"
                placeholderTextColor={theme.color.textTertiary}
              />
            </View>
          </ScrollView>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: theme.color.primaryButtonBackground,
                opacity: isFormValid ? 1 : 0.6,
              },
            ]}
            onPress={handleContinue}>
            <Text
              style={[
                theme.typography.button.medium,
                {textAlign: 'center', color: theme.color.staticWhite},
              ]}>
              {t('CONTINUE')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* Toast Message */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AppCredentials;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 30 : 50,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginTop: 20,
  },
  regionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flagContainer: {
    width: '32%',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 5,
  },
  flagImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  continueButton: {
    borderRadius: 8,
    paddingVertical: 12,
    width: '100%',
  },
  toastContainer: {
    position: 'absolute',
    bottom: '8%',
    left: 20,
    right: 20,
    backgroundColor: '#C73C3E',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
  },
});
