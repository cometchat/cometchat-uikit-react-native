import React, { useContext } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { AppStyle } from '../../AppStyle'
import { RightArrow } from '../../resources'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

export const AppTopBar = ({navigation, title}) => {

    const { theme } = useContext(CometChatContext);

    return (
        <View style={{ paddingBottom: 16, backgroundColor: theme.palette.getAccent200(), flexDirection: "row" }}>
            <TouchableOpacity style={{flexDirection: 'row'}} onPress={() => navigation.goBack()}>
                <Image style={[Style.image, { tintColor: theme.palette.getAccent(), transform: [{ rotate: '180deg' }] }]} source={RightArrow} />
                <Text style={[AppStyle.heading2, {color: theme.palette.getAccent()}]}>{title}</Text>
            </TouchableOpacity>
            <View style={AppStyle.container} />
        </View>
    )
}

const Style = StyleSheet.create({
    image: {
        height: 24,
        width: 24,
        margin: 4,
        resizeMode: "contain",
        alignSelf: "center"
    }
})