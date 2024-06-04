import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import { CometChatVideoBubble } from '@cometchat/chat-uikit-react-native'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

export const VideoBubble = () => {

  const {theme} = useContext(CometChatContext);

  return (
    <View style={{ alignItems: "center", justifyContent: "center", flex:1, backgroundColor: theme.palette.getBackgroundColor() }}>
      <CometChatVideoBubble
        videoUrl='https://data-us.cometchat.io/2379614bd4db65dd/media/1682517886_527585446_3e8e02fc506fa535eecfe0965e1a2024.mp4'
        style={{
          height: 200,
          width: 200,
          backgroundColor: theme.palette.getAccent600()
        }}
      />
    </View>
  )
}