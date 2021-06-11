/* eslint-disable import/no-duplicates */
import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { CometChatGroupListWithMessages } from '../Groups';
import { CometChatUserListWithMessages } from '../Users';
import { CometChatConversationListWithMessages } from '../Chats';
import { CometChatContextProvider } from '../../utils/CometChatContext';
import { CometChatUserProfile } from '../UserProfile';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MCIIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import theme from '../../resources/theme';
import { heightRatio } from '../../utils/consts';

const Tab = createBottomTabNavigator();

function CometChatUI() {
  const [tabs, setTabs] = useState(null);
  const contextRef = useRef(null);

  useEffect(() => {
    checkRestrictions();
  }, []);
  const checkRestrictions = async () => {
    let isChatEnabled = await contextRef.current.state.FeatureRestriction.isRecentChatListEnabled();
    let isGroupListEnabled = await contextRef.current.state.FeatureRestriction.isGroupListEnabled();
    let isUserSettingsEnabled = await contextRef.current.state.FeatureRestriction.isUserSettingsEnabled();
    let isUserListEnabled = await contextRef.current.state.FeatureRestriction.isUserListEnabled();
    let isCallListEnabled = await contextRef.current.state.FeatureRestriction.isCallListEnabled();
    setTabs({
      isChatEnabled,
      isGroupListEnabled,
      isUserSettingsEnabled,
      isUserListEnabled,
      isCallListEnabled,
    });
  };
  return (
    <CometChatContextProvider ref={contextRef}>
      {tabs ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color }) => {
              let iconName;

          if (route.name === 'Chats') {
            return (
              <MCIIcons name="chat" size={25 * heightRatio} color={color} />
            );
          }
          if (route.name === 'More') {
            return (
              <MaterialIcons
                name="more-horiz"
                size={25 * heightRatio}
                color={color}
              />
            );
          }
          if (route.name === 'Users') {
            iconName = 'ios-person-circle-sharp';
          } else if (route.name === 'Groups') {
            iconName = 'people';
          }

          // You can return any component that you like here!
          return (
            <Ionicons name={iconName} size={24 * heightRatio} color={color} />
          );
        },
      })}
      tabBarOptions={{
        activeTintColor: theme.color.blue,
        inactiveTintColor: 'rgba(0,0,0,0.5)',
        activeBackgroundColor: theme.color.white,
        inactiveBackgroundColor: theme.color.white,
        labelStyle: { fontSize: 12 },
      }}>
      <Tab.Screen
        name="Chats"
        component={CometChatConversationListWithMessages}
      />
      <Tab.Screen name="Users" component={CometChatUserListWithMessages} />
      <Tab.Screen name="Groups" component={CometChatGroupListWithMessages} />
      <Tab.Screen name="More" component={CometChatUserProfile} />
    </Tab.Navigator>
  );
}

export default CometChatUI;
