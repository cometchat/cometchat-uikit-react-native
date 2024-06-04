import { CometChat } from '@cometchat/chat-sdk-react-native'
import { CallLogDetailsConfigurationInterface } from "../CometChatCallLogDetails";
import { CallLogsConfigurationInterface } from "../CometChatCallLogs/CallLogsConfiguration";

export interface CallLogsWithDetailsConfigurationInterface {
    onError?: (e: CometChat.CometChatException) => void,
    CallLogsConfiguration?: CallLogsConfigurationInterface,
    callLogDetailsConfiguration?: CallLogDetailsConfigurationInterface,
}