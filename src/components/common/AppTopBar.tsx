import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { AppStyle } from '../../AppStyle'
import { RightArrow } from '../../resources'

interface AppTopBarProps {
    navigation: {
        goBack: () => void;
    };
    title: string;
}

export const AppTopBar = ({ navigation, title }: AppTopBarProps) => {
    return (
        <TouchableOpacity style={{ flexDirection: "row", marginBottom: 16 }} onPress={() => navigation.goBack()}>
            <Image style={[Style.image, { transform: [{ rotate: '180deg' }] }]} source={RightArrow} />
            <Text style={AppStyle.heading2}>{title}</Text>
        </TouchableOpacity>
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