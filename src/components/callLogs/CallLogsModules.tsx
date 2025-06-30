import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native'
import { AppStyle } from '../../AppStyle';
import { CallLogs, Call, RightArrow, CallParticipants, CallRecording, CallHistory } from '../../resources';
import { CardView } from '../common/CardView';
import { NavigationProp } from '@react-navigation/native';

interface CallLogsModuleListProps {
    navigation: NavigationProp<any>;
}

const CallLogsModules = [
    {
        id: "CometChatCallLogs",
        name: "Call Logs Listing",
        info: "CometChatCallLogs is a widget which is used to display list of Call Logs.",
        image: Call
    },
    {
        id: "CometChatCallLogsWithDetails",
        name: "Call Logs With Details",
        info: "CometChatCallLogsWithDetails is a widget which is used to display list of Call Logs with an icon to display call details.",
        image: CallLogs
    },
    {
        id: "CometChatCallLogDetails",
        name: "Call Log Details",
        info: "CometChatCallLogDetails is a widget which is used to display call detail of a particular callLog.",
        image: CallLogs
    },
    {
        id: "CometChatCallLogParticipants",
        name: "Call Log Participants",
        info: "CometChatCallLogParticipants is a widget that displays list of participants for a particular Call.",
        image: CallParticipants
    },
    {
        id: "CometChatCallLogRecordings",
        name: "Call Log Recordings",
        info: "CometChatCallLogRecordings is a widget that displays list of recordings for a particular Call.",
        image: CallRecording
    },
    {
        id: "CometChatCallLogHistory",
        name: "Call Log History",
        info: "CometChatCallLogHistory is a widget which is used to display list of call history for a particular user or group.",
        image: CallHistory
    }
];

export const CallLogsModuleList = ({ navigation } : CallLogsModuleListProps) => {
    return (
        <View style={AppStyle.container}>
            <TouchableOpacity style={{ flexDirection: "row", marginBottom: 16 }} onPress={() => navigation.goBack()}>
                <Image style={[Style.image, { transform: [{ rotate: '180deg' }] }]} source={RightArrow} />
                <Text style={AppStyle.heading2}>Call Logs</Text>
            </TouchableOpacity>
            <ScrollView>
            {
                CallLogsModules.map(module => {
                    return <CardView
                        name={module.name}
                        info={module.info}
                        image={module.image}
                        onPress={() => navigation.navigate(module.id)}
                    />
                })
            }
            </ScrollView>
        </View>
    )
}

const Style = StyleSheet.create({
    optionButton: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: "100%",
        justifyContent: 'space-between'
    },
    image: {
        height: 24,
        width: 24,
        margin: 4,
        resizeMode: "contain",
        alignSelf: "center"
    }
})