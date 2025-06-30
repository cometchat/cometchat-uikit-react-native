import React from "react";
import { Component1, Component2, Component3, Info, List, RightArrow } from "../../resources";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppStyle } from "../../AppStyle";
import { CardView } from "../common/CardView";
import { NavigationProp } from "@react-navigation/native";

interface MessageModuleListProps {
    navigation: NavigationProp<any>;
}

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
    },
    {
        id: "MessageInformation",
        name: "Message Information",
        info: "CometChatMessageInformation is an independant that allows users to see the information of a message such as sent at, delivered at, read at and so on.",
        image: Info
    }
];

export const MessageModuleList = ({ navigation }: MessageModuleListProps) => {

    return (
        <View style={AppStyle.container}>
            <TouchableOpacity style={{ flexDirection: "row", marginBottom: 16 }} onPress={() => navigation.goBack()}>
                <Image style={[Style.image, { transform: [{ rotate: '180deg' }] }]} source={RightArrow} />
                <Text style={AppStyle.heading2}>Messages</Text>
            </TouchableOpacity>
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
