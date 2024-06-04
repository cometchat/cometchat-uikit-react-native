import { View} from 'react-native'
import React, { useContext } from 'react'
import { CometChatFileBubble } from "@cometchat/chat-uikit-react-native";
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
export const FileBubble = () => {
  const {theme} = useContext(CometChatContext);
  return (
    <View style={{ alignItems: "center", justifyContent: "center", flex: 1, backgroundColor: theme.palette.getBackgroundColor() }}>
      <CometChatFileBubble
        fileUrl='https://data-us.cometchat.io/2379614bd4db65dd/media/1682517934_233027292_069741a92a2f641eb428ba6d12ccb9af.pdf'
        title='Sample'
        subtitle='pdf'
        style={{
          width: "65%"
        }}
      />
    </View>
  )
}