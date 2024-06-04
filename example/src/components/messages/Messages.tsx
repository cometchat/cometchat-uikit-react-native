import React, { useState, useEffect, useContext } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { CometChatMessages } from "@cometchat/chat-uikit-react-native";
import { CometChat } from "@cometchat-pro/react-native-chat";
import { UserContext } from "../../../UserContext";

export const Messages = ({ navigation }) => {

    const {user} = useContext(UserContext);

    if (!user && user == null)
        return <ActivityIndicator size={"large"} />

    return <CometChatMessages
        user={user}
        messageHeaderConfiguration={{
            onBack: () => navigation.goBack()
        }}
    />;
}