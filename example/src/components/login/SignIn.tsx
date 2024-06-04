import React, { useContext } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Modal, Image, ActivityIndicator, StatusBar } from "react-native";
import { RoudedButton } from "../../components/common/RoundedButton";
import { Create } from "./Create";
import { CometChatContext, CometChatUIKit } from "@cometchat/chat-uikit-react-native";

export const SignIn = (props) => {
    const [uid, setUID] = React.useState("");
    const [isLoginInPregress, setLoginInProgress] = React.useState(false);
    
    const {theme} = useContext(CometChatContext);

    return (
        <View style={{flex: 1, padding: 8, backgroundColor :theme.palette.getBackgroundColor()}}>
            {
                isLoginInPregress ? 
                    <Modal transparent statusBarTranslucent>
                        <View style={{backgroundColor: "rgba(20,20,20,0.5)", flex: 1, justifyContent: "center"}}>
                        <View style={{alignSelf:"center", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", width: "80%", padding: 16, borderRadius: 16}}>
                            <Image style={{height: 200, width: 200, marginBottom: 8, alignSelf: "center"}} source={require("./logo.png")} />
                            <ActivityIndicator size="large" color={theme.palette.getPrimary()} />
                        </View>
                        </View>
                    </Modal> :
                    null
            }
            <Text style={[Style.header, {color: theme.palette.getAccent()}]}>Sign In</Text>
            <Text style={[Style.welcome]}>Welcome!</Text>
            <Text style={[Style.defaultText, {color: theme.palette.getAccent600()}]}>Kindly, enter UID to proceed</Text>
            <TextInput
                value={uid}
                onChangeText={txt => setUID(txt)}
                style={[Style.inputBox, {backgroundColor :theme.palette.getAccent200()}]}
                placeholder="Enter UID"
                placeholderTextColor={theme.palette.getAccent600()}
            />
            <View style={{flex: 1}} />

            <View>
                <RoudedButton
                    style={Style.signInButton}
                    onPress={() => {
                        setLoginInProgress(true);
                        CometChatUIKit.login({uid})
                            .then(user => {
                                props.navigation.navigate("Home");
                                setLoginInProgress(false);
                            })
                            .catch(err => {
                                Alert.alert("Error", "Unable to login")
                                setLoginInProgress(false);
                            })
                     }}>
                    <Text style={Style.signInText}>Sign In</Text>
                </RoudedButton>
                <Create theme={theme} navigator={props.navigation} />
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
        fontWeight: "700"
    },
    inputBox: {
        width: "100%",
        padding: 16,
        backgroundColor: "rgba(20,20,20,0.1)",
        borderRadius: 10
    },
    signInButton: {
        backgroundColor: 'rgb(50,150,255)',padding: 8,margin: 8
    },
    signInText: {margin: 8, color: "white", fontWeight: "bold", fontSize: 18}
});