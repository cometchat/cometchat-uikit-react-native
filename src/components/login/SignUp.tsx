import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useContext } from "react"
import { StyleSheet, View, Text, TextInput, Modal, ActivityIndicator, Image } from "react-native"
import { RoundedButton } from "../../components/common/RoundedButton"
import { AppConstants } from "../../../AppConstants";
import { CometChatContext, CometChatUIKit } from "@cometchat/chat-uikit-react-native";
import { NavigationProp } from "@react-navigation/native";

interface SignUpProps {
    navigation: NavigationProp<any>;
}

export const SignUp = (props: SignUpProps) => {
    const [uid, setUID] = React.useState("");
    const [name, setName] = React.useState("");
    const [isLoginInProgress, setLoginInProgress] = React.useState(false);
    const {theme} = useContext(CometChatContext);
    
    return (
        <View style={{flex: 1, padding: 8}}>
            {
                isLoginInProgress ? 
                    <Modal transparent>
                        <View style={{backgroundColor: "rgba(20,20,20,0.5)", flex: 1, justifyContent: "center"}}>
                        <View style={{alignSelf:"center", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", width: "80%", padding: 16, borderRadius: 16}}>
                            <Image style={{height: 200, width: 200, marginBottom: 8, alignSelf: "center"}} source={require("./logo.png")} />
                            <ActivityIndicator size="large" color={theme.palette.getPrimary()} />
                        </View>
                        </View>
                    </Modal> :
                    null
            }
            <Text style={Style.header}>Sign Up</Text>
            <Text style={Style.welcome}>Welcome to CometChat</Text>
            <Text style={Style.defaultText}>Please Enter below details to continue</Text>
            <TextInput
                value={uid}
                onChangeText={txt => setUID(txt)}
                style={Style.inputBox}
                placeholder="Enter UID"
            />
            <TextInput
                value={name}
                onChangeText={txt => setName(txt)}
                style={Style.inputBox}
                placeholder="Enter Name"
            />
            <View style={{flex: 1}} />

            <View>
                <RoundedButton
                    style={{ width: "100%", backgroundColor: "rgb(50,150,255)", marginBottom: 8 }}
                    onPress={() => {
                        if (uid.length == 0 && name.length == 0)
                            return;
                            setLoginInProgress(true);
                        CometChat.createUser({uid, name}, AppConstants.AUTH_KEY)
                            .then(user => {
                                CometChatUIKit.login({uid: uid})
                                .then(loggedInUser => {
                                    props.navigation.navigate("Home");
                                    setLoginInProgress(false);
                                });
                            })
                            .catch(err => {
                                setLoginInProgress(false);
                            })
                    }}>
                    <Text style={{margin: 8, color: "white"}}>CREATE USER</Text>
                </RoundedButton>
            </View>
        </View>
    )
}

const Style = StyleSheet.create({
    header: {
        fontSize: 24,
        fontWeight: "bold",
        color: "black"
    },
    welcome: {
        fontSize: 26,
        color: "blue",
        fontWeight: "bold"
    },
    defaultText: {
        fontSize: 18,
    },
    inputBox: {
        width: "100%",
        backgroundColor: "rgba(20,20,20,0.1)",
        borderRadius: 10,
        margin: 4,
        padding: 16
    }
});