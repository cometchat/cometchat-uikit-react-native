import { AvatarStyleInterface, CometChatDetailsTemplate, ImageType } from "../../shared"
import { CometChat } from '@cometchat/chat-sdk-react-native'
import { CallLogDetailsStyleInterface } from "./CallLogDetailsStyle"
import { CallLogHistoryConfiguration } from "../CometChatCallLogHistory";
import { CallLogParticipantsConfiguration } from "../CometChatCallLogParticipants";
import { CallLogRecordingsConfiguration } from "../CometChatCallLogRecordings/CallLogRecordingsConfiguration";

export interface CallLogDetailsConfigurationInterface {
    /**
     * toggle visibility of close button
     */
    showCloseButton?: boolean,
    /**
     * This will change the close button icon
     */
    closeButtonIconImage?: ImageType,
    /**
     * toggle the profile view
     */
    hideProfile?: boolean,
    /**
     * Pass the custom profile view here.
     */
    CustomProfileView?: (props: { user?: CometChat.User }) => JSX.Element,
    /**
     * List of templates tobe shown
     */
    data?: (props: { message: CometChat.BaseMessage, user?: CometChat.User, group?: CometChat.Group }) => CometChatDetailsTemplate[],
    /**
     * call back for error
     */
    onError?: (e: CometChat.CometChatException) => void,
    /**
     * custom functionality on back press
     */
    onBack?: () => void,
    /**
     * Style object for Avatar
     */
    avatarStyle?: AvatarStyleInterface,
    /**
     * Style object for CallLogDetails
     */
    callLogDetailsStyle?: CallLogDetailsStyleInterface,
    /**
     * Configuration for call history.
     */
    callLogHistoryConfiguration?: CallLogHistoryConfiguration;
    /**
     * Configuration for call log participants.
     */
    callLogParticipantsConfiguration?: CallLogParticipantsConfiguration;
    /**
     * Configuration for call log recordings.
     */
    callLogRecordingsConfiguration?: CallLogRecordingsConfiguration;
}

export class CallLogDetailsConfiguration implements CallLogDetailsConfigurationInterface {
    /**
     * toggle visibility of close button
     */
    showCloseButton?: boolean
    /**
     * This will change the close button icon
     */
    closeButtonIconImage?: ImageType
    /**
     * toggle the profile view
     */
    hideProfile?: boolean
    /**
     * Pass the custom profile view here.
     */
    CustomProfileView?: (props: { user?: CometChat.User }) => JSX.Element
    /**
     * List of templates tobe shown
     */
    data?: (props: { message: CometChat.BaseMessage; user?: CometChat.User; group?: CometChat.Group }) => CometChatDetailsTemplate[]
    /**
     * call back for error
     */
    onError?: (e: CometChat.CometChatException) => void
    /**
     * custom functionality on back press
     */
    onBack?: () => void
    /**
     * Style object for Avatar
     */
    avatarStyle?: AvatarStyleInterface
    /**
     * Style object for CallLogDetails
     */
    callLogDetailsStyle?: CallLogDetailsStyleInterface
    /**
     * Configuration for call history.
     */
    callLogHistoryConfiguration?: CallLogHistoryConfiguration
    /**
     * Configuration for call log participants.
     */
    callLogParticipantsConfiguration?: CallLogParticipantsConfiguration
    /**
     * Configuration for call log recordings.
     */
    callLogRecordingsConfiguration?: CallLogRecordingsConfiguration

    constructor(props: CallLogDetailsConfigurationInterface) {
        if (props) {
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
        }
    }
}