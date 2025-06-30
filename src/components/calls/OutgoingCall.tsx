import React from 'react'
import { View } from 'react-native'
import { AppStyle } from '../../AppStyle'
import { CometChatOutgoingCall } from '@cometchat/chat-uikit-react-native'

interface OutgoingCallProps {
  navigation: {
    goBack: () => void;
  };
}

export const OutgoingCall = (props: OutgoingCallProps) => {

    let msgObj = {
        "action": "initiated",
        getCategory: () => "call",
        getReceiver: () => {
            return {
                getAvatar: () => "https://data-us.cometchat.io/assets/images/avatars/ironman.png",
                getBlockedByMe: () => false,
                getDeactivatedAt: () => 0,
                getHasBlockedMe: () => false,
                getLastActiveAt: () => 1693306209,
                getName: () => "Iron Man",
                getRole: () => "default",
                getStatus: () => "online",
                getUid: () => "superhero2",
            }
        },
        getSender: () => {
            return {
                getAvatar: () => "https://data-us.cometchat.io/assets/images/avatars/ironman.png",
                getBlockedByMe: () => false,
                getDeactivatedAt: () => 0,
                getHasBlockedMe: () => false,
                getLastActiveAt: () => 1693306209,
                getName: () => "Iron Man",
                getRole: () => "default",
                getStatus: () => "online",
                getUid: () => "superhero1",
            }
        },
        "callInitiator": { "blockedByMe": false, "deactivatedAt": 0, "hasBlockedMe": false, "lastActiveAt": 1693573660, "name": "Hulk", "role": "default", "status": "online", "uid": "hulk123" },
        "callReceiver": { "avatar": "https://data-us.cometchat.io/assets/images/avatars/ironman.png", "blockedByMe": false, "deactivatedAt": 0, "hasBlockedMe": false, "lastActiveAt": 1684838515, "name": "Iron Man", "role": "default", "status": "online", "uid": "superhero1" },
        "category": "call", "conversationId": "hulk123_user_superhero1",
        "data": { "action": "initiated", "entities": { "by": [Object], "for": [Object], "on": [Object] }, "resource": "REACT_NATIVE-4_0_0-d4c7ff98-7df0-4cda-87a0-042d24c7d592-1693575737245" },
        "id": "2889", "initiatedAt": 1693576153, "joinedAt": 1693576153,
        "rawMessage": { "category": "call", "conversationId": "hulk123_user_superhero1", "data": { "action": "initiated", "entities": [Object], "resource": "REACT_NATIVE-4_0_0-d4c7ff98-7df0-4cda-87a0-042d24c7d592-1693575737245" }, "id": "2889", "receiver": "superhero1", "receiverType": "user", "sender": "hulk123", "sentAt": 1693576153, "type": "audio", "updatedAt": 1693576153 },
        "receiver": { "avatar": "https://data-us.cometchat.io/assets/images/avatars/ironman.png", "blockedByMe": false, "deactivatedAt": 0, "hasBlockedMe": false, "lastActiveAt": 1684838515, "name": "Iron Man", "role": "default", "status": "online", "uid": "superhero1" },
        "receiverId": "superhero1", "receiverType": "user",
        "sender": { "blockedByMe": false, "deactivatedAt": 0, "hasBlockedMe": false, "lastActiveAt": 1693573660, "name": "Hulk", "role": "default", "status": "online", "uid": "hulk123" },
        "sentAt": 1693576153, "sessionId": "v1.us.239414efb0e4882a.1693576153e0dfe098a411c7c30f25e4382a150c64104f228e",
        "status": "initiated", "type": "audio", "updatedAt": 1693576153
    };

    return (
        <View style={[AppStyle.container, AppStyle.center]}>
            <CometChatOutgoingCall
                onDeclineButtonPressed={props.navigation.goBack}
                call={msgObj}
            />
        </View>
    )
}
