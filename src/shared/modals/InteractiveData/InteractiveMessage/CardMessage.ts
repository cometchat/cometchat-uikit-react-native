import { MessageTypeConstants } from "../../../constants/UIKitConstants";
import { ButtonElement } from "../InteractiveElements/index";
import { CometChat } from "@cometchat/chat-sdk-react-native";

interface CardData {
    text: string;
    cardActions: Array<ButtonElement>;
    imageUrl?: string;
}

/**
 * Represents a card message for CometChat.
 * @extends CometChat.InteractiveMessage
 */
export class CardMessage extends CometChat.InteractiveMessage {

    /**
     * The URL of the image for the card.
     */
    private imageUrl?: string;

    /**
     * The text to display on the card.
     */
    private text: string;

    /**
     * The actions to perform when the card is interacted with.
     */
    private cardActions: Array<ButtonElement>;

    /**
     * Creates a new instance of CardMessage.
     * @param receiverId - The ID of the receiver.
     * @param receiverType - The type of the receiver.
     * @param text - The text to display on the card.
     * @param cardActions - The actions to perform when the card is interacted with.
     */
    constructor(
        receiverId: string,
        receiverType: string,
        text: string,
        cardActions: Array<ButtonElement>
    ) {
        super(receiverId, receiverType, MessageTypeConstants.card, {});
        this.text = text;
        this.cardActions = cardActions;
        this.setInteractiveData({ text, cardActions });
    }

    /**
     * Gets the URL of the image for the card.
     * @returns The URL of the image.
     */
    getImageUrl(): string | undefined {
        return this.imageUrl;
    }

    /**
     * Sets the image URL for the interactive card data.
     * @param imageUrl - The URL of the image to be set.
     */
    setImageUrl(imageUrl: string) {
        this.imageUrl = imageUrl;
        this.setInteractiveData({ imageUrl });
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
     * Sets the interactive data for the card message.
     * @param json - The partial data to set.
     */
    setInteractiveData(json: Partial<CardData>): void {
        const text = json.text || this.text;
        const cardActions = json.cardActions || this.cardActions;
        const imageUrl = json.imageUrl || this.imageUrl;
        const data: CardData = {
            text: text,
            cardActions: cardActions,
        }
        if (imageUrl) {
            data.imageUrl = imageUrl;
        }
        super.setInteractiveData(data);
        if (text) this.text = text;
        if (cardActions) this.cardActions = cardActions;
        if (imageUrl) this.imageUrl = imageUrl;
    }

    /**
     * Gets the interactive data for the card message.
     * @returns The interactive data.
     */
    getInteractiveData(): CardData {
        const data: CardData = {
            text: this.text,
            cardActions: this.cardActions,
        };
        if (this.imageUrl) {
            data.imageUrl = this.imageUrl;
        }
        return data;
    }

    /**
     * Creates a new instance of CardMessage from the provided JSON.
     * @param json - The JSON to create the instance from.
     * @returns The new instance of CardMessage.
     */
    static fromJSON(json: any): CardMessage {
        const data = json?.data?.interactiveData;
        const cardActions = (data?.cardActions as [] || []).map((action: any) => {
            return ButtonElement.fromJSON(action);
        });
        const imageUrl = data?.imageUrl;
        const cardMessage = new CardMessage(
            json.receiverId,
            json.receiverType,
            data?.text,
            cardActions
        );
        if (imageUrl) cardMessage.setImageUrl(imageUrl);
        Object.assign(cardMessage, json);
        return cardMessage;
    }

}