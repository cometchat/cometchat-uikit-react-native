import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import { CometChatDetails } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'

export const Details = (props) => {
    const { user } = useContext(UserContext);

    return (
        <CometChatDetails user={user} onBack={() => props.navigation.goBack()} />
    )
}