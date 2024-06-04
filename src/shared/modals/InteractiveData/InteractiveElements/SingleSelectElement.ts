import { BaseInputElement, OptionElement } from "./index";

import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents a singleSelect button input element.
 */

export class SingleSelectElement extends BaseInputElement<string> {
    /** The label of the input element. */
    private label: string;
    /** The default value of the input element. */
    private defaultValue?: string;
    /** The options available for the singleSelect input element. */
    private options: OptionElement[];

    /**
     * Creates a new instance of the SingleSelectElement class.
     * @param elementId The ID of the singleSelect button element.
     * @param label The label of the singleSelect button element.
     * @param options The options available for the singleSelect button element.
     */
    constructor(elementId: string, label: string, options: OptionElement[] = []) {
        super(elementId, ElementType.singleSelect);
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
     * Gets the default value of the input element.
     * @returns The default value of the input element.
     */
    getDefaultValue(): string | undefined {
        return this.defaultValue;
    }

    /**
     * Sets the default value of the input element.
     * @param defaultValue The default value of the input element.
     */
    setDefaultValue(defaultValue: string): void {
        this.defaultValue = defaultValue;
    }

    /**
     * Gets the options available for the singleSelect input element.
     * @returns The options available for the singleSelect input element.
     */
    getOptions(): OptionElement[] {
        return this.options;
    }

    static fromJSON(json: any): SingleSelectElement {
        const options = (json?.options as [] || []).map((option: any) => {
            return OptionElement.fromJSON(option);
        });
        const singleSelectElement = new SingleSelectElement(json.elementId, json.label, options);
        if (json.defaultValue)
            singleSelectElement.setDefaultValue(json.defaultValue);
        return singleSelectElement;
    }
}
