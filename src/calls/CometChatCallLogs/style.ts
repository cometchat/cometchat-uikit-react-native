import { StyleSheet } from "react-native";

export const Style = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    headerStyle : {
        alignItems: "center",
        justifyContent: "space-between",
        paddingEnd: 8,
        paddingStart: 8
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    imageStyle: {
        height: 24,
        width: 24,
        alignSelf: "center",
    }
});