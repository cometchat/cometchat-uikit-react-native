import { StyleProp, ViewStyle } from "react-native/types";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { AvatarStyleInterface, CometChatOptions, ImageType, ListItemStyleInterface } from "../../shared";
import { CallParticipantsStyleInterface } from "./CallLogParticipantsStyle";

export interface CallLogParticipantsConfigurationInterface {
    SubtitleView?: (param: { participant?: CometChat.BaseMessage }) => JSX.Element,
    TailView?: (param: { participant?: CometChat.BaseMessage }) => JSX.Element,
    ListItemView?: (param: { participant?: CometChat.BaseMessage }) => JSX.Element,
    AppBarOptions?: () => JSX.Element,
    /**
     * Participant list
     */
    data: any[],
    call: any,
    hideSeperator?: boolean,
    BackButton?: JSX.Element,
    showBackButton?: boolean,
    EmptyStateView?: () => JSX.Element,
    onItemPress?: (item: CometChat.BaseMessage) => void,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    avatarStyle?: AvatarStyleInterface,
    listItemStyle?: ListItemStyleInterface,
    callLogParticipantsStyle?: CallParticipantsStyleInterface,
    headViewContainerStyle?: StyleProp<ViewStyle>,
    bodyViewContainerStyle?: StyleProp<ViewStyle>,
    tailViewContainerStyle?: StyleProp<ViewStyle>,
}
export class CallLogParticipantsConfiguration implements CallLogParticipantsConfigurationInterface {
    SubtitleView?: (param: { participant?: CometChat.BaseMessage }) => JSX.Element
    TailView?: (param: { participant?: CometChat.BaseMessage }) => JSX.Element
    ListItemView?: (param: { participant?: CometChat.BaseMessage }) => JSX.Element
    AppBarOptions?: () => JSX.Element
    /**
     * Participant list
     */
    data: any[]
    call: any
    hideSeperator?: boolean
    BackButton?: JSX.Element
    showBackButton?: boolean
    EmptyStateView?: () => JSX.Element
    onItemPress?: (item: CometChat.BaseMessage) => void
    onError?: (e: CometChat.CometChatException) => void
    onBack?: () => void
    avatarStyle?: AvatarStyleInterface
    listItemStyle?: ListItemStyleInterface
    callLogParticipantsStyle?: CallParticipantsStyleInterface
    headViewContainerStyle?: StyleProp<ViewStyle>
    bodyViewContainerStyle?: StyleProp<ViewStyle>
    tailViewContainerStyle?: StyleProp<ViewStyle>

    constructor(props: CallLogParticipantsConfigurationInterface) {
        if (props) {
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
        }
    }
}