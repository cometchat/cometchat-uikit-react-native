import { CometChat } from "@cometchat-pro/react-native-chat";
import React, { useContext, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { AppStyle } from "../../AppStyle";
import { CardView } from "../../components/common/CardView"
import { Logout, DarkModeIcon, LightModeIcon } from '../../resources';
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
import { UserContext } from "../../../UserContext";

const UiKitModules = [
    {
        name: "Conversations",
        info: "Conversations module helps you to list the recent conversations between your users and groups. To learn more about components click here.",
    },
    {
        name: "Messages",
        info: "Messages module helps you to send and receive in a conversation between a user or group. To learn more about its components click here.",
    },
    {
        name: "Users",
        info: "Users module helps you list all the users available in you app. To learn more about its components click here.",
    },
    {
        name: "Groups",
        info: "Groups module helps you list all the groups you are apart in your app. To learn more about its components click here.",
    },
    {
        name: "Calls",
        info: "Calls module helps you to list the recent call history between your users and groups. To learn more about this component click here."
    },
    {name: "Shared",
        info: "Share module contains several resuable components that are devided into Primary, Secondary and SDKderived components. To learn more about these components click here.",
    },
];

export const Home = ({ navigation }) => {

    const { setGroup, setUser, setCall } = useContext(UserContext);
    const { theme, changeThemeMode } = useContext(CometChatContext);

    const Navigate = (to) => {
        navigation.navigate(`${to}Module`);
    }

    useEffect(() => {

        let userRequest = new CometChat.UsersRequestBuilder().setLimit(1).build();
        let groupRequest = new CometChat.GroupsRequestBuilder().setLimit(1).build();
        let callRequest = new CometChat.MessagesRequestBuilder()
                            .setCategories([CometChat.CATEGORY_CALL, CometChat.CATEGORY_CUSTOM])
                            .setTypes([CometChat.MESSAGE_TYPE.AUDIO, CometChat.MESSAGE_TYPE.VIDEO, "meeting"])
                            .setLimit(1)
                            .build();

        callRequest.fetchPrevious()
            .then(calls => {
                if (calls.length > 0) {
                    setCall?.(calls[0]);
                }
            })

        userRequest.fetchNext()
            .then(res => {
                console.log("setting user", res[0]['uid']);
                if (res.length > 0)
                    setUser?.(res[0]);
            })
            .catch(rej => {
                console.log("no user found");
            })
        groupRequest.fetchNext()
            .then(res => {
                console.log("setting group", res[0]['guid']);
                if (res.length > 0)
                    setGroup?.(res[0]);
            })
            .catch(rej => {
                console.log("no group found");
            })
    }, []);

    const updateMode = () => {
        theme.palette.mode == "light" ?
            changeThemeMode("dark") :
            changeThemeMode("light")
    }

    return (
        <View style={[AppStyle.container, {backgroundColor: theme.palette.getBackgroundColor()}]}>
            <View style={[AppStyle.row, AppStyle.center, { justifyContent: 'space-between', padding: 8, backgroundColor: theme.palette.getAccent200()}]}>
                <Text style={[AppStyle.heading, {color: theme.palette.getAccent()}]}>UI Components</Text>
                <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity onPress={updateMode} style={{marginEnd: 8}}>
                        <Image source={theme.palette.mode == "light" ? LightModeIcon : DarkModeIcon} style={{ height: 24, width: 24, resizeMode:"contain", tintColor: theme.palette.getAccent800() }} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{marginEnd: 8}} onPress={() => {
                        CometChat.logout().then(() => {
                            navigation.navigate("Login");
                        });
                    }}>
                        <Image source={Logout} style={{ height: 24, width: 24, tintColor: theme.palette.getAccent() }} />
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView style={[AppStyle.container, {backgroundColor: theme.palette.getAccent200()}]}>
                {
                    UiKitModules.map(
                        (module) => <CardView
                            key={module.name}
                            name={module.name}
                            info={module.info}
                            onPress={() => Navigate(module.name)}
                        />
                    )
                }
            </ScrollView>
        </View>
    )
}
