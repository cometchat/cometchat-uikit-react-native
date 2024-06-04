import React, { useContext, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
import { CometChatTheme } from '@cometchat/chat-uikit-react-native';
import { AppStyle } from "../../AppStyle";
import { CardView } from "../common/CardView";

const customTheme = new CometChatTheme({});
customTheme.palette.accent = { light: "red", dark: "green" };
customTheme.palette.accent50 = { light: "grey", dark: "cyan" };
customTheme.palette.accent600 = { light: "rgb(100,100,100)", dark: "grey" };
customTheme.palette.backgroundColor = { light: "rgba(50,250,250,1)", dark: "black" };

export const Theme = (props) => {

  const { theme, applyTheme } = useContext(CometChatContext);

  const [selectedTheme, setSelectedTheme] = useState(theme.palette.accent.light == "green" ? "custom" : "default");

  return (
    <View style={[AppStyle.container, AppStyle.center, {backgroundColor: theme.palette.getBackgroundColor()}]}>
      <CardView>
        <View>
          <Text style={Style.heading}>Theme</Text>
          <Text style={Style.info}>CometChatTheme is a style applied to every component and every view in the activity or component in the UI Kit.</Text>
          <View style={Style.row}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>Theme</Text>
            <View style={[AppStyle.row, { padding: 4, backgroundColor: "grey" }]}>
              <TouchableOpacity
                style={{
                  padding: 6,
                  backgroundColor: selectedTheme == "default" ? "white" : "transparent"
                }}
                onPress={() => {
                  applyTheme(new CometChatTheme({}))
                  setSelectedTheme("default")
                }}>
                <Text>Default</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  padding: 6,
                  backgroundColor: selectedTheme == "custom" ? "white" : "transparent"
                }}
                onPress={() => {
                  applyTheme(customTheme)
                  setSelectedTheme("custom")
                }}>
                <Text>Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={Style.button}
            onPress={() => props.navigation.navigate("Groups")}>
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