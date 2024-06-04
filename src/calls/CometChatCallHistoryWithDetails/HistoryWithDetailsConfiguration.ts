import { CallDetailsConfigurationInterface } from "../CometChatCallDetails";
import { CallHistoryConfigurationInterface } from "../CometChatCallHistory/CallHistoryConfiguration";

export interface HistoryWithDetailsConfigurationInterface {
    callHistoryConfiguration?: CallHistoryConfigurationInterface,
    callDetailsConfiguration?: CallDetailsConfigurationInterface,
}