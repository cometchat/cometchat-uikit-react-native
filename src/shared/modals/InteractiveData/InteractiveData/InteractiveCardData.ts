import { ButtonElement } from "../InteractiveElements/index";

/**
 * Represents the data for an interactive card.
 */
export class InteractiveCardData {
    private imageUrl?: string;
    private text: string;
    private cardActions: Array<ButtonElement>;

    /**
     * Creates an instance of InteractiveCardData.
     * @param text The text to display on the card.
     * @param actions The actions to perform when the card is interacted with.
     */
    constructor(text: string, cardActions: Array<ButtonElement>) {
        this.text = text;
        this.cardActions = cardActions;
    }

    /**
     * Gets the Url of the image for the card.
     * @returns The Url of the image.
     */
    getImageUrl(): string {
        return this.imageUrl || "";
    }

    /**
     * Sets the image Url for the interactive card data.
     * @param imageUrl - The Url of the image to be set.
     */
    setImageUrl(imageUrl: string) {
        this.imageUrl = imageUrl;
    }

    /**
     * Gets the text to display on the card.
     * @returns The text to display.
     */
    getText(): string {
        return this.text;
    }

    /**
     * Gets the actions to perform when the card is interacted with.
     * @returns The actions to perform.
     */
    getCardActions(): Array<ButtonElement> {
        return this.cardActions;
    }

    /**
     * Creates an instance of InteractiveCardData from a JSON object.
     * @param json The JSON object to create the instance from.
     * @returns The created instance of InteractiveCardData.
     */
    static fromJSON(json: any): InteractiveCardData {
        const actions = json?.cardActions?.map((action: any) => {
            return ButtonElement.fromJSON(action);
        });
        const interactiveCardData = new InteractiveCardData(
            json.text,
            actions
        );
        if (json.imageUrl) interactiveCardData.setImageUrl(json.imageUrl);
        return interactiveCardData;
    }
}
