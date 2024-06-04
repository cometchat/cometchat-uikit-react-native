import {
    CheckboxElement,
    DropdownElement,
    RadioButtonElement,
    SingleSelectElement,
    TextInputElement
} from "./index";

import { ElementEntity } from "../InteractiveEntities/ElementEntity";
import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents the base input for a dynamic form element.
 */
export class BaseInputElement<T> extends ElementEntity {
    /**
     * The response of an input.
     */
    private response?: T;
    /**
     * Whether the input element is optional or required.
     * */
    private optional?: boolean = true;

    /**
     * Creates a new instance of the BaseInputElement class.
     * @param {string} elementId - The unique identifier of the form element.
     * @param {string} elementType - The type of the form element.
     */
    constructor(elementId: string, elementType: string) {
        super(elementId, elementType);
    }

    /**
     * Sets the response of an input.
     */
    setResponse(response: T): void {
        this.response = response;
    }

    /**
     * Returns the response of an input.
     * @returns {T} The response of an input.
     */
    getResponse(): T | undefined {
        return this.response;
    }

    /**
 * Returns whether the element is optional or required.
 * @returns {boolean} Whether the element is optional or required.
 */
    getOptional(): boolean | undefined {
        return this.optional;
    }

    /**
     * Sets whether the element is optional or required.
     * @param {boolean} optional - Whether the element is optional or required.
     */
    setOptional(optional: boolean | string): void {
        let optionalValue: boolean;
        if (typeof optional === "boolean" || typeof optional === "string") {
            optionalValue = optional === "true" ? true : optional === "false" ? false : optional as boolean;
        } else {
            optionalValue = true;
        }
        this.optional = optionalValue;
    }

    static fromJSON(json: any): ElementEntity {
        switch (json.elementType) {
            case ElementType.text:
                const element = TextInputElement.fromJSON(json);
                element.setOptional(json.optional);
                return element;
            case ElementType.checkbox:
                const checkboxElement = CheckboxElement.fromJSON(json);
                checkboxElement.setOptional(json.optional);
                return checkboxElement;
            case ElementType.dropdown:
                const dropdownElement = DropdownElement.fromJSON(json);
                dropdownElement.setOptional(json.optional);
                return dropdownElement;
            case ElementType.radio:
                const radioButtonElement = RadioButtonElement.fromJSON(json);
                radioButtonElement.setOptional(json.optional);
                return radioButtonElement;
            case ElementType.singleSelect:
                const singleSelectElement = SingleSelectElement.fromJSON(json);
                singleSelectElement.setOptional(json.optional);
                return singleSelectElement;
            default:
                return TextInputElement.fromJSON({
                    elementId: "1",
                    elementType: ElementType.text,
                    label: "Label",
                });
        }
    }

}
