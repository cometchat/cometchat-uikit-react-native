import { AIBaseConfiguration } from "../AIBaseConfiguration";
import { AIConversationSummaryStyle } from "./AIConversationSummaryStyle";
import { closeIcon } from "./resources";

export class AIConversationSummaryConfiguration extends AIBaseConfiguration {
    customView?: (response: string, onClose: Function) => Promise<any>;
    conversationSummaryStyle?: AIConversationSummaryStyle;
    unreadMessageThreshold?: number = 30;
    closeIconURL?: string = closeIcon;
    constructor(props: Partial<AIConversationSummaryConfiguration>) {
        super({});
        Object.assign(this, props);
    }
}
