import React, { useContext } from 'react'
import { View } from 'react-native'
import { UserContext } from '../../../UserContext';
import { AppStyle } from '../../AppStyle';
import { CometChatMessageHeader } from '@cometchat/chat-uikit-react-native';
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

export const MessageHeader = (props) => {

  const { user } = useContext(UserContext);
  const { theme } = useContext(CometChatContext);

  return (
    <View style={[AppStyle.container, {justifyContent: "center", backgroundColor: theme.palette.getBackgroundColor()}]}>
      <CometChatMessageHeader
        user={user}
        onBack={() => props.navigation.goBack()}
      />
    </View>
  )
}