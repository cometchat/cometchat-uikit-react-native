import { ActionEntity } from "../InteractiveEntities/ActionEntity";
import { ButtonAction } from "../../../constants/UIKitConstants";

/**
 * Represents a custom action entity.
 */
export class CustomAction extends ActionEntity {
    constructor() {
        super(ButtonAction.custom);
    }

    /**
     * Creates a new CustomAction object from a JSON object.
     * @returns A new CustomAction object created from the JSON object.
     */
    static fromJSON(): CustomAction {
        return new CustomAction();
    }
}
