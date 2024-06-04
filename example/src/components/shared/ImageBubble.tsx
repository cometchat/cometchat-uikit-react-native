import React, { useContext } from 'react'
import { View, Text } from 'react-native'
import { CometChatImageBubble } from "@cometchat/chat-uikit-react-native";
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
export const ImageBubble = () => {
  const {theme} = useContext(CometChatContext);
  return (
    <View style={{ alignItems: "center", justifyContent: "center", flex:1, backgroundColor: theme.palette.getBackgroundColor() }}>
        <CometChatImageBubble
          imageUrl={{ uri: "https://data-us.cometchat.io/2379614bd4db65dd/media/1682517838_2050398854_08d684e835e3c003f70f2478f937ed57.jpeg" }}
          style={{
            height: 200,
            width: 200,
          }}
        />
      <View style={{ alignItems: "center", }}>
        <Text>This is simple reprasentation of CometChatImageBubble</Text>
      </View>
    </View>
  )
}