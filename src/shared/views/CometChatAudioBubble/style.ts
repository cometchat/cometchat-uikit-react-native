import React from "react";
import { StyleSheet } from "react-native";

export const Style = StyleSheet.create({
    container: {
        paddingEnd: 16,
        height: 56,
        width: 228,
        flexDirection: 'row',
        alignItems: "center"
    },
    titleStyle: {
        opacity: 1,
        color: "rgba(20, 20, 20)",
        fontStyle: "normal",
        letterSpacing: -0.1,
        textAlign: 'left',
        lineHeight: 18,
    },
    subtitleStyle: {
        color: 'rgba(20,20,20,0.58)',
    },
    imageStyle: {
        height: 24,
        width: 24,
        tintColor: 'rgb(51, 153, 255)',
        margin: 16,
    }
});
