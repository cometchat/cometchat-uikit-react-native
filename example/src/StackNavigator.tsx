import React, { useContext, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Login, SignIn, SignUp } from "./components/login";
import { Home } from "./components/home/Home";
import { ConversationComponentList } from "./components/conversation";
import { CometChatConversationsWithMessages, CometChatContext, CometChatConversations, CometChatUsersWithMessages, CometChatUsers } from "@cometchat/chat-uikit-react-native";
import { Messages, MessageComposer, MessageHeader, MessageList, MessageModuleList } from "./components/messages";
import { UserModuleList } from "./components/users/UserModuleList";
import { Details } from "./components/users/Details";
import { JoinGroup, AddMember, BannedMembers, CreateGroup, GroupDetails, GroupMember, GroupModuleList, Groups, GroupsWithMessages, TransferOwnership } from "./components/groups";
import { AudioBubble, Avatar, BadgeCount, FileBubble, ImageBubble, ListItem, Localize, MessageReceipt, SharedModuleList, SoundManager, StatusIndicator, TextBubble, Theme, VideoBubble } from "./components/shared";
import { CallButton, CallFeatureList } from "./components/calls";
import { Appearance } from "react-native";

function StackNavigator(props) {
  const Stack = createStackNavigator();

  const { changeThemeMode } = useContext(CometChatContext);

  useEffect(() => {
    Appearance.addChangeListener((mode) => {
      changeThemeMode(mode.colorScheme);
    })
  },[]);

  return (
    <NavigationContainer>
      <Stack.Navigator headerMode="none" initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ConversationsModule" component={ConversationComponentList} />
        <Stack.Screen name="MessagesModule" component={MessageModuleList} />
        <Stack.Screen name="CallsModule" component={CallFeatureList} />
        <Stack.Screen name="CallButton" component={CallButton} />
        <Stack.Screen name="SharedModule" component={SharedModuleList} />
        <Stack.Screen name="UsersModule" component={UserModuleList} />
        <Stack.Screen name="GroupsModule" component={GroupModuleList} />
        <Stack.Screen name="ConversationsWithMessages" component={CometChatConversationsWithMessages} />
        <Stack.Screen name="Conversations" component={CometChatConversations} />
        <Stack.Screen name="Messages" component={Messages} />
        <Stack.Screen name="MessageHeader" component={MessageHeader} />
        <Stack.Screen name="MessageList" component={MessageList} />
        <Stack.Screen name="MessageComposer" component={MessageComposer} />
        <Stack.Screen name="UsersWithMessages" component={CometChatUsersWithMessages} />
        <Stack.Screen name="Users" component={CometChatUsers} />
        <Stack.Screen name="Details" component={Details} />
        <Stack.Screen name="GroupsWithMessages" component={GroupsWithMessages} />
        <Stack.Screen name="Groups" component={Groups} />
        <Stack.Screen name="CreateGroup" component={CreateGroup} />
        <Stack.Screen name="JoinGroup" component={JoinGroup} />
        <Stack.Screen name="GroupMember" component={GroupMember} />
        <Stack.Screen name="AddMember" component={AddMember} />
        <Stack.Screen name="TransferOwnership" component={TransferOwnership} />
        <Stack.Screen name="BannedMembers" component={BannedMembers} />
        <Stack.Screen name="GroupDetails" component={GroupDetails} />
        <Stack.Screen name="AudioBubble" component={AudioBubble} />
        <Stack.Screen name="Avatar" component={Avatar} />
        <Stack.Screen name="BadgeCount" component={BadgeCount} />
        <Stack.Screen name="FileBubble" component={FileBubble} />
        <Stack.Screen name="ImageBubble" component={ImageBubble} />
        <Stack.Screen name="ListItem" component={ListItem} />
        <Stack.Screen name="Localize" component={Localize} />
        <Stack.Screen name="MessageReceipt" component={MessageReceipt} />
        <Stack.Screen name="SoundManager" component={SoundManager} />
        <Stack.Screen name="StatusIndicator" component={StatusIndicator} />
        <Stack.Screen name="TextBubble" component={TextBubble} />
        <Stack.Screen name="Theme" component={Theme} />
        <Stack.Screen name="VideoBubble" component={VideoBubble} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default StackNavigator;