import React, { useContext } from 'react'
import { CometChatJoinProtectedGroup } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'

export const JoinGroup = (props) => {

    const { protectedGroup } = useContext(UserContext);

    return <CometChatJoinProtectedGroup
        group={protectedGroup}
        onBack={() => props.navigation.goBack()}
    />
}
