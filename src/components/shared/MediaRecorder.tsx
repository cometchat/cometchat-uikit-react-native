import { View } from 'react-native'
import React from 'react'
import { CometChatBottomSheet, CometChatMediaRecorder } from '@cometchat/chat-uikit-react-native'
import { NavigationProp } from '@react-navigation/native';

interface MediaRecorderProps {
    navigation: NavigationProp<any>;
}


const MediaRecorder = (props: MediaRecorderProps) => {

    return (
        <View style={{ flex: 1, alignItems: "flex-end" }}>
            <CometChatBottomSheet
                onClose={props.navigation.goBack}
            >
                <CometChatMediaRecorder
                    onClose={props.navigation.goBack}
                    onSend={props.navigation.goBack}
                />
            </CometChatBottomSheet>
        </View>
    )
}

export default MediaRecorder