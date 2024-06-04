import { StyleProp, ViewStyle } from "react-native/types";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { DatePattern, ImageType, ListItemStyleInterface } from "../../shared";
import { CallRecordingsStyleInterface } from "./CallLogRecordingsStyle";

export interface CallLogRecordingsConfigurationInterface {
    SubtitleView?: (param: { recording?: CometChat.BaseMessage }) => JSX.Element,
    TailView?: (param: { recording?: CometChat.BaseMessage }) => JSX.Element,
    ListItemView?: (param: { recording?: CometChat.BaseMessage }) => JSX.Element,
    AppBarOptions?: () => JSX.Element,
    /**
     * Recording list
     */
    data: any[],
    datePattern?: DatePattern, //'timeFormat' | 'dayDateFormat' | 'dayDateTimeFormat',
    hideSeperator?: boolean,
    BackButton?: JSX.Element,
    showBackButton?: boolean,
    EmptyStateView?: () => JSX.Element,
    onItemPress?: (item: CometChat.BaseMessage) => void,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    hideDownloadButton?: boolean,
    onDownloadIconPress?: (prop: { recording: CometChat.BaseMessage }) => void,
    downloadIcon?: ImageType,
    listItemStyle?: ListItemStyleInterface,
    callLogRecordingsStyle?: CallRecordingsStyleInterface,
    bodyViewContainerStyle?: StyleProp<ViewStyle>,
    tailViewContainerStyle?: StyleProp<ViewStyle>,
}
export class CallLogRecordingsConfiguration implements CallLogRecordingsConfigurationInterface {
    SubtitleView?: (param: { recording?: CometChat.BaseMessage }) => JSX.Element
    TailView?: (param: { recording?: CometChat.BaseMessage }) => JSX.Element
    ListItemView?: (param: { recording?: CometChat.BaseMessage }) => JSX.Element
    AppBarOptions?: () => JSX.Element
    /**
     * Recording list
     */
    data: any[]
    datePattern: DatePattern; //'timeFormat' | 'dayDateFormat' | 'dayDateTimeFormat'
    hideSeperator?: boolean
    BackButton?: JSX.Element
    showBackButton?: boolean
    EmptyStateView?: () => JSX.Element
    onItemPress?: (item: CometChat.BaseMessage) => void
    onError?: (e: CometChat.CometChatException) => void
    onBack?: () => void
    hideDownloadButton?: boolean
    onDownloadIconPress?: (prop: { recording: CometChat.BaseMessage }) => void
    downloadIcon?: ImageType
    listItemStyle?: ListItemStyleInterface
    callLogRecordingsStyle?: CallRecordingsStyleInterface
    bodyViewContainerStyle?: StyleProp<ViewStyle>
    tailViewContainerStyle?: StyleProp<ViewStyle>

    constructor(props: CallLogRecordingsConfigurationInterface) {
        if (props) {
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
        }
    }
}