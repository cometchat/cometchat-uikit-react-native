import { APIAction, CustomAction, URLNavigationAction } from "../InteractiveActions";

import { ButtonAction } from "../../../constants/UIKitConstants";

/**
 * Represents an action that can be performed on a UI element, such as a button.
 */

export class ActionEntity {
    /**
     * The type of action to perform when the UI element is interacted with.
     */
    private actionType: ButtonAction;

    /**
     * Creates an instance of the ActionEntity class.
     * @param {ButtonAction} actionType - The type of action that the button performs.
     */
    constructor(actionType: ButtonAction) {
        this.actionType = actionType;
    }

    /**
     * Returns the type of action to perform when the UI element is interacted with.
     * @returns {ButtonAction} The type of action to perform when the UI element is interacted with.
     */
    getActionType(): ButtonAction {
        return this.actionType;
    }

    static fromJSON(json: any): APIAction | URLNavigationAction | CustomAction {
        switch (json.actionType) {
            case ButtonAction.apiAction:
                return APIAction.fromJSON(json);
            case ButtonAction.urlNavigation:
                return URLNavigationAction.fromJSON(json);
            default:
                return CustomAction.fromJSON();
        }
    }
}
