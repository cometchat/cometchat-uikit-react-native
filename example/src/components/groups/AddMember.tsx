import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import { CometChatAddMembers } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'

export const AddMember = (props) => {
    const { group } = useContext(UserContext);

    return <CometChatAddMembers group={group} onBack={() => props.navigation.goBack()} />
}
