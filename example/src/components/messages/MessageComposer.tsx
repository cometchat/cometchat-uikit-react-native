import React, { useContext } from 'react'
import { View, Text } from 'react-native'
import { CometChatMessageComposer } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'
import { AppStyle } from '../../AppStyle'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

export const MessageComposer = () => {

  const { user } = useContext(UserContext);
  const {theme} = useContext(CometChatContext);

  return (
    <View style={[AppStyle.container, {justifyContent: "center", backgroundColor: theme.palette.getBackgroundColor()}]}>
      <CometChatMessageComposer
        user={user}
      />
    </View>
  )
}