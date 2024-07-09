import React from 'react';
import { StyleSheet } from "react-native";

export const Style = StyleSheet.create({
    container: {
        flex: 1,
    },
    infoIconStyle: {
        height: 24,
        width: 24,
    },
    appBarStyle: {
        flexDirection: "row",
        paddingEnd: 8,
        alignItems: "center"
    },
    stackMe: {
        height: "100%",
        width: "100%",
        position: "absolute",
        zIndex: 10
    }
});