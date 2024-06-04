import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { OngoingCallStyleInterface } from './OngoingCallStyle';
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatContext } from '../../shared/CometChatContext';
import { CallingPackage } from '../CallingPackage';

const CometChatCalls = CallingPackage.CometChatCalls;

export interface CometChatOngoingCallInterface {
    sessionID: string,
    ongoingCallStyle?: OngoingCallStyleInterface,
    callSettingsBuilder: typeof CometChatCalls.CallSettingsBuilder
    onError?: (e: CometChat.CometChatException) => void,
}

export const CometChatOngoingCall = (props: CometChatOngoingCallInterface) => {

    const {
        callSettingsBuilder,
        onError,
        ongoingCallStyle,
        sessionID,
    } = props;

    const [callToken, setToken] = useState(undefined);
    const callSettings = useRef(callSettingsBuilder?.build());

    const { theme } = useContext(CometChatContext);

    useEffect(() => {
        CometChat.getLoggedinUser()
            .then(user => {
                let authToken = user.getAuthToken();
                CometChatCalls.generateToken(sessionID, authToken)
                    .then(token => {
                        setToken(token.token);
                    })
                    .catch(rej => {
                        setToken(undefined);
                        onError && onError(rej);
                    })
            })
            .catch(rej => {
                console.log("Error", rej);
                onError && onError(rej);
            });
        return () => {
            callSettings.current = null;
        }
    }, []);

    return (
        <View style={[{ height: '100%', width: '100%', position: 'relative' }, ongoingCallStyle]}>
            {
                callSettings.current && callToken &&
                <CometChatCalls.Component
                    callSettings={callSettings.current}
                    callToken={callToken}
                /> ||
                <View style={{ justifyContent: "center", alignItems: "center", height: "100%", backgroundColor: "transparent" }}>
                    <ActivityIndicator size={"large"} color={theme.palette.getPrimary()} />
                </View>
            }
        </View>
    )
}