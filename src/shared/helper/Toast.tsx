import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export const Toast = (props: { message: string }) => {
    return <View style={ToastStyle.container}>
        <Text style={{ alignSelf: "center" }}>{props.message}</Text>
    </View>
}

const ToastStyle = StyleSheet.create({
    container: {
        position: "absolute",
        backgroundColor: 'rgba(95,95,95,1)',
        borderWidth:1,
        borderColor: 'rgba(0,0,0,0.8)',
        zIndex: 10000,
        margin: 16,
        padding: 16,
        borderRadius: 18,
        alignSelf: "center",
        justifyContent: "center",
        bottom: 16,
    }
});
