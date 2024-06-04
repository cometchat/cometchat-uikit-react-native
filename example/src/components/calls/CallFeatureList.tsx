import React, { useContext } from 'react'
import { View } from 'react-native'
import { AppStyle } from '../../AppStyle'
import { AppTopBar } from '../common/AppTopBar'
import ModuleFeatures from '../common/ModuleFeatures'
import { Component3 } from '../../resources'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

const CallModules = [
    {
        id: "CallButton",
        name: "Call Button",
        info: "CometChatCallButton is an independent component that will allows you to make a call.",
        image: Component3,
    },
]

export const CallFeatureList = (props) => {

    const {theme} = useContext(CometChatContext);

    return (
        <View style={[AppStyle.container, {backgroundColor: theme.palette.getBackgroundColor()}]}>
            <AppTopBar navigation={props.navigation} title={"Calls"} />
            <ModuleFeatures navigation={props.navigation} features={CallModules} />
        </View>
    )
}