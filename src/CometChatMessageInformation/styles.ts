import { StyleSheet } from "react-native";

export const Style = StyleSheet.create({
    container: {
        paddingStart: 8,
        paddingEnd: 8,
    },
    divider: {
        height: 1,
        marginVertical: 10,
    },
    viewContainer: {
        // flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    imageStyle: {
        height: 24,
        width: 24,
        alignSelf: "center",
    },
    msgBubbleContainer: {
        maxHeight: '30%',
        height: 'auto',
    },
});