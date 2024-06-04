import React, { useContext } from "react";
import { View, Text, Image, SafeAreaView, ActivityIndicator, Modal } from 'react-native';
import { RoudedButton } from "../common/RoundedButton";
import {
    AppLogo, Ironman, Captainamerica,
    Spiderman, Wolverine
} from "../../resources";
import { Style } from "./style";
import { Create } from "./Create";
import { CometChatContext, CometChatUIKit } from "@cometchat/chat-uikit-react-native";
import { AppStyle } from "../../AppStyle";

export const Login = ({navigation}) => {

    const [isLoginInPregress, setLoginInProgress] = React.useState(false);

    const {theme} = useContext(CometChatContext);

    React.useEffect(() => {
        CometChatUIKit.getLoggedInUser()
        .then(user => {
            if (user != null)
                navigation.navigate("Home")
        })
        .catch(e => console.log("Unable to get loggedInUser",e))
    },[]);

    const makeLogin = (uid) => {
        setLoginInProgress(true);
        CometChatUIKit.login({uid})
        .then(user => {
            setLoginInProgress(false);
            navigation.navigate("Home");
        })
        .catch(err => {
            setLoginInProgress(false);
            console.log("Error while login:", err);
        });
    }

    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', padding: 16, backgroundColor : theme?.palette?.getBackgroundColor() }}>
            {
                isLoginInPregress ? 
                    <Modal transparent>
                        <View style={{backgroundColor: theme.palette.getAccent500(), flex: 1, justifyContent: "center"}}>
                        <View style={{alignSelf:"center", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", width: "80%", padding: 16, borderRadius: 16}}>
                            <Image style={{height: 200, width: 200, marginBottom: 8, alignSelf: "center"}} source={require("./logo.png")} />
                            <ActivityIndicator size="large" color={theme.palette.getPrimary()} />
                        </View>
                        </View>
                    </Modal> :
                    null
            }
            <View style={{marginTop: 16}}>
                <Image source={AppLogo} style={Style.LogoImage} />
                <Text style={[Style.Title, {color: theme.palette.getAccent()}]}>CometChat</Text>
                <Text style={Style.Version}>Kitchen Sink App</Text>
            </View>
            <View>
                <Text style={{color: theme.palette.getAccent()}}>Login with one of our sample users</Text>

                <View style={{ flexDirection: 'row', alignSelf: 'center', marginTop: 8 }}>
                    <RoudedButton style={Style.LoginButton} onPress={() => makeLogin("superhero1")}>
                        <Image style={Style.ButtonImage} source={Ironman} />
                        <Text style={Style.ButtonText}> SUPERHERO 1</Text>
                    </RoudedButton>

                    <RoudedButton style={Style.LoginButton} onPress={() => makeLogin("superhero2")}>
                        <Image style={Style.ButtonImage} source={Captainamerica} />
                        <Text style={Style.ButtonText}> SUPERHERO 2</Text>
                    </RoudedButton>
                </View>
                <View style={{ flexDirection: 'row', alignSelf: 'center', marginBottom: 8 }}>
                    <RoudedButton style={Style.LoginButton} onPress={() => makeLogin("superhero3")}>
                        <Image style={Style.ButtonImage} source={Spiderman} />
                        <Text style={Style.ButtonText}> SUPERHERO 3</Text>
                    </RoudedButton>

                    <RoudedButton style={Style.LoginButton} onPress={() => makeLogin("superhero4")}>
                        <Image style={Style.ButtonImage} source={Wolverine} />
                        <Text style={Style.ButtonText}> SUPERHERO 4</Text>
                    </RoudedButton>
                </View>

                <Text style={{color: theme.palette.getAccent()}}>or else login countinue with</Text>

                <RoudedButton
                    style={Style.CustomLoginButton}
                    onPress={() => {
                        navigation.navigate("SignIn");
                     }}>
                    <Text style={{fontWeight: "bold"}}>Login using UID</Text>
                </RoudedButton>
            </View>
            <View style={{alignItems: 'center'}}>
                <Create navigator={navigation} theme={theme} />
                <Text style={{color: theme.palette.getAccent600()}}>2023 CometChat Inc.</Text>
            </View>
        </SafeAreaView>
    );
}