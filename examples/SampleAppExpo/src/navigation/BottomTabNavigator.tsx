import React from 'react';
import {
  StyleSheet,
  Platform,
  View,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import {useTheme, Icon, useCometChatTranslation } from '@cometchat/chat-uikit-react-native';
import {SCREEN_CONSTANTS} from '../utils/AppConstants';
import { useIsKeyboardVisible } from '../hooks/useIsKeyboardVisible';
import ChatFill from '../assets/icons/Chatfill';
import Chat from '../assets/icons/Chat';
import PersonFill from '../assets/icons/PersonFill';
import Person from '../assets/icons/Person';
import GroupFill from '../assets/icons/GroupFill';
import CallFill from '../assets/icons/CallFill';
import Call from '../assets/icons/Call';
import Group from '../assets/icons/Group';
import Conversations from '../components/conversations/screens/Conversations';
import Calls from '../components/calls/Calls';
import Users from '../components/users/Users';
import Groups from '../components/groups/Groups';
import {BottomTabParamList} from './types';
import { useConfig } from '../config/store';

// Create the tab navigator.
const Tab = createBottomTabNavigator<BottomTabParamList>();

// Define a type for icon components that accept color, height, and width props.
type IconComponentType = React.ComponentType<{
  color?: string;
  height?: number;
  width?: number;
}>;

// Update the icons mapping to use the imported image components.
const icons: Record<
  string,
  {active: IconComponentType; inactive: IconComponentType}
> = {
  Chats: {active: ChatFill, inactive: Chat},
  Users: {active: PersonFill, inactive: Person},
  Calls: {active: CallFill, inactive: Call},
  Groups: {active: GroupFill, inactive: Group},
};

const CustomTabBarButton = ({children, onPress}: BottomTabBarButtonProps) => (
  <TouchableWithoutFeedback onPress={onPress}>
    <View style={styles.tabButton}>{children}</View>
  </TouchableWithoutFeedback>
);

const BottomTabNavigator = () => {
  const theme = useTheme();
  const tabs = useConfig(state => state.settings.layout.tabs);
  const { t } = useCometChatTranslation();
  // Use the custom hook to track keyboard visibility
  const isKeyboardVisible = useIsKeyboardVisible();

  // Map tab keys to screen names and components
  const TAB_COMPONENTS: Record<string, { name: string; component: React.ComponentType<any> }> = {
    chats: { name: SCREEN_CONSTANTS.CHATS, component: Conversations },
    calls: { name: SCREEN_CONSTANTS.CALLS, component: Calls },
    users: { name: SCREEN_CONSTANTS.USERS, component: Users },
    groups: { name: SCREEN_CONSTANTS.GROUPS, component: Groups },
  };

  return (
    <Tab.Navigator
      initialRouteName="Chats"
      screenOptions={({route}) => ({
        headerShown: false,
        // Hide tab bar when keyboard is visible
        tabBarStyle: isKeyboardVisible 
          ? { display: 'none' } 
          : styles.tabBar,
        animation: 'none',
        tabBarIcon: ({focused}) => {
          const iconSet = icons[route.name];
          if (!iconSet) return null;

          const IconComponent = focused ? iconSet.active : iconSet.inactive;
          const iconColor = focused
            ? theme.color.primary
            : theme.color.iconSecondary;

          return (
            <Icon
              icon={
                <IconComponent
                  color={iconColor as string}
                  height={24}
                  width={24}
                />
              }
            />
          );
        },
        tabBarShowLabel: true,
        tabBarLabel: ({focused}) => 
          focused ? (
            <View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: theme.color.primary,
                    fontFamily: theme.typography.heading1.bold.fontFamily,
                  },
                ]}
              >
                {t(route.name.toUpperCase())}
              </Text>
            </View>
       ) : null,
        tabBarButton: props => <CustomTabBarButton {...props} />,
        tabBarBackground: () => (
          <View style={{backgroundColor: theme.color.background1, flex: 1}} />
        ),
      })}
    >
      {tabs.map(tabKey => {
        const tab = TAB_COMPONENTS[tabKey.toLowerCase()];
        return tab ? (
          <Tab.Screen
            key={tab.name}
            name={tab.name as keyof BottomTabParamList}
            component={tab.component}
          />
        ) : null;
      })}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 60 : 70,
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
    paddingTop: 15,
    borderTopWidth: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabNavigator;
