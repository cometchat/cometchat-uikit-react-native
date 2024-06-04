import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import { AppStyle } from '../../AppStyle'
import { CardView } from '../common/CardView'
import { CometChatBadge, CometChatDate, CometChatListItem } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'
import { CometChatContext } from "@cometchat/chat-uikit-react-native";
export const ListItem = () => {
  
  const {theme} = useContext(CometChatContext);
  const { user, group } = useContext(UserContext);

  return (
    <View style={[AppStyle.container, AppStyle.center, {backgroundColor: theme.palette.getBackgroundColor()}]}>
      <CardView>
        <View>
          <Text style={[AppStyle.featureHeading, {color: theme.palette.getAccent()}]}>List Item</Text>
          <Text style={AppStyle.featureInfo}>StatusIndicator component indicates whether a user is online or offline</Text>
        </View>
        <View>
          <Text style={{ color: theme.palette.getAccent800(), fontWeight: "bold", marginBottom: 4 }}>Group</Text>
          <CometChatListItem
            listItemStyle={{backgroundColor: theme.palette.getBackgroundColor()}}
            SubtitleView={() => <Text style={{color: theme.palette.getAccent600()}}>8 members</Text>}
            hideSeparator={false}
            title={group?.getName()}
            avatarName={group?.getName()}
            avatarURL={group?.getIcon() && { uri: group?.getIcon() } || undefined}
          />
        </View>
        <View>
          <Text style={{ color: theme.palette.getAccent800(), fontWeight: "bold" }}>User</Text>
          <CometChatListItem
            listItemStyle={{backgroundColor: theme.palette.getBackgroundColor()}}
            SubtitleView={() => <Text style={{color: theme.palette.getAccent600()}}>{user?.getStatus()}</Text>}
            hideSeparator={false}
            title={user?.getName()}
            avatarName={user?.getName()}
            avatarURL={{ uri: user?.getAvatar() }}
            statusIndicatorColor={user?.getStatus() == "online" ? "rgb(0,255,0)" : "grey"}
          />
        </View>
        <View>
          <Text style={{ color: theme.palette.getAccent800(), fontWeight: "bold" }}>Conversation</Text>
          <CometChatListItem
            listItemStyle={{backgroundColor: theme.palette.getBackgroundColor()}}
            SubtitleView={() => <Text style={{color: theme.palette.getAccent600()}}>Hi there</Text>}
            hideSeparator={false}
            title={user?.getName()}
            avatarName={user?.getName()}
            avatarURL={{ uri: user?.getAvatar() }}
            TailView={() => {
              return <View style={{ alignItems: "flex-end" }}>
                <CometChatDate timeStamp={1683779015} pattern='timeFormat' />
                <CometChatBadge count={100} />
              </View>
            }}
          />
        </View>
      </CardView>
    </View>
  )
}