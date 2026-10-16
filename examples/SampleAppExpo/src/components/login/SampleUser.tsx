import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  useColorScheme,
  Pressable,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Keyboard,
  Alert,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CometChatAvatar,
  CometChatUIKit,
  Icon,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import Check from '../../assets/icons/CheckFill';
import { sampleData } from '../../utils/helper';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';
import { navigate, navigationRef } from '../../navigation/NavigationService';
import Skeleton from './Skeleton';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

type GridItem = CometChat.User | { dummy: true };

const LoginScreen: React.FC = () => {
  const [users, setUsers] = useState<CometChat.User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userUID, setUserUID] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

  const theme = useTheme();
  const mode = useColorScheme();
  const { width } = Dimensions.get('window');
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight(); // returns 0 if no header
  const keyboardVerticalOffset =
    Platform.OS === 'ios'
      ? (insets.top + 8 || 0) + (headerHeight || 0)
      : (statusBarHeight + 6 || 0) + (headerHeight || 0);

  const [keyboardBehavior, setKeyboardBehavior] = useState<
    'padding' | 'height' | undefined
  >(Platform.OS === 'ios' ? 'padding' : 'height');

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardBehavior(Platform.OS === 'ios' ? 'padding' : 'height');
    });

    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardBehavior(undefined); // Remove behavior when keyboard hides
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    (async function loadUsers(): Promise<void> {
      try {
        setLoadingUsers(true);
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const handleSelectUser = (user: CometChat.User): void => {
    setSelectedUser(user.getUid());
    setUserUID('');
  };

  // The SDK rejects with a code; the user needs to know which of these to fix.
  const loginErrorMessage = (error: any): string => {
    switch (error?.code) {
      case 'FAILED_TO_FETCH':
      case 'ERR_NETWORK':
        return 'Check your internet connection and try again.';
      case 'ERR_UID_NOT_FOUND':
        return 'No user with this UID exists in this app.';
      case 'AUTH_ERR_INVALID_APPID':
        return `${error.message ?? 'Invalid App ID.'} Check the App ID and region on the App Credentials screen.`;
      default:
        return error?.message ?? 'Something went wrong. Please try again.';
    }
  };

  const handleContinue = async () => {
    if ((!selectedUser && !userUID.trim()) || isLoading) return;
    setIsLoading(true);
    const uid: string = userUID.trim() || selectedUser!;
    try {
      await CometChatUIKit.login({ uid });
      navigate('BottomTabNavigator');
      navigationRef.reset({
        index: 0,
        routes: [{ name: SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR }],
      });
    } catch (error: any) {
      console.log('Login failed with exception:', error);
      Alert.alert('Could not log in', loginErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch users from a remote sample JSON file.
   * Falls back to local sample data if there's an error.
   */
  async function fetchUsers(): Promise<CometChat.User[]> {
    try {
      const response = await fetch(
        'https://assets.cometchat.io/sampleapp/sampledata.json',
      );

      if (response.ok) {
        const data = await response.json();
        const fetchedUsers = data.users || [];
        return fetchedUsers.map((user: any) => new CometChat.User(user));
      } else {
        throw new Error('Failed to load users');
      }
    } catch (error) {
      console.error('Exception while fetching users:', error);
      return await getDefaultUsers();
    }
  }

  /**
   * Get users from local sample data (used in case the remote fetch fails).
   */
  async function getDefaultUsers(): Promise<CometChat.User[]> {
    const localUsers = sampleData.users || [];
    return localUsers.map((user: any) => new CometChat.User(user));
  }

  /**
   * Returns the appropriate image source object for the avatar.
   */
  const getAvatarSource = (
    avatar: string | ImageSourcePropType,
  ): ImageSourcePropType => {
    if (typeof avatar === 'string') {
      if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return { uri: avatar };
      }
    }
    return avatar as ImageSourcePropType;
  };

  // Show skeleton if the API is still loading or if no users are available.
  const showSkeleton = loadingUsers || users.length === 0;

  // Compute grid data only if users are available.
  let gridData: GridItem[] = [];
  if (users.length > 0) {
    gridData = [...users];
    const numColumns = 3;
    const numberOfElementsLastRow = users.length % numColumns;
    if (numberOfElementsLastRow !== 0) {
      for (let i = 0; i < numColumns - numberOfElementsLastRow; i++) {
        gridData.push({ dummy: true });
      }
    }
  }

  const Loading = () => {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator
          size="small"
          color={theme.color.staticWhite}
          style={{ alignSelf: 'center', justifyContent: 'center' }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.color.background2 }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={keyboardBehavior} // Use dynamic behavior
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* App Logo */}
          <View style={styles.logoContainer}>
            <Image
              // NOTE: actual asset filenames are lowercase (dark.png, light.png)
              source={
                mode === 'dark'
                  ? require('../../assets/icons/dark.png')
                  : require('../../assets/icons/light.png')
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
              styles.logInTitle,
              { color: theme.color.textPrimary },
            ]}
          >
            Log In
          </Text>

          {/* Subtitle */}
          <Text
            style={[
              theme.typography.body.medium,
              styles.subtitle,
              { color: theme.color.textPrimary },
            ]}
          >
            Choose a Sample User
          </Text>

          {/* Sample Users Grid */}
          <View style={styles.userGridWrapper}>
            {showSkeleton ? (
              <Skeleton />
            ) : (
              <View style={styles.usersContainer}>
                {gridData.map((item, index) => {
                  // Render a blank view for dummy items
                  if ('dummy' in item && item.dummy) {
                    return (
                      <View key={`dummy-${index}`} style={styles.userCard} />
                    );
                  }

                  // Otherwise, render a user
                  const user = item as CometChat.User;
                  const isSelected = selectedUser === user.getUid();
                  const firstName = user.getName();

                  return (
                    <Pressable
                      key={user.getUid()}
                      style={[
                        styles.userCard,
                        {
                          borderWidth: isSelected ? 1.5 : 1,
                          borderColor: isSelected
                            ? theme.color.borderHighlight
                            : theme.color.borderLight,
                          backgroundColor: isSelected
                            ? theme.color.extendedPrimary50
                            : theme.color.background1,
                        },
                      ]}
                      onPress={() => handleSelectUser(user)}
                    >
                      {/* Show the check icon ONLY if selected */}
                      {isSelected && (
                        <View style={styles.checkIconContainer}>
                          <Icon
                            icon={
                              <Check
                                color={theme.color.staticWhite}
                                height={18}
                                width={18}
                              />
                            }
                          />
                        </View>
                      )}
                      <CometChatAvatar
                        name={user.getName()}
                        image={getAvatarSource(user.getAvatar())}
                      />
                      {/* Display only the first name */}
                      <Text
                        style={[
                          theme.typography.body.medium,
                          styles.firstNameText,
                          { color: theme.color.textPrimary },
                        ]}
                      >
                        {firstName}
                      </Text>
                      <Text
                        style={[
                          theme.typography.caption1.regular,
                          styles.uidText,
                          { color: theme.color.textSecondary },
                        ]}
                      >
                        {user.getUid()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Horizontal divider with "Or" in the middle */}
          <View style={styles.dividerRow}>
            <View
              style={[
                styles.divider,
                { borderColor: theme.color.borderDefault },
              ]}
            />
            <Text
              style={[
                theme.typography.body.medium,
                { color: theme.color.textTertiary },
              ]}
            >
              Or
            </Text>
            <View
              style={[
                styles.divider,
                { borderColor: theme.color.borderDefault },
              ]}
            />
          </View>

          {/* UID Input */}
          <Text
            style={[
              theme.typography.caption1.medium,
              styles.uidLabel,
              { color: theme.color.textPrimary },
            ]}
          >
            Enter Your UID
          </Text>
          <TextInput
            placeholder=" Enter UID"
            placeholderTextColor={theme.color.textTertiary}
            style={[
              theme.typography.body.regular,
              styles.uidInput,
              {
                borderColor: theme.color.borderLight,
                color: theme.color.textPrimary,
              },
            ]}
            value={userUID}
            onChangeText={(text: string) => {
              setUserUID(text);
              setSelectedUser(null);
            }}
          />
        </ScrollView>

        {/* Bottom container with "Continue" button and "Change App Credentials" */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: theme.color.primaryButtonBackground,
              },
            ]}
            onPress={handleContinue}
            disabled={(!selectedUser && !userUID.trim()) || isLoading}
          >
            {isLoading ? (
              <Loading />
            ) : (
              <Text
                style={[
                  theme.typography.button.medium,
                  styles.continueButtonText,
                  { color: theme.color.staticWhite },
                ]}
              >
                Continue
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.changeCredentialsWrapper}>
            <Text
              style={[
                theme.typography.body.regular,
                { color: theme.color.textSecondary },
              ]}
            >
              Change{' '}
            </Text>
            <TouchableOpacity
              style={styles.changeCredentialsContainer}
              onPress={() => {
                navigationRef.navigate(SCREEN_CONSTANTS.APP_CRED);
              }}
            >
              <Text
                style={[
                  theme.typography.body.regular,
                  { color: theme.color.primary },
                ]}
              >
                App Credentials
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logInTitle: {
    marginBottom: 16,
    alignSelf: 'center',
  },
  subtitle: {
    marginBottom: 6,
  },
  usersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  userCard: {
    position: 'relative',
    width: '30%',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  checkIconContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 7,
    width: '27%',
    height: '22%',
    backgroundColor: '#7367F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  firstNameText: {
    marginTop: 8,
    textAlign: 'center',
  },
  uidText: {
    marginTop: 4,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    borderWidth: 0.5,
  },
  uidLabel: {
    paddingBottom: 5,
  },
  uidInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 24,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  continueButton: {
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  continueButtonText: {
    alignSelf: 'center',
  },
  changeCredentialsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  changeCredentialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userGridWrapper: {
    minHeight: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
