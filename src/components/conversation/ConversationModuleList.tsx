import React from "react";
import { Image, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AppStyle } from "../../AppStyle";
import { CardView } from "../common/CardView";
import { Component1, Component2, RightArrow } from "../../resources";
import { NavigationProp } from "@react-navigation/native";

interface ConversationComponentListProps {
    navigation: NavigationProp<any>;
}

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
    {
        id: "Contacts",
        name: "Contacts",
        info: "CometChatContacts is an independent component used to set up a screen that shows the user and group contact.",
        image: Component2
    },
];

export const ConversationComponentList = (props: ConversationComponentListProps) => {

    return (
        <View style={AppStyle.container}>
            <TouchableOpacity style={{ flexDirection: "row", marginBottom: 16 }} onPress={() => props.navigation.goBack()}>
                <Image style={[Style.image, { transform: [{ rotate: '180deg' }] }]} source={RightArrow} />
                <Text style={AppStyle.heading2}>Conversations</Text>
            </TouchableOpacity>
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
