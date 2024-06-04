import { StyleSheet } from "react-native";

export const Style = StyleSheet.create({
    container: {
        padding: 8
    },
    LogoImage: {
        height: 100,
        width: 100,
    },
    Title: {
        fontSize: 26,
        color: "rgba(20,20,20,0.8)",
    },
    Version: {
        fontSize: 34,
        fontWeight: "700",
        color: "rgb(37, 151, 245)"
    },
    LoginButton: {
        backgroundColor: 'black',
        margin: 8,
        padding: 16
    },
    ButtonText: {
        color: 'white'
    },
    CustomLoginButton: {
        backgroundColor: 'rgb(50,150,255)',
        padding: 8,
        margin: 8
    },
    DefaultText: {},
    ButtonImage: {
        backgroundColor: "#e6e6e6",
        height: 32,
        width: 32,
        borderRadius: 16
    },
});