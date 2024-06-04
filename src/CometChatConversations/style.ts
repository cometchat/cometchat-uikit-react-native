import { StyleSheet } from "react-native";

export const Style = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        borderRadius: 0,
    },
    dialogContainer: {
        flex: 1,
        backgroundColor: "rgba(20,20,20,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    dialogViewStyle: {
        paddingStart: 16,
        paddingEnd: 16,
        paddingTop: 16,
        width: "80%",
        backgroundColor: "white"
    },
    listStyle: {
        paddingStart: 8,
        paddingEnd: 8,
    },
    listContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    row: {
        flexDirection: 'row'
    },
    groupMemberTextStyle: {
        fontWeight: 'bold'
    },
    subtitleTextStyle: {
        maxWidth: "80%",
        color: "rgba(20, 20, 20, 0.58)",
    },
    startNewConversationBtnStyle: {
        position: 'absolute',
        end: 16,
        top: 20,
        alignItems: 'flex-end'
    },
    newConversationImageStyle: {
        height: 24,
        width: 24
    },
    headerView: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
        height: 56,
        padding: 16,
    },
    titleStyle: {
        alignSelf: "center",
        color: "rgb(20, 20, 20)",
    }
});