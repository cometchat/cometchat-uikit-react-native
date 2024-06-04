import { View, Text, ActivityIndicator, Image } from 'react-native'
import React, { useContext } from 'react'
import { AIBaseStyle, AIBaseStyleInterface } from '../../../AI/AIBaseStyle';
import { CometChatContext } from '../../CometChatContext';
import { ErrorMessageIcon, NoMessageIcon } from './resources';

const enum States {
    loading = "loading",
    error = "error",
    empty = "empty",
}

export interface CometChatAICardInterface {
    state: "loading" | "error" | "empty",
    style: AIBaseStyleInterface,
    loadingIconTint?: string,
    errorIconTint?: string,
    emptyIconTint?: string,
    loadingIconURL?: string,
    errorIconURL?: string,
    emptyIconURL?: string,
    loadingStateText?: string,
    errorStateText?: string,
    emptyStateText?: string,
}

const CometChatAICard = (props: CometChatAICardInterface) => {
    const { state, style,
        loadingStateText, loadingIconURL,
        emptyIconURL, emptyStateText,
        errorIconURL, errorStateText } = props;

    const { theme } = useContext(CometChatContext);

    const { emptyStateTextColor, emptyStateTextFont, emptyIconTint,
        errorStateTextColor, errorStateTextFont, errorIconTint,
        loadingStateTextColor, loadingStateTextFont, loadingIconTint
    } = new AIBaseStyle({
        emptyIconTint: theme.palette.getAccent(),
        emptyStateTextColor: theme.palette.getAccent(),
        emptyStateTextFont: theme.typography.subtitle1,
        errorIconTint: theme.palette.getAccent(),
        errorStateTextColor: theme.palette.getAccent(),
        errorStateTextFont: theme.typography.subtitle1,
        loadingIconTint: theme.palette.getAccent(),
        loadingStateTextColor: theme.palette.getAccent(),
        loadingStateTextFont: theme.typography.subtitle1,
        ...style,
    })
    return (
        <View>
            {props.children ? props.children :
                state === States.loading ? <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
                    {!loadingIconURL ? <ActivityIndicator color={loadingIconTint} /> :
                        <Image style={{ width: 25, height: 25, tintColor: loadingIconTint }} source={loadingIconURL} />}
                    <Text style={[loadingStateTextFont, { color: loadingStateTextColor, marginLeft: 10 }]}>{loadingStateText}</Text>
                </View>
                    : state === States.error ? <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
                        <Image style={{ width: 25, height: 25, tintColor: errorIconTint }} source={errorIconURL || ErrorMessageIcon} />
                        <Text style={[errorStateTextFont, { color: errorStateTextColor, marginLeft: 10 }]}>{errorStateText}</Text>
                    </View>
                        : state === States.empty ? <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
                            <Image style={{ width: 25, height: 25, tintColor: emptyIconTint }} source={emptyIconURL || NoMessageIcon} />
                            <Text style={[emptyStateTextFont, { color: emptyStateTextColor, marginLeft: 10 }]}>{emptyStateText}</Text>
                        </View>
                            : null}
        </View>
    )
}

export default CometChatAICard