import React from 'react'
import { View, Text } from 'react-native'
import { CometChatCreateGroup } from '@cometchat/chat-uikit-react-native'

export const CreateGroup = (props) => {
  return (
    <CometChatCreateGroup onBack={() => props.navigation.goBack()}  />
  )
}
