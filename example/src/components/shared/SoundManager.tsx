import React, { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { AppStyle } from "../../AppStyle";
import { CardView } from "../common/CardView"
import { CometChatSoundManager } from '@cometchat/chat-uikit-react-native';
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

export const SoundManager = () => {
  const {theme} = useContext(CometChatContext);
  return (
    <View style={[AppStyle.container, AppStyle.center, {backgroundColor :theme.palette.getBackgroundColor()}]}>
      <CardView>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "bold", alignSelf: "center" }}>Sound Manager</Text>
          <Text>CometChatSoundManager allows you to play different types of audio which is required for incoming and outgoing events in UI Kit. for example, events like incoming and outgoing messages.</Text>
          <View style={[AppStyle.row, { justifyContent: "space-around", alignItems :"center" }]}>
            <Text>Incoming Messages</Text>
            <TouchableOpacity style={Style.soundButton} onPress={() => CometChatSoundManager.play("incomingMessage")}>
              <Text>Play</Text>
            </TouchableOpacity>
          </View>
          <View style={[AppStyle.row, {justifyContent: "space-around", alignItems: "center" }]}>
            <Text>Outgoing Messages</Text>
            <TouchableOpacity style={Style.soundButton} onPress={() => CometChatSoundManager.play("outgoingMessage")}>
              <Text>Play</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CardView>
    </View>
  )
}

const Style = StyleSheet.create({
  soundButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "grey"
  }
})