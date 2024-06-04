import React, { useContext } from 'react'
import { CometChatGroupsMembers } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'

export const GroupMember = (props) => {
    const { group } = useContext(UserContext);

    return <CometChatGroupsMembers group={group} onBack={() => props.navigation.goBack()} />
}
