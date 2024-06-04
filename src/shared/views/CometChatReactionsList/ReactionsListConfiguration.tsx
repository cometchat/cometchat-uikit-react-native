import { CometChatReactionsListInterface } from './CometChatReactionsList';

export interface ReactionsListConfigurationInterface extends Omit<CometChatReactionsListInterface,
    'messageObject' | 'errorStateText'
> { }

export class ReactionsListConfiguration {
    constructor(props: ReactionsListConfigurationInterface) {
        if (props)
            for (const [key, value] of Object.entries(props)) {
                this[key] = value;
            }
    }
}
