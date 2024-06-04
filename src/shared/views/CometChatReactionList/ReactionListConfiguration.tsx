import { CometChatReactionListInterface } from './CometChatReactionList';

export interface ReactionListConfigurationInterface extends Omit<CometChatReactionListInterface,
    'messageObject' | 'errorStateText'
> { }

export class ReactionListConfiguration {
    constructor(props: ReactionListConfigurationInterface) {
        if (props)
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
    }
}
