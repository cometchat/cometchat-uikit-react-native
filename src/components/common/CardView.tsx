import React from "react"
import {
    GestureResponderEvent, Image, Platform, StyleSheet,
    Text, TouchableOpacity, View
} from "react-native";
import { RightArrow } from "../../resources";
import { AppStyle } from "../../AppStyle";

export const CardView = (props: { name?: string, info?: string, image?: any, onPress?: ((event: GestureResponderEvent) => void), children?: React.ReactNode, hideRightArrow?: boolean}) => {
    const {
        children,
        info,
        name,
        image,
        onPress,
        hideRightArrow = false
    } = props;

    if (children)
        return <View key={name} style={Style.container}>
            {children}
        </View>
    return (
        <TouchableOpacity key={name} style={Style.container} onPress={onPress}>
            <View style={AppStyle.row}>
                {
                    image &&
                    <Image source={image} style={{height: 32, width: 32, margin: 8}} resizeMode="contain" />
                }
                <View style={AppStyle.container}>
                    <View style={Style.row}>
                        <Text style={[AppStyle.heading, { color: "black" }]} >{name}</Text>
                    </View>
                    <Text style={Style.info}>{info}</Text>
                </View>
                {
                    !hideRightArrow &&
                    <Image source={RightArrow} style={Style.image} />
                }
            </View>
        </TouchableOpacity>
    )
}

export const Style = StyleSheet.create({
    container: {
        elevation: 8,
        shadowOffset: { width: 5, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        shadowColor: "black",
        flexDirection: 'column',
        margin: 8,
        padding: 8,
        borderRadius: 16,
        backgroundColor: 'white'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    image: {
        height: 24,
        width: 24,
        tintColor: "black",
        alignSelf:"center",
    },
    info: {
        fontSize: 14,
        color: "grey",
        marginEnd: 4
    }
})