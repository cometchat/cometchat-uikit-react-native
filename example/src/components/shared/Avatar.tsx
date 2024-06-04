import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, { useContext } from 'react'
import { AppStyle } from '../../AppStyle'
import { CometChatAvatar } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'
import { CardView } from '../common/CardView'
import { StyleSheet } from 'react-native'
import { Ironman } from '../../resources'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
export const Avatar = () => {
  
  const { user } = useContext(UserContext);
  const {theme} = useContext(CometChatContext);

  const [borderRadius, setBorderRaius] = React.useState(0);
  const [avatarImage, setAvatarImage] = React.useState(Ironman);

  return (
    <View style={[AppStyle.container, AppStyle.center, {backgroundColor: theme.palette.getBackgroundColor()}]}>
      <CardView>
        <View>
          <Text style={[Style.heading, {color: theme.palette.getAccent()}]}>Avatar</Text>
          <Text style={[Style.info, {color: theme.palette.getAccent500()}]}>CometChatAvatar component displays an image or user/group avatar with fallback to the first two letters of the user name/group name</Text>

          <Text style={{ marginTop: 16, fontWeight: "bold", fontSize: 18, color: theme.palette.getAccent() }}>Name: Iron Man</Text>
          <View style={{ alignItems: 'center' }}>
            <CometChatAvatar image={avatarImage} name="Iron man" style={{ borderRadius: borderRadius, height: 100, width: 100 }} />
          </View>
          <TextInput
            value={String(borderRadius ? borderRadius : "")}
            style={{ borderWidth: 1, borderRadius: 16, marginTop: 8, paddingStart: 16 }}
            keyboardType="numeric"
            placeholder="Enter BorderRadius"
            placeholderTextColor={theme.palette.getAccent500()}
            onChangeText={txt => setBorderRaius(parseInt(txt.length > 0 ? txt : "0"))}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            <Text style={{ textAlign: 'center', color: theme.palette.getAccent800() }}>Avatar</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={{ backgroundColor: avatarImage ? "cyan" : "white" }} onPress={() => setAvatarImage(Ironman)}>
                <Text style={Style.buttonText}>Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: avatarImage ? "white" : "cyan" }} onPress={() => setAvatarImage(undefined)}>
                <Text style={Style.buttonText}>Name</Text>
              </TouchableOpacity>
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
  },
  buttonText: {
    color: 'black',
    margin: 8
  },
  statusButton: {
    padding: 4,
    backgroundColor: 'cyan',
    width: "30%",
    textAlign: "center"
  },
  componentContainer: {
    paddingTop: 6,
    justifyContent: "center"
  }
})