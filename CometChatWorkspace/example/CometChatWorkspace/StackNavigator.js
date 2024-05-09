import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import React from 'react';
import {connect} from 'react-redux';

import LoginPage from './src/defaultPages/LoginPage';
import HomePage from './src/defaultPages/HomePage';
import {
  CometChatUserProfile,
  CometChatUI,
  CometChatMessages,
  CometChatUserListWithMessages,
  CometChatUserList,
  CometChatGroupListWithMessages,
  CometChatGroupList,
  CometChatConversationListWithMessages,
  CometChatConversationList,
} from './src/cometchat-chat-uikit-react-native/CometChatWorkspace/src/index';

function StackNavigator(props) {
  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator
        headerMode="none"
        initialRouteName={props.isLoggedIn ? 'HomePage' : null}>
        <Stack.Screen name="LoginPage" component={LoginPage} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="CometChatUI" component={CometChatUI} />
        <Stack.Screen
          name="Conversation"
          component={CometChatConversationListWithMessages}
        />
        <Stack.Screen
          name="ConversationComponent"
          component={CometChatConversationList}
        />
        <Stack.Screen name="Group" component={CometChatGroupListWithMessages} />
        <Stack.Screen name="GroupComponent" component={CometChatGroupList} />
        <Stack.Screen name="Users" component={CometChatUserListWithMessages} />
        <Stack.Screen name="UsersComponent" component={CometChatUserList} />
        <Stack.Screen name="CometChatMessages" component={CometChatMessages} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const mapStateToProps = ({reducer}) => {
  return {
    loading: reducer.loading,
    error: reducer.error,
    isLoggedIn: reducer.isLoggedIn,
  };
};

export default connect(mapStateToProps)(StackNavigator);
