import { CometChatQuickReactionsInterface } from './CometChatQuickReactions';

export interface QuickReactionsConfigurationInterface extends CometChatQuickReactionsInterface { }

export class QuickReactionsConfiguration {
    constructor(props: QuickReactionsConfigurationInterface) {
        if (props)
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
    }
}
