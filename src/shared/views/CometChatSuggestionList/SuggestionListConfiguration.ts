import { AvatarStyleInterface } from "../CometChatAvatar";
import { ListItemStyle } from "../CometChatListItem";
import { CometChatSuggestionListInterface } from "./CometChatSuggestionList";
import { SuggestionItem } from "./SuggestionItem";

export interface SuggestionListConfigurationInterface extends CometChatSuggestionListInterface { }

export class SuggestionListConfiguration {
    separatorColor: string
    /**
     * Array of selection items
     */
    data: Array<SuggestionItem>;
    listItemStyle?: ListItemStyle
    avatarStyle?: AvatarStyleInterface
    onPress: (item: SuggestionItem) => void
    onEndReached?: () => void
    loading?: boolean

    constructor(props: SuggestionListConfigurationInterface) {
        Object.assign(this, props);
    }
}