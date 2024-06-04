import { BaseInputElement, OptionElement } from "./index";

import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents a dropdown input element.
 */
export class DropdownElement extends BaseInputElement<string> {
    /**
     * The label of the input element.
     */
    private label: string;

    /**
     * The default value to be selected in the dropdown.
     */
    private defaultValue?: string;

    /**
     * The options available for the dropdown input element.
     */
    private options: OptionElement[];

    /**
     * Creates a new instance of DropdownInput.
     * @param elementId - The ID of the input element.
     * @param label - The label of the input element.
     * @param options - The options available for the dropdown input element.
     */
    constructor(elementId: string, label: string, options: OptionElement[] = []) {
        super(elementId, ElementType.dropdown);
        this.label = label || "";
        this.options = options.map((option) => {
            if (option instanceof OptionElement) {
                return option;
            } else {
                return OptionElement.fromJSON(option);
            }
        });
    }

    /**
     * Gets the label of the input element.
     * @returns The label of the input element.
     */
    getLabel(): string {
        return this.label;
    }

    /**
     * Gets the default value to be selected in the dropdown.
     * @returns The default value to be selected in the dropdown.
     */
    getDefaultValue(): string | undefined {
        return this.defaultValue;
    }

    /**
     * Sets the default value to be selected in the dropdown.
     * @param defaultValue - The default value to be selected in the dropdown.
     */
    setDefaultValue(defaultValue: string): void {
        this.defaultValue = defaultValue;
    }

    /**
     * Gets the options available for the dropdown input element.
     * @returns The options available for the dropdown input element.
     */
    getOptions(): OptionElement[] {
        return this.options;
    }

    static fromJSON(json: any): DropdownElement {
        const options = (json?.options as [] || []).map((option: any) => {
            return OptionElement.fromJSON(option);
        });
        const dropdownElement = new DropdownElement(json.elementId, json.label, options);
        if (json.defaultValue)
            dropdownElement.setDefaultValue(json.defaultValue);
        return dropdownElement;
    }
}
