import { StyleProp, ViewStyle } from "react-native/types";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { AvatarStyleInterface, CometChatOptions, ImageType, ListItemStyleInterface } from "../../shared";
import { StatusIndicatorStyleInterface } from "../../shared/views/CometChatStatusIndicator/StatusIndicatorStyle";
import { CallLogHistoryStyleInterface } from "./CallLogHistoryStyle";
import { DatePattern, SelectionMode } from "../../shared/base/Types";

export interface CallLogHistoryConfigurationInterface {
    SubtitleView?: (param: { call?: CometChat.Call }) => JSX.Element,
    TailView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
    ListItemView?: (param: { call?: CometChat.Call }) => JSX.Element,
    AppBarOptions?: () => JSX.Element,
    options?: (param: { message: CometChat.BaseMessage }) => CometChatOptions[],
    callLogHistoryRequestBuilder?: any,
    hideSeperator?: boolean,
    datePattern?: DatePattern,
    dateSeparatorPattern?: DatePattern,
    BackButton?: JSX.Element,
    showBackButton?: boolean,
    EmptyStateView?: () => JSX.Element,
    ErrorStateView?: () => JSX.Element,
    loadingIcon?: ImageType,
    LoadingStateView?: () => JSX.Element,
    hideError?: boolean,
    onItemPress?: (item: CometChat.Call) => void,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    listItemStyle?: ListItemStyleInterface,
    CallLogHistoryStyle?: CallLogHistoryStyleInterface,
    bodyViewContainerStyle?: StyleProp<ViewStyle>,
    tailViewContainerStyle?: StyleProp<ViewStyle>,
}
export class CallLogHistoryConfiguration implements CallLogHistoryConfigurationInterface {
    SubtitleView?: (param: { call?: CometChat.Call }) => JSX.Element
    TailView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element
    ListItemView?: (param: { call?: CometChat.Call }) => JSX.Element
    AppBarOptions?: () => JSX.Element
    options?: (param: { message: CometChat.BaseMessage }) => CometChatOptions[]
    callLogHistoryRequestBuilder?: any
    hideSeperator?: boolean
    datePattern?: DatePattern
    dateSeparatorPattern?: DatePattern
    BackButton?: JSX.Element
    showBackButton?: boolean
    EmptyStateView?: () => JSX.Element
    ErrorStateView?: () => JSX.Element
    loadingIcon?: ImageType
    LoadingStateView?: () => JSX.Element
    hideError?: boolean
    onItemPress?: (item: CometChat.Call) => void
    onError?: (e: CometChat.CometChatException) => void
    onBack?: () => void
    listItemStyle?: ListItemStyleInterface
    CallLogHistoryStyle?: CallLogHistoryStyleInterface
    bodyViewContainerStyle?: StyleProp<ViewStyle>
    tailViewContainerStyle?: StyleProp<ViewStyle>
    
    constructor(props: CallLogHistoryConfigurationInterface) {
        if (props) {
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
        }
    }
}