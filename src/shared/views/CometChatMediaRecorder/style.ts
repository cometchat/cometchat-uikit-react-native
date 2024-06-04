import React from 'react';
import { StyleSheet } from 'react-native';

export const Style = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 10,
    },
    imageStyle: {
    },
    buttonStyle: {
    },
    buttonContainer: {
        flex: 1,
        flexDirection: "row", justifyContent: "space-between"
    },
    soundBarContainer: {
        marginBottom: 20,
        flexDirection: "row",
    },
    timerContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    soundBar: {
        width: 5,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 1,
    }
});