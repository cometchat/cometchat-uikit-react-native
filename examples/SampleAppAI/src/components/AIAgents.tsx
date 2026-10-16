import {CometChat} from '@cometchat/chat-sdk-react-native';
import {CometChatUsers, useTheme, CometChatUIKit, CometChatAvatar} from '@cometchat/chat-uikit-react-native';
import React, {useLayoutEffect, useState, useRef, useCallback, useContext} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useNavigation, CommonActions} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/types';
import {StackNavigationProp} from '@react-navigation/stack';
import {TooltipMenu} from '../utils/TooltipMenu';
import {AppConstants} from '../utils/AppConstants';
import Logout from '../assets/icons/Logout';
import Info from '../assets/icons/Info';
import {AuthContext} from '../navigation/AuthContext';
import {navigationRef} from '../navigation/NavigationService';
import AccountCircle from '../assets/icons/AccountCircle';

type AIAgentNavigationProp = StackNavigationProp<RootStackParamList, 'Messages'>;

const AppBarOptions: React.FC<{
  onPress: () => void;
  loggedInUser: CometChat.User;
  avatarContainerRef: React.RefObject<React.ComponentRef<typeof View> | null>;
}> = ({ onPress, loggedInUser, avatarContainerRef }) => {
  return (
    <View ref={avatarContainerRef}>
      <TouchableOpacity onPress={onPress}>
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

const AIAgents: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<AIAgentNavigationProp>();
  const {setIsLoggedIn: setLogout} = useContext(AuthContext);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const tooltipPosition = useRef({pageX: 0, pageY: 0});
  const avatarContainerRef = useRef<React.ComponentRef<typeof View>>(null);
  const loggedInUser = useRef<CometChat.User>(
    CometChatUIKit.loggedInUser!,
  ).current;

  // Configure header with back button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      title: 'AI Assistants',
      headerStyle: {
        backgroundColor: theme.color.background1,
      },
      headerTitleStyle: {
        color: theme.color.textPrimary,
      },
    });
  }, [navigation, theme]);

  const handleUserPress = (user: CometChat.User) => {
    navigation.navigate('Messages', { user });
  };

  const handleAvatarPress = useCallback(() => {
    try {
      if (avatarContainerRef.current) {
        avatarContainerRef.current.measureInWindow((x, y, width, height) => {
          // Add spacing from the avatar - move tooltip to the right and down
          tooltipPosition.current = {
            pageX: x + width + 20, // 20px to the right of the avatar
            pageY: y + height + 10 // 10px below the avatar
          };
        });
        setTooltipVisible(true);
      }
    } catch (error) {
      console.error('Error while handling avatar press:', error);
    }
  }, [avatarContainerRef, tooltipPosition, setTooltipVisible]);

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
    // navigate('Login');
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'SampleUser' }],
      }),
    );
  };

  const AppBarWrapper = React.useMemo(
    () => () => (
      <View style={styles.appBarWrapper}>
        <AppBarOptions
          onPress={handleAvatarPress}
          loggedInUser={loggedInUser}
          avatarContainerRef={avatarContainerRef}
        />
      </View>
    ),
    [handleAvatarPress, loggedInUser, avatarContainerRef]
  );





  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <CometChatUsers
          onItemPress={handleUserPress}
          title='Assistants'
          showBackButton={false}
          AppBarOptions={AppBarWrapper}
          usersRequestBuilder={new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .hideBlockedUsers(false)
            .setRoles(['@agentic'])
            .friendsOnly(false)
            .setStatus('')
            .setTags([])
            .sortBy('name')
            .setUIDs([])}
        />
      </View>

      <View>
        <TooltipMenu
          visible={tooltipVisible}
          onClose={() => {
            setTooltipVisible(false);
          }}
          onDismiss={() => {
            setTooltipVisible(false);
          }}
          event={{
            nativeEvent: tooltipPosition.current,
          }}
          menuItems={[
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
              text: AppConstants.versionNumber,
              onPress: () => {},
              icon: (
                <Info
                  height={24}
                  width={24}
                  color={theme.color.textPrimary}
                />
              ),
            },
            {
              text: 'Logout',
              onPress: () => {
                handleLogout();
              },
              icon: (
                <Logout
                  height={24}
                  width={24}
                  color={theme.color.error}
                />
              ),
              textColor: theme.color.error,
              iconColor: theme.color.error,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBarWrapper: {
    marginRight: 15,
  },
});

export default AIAgents;