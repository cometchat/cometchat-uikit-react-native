import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import OngoingCallScreen from '../components/conversations/screens/OngoingCallScreen';
import {SCREEN_CONSTANTS} from '../utils/AppConstants';
import {useTheme} from '@cometchat/chat-uikit-react-native';
import {RootStackParamList} from './types';
import {navigationRef, processPendingNavigation} from './NavigationService';
import SampleUser from '../components/login/SampleUser';
import AppCredentials from '../components/login/AppCredentials';
import {Platform, StatusBar, useColorScheme} from 'react-native';
import {navigateToConversation} from '../utils/helper';
import Conversations from '../components/conversations/screens/Conversations';
import CreateConversation from '../components/conversations/screens/CreateConversation';
import Messages from '../components/conversations/screens/Messages';
import ThreadView from '../components/conversations/screens/ThreadView';
import SavedMessages from '../components/conversations/screens/SavedMessages';
import PinnedMessages from '../components/conversations/screens/PinnedMessages';
import UserInfo from '../components/conversations/screens/UserInfo';
import AddMember from '../components/conversations/screens/AddMember';
import BannedMember from '../components/conversations/screens/BannedMember';
import ViewMembers from '../components/conversations/screens/ViewMembers';
import GroupInfo from '../components/conversations/screens/GroupInfo';
import TransferOwnership from '../components/conversations/screens/TransferOwnership';
import Calls from '../components/calls/Calls';
import {CallDetails} from '../components/calls/CallDetails';
import Users from '../components/users/Users';
import Groups from '../components/groups/Groups';
import QRScreen from '../components/conversations/screens/qr_screen';
import AIAgents from '../components/AIAgent/AIAgents';
import SearchMessages from '../components/conversations/screens/SearchMessages';

type Props = {
  isLoggedIn: boolean;
  hasValidAppCredentials: boolean;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStackNavigator = ({isLoggedIn, hasValidAppCredentials: _hasValidAppCredentials}: Props) => {
  const theme = useTheme();
  const NavigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.color.background1 as string,
    },
  };

  const isDark = useColorScheme() === 'dark';
  const backgroundColor = theme.color.background2;
  const barStyle = isDark ? 'light-content' : 'dark-content';
  return (
    <>
      <StatusBar
        backgroundColor={backgroundColor}
        barStyle={barStyle}
        translucent={false}
      />
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          processPendingNavigation();
        }}
        theme={NavigationTheme}>
        <Stack.Navigator
          id={undefined}
          initialRouteName={
            isLoggedIn
              ? SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR
              : _hasValidAppCredentials
            ? SCREEN_CONSTANTS.SAMPLE_USER
            : SCREEN_CONSTANTS.APP_CRED
          }
          screenOptions={{
            gestureEnabled: true,
            headerShown: false,
            animation: 'slide_from_right',
          }}>
          {/* Auth Screens */}
          <Stack.Screen
            name={SCREEN_CONSTANTS.APP_CRED}
            component={AppCredentials}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.SAMPLE_USER}
            component={SampleUser}
          />
          {/* Tab Screens */}
          <Stack.Screen
            name={SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR}
            component={BottomTabNavigator}
          />
          <Stack.Screen name={SCREEN_CONSTANTS.USERS} component={Users} />
          <Stack.Screen name={SCREEN_CONSTANTS.GROUPS} component={Groups} />
          <Stack.Screen name={SCREEN_CONSTANTS.AI_AGENTS} component={AIAgents} />
          <Stack.Screen
            name={SCREEN_CONSTANTS.SAVED_MESSAGES}
            component={SavedMessages}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.PINNED_MESSAGES}
            component={PinnedMessages}
          />

          {/* Chat Screens */}
          <Stack.Screen
            name={SCREEN_CONSTANTS.CONVERSATION}
            component={Conversations}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.CREATE_CONVERSATION}
            component={CreateConversation}
          />
          <Stack.Screen name={SCREEN_CONSTANTS.MESSAGES} component={Messages} />
          <Stack.Screen
            name={SCREEN_CONSTANTS.THREAD_VIEW}
            component={ThreadView}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.SEARCH_MESSAGES}
            component={SearchMessages}
          />

          {/* Info Screens */}
          <Stack.Screen
            name={SCREEN_CONSTANTS.USER_INFO}
            component={UserInfo}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.GROUP_INFO}
            component={GroupInfo}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.ADD_MEMBER}
            component={AddMember}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.TRANSFER_OWNERSHIP}
            component={TransferOwnership}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.BANNED_MEMBER}
            component={BannedMember}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.VIEW_MEMBER}
            component={ViewMembers}
          />

          {/* Call Screens */}
          <Stack.Screen
            name={SCREEN_CONSTANTS.ONGOING_CALL_SCREEN}
            component={OngoingCallScreen}
          />
          <Stack.Screen name={SCREEN_CONSTANTS.CALL_LOGS} component={Calls} />
          <Stack.Screen
            name={SCREEN_CONSTANTS.CALL_DETAILS}
            component={CallDetails}
          />
          <Stack.Screen name={SCREEN_CONSTANTS.QR_SCREEN} component={QRScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default RootStackNavigator;
