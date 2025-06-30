import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Login, SignIn, SignUp } from "./components/login";
import { Home } from "./components/home/Home";
import { ConversationComponentList } from "./components/conversation";
import { CometChatConversationsWithMessages, CometChatConversations, CometChatUsersWithMessages, CometChatUsers, CometChatCallLogs, CometChatCallLogsWithDetails } from "@cometchat/chat-uikit-react-native";
import { Messages, MessageComposer, MessageHeader, MessageList, MessageModuleList } from "./components/messages";
import { UserModuleList } from "./components/users/UserModuleList";
import { Details } from "./components/users/Details";
import { JoinGroup, AddMember, BannedMembers, CreateGroup, GroupDetails, GroupMember, GroupModuleList, Groups, GroupsWithMessages, TransferOwnership } from "./components/groups";
import { AudioBubble, Avatar, BadgeCount, FileBubble, ImageBubble, ListItem, Localize, MessageReceipt, SharedModuleList, SoundManager, StatusIndicator, TextBubble, Theme, VideoBubble } from "./components/shared";
import { CallButton, CallFeatureList } from "./components/calls";
import { CallBubble } from "./components/calls/CallBubble";
import { IncomingCall } from "./components/calls/IncomingCall";
import { OutgoingCall } from "./components/calls/OutgoingCall";
import Contacts from "./components/conversation/Contacts";
import MessageInformation from "./components/messages/MessageInformation";
import MediaRecorder from "./components/shared/MediaRecorder";
import FormBubble from "./components/shared/FormBubble";
import CardBubble from "./components/shared/CardBubble";
import { CallLogsModuleList } from "./components/callLogs/CallLogsModules";
import CallLogDetails from "./components/callLogs/CometChatCallLogDetails";
import CallLogParticipants from "./components/callLogs/CometChatParticipants";
import CallLogRecordings from "./components/callLogs/CometChatCallLogRecordings";
import CallLogHistory from "./components/callLogs/CometChatCallLogHistory";
import SchedulerBubble from "./components/shared/SchedulerBubble";

function StackNavigator() {
  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ConversationsModule" component={ConversationComponentList} />
        <Stack.Screen name="MessagesModule" component={MessageModuleList} />
        <Stack.Screen name="CallsModule" component={CallFeatureList} />
        <Stack.Screen name="CallButton" component={CallButton} />
        <Stack.Screen name="IncomingCall" component={IncomingCall} options={{gestureEnabled: false}} />
        <Stack.Screen name="OutgoingCall" component={OutgoingCall} />
        <Stack.Screen name="CallBubble" component={CallBubble} />
        <Stack.Screen name="CallLogsModule" component={CallLogsModuleList} />
        <Stack.Screen name="CometChatCallLogs" component={CometChatCallLogs} />
        <Stack.Screen name="CometChatCallLogsWithDetails" component={CometChatCallLogsWithDetails} />
        <Stack.Screen name="CometChatCallLogDetails" component={CallLogDetails} />
        <Stack.Screen name="CometChatCallLogParticipants" component={CallLogParticipants} />
        <Stack.Screen name="CometChatCallLogRecordings" component={CallLogRecordings} />
        <Stack.Screen name="CometChatCallLogHistory" component={CallLogHistory} />
        <Stack.Screen name="Contacts" component={Contacts} />
        <Stack.Screen name="SharedModule" component={SharedModuleList} />
        <Stack.Screen name="UsersModule" component={UserModuleList} />
        <Stack.Screen name="GroupsModule" component={GroupModuleList} />
        <Stack.Screen name="ConversationsWithMessages" component={CometChatConversationsWithMessages} />
        <Stack.Screen name="Conversations" component={CometChatConversations} />
        <Stack.Screen name="Messages" component={Messages} />
        <Stack.Screen name="MessageHeader" component={MessageHeader} />
        <Stack.Screen name="MessageList" component={MessageList} />
        <Stack.Screen name="MessageComposer" component={MessageComposer} />
        <Stack.Screen name="MessageInformation" component={MessageInformation} />
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
        <Stack.Screen name="MediaRecorder" component={MediaRecorder} />
        <Stack.Screen name="FormBubble" component={FormBubble} />
        <Stack.Screen name="CardBubble" component={CardBubble} />
        <Stack.Screen name="SchedulerBubble" component={SchedulerBubble} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default StackNavigator;