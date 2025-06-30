import React from "react";
import { View, Text } from "react-native";
import { NavigationProp } from "@react-navigation/native";

interface CreateProps {
    navigator: NavigationProp<any>;
}

export const Create = ({ navigator }: CreateProps) => {
    return (
        <View style={{ flexDirection: 'row', width: "100%", justifyContent: 'center' }}>
            <Text>
                Don't have any users?
            </Text>
            <Text onPress={() => navigator.navigate("SignUp")}
                style={{ color: 'rgb(37, 131, 245)', marginHorizontal: 10 }}>CREATE NOW</Text>
        </View>
    );
}