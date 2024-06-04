import React, { useState, useRef, useContext } from 'react'
import { View } from 'react-native'
import { CometChat } from '@cometchat/chat-sdk-react-native'
import { CallHistoryConfigurationInterface } from '../CometChatCallHistory/CallHistoryConfiguration'
// import { CometChatCallHistory } from '../CometChatCallHistory/CometChatCallHistory'
import { CallDetailsConfigurationInterface } from '../CometChatCallDetails'
import { Style } from './style'
import { CometChatContext } from '../../shared'

interface CometChatCallHistoryWithDetailsInterface {
    call?: CometChat.Call,
    onError?: (e: CometChat.CometChatException) => void,
    callHistoryConfiguration?: CallHistoryConfigurationInterface,
    callDetailsConfiguration?: CallDetailsConfigurationInterface,
}

const CometChatCallHistoryWithDetails = (props: CometChatCallHistoryWithDetailsInterface) => {

    const {
        call,
        callDetailsConfiguration,
        callHistoryConfiguration,
        onError
    } = props;

    const [showDetails, setShowDetails] = useState(call ? true : false);
    const selectedCall = useRef(call);

    const { theme } = useContext(CometChatContext);

    return (
        <View>
            {/* <CometChatCallHistory
                onInfoIconPress={({ call }) => {
                    selectedCall.current = call as CometChat.Call;
                    setShowDetails(true)
                }}
                onError={onError}
                {...callHistoryConfiguration}
            /> */}
            {
                showDetails &&
                <View style={[Style.stackScreen, { backgroundColor: theme.palette.getBackgroundColor() }]}>
                    {/* <CometChatCallDetails
                        onError={onError}
                        call={selectedCall.current}
                        onBack={() => setShowDetails(false)}
                        {...callDetailsConfiguration}
                    /> */}
                </View>
            }
        </View>
    )
}
