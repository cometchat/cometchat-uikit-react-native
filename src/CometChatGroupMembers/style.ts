import React from "react";
import { StyleSheet } from "react-native";

export const Style = StyleSheet.create({
    optionTextStyle: {
        textAlign: "center",
        padding: 8,
        width: "100%"
    },
    changeDialogContainer: {
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(20,20,20,0.15)",
    },
    changeDialogView: {
        backgroundColor: "white",
        width: "80%",
        padding: "2%",
        shadowColor: "rgba(20,20,20,0.4)",
        elevation: 5,
        borderRadius: 8,
        shadowOffset: {height: 5, width: 5},
    },
    changeDialogTitle: {
        alignSelf: "center",
        fontWeight: "700",
        fontSize: 20
    }
});