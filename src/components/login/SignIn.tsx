import React, { useContext } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Modal, Image, ActivityIndicator, StatusBar } from "react-native";
import { RoundedButton } from "../../components/common/RoundedButton";
import { Create } from "./Create";
import { CometChatContext, CometChatUIKit } from "@cometchat/chat-uikit-react-native";
import { NavigationProp } from "@react-navigation/native";

interface SignInProps {
    navigation: NavigationProp<any>;
}

export const SignIn = (props: SignInProps) => {
    const [uid, setUID] = React.useState("");
    const [isLoginInProgress, setLoginInProgress] = React.useState(false);
    
    const {theme} = useContext(CometChatContext);

    return (
        <View style={{flex: 1, padding: 8}}>
            {
                isLoginInProgress ? 
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
            <Text style={Style.header}>Sign In</Text>
            <Text style={Style.welcome}>Welcome!</Text>
            <Text style={Style.defaultText}>Kindly, enter UID to proceed</Text>
            <TextInput
                value={uid}
                onChangeText={txt => setUID(txt)}
                style={Style.inputBox}
                placeholder="Enter UID"
            />
            <View style={{flex: 1}} />

            <View>
                <RoundedButton
                    style={Style.signInButton}
                    onPress={() => {
                        setLoginInProgress(true);
                        CometChatUIKit.login({uid})
                            .then(user => {
                                props.navigation.navigate("Home");
                                setLoginInProgress(false);
                            })
                            .catch(err => {
                                Alert.alert("Error", "Unable to login");
                                setLoginInProgress(false);
                            })
                     }}>
                    <Text style={Style.signInText}>Sign In</Text>
                </RoundedButton>
                <Create navigator={props.navigation} />
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