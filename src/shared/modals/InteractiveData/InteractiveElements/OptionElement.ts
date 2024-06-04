/**
 * Represents a option.
 */
export class OptionElement {
    /** The unique identifier for the option. */
    private label: string;
    /** The display value for the option. */
    private value: string;

    /**
     * Creates a new instance of the OptionElement class.
     * @param {string} label - The unique identifier for the option.
     * @param {string} value - The display value for the option.
     */
    constructor(label: string, value: string) {
        this.label = label || "";
        this.value = value || "";
    }

    /**
     * Returns the unique identifier for the option.
     * @returns {string} The unique identifier for the option.
     */
    getLabel(): string {
        return this.label;
    }

    /**
     * Returns the display value for the option.
     * @returns {string} The display value for the option.
     */
    getValue(): string {
        return this.value;
    }

    static fromJSON(json: any): OptionElement {
        return new OptionElement(json.label, json.value);
    }
}
