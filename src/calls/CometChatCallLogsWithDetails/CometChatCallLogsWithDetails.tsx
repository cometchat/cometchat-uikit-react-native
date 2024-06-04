import React, { useState, useRef, useContext } from 'react'
import { View } from 'react-native'
import { CometChat } from '@cometchat/chat-sdk-react-native'
import { CometChatCallLogs } from '../CometChatCallLogs/CometChatCallLogs'
import { Style } from './style'
import { CometChatContext } from '../../shared'
import { CometChatCallLogDetails } from '../CometChatCallLogDetails/CometChatCallLogDetails'
import { CallLogsConfigurationInterface } from '../CometChatCallLogs/CallLogsConfiguration'
import { CallLogDetailsConfigurationInterface } from '../CometChatCallLogDetails'

interface CometChatCallLogsWithDetailsConfigurationInterface {
    call?: any,
    onError?: (e: CometChat.CometChatException) => void,
    CallLogsConfiguration?: CallLogsConfigurationInterface,
    callLogDetailsConfiguration?: CallLogDetailsConfigurationInterface,
}

export const CometChatCallLogsWithDetails = (props: CometChatCallLogsWithDetailsConfigurationInterface) => {

    const {
        call,
        callLogDetailsConfiguration,
        CallLogsConfiguration,
        onError
    } = props;

    const [showDetails, setShowDetails] = useState(call ? true : false);
    const selectedCall = useRef(call);

    const { theme } = useContext(CometChatContext);

    return (
        <View>
            <CometChatCallLogs
                onInfoIconPress={({ call }) => {
                    selectedCall.current = call as CometChat.Call;
                    setShowDetails(true)
                }}
                onError={onError}
                {...CallLogsConfiguration}
            />
            {
                showDetails &&
                <View style={[Style.stackScreen, { backgroundColor: theme.palette.getBackgroundColor() }]}>
                    <CometChatCallLogDetails
                        onError={onError}
                        call={selectedCall.current}
                        onBack={() => setShowDetails(false)}
                        {...callLogDetailsConfiguration}
                    />
                </View>
            }
        </View>
    )
}
