import React from 'react'
import { View, Text } from 'react-native'
import { AppStyle } from '../../AppStyle'
import { AppTopBar } from '../common/AppTopBar'
import ModuleFeatures from '../common/ModuleFeatures'
import { CallBubble, CallButton, IncomingCall, OutgoingCall } from '../../resources'
import { NavigationProp } from '@react-navigation/native'

interface CallFeatureListProps {
    navigation: NavigationProp<any>;
}
const CallModules = [
    {
        id: "IncomingCall",
        name: "Incoming call screen",
        info: "CometChatIncomingCall is an independent component that will display an incoming call.",
        image: IncomingCall,
    },
    {
        id: "OutgoingCall",
        name: "Outgoing call screen",
        info: "CometChatOutgoingCall is an independent component that will display an outgoing call.",
        image: OutgoingCall,
    },
    {
        id: "CallButton",
        name: "Call Button",
        info: "CometChatCallButton is an independent component that will allows you to make a call.",
        image: CallButton,
    },
    {
        id: "CallBubble",
        name: "Call Bubble",
        info: "CometChatCallBubble is a component that displays the call information and a button to join the call.",
        image: CallBubble,
    },
]

export const CallFeatureList = (props: CallFeatureListProps) => {
    return (
        <View style={AppStyle.container}>
            <AppTopBar navigation={props.navigation} title={"Calls"} />
            <ModuleFeatures navigation={props.navigation} features={CallModules} />
        </View>
    )
}