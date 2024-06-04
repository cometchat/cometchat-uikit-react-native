import { StyleProp, ViewStyle } from "react-native/types";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { AvatarStyleInterface, CometChatOptions, ImageType, ListItemStyleInterface } from "../../shared";
import { CallLogsStyleInterface } from "./CallLogsStyle";
import { DatePattern } from "../../shared/base/Types";
import { CometChatOutgoingCallInterface } from "../CometChatOutgoingCall";

export interface CallLogsConfigurationInterface {
    SubtitleView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
    ListItemView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
    TailView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
    AppBarOptions?: () => JSX.Element,
    options?: (param: { message: CometChat.BaseMessage }) => CometChatOptions[],
    callRequestBuilder?: any,
    datePattern: DatePattern,
    dateSeparatorPattern: DatePattern,
    hideSeperator?: boolean,
    BackButton?: JSX.Element,
    showBackButton?: boolean,
    EmptyStateView?: () => JSX.Element,
    ErrorStateView?: () => JSX.Element,
    loadingIcon?: ImageType,
    LoadingStateView?: () => JSX.Element,
    hideError?: boolean,
    onItemPress?: (item: CometChat.BaseMessage) => void,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    onInfoIconPress?: (prop: { call: CometChat.BaseMessage }) => void,
    infoIcon?: ImageType,
    avatarStyle?: AvatarStyleInterface,
    listItemStyle?: ListItemStyleInterface,
    callLogsStyle?: CallLogsStyleInterface,
    headViewContainerStyle?: StyleProp<ViewStyle>,
    bodyViewContainerStyle?: StyleProp<ViewStyle>,
    tailViewContainerStyle?: StyleProp<ViewStyle>,
    missedAudioCallIconUrl?: string,
    missedVideoCallIconUrl?: string,
    incomingAudioCallIconUrl?: string,
    incomingVideoCallIconUrl?: string,
    outgoingAudioCallIconUrl?: string,
    outgoingVideoCallIconUrl?: string,
    outgoingCallConfiguration?: CometChatOutgoingCallInterface,
}
export class CallLogsConfiguration implements CallLogsConfigurationInterface {
    SubtitleView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element
    ListItemView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element
    TailView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element
    AppBarOptions?: () => JSX.Element
    options?: (param: { message: CometChat.BaseMessage }) => CometChatOptions[]
    callRequestBuilder?: any
    datePattern: DatePattern
    dateSeparatorPattern: DatePattern
    hideSeperator?: boolean
    BackButton?: JSX.Element
    showBackButton?: boolean
    EmptyStateView?: () => JSX.Element
    ErrorStateView?: () => JSX.Element
    loadingIcon?: ImageType
    LoadingStateView?: () => JSX.Element
    hideError?: boolean
    onItemPress?: (item: CometChat.BaseMessage) => void
    onError?: (e: CometChat.CometChatException) => void
    onBack?: () => void
    onInfoIconPress?: (prop: { call: CometChat.BaseMessage }) => void
    infoIcon?: ImageType
    avatarStyle?: AvatarStyleInterface
    listItemStyle?: ListItemStyleInterface
    callLogsStyle?: CallLogsStyleInterface
    headViewContainerStyle?: StyleProp<ViewStyle>
    bodyViewContainerStyle?: StyleProp<ViewStyle>
    tailViewContainerStyle?: StyleProp<ViewStyle>
    missedAudioCallIconUrl?: string
    missedVideoCallIconUrl?: string
    incomingAudioCallIconUrl?: string
    incomingVideoCallIconUrl?: string
    outgoingAudioCallIconUrl?: string
    outgoingVideoCallIconUrl?: string
    outgoingCallConfiguration?: CometChatOutgoingCallInterface

    constructor(props: CallLogsConfigurationInterface) {
        if (props) {
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
        }
    }
}