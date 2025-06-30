import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { AppStyle } from '../../AppStyle';
import { Component1, Component2, Component3, RightArrow } from '../../resources';
import { CardView } from '../common/CardView';

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

export const UserModuleList = ({ navigation }: any) => {
    return (
        <View style={AppStyle.container}>
            <TouchableOpacity style={{ flexDirection: "row", marginBottom: 16 }} onPress={() => navigation.goBack()}>
                <Image style={[Style.image, { transform: [{ rotate: '180deg' }] }]} source={RightArrow} />
                <Text style={AppStyle.heading2}>Users</Text>
            </TouchableOpacity>
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