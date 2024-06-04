import React, { useContext } from 'react'
import { View, Text } from 'react-native'
import { AppStyle } from '../../AppStyle'
import { CometChatCallButtons } from '@cometchat/chat-uikit-react-native'
import { UserContext } from "../../../UserContext";
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

export const CallButton = () => {
    const { user } = useContext(UserContext);
    const {theme} = useContext(CometChatContext);

    return (
        <View style={[AppStyle.container, AppStyle.center, {backgroundColor: theme.palette.getBackgroundColor()}]}>
            <CometChatCallButtons user={user} />
        </View>
    )
}
