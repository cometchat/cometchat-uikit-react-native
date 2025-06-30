import { View, Text } from 'react-native'
import React from 'react'
import { CometChatContacts } from '@cometchat/chat-uikit-react-native'

interface ContactsProps {
  navigation: {
    goBack: () => void;
  };
}

const Contacts = (props: ContactsProps) => {
  return (
    <CometChatContacts onClose={props.navigation.goBack} onSubmitIconClick={props.navigation.goBack} />
  )
}
export default Contacts