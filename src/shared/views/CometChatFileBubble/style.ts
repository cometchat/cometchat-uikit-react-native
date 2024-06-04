import React from "react";
import {StyleSheet, Dimensions} from "react-native";

const {width: windowWidth} = Dimensions.get('window');

export const Style = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: 8,
        opacity: 1,
        backgroundColor: "rgba(20, 20, 20, 0.04)",
        padding: 8,
        paddingBottom: 0
    },
    messageInfoStyle: {
        flex: 1,
        justifyContent: 'center'
    },
    imageStyle: {
        tintColor: 'rgb(51, 153, 255)',
    },
    downloadImage: {
        height: 24,
        width: 24,
        marginRight: 8,
        marginLeft: 4,
        alignSelf: 'center'
    },
    titleStyle: {
        opacity: 1,
        color: "rgba(20, 20, 20, 1)",
        fontStyle: "normal",
        fontWeight: "500",
        letterSpacing: -0.1,
        textAlign: "left",
        lineHeight: 22,
        fontSize: 17,
        maxWidth: windowWidth * 0.6
    },
    subtitleStyle: {
        opacity: 1,
        color: "rgba(20, 20, 20, 0.58)",
        fontStyle: "normal",
        letterSpacing: -0.1,
        textAlign: "left",
        lineHeight: 18,
        maxWidth: windowWidth * 0.5
    }

});
