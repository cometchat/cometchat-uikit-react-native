import React, { useContext } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { CometChatReceipt } from '@cometchat/chat-uikit-react-native'
import { AppStyle } from '../../AppStyle'
import { CardView } from '../common/CardView'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

export const MessageReceipt = () => {
  const {theme} = useContext(CometChatContext);
  return (
    <View style={{flex: 1, backgroundColor: theme.palette.getBackgroundColor()}}>
      <View style={{flex: 1, borderRadius: 16, marginTop: 16, padding: 8 }}>
        <Text style={[AppStyle.heading, { alignSelf: "center", color: theme.palette.getAccent() }]}>Message Receipt</Text>
        <Text style={[Style.info, {color: theme.palette.getAccent600()}]}>CometChatMessageReceipt component renders the receipts such as sending, sent, delivered, read and error state indicator of a message.</Text>
        <ScrollView>
          <CardView>
            <View style={Style.cardContainer}>
              <Text style={[Style.cardContainerHeading, {color: theme.palette.getAccent600()}]}>Progress state</Text>
              <CometChatReceipt receipt='WAIT' />
            </View>
          </CardView>
          <CardView>
            <View style={Style.cardContainer}>
              <Text style={[Style.cardContainerHeading, {color: theme.palette.getAccent600()}]}>Sent Receipt</Text>
              <View>
                <CometChatReceipt receipt='SENT' />
              </View>
            </View>
          </CardView>
          <CardView>
            <View style={Style.cardContainer}>
              <Text style={[Style.cardContainerHeading, {color: theme.palette.getAccent600()}]}>Delivered Receipt</Text>
              <View>
                <CometChatReceipt receipt='DELIVERED' />
              </View>
            </View>
          </CardView>
          <CardView>
            <View style={Style.cardContainer}>
              <Text style={[Style.cardContainerHeading, {color: theme.palette.getAccent600()}]}>Read Receipt</Text>
              <View>
                <CometChatReceipt receipt='READ' />
              </View>
            </View>
          </CardView>
          <CardView>
            <View style={Style.cardContainer}>
              <Text style={[Style.cardContainerHeading, {color: theme.palette.getAccent600()}]}>Error state</Text>
              <View>
                <CometChatReceipt receipt='ERROR' />
              </View>
            </View>
          </CardView>
        </ScrollView>
      </View>
    </View>
  )
}

const Style = StyleSheet.create({
  cardContainer: {
    justifyContent: "space-around",
    height: 100
  },
  cardContainerHeading: {
    fontWeight: "bold",
    fontSize: 18,
    color: "black"
  },
  info: {
    fontSize: 16,
    color: "grey"
  }
})