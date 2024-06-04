import React from 'react'
import { CometChatGroups } from '@cometchat/chat-uikit-react-native'

export const Groups = (props) => {
  return (
    <CometChatGroups showBackButton={true} onBack={() => props.navigation.goBack()} />
  )
}
