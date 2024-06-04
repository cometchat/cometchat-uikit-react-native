import React, { useContext } from "react";
import { Image, View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { AppStyle } from "../../AppStyle";
import { CardView } from "../common/CardView";
import { Component1, Component2, RightArrow } from "../../resources";
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
import { AppTopBar } from "../common/AppTopBar";

const ConversationModule = [
    {
        id: "ConversationsWithMessages",
        name: "Conversations With Messages",
        info: "CometChatConversationsWithMessages is an independent component used to set up a screen that shows the recent conversations and allows you to send a message to the user or group from the list.",
        image: Component1
    },
    {
        id: "Conversations",
        name: "Conversations",
        info: "CometChatConversations is an independent component used to set up a screen that shows the recent conversations alone",
        image: Component2
    },
];

export const ConversationComponentList = (props) => {

    const {theme} = useContext(CometChatContext);

    return (
        <View style={[AppStyle.container, {backgroundColor :theme.palette.getBackgroundColor()}]}>
            <AppTopBar navigation={props.navigation} title={"Conversations"} />
            <ScrollView style={[AppStyle.container, {backgroundColor: theme.palette.getAccent200()}]}>
            {
                ConversationModule.map(module => {
                    return <CardView
                        key={module.id}
                        name={module.name}
                        info={module.info}
                        image={module.image}
                        onPress={() => props.navigation.navigate(module.id)}
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
