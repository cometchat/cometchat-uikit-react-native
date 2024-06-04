import React, { useContext } from "react";
import { View, Text } from "react-native";

export const Create = ({ navigator, theme }) => {
    return (
        <View style={{
            flexDirection: 'row', width: "100%",
            justifyContent: 'space-around'}}>
            <Text style={{color: theme?.palette?.getAccent600()}}>
                Don't have any users?
                <Text onPress={() => navigator.navigate("SignUp")} style={{ color: 'rgb(37, 131, 245)' }}>CREATE NOW</Text>
            </Text>
        </View>
    );
}