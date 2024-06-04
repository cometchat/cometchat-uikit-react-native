
import React, { useContext, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { CometChatContext, CometChatLocalize } from "@cometchat/chat-uikit-react-native";
import { AppStyle } from "../../AppStyle";
import { CardView } from "../common/CardView";

export const Localize = (props) => {
  
  const { changeLocalise } = useContext(CometChatContext);
  const {theme} = useContext(CometChatContext);

  const [selectedLanguage, setSelectedLangauge] = useState(CometChatLocalize.getLocale());

  return (
    <View style={[AppStyle.container, AppStyle.center, {backgroundColor: theme.palette.getBackgroundColor()}]}>
      <CardView>
        <View>
          <Text style={Style.heading}>Localize</Text>
          <Text style={Style.info}>CometChatLocalize allows you to detect the language of your users based on their browser or device settings and set the laguage accordingly.</Text>
          <View style={Style.row}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>Language</Text>
            <View style={[AppStyle.row, { padding: 4, backgroundColor: "grey" }]}>
              <TouchableOpacity
                style={{
                  padding: 6,
                  backgroundColor: selectedLanguage == "en" ? "white" : "transparent"
                }}
                onPress={() => {
                  changeLocalise("en");
                  setSelectedLangauge("en");
                }}>
                <Text>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  padding: 6,
                  backgroundColor: selectedLanguage == "hi" ? "white" : "transparent"
                }}
                onPress={() => {
                  changeLocalise("hi");
                  setSelectedLangauge("hi")
                }}>
                <Text>Hindi</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={Style.button}
            onPress={() => props.navigation.navigate("ConversationsWithMessages")}>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: "white" }}>VIEW</Text>
          </TouchableOpacity>
        </View>
      </CardView >
    </View >
  )
}

const Style = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "center",
    marginBottom: 24,
  },
  info: {
    fontWeight: "400",
    fontSize: 16,
    color: "grey",
    marginBottom: 24,
  },
  row: {
    ...AppStyle.row,
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 24,
  },
  button: {
    borderRadius: 18,
    backgroundColor: "rgb(51, 155, 255)",
    width: "100%",
    padding: 16,
    marginBottom: 24,
    ...AppStyle.center
  },
});