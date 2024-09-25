import { MessageTypeConstants, goalType } from "../constants/UIKitConstants";
import { CardMessage, CustomInteractiveMessage, FormMessage, SchedulerMessage } from "../modals/InteractiveData";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
export class InteractiveMessageUtils {

    static convertInteractiveMessage(item: any): any {
        if (item.getDeletedBy() != null) {
            return item;
        }
        switch (item.getType()) {
            case MessageTypeConstants.form:
                return FormMessage.fromJSON(item);
            case MessageTypeConstants.scheduler:
                return SchedulerMessage.fromJSON(item);
            case MessageTypeConstants.card:
                return CardMessage.fromJSON(item);
            default:
                return CustomInteractiveMessage.fromJSON(item);
        }
    }

    static checkHasInteractionCompleted = ({ interactionGoal, interactedElements } : { interactionGoal: CometChat.InteractionGoal, interactedElements: CometChat.Interaction[]}) => {
        let completed = false;
        let neededInteractionElement = interactionGoal?.getElementIds() || [];
        let neededInteractionElementCondition: string = interactionGoal?.getType() || "";
        let _interactedElements = [...(interactedElements ?? [])];

        switch (neededInteractionElementCondition) {
            case goalType.anyOf.toString():
                completed = _interactedElements.find((element: CometChat.Interaction) =>
                    neededInteractionElement.includes(element.getElementId())
                )
                    ? true
                    : false;
                break;
            case goalType.anyAction.toString():
                completed = _interactedElements.length > 0 ? true : false;
                break;
            case goalType.allOf.toString():
                completed = neededInteractionElement.every((element: any) =>
                    _interactedElements.find(
                        (interaction: CometChat.Interaction) =>
                            interaction.getElementId() === element
                    )
                )
                    ? true
                    : false;
                break;
            case goalType.none.toString():
                completed = false;
                break;
            default:
                completed = false;
                break;
        }
        return completed;
    };

}