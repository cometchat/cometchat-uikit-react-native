import React, { useContext } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native'
import { AppStyle } from '../../AppStyle';
import { Component1, Component2, Component3, RightArrow } from '../../resources';
import { CardView } from '../common/CardView';
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
import { AppTopBar } from '../common/AppTopBar';

const UserModules = [
    {
        id: "UsersWithMessages",
        name: "Users With Messages",
        info: "CometChatUsersWithMessages is an independent component used to set up a screen that shows the list of users available in your app and gives you the ability to search for a specific user and to start conversation.",
        image: Component1
    },
    {
        id: "Users",
        name: "Users",
        info: "CometChatUsers is an independent component used to set up a screen that displays a scrollable list of users available in your app and gives you the ability to search for a specific user.",
        image: Component2
    },
    {
        id: "Details",
        name: "Details",
        info: "The component can be used to view information about a user to learn more about this component tap here.",
        image: Component3
    }
];

export const UserModuleList = ({ navigation }) => {
    const {theme} = useContext(CometChatContext);
    return (
        <View style={[AppStyle.container, {backgroundColor: theme.palette.getBackgroundColor()}]}>
            <AppTopBar title={"Users"} navigation={navigation} />
            <ScrollView style={[AppStyle.container, {backgroundColor: theme.palette.getAccent200()}]}>
            {
                UserModules.map(module => {
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