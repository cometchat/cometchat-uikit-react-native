import { APIAction, CustomAction, URLNavigationAction } from "../InteractiveActions";

import { ActionEntity } from "../InteractiveEntities/ActionEntity";
import { BaseInteractiveElement } from "./index";
import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents a button element that can be added to a interactive bubble.
 */
export class ButtonElement extends BaseInteractiveElement {
    /**
     * The text to display on the button.
     */
    private buttonText: string;
    /**
     * Whether the button should be disabled after it is interacted with.
     * */
    private disableAfterInteracted?: boolean = true;
    /**
     * Creates an instance of ButtonInput.
     * @param elementId - The unique identifier for the button element.
     * @param action - The action to be performed when the button is clicked.
     * @param buttonText - The text to display on the button.
     */
    constructor(elementId: string, action: APIAction | URLNavigationAction | CustomAction, buttonText: string) {
        super(elementId, ElementType.button, action);
        this.buttonText = buttonText || "";
    }

    /**
     * Gets the text to display on the button.
     * @returns The text to display on the button.
     */
    getButtonText(): string {
        return this.buttonText;
    }

    /**
     * Gets whether the button should be disabled after it is interacted with.
     * @returns Whether the button should be disabled after it is interacted with.
     */
    getDisableAfterInteracted(): boolean | undefined {
        return this.disableAfterInteracted;
    }

    /**
     * Sets whether the button should be disabled after it is interacted with.
     * @param disableAfterInteracted - Whether the button should be disabled after it is interacted with.
     */
    setDisableAfterInteracted(disableAfterInteracted: boolean): void {
        this.disableAfterInteracted = disableAfterInteracted;
    }

    static fromJSON(json: any): ButtonElement {
        const action = ActionEntity.fromJSON(json.action);
        const buttonElement = new ButtonElement(json.elementId, action, json.buttonText);
        if (json.disableAfterInteracted)
            buttonElement.setDisableAfterInteracted(json.disableAfterInteracted);
        return buttonElement;
    }
}
