import { StyleSheet, Text, View } from 'react-native'
import React, { useContext } from 'react'
import { CometChatBannedMembers } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'

export const BannedMembers = (props) => {

    const { group } = useContext(UserContext);
    
    return (
        <CometChatBannedMembers group={group} onBack={() => props.navigation.goBack()} />
    )
}
