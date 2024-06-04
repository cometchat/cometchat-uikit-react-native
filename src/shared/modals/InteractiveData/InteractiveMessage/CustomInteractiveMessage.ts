import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageTypeConstants } from "../../../constants/UIKitConstants";

/**
 * Represents a custom interactive message that extends CometChat's InteractiveMessage class.
 * @extends CometChat.InteractiveMessage
 */
export class CustomInteractiveMessage extends CometChat.InteractiveMessage {
    /**
     * Creates a new instance of CustomInteractiveMessage.
     * @param receiverId - The ID of the receiver of the message.
     * @param receiverType - The type of the receiver of the message.
     * @param json - The JSON object to create the CustomInteractiveMessage object from.
     */
    constructor(
        receiverId: string,
        receiverType: string,
        json: Object
    ) {
        super(receiverId, receiverType, MessageTypeConstants.customInteractive, json);
    }

    /**
     * Static method to create a CustomInteractiveMessage object from a JSON object.
     * @param json - JSON object to create the CustomInteractiveMessage object from.
     * @returns CustomInteractiveMessage object.
     */
    static fromJSON(json: any): CustomInteractiveMessage {
        const data = json?.data?.interactiveData;
        const customInteractiveMessage = new CustomInteractiveMessage(
            json.receiverId,
            json.receiverType,
            data
        );
        Object.assign(customInteractiveMessage, json);
        return customInteractiveMessage;
    }
}
