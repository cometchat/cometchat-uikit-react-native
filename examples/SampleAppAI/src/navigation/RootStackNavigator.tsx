import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import { SCREEN_CONSTANTS } from '../utils/AppConstants';
import { useTheme } from '@cometchat/chat-uikit-react-native';
import { RootStackParamList } from './types';
import { navigationRef, processPendingNavigation } from './NavigationService';
import SampleUser from '../components/login/SampleUser';
import AppCredentials from '../components/login/AppCredentials';
import { StatusBar, useColorScheme } from 'react-native';
import Messages from '../components/Messages';


type Props = {
  isLoggedIn: boolean;
  hasValidAppCredentials: boolean;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStackNavigator = ({ isLoggedIn, hasValidAppCredentials }: Props) => {
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
        theme={NavigationTheme}
      >
        <Stack.Navigator
          initialRouteName={
            isLoggedIn
              ? SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR
              : hasValidAppCredentials
              ? SCREEN_CONSTANTS.SAMPLE_USER
              : SCREEN_CONSTANTS.APP_CRED
          }
          screenOptions={{
            gestureEnabled: true,
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
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
          <Stack.Screen name={SCREEN_CONSTANTS.MESSAGES} component={Messages} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default RootStackNavigator;
