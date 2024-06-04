import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import { CometChatTransferOwnership } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'

export const TransferOwnership = (props) => {
  
  const{group} = useContext(UserContext);
  
  return <CometChatTransferOwnership
    group={group} 
    onBack={() => props.navigation.goBack()}
    />
}
