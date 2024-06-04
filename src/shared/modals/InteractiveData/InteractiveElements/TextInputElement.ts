import { BaseInputElement } from "./index";
import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents a text input element.
 */

export class TextInputElement extends BaseInputElement<string> {
    /** The label of the input element. */
    private label: string;
    /** The maximum number of lines for a multi-line text input element. */
    private maxLines?: number = 1;
    /** The placeholder text to display in the input element. */
    private placeholder?= {
        text: "Enter text here..."
    };
    /**
     * The default value in text input.
     */
        private defaultValue?: string;

    /**
     * Creates a new instance of the TextInputElement class.
     * @param {string} elementId - The unique identifier of the form element.
     * @param {string} label - The label of the input element.
     */
    constructor(elementId: string, label: string) {
        super(elementId, ElementType.text);
        this.label = label || "";
    }

    /**
     * Returns the label of the input element.
     * @returns {string} The label of the input element.
     */
    getLabel(): string {
        return this.label;
    }

    /**
     * Returns the maximum number of lines for a multi-line text input element.
     * @returns {number} The maximum number of lines for a multi-line text input element.
     */
    getMaxLines(): number | undefined {
        return this.maxLines;
    }

    /**
     * Sets the maximum number of lines for a multi-line text input element.
     * @param {number} maxLines - The maximum number of lines for a multi-line text input element.
     */
    setMaxLines(maxLines: number): void {
        this.maxLines = maxLines;
    }

    /**
     * Returns the placeholder text to display in the input element.
     * @returns {string} The placeholder text to display in the input element.
     */
    getPlaceholder(): string | undefined {
        return this?.placeholder?.text;
    }

    /**
     * Sets the placeholder text to display in the input element.
     * @param {string} placeholder - The placeholder text to display in the input element.
     */
    setPlaceholder(placeholder: string): void {
        this.placeholder = {
            text: placeholder
        };
    }

    /**
     * Returns the default value in text input.
     * @returns {string} The default value in text input.
     */
    getDefaultValue(): string | undefined {
        return this.defaultValue;
    }

    /**
     * Sets the default value in text input.
     * @param {string} defaultValue - The default value in text input.
     * @returns {string} The default value in text input.
     */
    setDefaultValue(defaultValue: string): void {
        this.defaultValue = defaultValue;
    }

    static fromJSON(json: any): TextInputElement {
        const textInput = new TextInputElement(json.elementId, json.label);
        if (json.maxLines)
            textInput.setMaxLines(json.maxLines);
        if (json.placeholder && json.placeholder.text)
            textInput.setPlaceholder(json.placeholder?.text);
        if (json.defaultValue)
            textInput.setDefaultValue(json.defaultValue);
        return textInput;
    }
}
