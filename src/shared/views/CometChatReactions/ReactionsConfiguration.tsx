import { CometChatReactionsInterface } from './CometChatReactions';

export interface ReactionsConfigurationInterface extends Omit<CometChatReactionsInterface, 'messageObject' | 'alignment'> { }

export class ReactionsConfiguration {
    constructor(props: ReactionsConfigurationInterface) {
        if (props)
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
    }
}
