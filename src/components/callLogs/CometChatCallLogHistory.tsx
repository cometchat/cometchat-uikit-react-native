import { View } from 'react-native'
import React from 'react'
import { CometChatCallLogHistory } from '@cometchat/chat-uikit-react-native';
import { CallLog } from '@cometchat/calls-sdk-react-native';
import { NavigationProp } from '@react-navigation/native';

interface CallLogHistoryProps {
    navigation: NavigationProp<any>;
}

const CallLogHistory = (props: CallLogHistoryProps) => {
    const call = CallLog.callLogFromJson({ "sessionId": "v1.us.212570a35d379d83.1702625211b9a0a3efbd1a985de5670602008c935796cfa8e9", "totalAudioMinutes": 0, "totalVideoMinutes": 0, "totalDuration": "00:00:00", "hasRecording": false, "initiatedAt": 1702625211, "initiator": { "uid": "superhero3", "name": "Shantanu Khare", "avatar": "https://ca.slack-edge.com/THE2F2GKX-U02K3RHUN3A-6dbe098dfa19-512" }, "mode": "call", "receiver": { "uid": "superhero1", "name": "Darshan bhanushali", "avatar": "https://data-us.cometchat.io/212570a35d379d83/avatars/dc508f0baf96.png" }, "receiverType": "user", "status": "rejected", "totalDurationInMinutes": 0, "totalParticipants": 0, "type": "audio", "participants": [{ "uid": "superhero1", "totalAudioMinutes": 0, "totalVideoMinutes": 0, "isJoined": false, "totalDurationInMinutes": 0, "name": "Darshan bhanushali", "avatar": "https://data-us.cometchat.io/212570a35d379d83/avatars/dc508f0baf96.png" }, { "uid": "superhero3", "totalAudioMinutes": 0, "totalVideoMinutes": 0, "isJoined": false, "state": "rejected", "totalDurationInMinutes": 0, "name": "Shantanu Khare", "avatar": "https://ca.slack-edge.com/THE2F2GKX-U02K3RHUN3A-6dbe098dfa19-512" }], "data": { "entities": { "initiator": { "entity": { "uid": "superhero3", "name": "Shantanu Khare", "avatar": "https://ca.slack-edge.com/THE2F2GKX-U02K3RHUN3A-6dbe098dfa19-512" } }, "receiver": { "entity": { "uid": "superhero1", "name": "Darshan bhanushali", "avatar": "https://data-us.cometchat.io/212570a35d379d83/avatars/dc508f0baf96.png" } } } } });

    return (
        <View>
            <CometChatCallLogHistory
                user={call?.getInitiator()}
                showBackButton={true}
                onBack={props.navigation.goBack}
                onItemPress={props.navigation.goBack}
            />
        </View>
    )
}

export default CallLogHistory;