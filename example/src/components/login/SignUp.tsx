import { CometChat } from "@cometchat-pro/react-native-chat";
import React, { useContext } from "react"
import { StyleSheet, View, Text, TextInput, Modal, ActivityIndicator, Image } from "react-native"
import { RoudedButton } from "../../components/common/RoundedButton"
import { COMETCHAT_CONSTANTS } from "../../CONSTS";
import { CometChatContext, CometChatUIKit } from "@cometchat/chat-uikit-react-native";

export const SignUp = (props) => {
    const [uid, setUID] = React.useState("");
    const [name, setName] = React.useState("");
    const [isLoginInPregress, setLoginInProgress] = React.useState(false);
    const {theme} = useContext(CometChatContext);
    
    return (
        <View style={{flex: 1, padding: 8, backgroundColor : theme.palette.getBackgroundColor()}}>
            {
                isLoginInPregress ? 
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
            <Text style={[Style.header, {color: theme.palette.getAccent()}]}>Sign Up</Text>
            <Text style={Style.welcome}>Welcome to CometChat</Text>
            <Text style={[Style.defaultText, {color: theme.palette.getAccent600()}]}>Please Enter below details to continue</Text>
            <TextInput
                value={uid}
                onChangeText={txt => setUID(txt)}
                style={[Style.inputBox, {backgroundColor: theme.palette.getAccent200()}]}
                placeholder="Enter UID"
                placeholderTextColor={theme.palette.getAccent600()}
            />
            <TextInput
                value={name}
                onChangeText={txt => setName(txt)}
                style={[Style.inputBox, {backgroundColor: theme.palette.getAccent200()}]}
                placeholder="Enter Name"
                placeholderTextColor={theme.palette.getAccent600()}
            />
            <View style={{flex: 1}} />

            <View>
                <RoudedButton
                    style={{ width: "100%", backgroundColor: "rgb(50,150,255)", marginBottom: 8 }}
                    onPress={() => {
                        if (uid.length == 0 && name.length == 0)
                            return;
                            setLoginInProgress(true);
                        CometChat.createUser({uid, name}, COMETCHAT_CONSTANTS.AUTH_KEY)
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
                </RoudedButton>
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