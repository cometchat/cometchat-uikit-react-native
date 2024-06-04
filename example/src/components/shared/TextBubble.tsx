import React, { useContext } from 'react'
import { Text, View } from 'react-native'
import { CometChatTextBubble } from "@cometchat/chat-uikit-react-native";
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

export const TextBubble = () => {

  const {theme} = useContext(CometChatContext);

  return <View style={{ flex: 1, justifyContent: "center", backgroundColor: theme.palette.getBackgroundColor() }}>
    <CometChatTextBubble
      text={"Can I customize UI"}
      style={{
        width: "65%",
        height: 100,
        backgroundColor: theme.palette.getAccent600(),
        borderRadius: 18,
      }}
    />

    <View style={{ alignSelf: "flex-end" }}>
      <CometChatTextBubble
        text={"Yes.\n\nYou can refer to our documentation\n\n https://www.cometchat.com/docs/react-native-chat-ui-kit/customize-ui-kit"}
        style={{
          width: "65%",
          backgroundColor: "rgb(51, 155, 255)",
          borderRadius: 18,
        }}
      />
    </View>
  </View>
}
