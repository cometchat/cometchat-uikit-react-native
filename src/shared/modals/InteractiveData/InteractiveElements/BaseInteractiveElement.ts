import { APIAction, CustomAction, URLNavigationAction } from "../InteractiveActions";
import { ActionEntity, ElementEntity } from "../InteractiveEntities";

import { ButtonElement } from "./index";
import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents a base interactive element in a interactive message.
 */
export class BaseInteractiveElement extends ElementEntity {
    /**
     * Represents an action that can be performed on the message.
     */
    private action: APIAction | URLNavigationAction | CustomAction;

    constructor(elementId: string, elementType: string, action: APIAction | URLNavigationAction | CustomAction) {
        super(elementId, elementType);
        if (action instanceof APIAction || action instanceof URLNavigationAction || action instanceof CustomAction) {
            this.action = action;
        } else {
            this.action = ActionEntity.fromJSON(action);
        }
    }
    /**
     * Returns the action associated with the bubble.
     * @returns {APIAction | URLNavigationAction | CustomAction} The action associated with the bubble.
     */
    getAction(): APIAction | URLNavigationAction | CustomAction {
        return this.action;
    }

    static fromJSON(json: any): BaseInteractiveElement {
        switch (json.elementType) {
            case ElementType.button:
                return ButtonElement.fromJSON(json);
            default:
                return ButtonElement.fromJSON({
                    elementId: "1",
                    elementType: ElementType.button,
                    buttonText: "Button",
                    action: new CustomAction()
                });
        }
    }
}
