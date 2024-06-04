import React, { useContext } from "react";
import { Component1, Component2, Component3, List, RightArrow } from "../../resources";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppStyle } from "../../AppStyle";
import { CardView } from "../common/CardView";
import { AppTopBar } from "../common/AppTopBar";
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

const MessageModules = [
    {
        id: "Messages",
        name: "Messages",
        info: "Messages module helps you to send and receive in a conversation between a user or group. To learn more about its components click here.",
        image: Component1
    },
    {
        id: "MessageHeader",
        name: "Message Header",
        info: "CometChatMessageHeader is an independant component that displays the User or Group information using SDK's User or Group object.",
        image: Component2
    },
    {
        id: "MessageList",
        name: "Message List",
        info: "CometChatMessageList displays a list of messages and handlers real-time operations",
        image: List
    },
    {
        id: "MessageComposer",
        name: "Message Composer",
        info: "CometChatComposer is an independant and a critical component that allows users to compose and send various types of messages such as text, image, video and custom messages.",
        image: Component3
    }
];

export const MessageModuleList = ({ navigation }) => {

    const {theme} = useContext(CometChatContext);

    return (
        <View style={[AppStyle.container, {backgroundColor: theme.palette.getBackgroundColor()}]}>
            <AppTopBar title={"Messages"} navigation={navigation} />
            <ScrollView style={[AppStyle.container, {backgroundColor: theme.palette.getAccent200()}]}>
            {
                MessageModules.map(module => {
                    return <CardView
                        name={module.name}
                        info={module.info}
                        image={module.image}
                        onPress={() => navigation.navigate(module.id)}
                    />
                })
            }
            </ScrollView>
        </View>
    )
}

const Style = StyleSheet.create({
    optionButton: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: "100%",
        justifyContent: 'space-between'
    },
    image: {
        height: 24,
        width: 24,
        margin: 4,
        resizeMode: "contain",
        alignSelf: "center"
    }
})
