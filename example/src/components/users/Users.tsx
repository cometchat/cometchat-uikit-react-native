import { View, Text } from 'react-native'
import React from 'react'
import { CometChatUsers, localize } from '@cometchat/chat-uikit-react-native'

export const Users = () => {
  return (
    <CometChatUsers title={localize("USER")} />
  )
}