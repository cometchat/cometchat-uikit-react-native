import { MessageTypeConstants } from "../constants/UIKitConstants";
import { CardMessage, CustomInteractiveMessage, FormMessage } from "../modals/InteractiveData";

export class InteractiveMessageUtils {

    static convertInteractiveMessage(item: any): any {
        if (item.getDeletedBy() != null) {
            return item;
        }
        switch (item.getType()) {
            case MessageTypeConstants.form:
                return FormMessage.fromJSON(item);
            case MessageTypeConstants.card:
                return CardMessage.fromJSON(item);
            default:
                return CustomInteractiveMessage.fromJSON(item);
        }
    }

}