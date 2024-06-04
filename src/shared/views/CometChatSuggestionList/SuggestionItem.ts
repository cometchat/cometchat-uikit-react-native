
export class SuggestionItem {
    /**
     * Unique identifier of item
     */
    id: string;
    /**
     * Name to be displayed in the list
     */
    name: string;
    /**
     * Avatar Icon Url
     */
    leadingIconUrl?: string;
    /**
     * Hide leading icon
     * @default true
    */
    hideLeadingIcon?: boolean = true;
    /**
     * Presence Indicator
     */
    status?: 'online' | 'offline';
    /**
     * Name to be displayed in the composer
     */
    promptText: string;
    /**
     * underlying text
     * @example <@uid:superhero1>
     */
    underlyingText: string;
    /**
     * set a tracking character.
     * @description string length has be 1.
     * @example '@' | '#' etc.
    */
    trackingCharacter: string
    /**
     * extra data to be passed in JSON format
     */
    data?: JSON;

    constructor(props: SuggestionItem) {
        Object.assign(this, props);
    }

}