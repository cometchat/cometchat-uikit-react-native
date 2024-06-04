import { BaseInputElement, OptionElement } from "./index";

import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents a checkbox input element.
 */
export class CheckboxElement extends BaseInputElement<string[]> {
    /** The label of the input element. */
    private label: string;
    /** The default values to be selected in the checkbox. */
    private defaultValue?: string[];
    /** The options available for the checkbox input element. */
    private options: OptionElement[];

    /**
     * Creates a new instance of the CheckboxInput class.
     * @param elementId The ID of the input element.
     * @param label The label of the input element.
     * @param options The options available for the checkbox input element.
     */
    constructor(elementId: string, label: string, options: OptionElement[] = []) {
        super(elementId, ElementType.checkbox);
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
     * Sets the default values to be selected in the checkbox.
     * @param defaultValue The default values to be selected in the checkbox.
     */
    setDefaultValue(defaultValue: string[]): void {
        this.defaultValue = defaultValue;
    }

    /**
     * Gets the default values to be selected in the checkbox.
     * @returns The default values to be selected in the checkbox.
     * */
    getDefaultValue(): string[] | undefined {
        return this.defaultValue;
    }

    /**
     * Gets the options available for the checkbox input element.
     * @returns The options available for the checkbox input element.
     */
    getOptions(): OptionElement[] {
        return this.options;
    }

    static fromJSON(json: any): CheckboxElement {
        const options = (json?.options as [] || []).map((option: any) => {
            return OptionElement.fromJSON(option);
        });
        const checkboxElement = new CheckboxElement(json.elementId, json.label, options);
        if (json.defaultValue)
            checkboxElement.setDefaultValue(json.defaultValue);
        return checkboxElement;
    }
}
