import React, { useContext } from "react"
import {
    GestureResponderEvent, Image, Platform, StyleSheet,
    Text, TouchableOpacity, View, ViewStyle
} from "react-native";
import { RightArrow } from "../../resources";
import { AppStyle } from "../../AppStyle";
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

export const CardView = (props: { name?: string, info?: string, image?: any, style?: ViewStyle, onPress?: ((event: GestureResponderEvent) => void), children?, hideRightArrow?: boolean}) => {
    const {
        children,
        info,
        name,
        image,
        style,
        onPress,
        hideRightArrow = false
    } = props;

    const {theme} = useContext(CometChatContext);

    if (children)
        return <View key={name} style={[Style.container, {backgroundColor: theme.palette.getAccent200()}, style]}>
            {children}
        </View>
    return (
        <TouchableOpacity key={name} onPress={onPress} style={style}>
            <View style={[Style.container, AppStyle.row, {backgroundColor: theme.palette.getBackgroundColor()}]}>
                {
                    image &&
                    <Image source={image} style={{height: 32, width: 32, margin: 8}} resizeMode="contain" />
                }
                <View style={AppStyle.container}>
                    <View style={Style.row}>
                        <Text style={[AppStyle.heading, { color: theme.palette.getAccent() }]} >{name}</Text>
                    </View>
                    <Text style={Style.info}>{info}</Text>
                </View>
                {
                    !hideRightArrow &&
                    <Image source={RightArrow} style={[Style.image, {tintColor: theme.palette.getAccent800()}]} />
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
        borderRadius: 16
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