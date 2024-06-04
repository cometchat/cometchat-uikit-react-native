import { BaseInputElement, BaseInteractiveElement, LabelElement } from "../InteractiveElements";

import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents the base input for a dynamic form element.
 */

export class ElementEntity {
    /**
     * The type of the form element.
     */
    private elementType: string;
    /**
     * The unique identifier of the form element.
     */
    private elementId: string;

    constructor(elementId: string, elementType: string) {
        this.elementId = elementId || "";
        this.elementType = elementType || "";
    }

    /**
     * Returns the type of the form element.
     * @returns {string} The type of the form element.
     */
    getElementType(): string {
        return this.elementType;
    }

    /**
     * Returns the unique identifier of the form element.
     * @returns {string} The unique identifier of the form element.
     */
    getElementId(): string {
        return this.elementId;
    }

    static fromJSON(json: any): ElementEntity {
        switch (json.elementType) {
            case ElementType.text:
                return BaseInputElement.fromJSON(json);
            case ElementType.checkbox:
                return BaseInputElement.fromJSON(json);
            case ElementType.dropdown:
                return BaseInputElement.fromJSON(json);
            case ElementType.radio:
                return BaseInputElement.fromJSON(json);
            case ElementType.singleSelect:
                return BaseInputElement.fromJSON(json);
            case ElementType.button:
                return BaseInteractiveElement.fromJSON(json);
            case ElementType.label:
                return LabelElement.fromJSON(json);
            default:
                return LabelElement.fromJSON({
                    elementId: "1",
                    elementType: ElementType.label,
                    text: "unknown element type",
                });
        }
    }
}
