import {CometChat} from '@cometchat/chat-sdk-react-native';
import React, {useCallback, useContext, useRef, useState} from 'react';
import {TouchableOpacity, View, Platform} from 'react-native';
import {
  CometChatAvatar,
  CometChatConversations,
  CometChatUIKit,
  useCometChatTranslation,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import {AuthContext} from '../../../navigation/AuthContext';
import {
  useFocusEffect,
  useNavigation,
  CommonActions,
} from '@react-navigation/native';
import {TooltipMenu} from '../../../utils/TooltipMenu';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../navigation/types';
import AccountCircle from '../../../assets/icons/AccountCircle';
import AddComment from '../../../assets/icons/AddComment';
import InfoIcon from '../../../assets/icons/InfoIcon';
import Logout from '../../../assets/icons/Logout';
import {navigate, navigationRef} from '../../../navigation/NavigationService';
import {AppConstants, SCREEN_CONSTANTS} from '../../../utils/AppConstants';
import Builder from '../../../assets/icons/Builder';
import { useConfig, useConfigStore } from '../../../config/store'; // adjust import if needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import Reset from '../../../assets/icons/Reset';
import AiIcon from '../../../assets/icons/AiIcon';

type ChatNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Conversation'
>;

const Conversations: React.FC<{}> = ({}) => {
  const theme = useTheme();
  const {setIsLoggedIn: setLogout} = useContext(AuthContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const tooltipPositon = React.useRef({pageX: 0, pageY: 0});
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const selectedConversation = useRef<CometChat.Conversation | null>(null);
  const navigation = useNavigation<ChatNavigationProp>();
  const avatarContainerRef = useRef<View>(null);
  const loggedInUser = useRef<CometChat.User>(
    CometChatUIKit.loggedInUser,
  ).current;
  const { t } = useCometChatTranslation();

  const [isConfigUpdated, setIsConfigUpdated] = useState(false);
  const messageDeliveryAndReadReceipts = useConfig(
        (state) => state.settings.chatFeatures.coreMessagingExperience.messageDeliveryAndReadReceipts
  );

  useFocusEffect(
    useCallback(() => {
      // Check config updated flag
      AsyncStorage.getItem('@config_updated').then(val => {
        setIsConfigUpdated(val === 'true');
      });
      return () => {
        setTooltipVisible(false);
      };
    }, []),
  );

  const handleResetConfig = async () => {
    useConfigStore.getState().resetConfig();
    await AsyncStorage.removeItem('@config_updated');
    setIsConfigUpdated(false);
  };
  const userAndFriendsPresence = useConfig(
      (state) => state.settings.chatFeatures.coreMessagingExperience.userAndFriendsPresence
    );
    
  const openMessagesFor = (item: CometChat.Conversation) => {
    // Determine if it's a user or group conversation
    const isUser = item.getConversationType() === 'user';
    const isGroup = item.getConversationType() === 'group';

    // Navigate to Messages with appropriate params
    navigation.navigate('Messages', {
      user: isUser ? (item.getConversationWith() as CometChat.User) : undefined,
      group: isGroup
        ? (item.getConversationWith() as CometChat.Group)
        : undefined,
    });
  };

  const _conversationsConfig = {
    onItemPress: openMessagesFor,
    onError: (err: any) => {
      console.log('ERROR IN CONVO: ', err);
    },
  };

  const handleAvatarPress = () => {
    try {
      if (avatarContainerRef.current) {
        avatarContainerRef.current.measureInWindow((x, y, height) => {
          // Set tooltip position 10px below the avatar
          tooltipPositon.current = {pageX: x, pageY: y + height};
        });
        selectedConversation.current = null;
        setTooltipVisible(true);
      }
    } catch (error) {
      console.error('Error while handling avatar press:', error);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // Step 1: Logout from CometChat
    try {
      await CometChat.logout();
    } catch (error) {
      console.error('CometChat logout failed:', error);
      setIsLoggingOut(false);
      return; // Exit if CometChat logout fails
    }

    // If all operations succeed, navigate to the LoginScreen
    setIsLoggingOut(false);
    setLogout(false);
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'SampleUser' }],
      }),
    );
  };

  const NewConversation = () => {
    return (
      <View ref={avatarContainerRef}>
        <TouchableOpacity
          onPress={() => {
            handleAvatarPress();
          }}>
          <CometChatAvatar
            style={{
              containerStyle: {
                height: 40,
                width: 40,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
              },
              textStyle: {
                fontSize: 22,
                lineHeight: 28,
                textAlign: 'center',
              },
            }}
            image={
              loggedInUser?.getAvatar()
                ? {uri: loggedInUser?.getAvatar()}
                : undefined
            }
            name={loggedInUser?.getName() ?? ''}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1}}>
        <CometChatConversations
          {..._conversationsConfig}
          AppBarOptions={NewConversation}
          selectionMode="none"
          showSearchBar={true}
          onSearchBarClicked={() => {
            navigate(SCREEN_CONSTANTS.SEARCH_MESSAGES);
          }}
          usersStatusVisibility={userAndFriendsPresence}
          receiptsVisibility={messageDeliveryAndReadReceipts}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          top: tooltipPositon.current.pageY,
          left: tooltipPositon.current.pageX,
          zIndex: 9999,
        }}>
        <TooltipMenu
          visible={tooltipVisible}
          onClose={() => {
            setTooltipVisible(false);
          }}
          onDismiss={() => {
            setTooltipVisible(false);
          }}
          event={{
            nativeEvent: tooltipPositon.current,
          }}
          menuItems={[
            {
              text: t('CREATE_CONVERSATION'),
              onPress: () => {
                navigation.navigate('CreateConversation');
              },
              icon: (
                <AddComment
                  height={24}
                  width={24}
                  color={theme.color.textPrimary}></AddComment>
              ),
              textColor: theme.color.textPrimary,
              iconColor: theme.color.textPrimary,
            },
            {
              text: t('AI_ASSISTANTS'),
              onPress: () => {
                navigation.navigate(SCREEN_CONSTANTS.AI_AGENTS);
              },
              icon: (
                <AiIcon
                  height={24}
                  width={24}
                  color={theme.color.textPrimary}></AiIcon>
              ),
              textColor: theme.color.textPrimary,
              iconColor: theme.color.textPrimary,
            },
            {
              text: loggedInUser?.getName() || 'User',
              onPress: () => {
                setTooltipVisible(false);
              },
              icon: (
                <AccountCircle
                  height={24}
                  width={24}
                  color={theme.color.textPrimary}></AccountCircle>
              ),
              textColor: theme.color.textPrimary,
              iconColor: theme.color.textPrimary,
            },
            {
              text: t('LOGOUT'),
              onPress: () => {
                handleLogout();
              },
              icon: (
                <Logout
                  height={24}
                  width={24}
                  color={theme.color.error}></Logout>
              ),
              textColor: theme.color.error,
              iconColor: theme.color.error,
            },
            {
              text: AppConstants.versionNumber,
              onPress: () => {},
              icon: (
                <InfoIcon
                  height={24}
                  width={24}
                  color={theme.color.textPrimary}></InfoIcon>
              ),
            },
            isConfigUpdated
              ? {
                text: 'Reset to Default',
                onPress: handleResetConfig,
                icon: (
                  <Reset
                    height={24}
                    width={24}
                    color={theme.color.textPrimary}
                  />
                ),
                textColor: theme.color.textPrimary,
                iconColor: theme.color.textPrimary,
              }
              : {
                text: 'Builder Live Preview',
                onPress: () => {
                  navigation.navigate(SCREEN_CONSTANTS.QR_SCREEN);
                },
                icon: (
                  <Builder
                    height={24}
                    width={24}
                    color={theme.color.textPrimary}
                  />
                ),
                textColor: theme.color.textPrimary,
                iconColor: theme.color.textPrimary,
              },
          ]}
        />
      </View>
    </View>
  );
};

export default Conversations;
