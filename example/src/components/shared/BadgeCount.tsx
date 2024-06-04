import React, { useContext } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import { CometChatBadge } from "@cometchat/chat-uikit-react-native";
import { AppStyle } from "../../AppStyle";
import { CardView } from '../common/CardView';
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
export const BadgeCount = () => {
  
  const {theme} = useContext(CometChatContext);
  
  const [badgeCount, setBadgeCount] = React.useState(1);
  const [backgroundColor, setBackgroundColor] = React.useState("red");

  return (
    <View style={[AppStyle.container, AppStyle.center, {backgroundColor: theme.palette.getBackgroundColor()}]}>
      <CardView>
        <View>
          <Text style={[Style.heading, {color: theme.palette.getAccent()}]}>Badge Count</Text>
          <Text style={[Style.info, {color: theme.palette.getAccent500()}]}>CometChatBadgeCount is a custom component which is used to display the unread message count. It can be used in plaves like ConversationListItem, etc.</Text>


          <View style={{ alignItems: "center" }}>
            <CometChatBadge
              count={badgeCount}
              style={{
                height: 100,
                width: 100,
                textFont: { fontSize: 32 },
                backgroundColor: backgroundColor
              }}
            />
          </View>

          <TextInput
            value={String(badgeCount ? badgeCount : "")}
            style={{ borderWidth: 1, borderRadius: 16, marginTop: 8, paddingStart: 16, color: theme.palette.getAccent() }}
            keyboardType="numeric"
            placeholder="Enter Badge Count"
            placeholderTextColor={theme.palette.getAccent600()}
            onChangeText={txt => setBadgeCount(parseInt(txt.length > 1 ? txt : "1"))}
            returnKeyType='done'
          />
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: "bold", color: theme.palette.getAccent800(), marginBottom: 4 }}>Background Color</Text>
            <View style={{ flexDirection: 'row', height: 30 }}>
              <TouchableOpacity
                style={{ backgroundColor: "red", flex: 1 }}
                onPress={() => setBackgroundColor("red")}
              />
              <TouchableOpacity
                style={{ backgroundColor: "brown", flex: 1 }}
                onPress={() => setBackgroundColor("brown")}
              />
              <TouchableOpacity
                style={{ backgroundColor: "green", flex: 1 }}
                onPress={() => setBackgroundColor("green")}
              />
              <TouchableOpacity
                style={{ backgroundColor: "cyan", flex: 1 }}
                onPress={() => setBackgroundColor("cyan")}
              />
              <TouchableOpacity
                style={{ backgroundColor: "blue", flex: 1 }}
                onPress={() => setBackgroundColor("blue")}
              />
            </View>
          </View>

        </View>
      </CardView>
    </View>
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
  }
});