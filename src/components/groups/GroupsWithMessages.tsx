import React from 'react'
import { CometChatGroupsWithMessages } from '@cometchat/chat-uikit-react-native'

export const GroupsWithMessages = (props: any) => {
  return (
    <CometChatGroupsWithMessages groupsConfiguration={{
      showBackButton: true,
      onBack: () => props.navigation.goBack()
    }} />
  )
}