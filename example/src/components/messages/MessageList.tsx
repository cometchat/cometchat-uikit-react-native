import React, { useContext } from 'react'
import { View, Text } from 'react-native'
import { CometChatMessageList } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext';

export const MessageList = () => {

  const { user } = useContext(UserContext);

  return (
    <CometChatMessageList user={user} />
  )
}