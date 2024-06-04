import React from "react";
import { StyleSheet } from "react-native";

export const Style = StyleSheet.create({
    nameStyle: {
        fontSize: 20,
        fontWeight: "500",
        color: "rgba(20,20,20,0.9)",
    },
    newMessageIndicatorStyle: {
        position: "absolute",
        zIndex: 20,
        padding: 4,
        paddingStart: 16,
        paddingEnd: 16,
        flexDirection: 'row',
        backgroundColor: "rgb(51,155,255)",
        borderRadius: 16,
        alignSelf: "center",
        marginTop: 16,
    },
    newMessageIndicatorImage: {
        tintColor: "white",
        height: 16,
        width: 16,
        alignSelf: "center",
        marginLeft: 8,
    },
    newMessageIndicatorText: {
        color: "white"
    },
    msgContainerStyle: {
        flex: 1,
        overflow: 'hidden',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    msgTxtStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        textAlign: 'center',
        width: '100%',
        color: "rgba(20, 20, 20, 0.33)",
    },
    msgImgStyle: {
        tintColor: 'rgba(20, 20, 20, 0.58)',
    },
    stickyHeaderFooterStyle: {
        position: "absolute",
        zIndex: 2,
        width: "100%"
    }
});