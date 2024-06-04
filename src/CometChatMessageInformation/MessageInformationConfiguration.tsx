import { CometChatMessageInformationInterface } from "./CometChatMessageInformation";

export interface MessageInformationConfigurationInterface extends
    Omit<CometChatMessageInformationInterface,
        'title' |
        'message' |
        'template' |
        'bubbleView' |
        'receiptDatePattern' |
        'readIcon' |
        'sentIcon' |
        'deliveredIcon'
    > {}