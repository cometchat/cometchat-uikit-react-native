import React, { useContext } from 'react'
import { CometChatDetails } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'

export const GroupDetails = (props) => {

    const { group } = useContext(UserContext);
    
    return (
        <CometChatDetails group={group} onBack={() => props.navigation.goBack()} />
    )
}
