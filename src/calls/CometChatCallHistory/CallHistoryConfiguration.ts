import { StyleProp, ViewStyle } from "react-native/types";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { AvatarStyleInterface, CometChatOptions, ImageType, ListItemStyleInterface } from "../../shared";
import { StatusIndicatorStyleInterface } from "../../shared/views/CometChatStatusIndicator/StatusIndicatorStyle";
import { CallHistoryStyleInterface } from "./CallHistoryStyle";
import { SelectionMode } from "../../shared/base/Types";

export interface CallHistoryConfigurationInterface {
    SubtitleView?: (param: { call?: CometChat.Call }) => JSX.Element,
    ListItemView?: (param: { call?: CometChat.Call }) => JSX.Element,
    AppBarOptions?: () => JSX.Element,
    options?: (param: { message: CometChat.BaseMessage }) => CometChatOptions[],
    messageRequestBuilder?: CometChat.MessagesRequestBuilder,
    hideSeperator?: boolean,
    BackButton?: JSX.Element,
    showBackButton?: boolean,
    selectionMode?: SelectionMode,
    onSelection?: (items: Array<CometChat.BaseMessage>) => void,
    EmptyStateView?: () => JSX.Element,
    emptyStateText?: string,
    ErrorStateView?: () => JSX.Element,
    errorStateText?: string,
    loadingIcon?: ImageType,
    LoadingStateView?: () => JSX.Element,
    hideError?: boolean,
    onItemPress?: (item: CometChat.Call) => void,
    onItemLongPress?: (item: CometChat.Call) => void,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    onInfoIconPress?: (prop: { call: CometChat.Call }) => void,
    avatarStyle?: AvatarStyleInterface,
    statusIndicatorStyle?: StatusIndicatorStyleInterface,
    listItemStyle?: ListItemStyleInterface,
    callHistoryStyle?: CallHistoryStyleInterface,
    headViewContainerStyle?: StyleProp<ViewStyle>,
    bodyViewContainerStyle?: StyleProp<ViewStyle>,
    tailViewContainerStyle?: StyleProp<ViewStyle>,
}
export class CallHistoryConfiguration implements CallHistoryConfigurationInterface {
    SubtitleView?: (param: { call?: CometChat.Call }) => JSX.Element
    ListItemView?: (param: { call?: CometChat.Call }) => JSX.Element
    AppBarOptions?: () => JSX.Element
    options?: (param: { message: CometChat.BaseMessage }) => CometChatOptions[]
    messageRequestBuilder?: CometChat.MessagesRequestBuilder
    hideSeperator?: boolean
    BackButton?: JSX.Element
    showBackButton?: boolean
    selectionMode?: SelectionMode
    onSelection?: (items: Array<CometChat.BaseMessage>) => void
    EmptyStateView?: () => JSX.Element
    emptyStateText?: string
    ErrorStateView?: () => JSX.Element
    errorStateText?: string
    loadingIcon?: ImageType
    LoadingStateView?: () => JSX.Element
    hideError?: boolean
    onItemPress?: (item: CometChat.Call) => void
    onItemLongPress?: (item: CometChat.Call) => void
    onError?: (e: CometChat.CometChatException) => void
    onBack?: () => void
    onInfoIconPress?: (prop: { call: CometChat.Call }) => void
    avatarStyle?: AvatarStyleInterface
    statusIndicatorStyle?: StatusIndicatorStyleInterface
    listItemStyle?: ListItemStyleInterface
    callHistoryStyle?: CallHistoryStyleInterface
    headViewContainerStyle?: StyleProp<ViewStyle>
    bodyViewContainerStyle?: StyleProp<ViewStyle>
    tailViewContainerStyle?: StyleProp<ViewStyle>
    
    constructor(props: CallHistoryConfigurationInterface) {
        if (props) {
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
        }
    }
}