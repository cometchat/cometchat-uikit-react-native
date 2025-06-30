import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import { AppStyle } from '../../AppStyle'
import { CardView } from '../common/CardView'
import { CometChatBadge, CometChatDate, CometChatListItem } from '@cometchat/chat-uikit-react-native'
import { UserContext } from '../../../UserContext'

export const ListItem = () => {

  const { user, group } = useContext(UserContext);

  return (
    <View style={[AppStyle.container, AppStyle.center]}>
      <CardView>
        <View>
          <Text style={AppStyle.featureHeading}>Status Indicator</Text>
          <Text style={AppStyle.featureInfo}>StatusIndicator component indicates whether a user is online or offline</Text>
        </View>
        <View>
          <Text style={{ color: "black", fontWeight: "bold" }}>Group</Text>
          <CometChatListItem
            id={group?.getGuid()!}
            SubtitleView={() => <Text>8 members</Text>}
            hideSeparator={false}
            title={group?.getName()}
            avatarName={group?.getName()}
            avatarURL={{ uri: group?.getIcon() }}
          />
        </View>
        <View>
          <Text style={{ color: "black", fontWeight: "bold" }}>User</Text>
          <CometChatListItem
            id={user?.getUid()!}
            SubtitleView={() => <Text>{user?.getStatus()}</Text>}
            hideSeparator={false}
            title={user?.getName()}
            avatarName={user?.getName()}
            avatarURL={{ uri: user?.getAvatar() }}
            statusIndicatorColor={user?.getStatus() == "online" ? "rgb(0,255,0)" : "grey"}
          />
        </View>
        <View>
          <Text style={{ color: "black", fontWeight: "bold" }}>Conversation</Text>
          <CometChatListItem
            id={user?.getUid()!}
            SubtitleView={() => <Text>Hi there</Text>}
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