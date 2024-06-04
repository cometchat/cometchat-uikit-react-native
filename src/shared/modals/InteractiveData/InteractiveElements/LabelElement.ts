import { ElementEntity } from "../InteractiveEntities/ElementEntity";
import { ElementType } from "../../../constants/UIKitConstants";

/**
 * Represents a label element.
 */
export class LabelElement extends ElementEntity {
    /** The text to display in the label. */
    private text: string;

    /**
     * Creates a new instance of the LabelElement class.
     * @param {string} elementId - The unique identifier of the form element.
     * @param {string} text - The text to display in the label.
     */
    constructor(elementId: string, text: string) {
        super(elementId, ElementType.label);
        this.text = text || "";
    }

    /**
     * Returns the text to display in the label.
     * @returns {string} The text to display in the label.
     */
    getText(): string {
        return this.text;
    }

    static fromJSON(json: any): LabelElement {
        return new LabelElement(json.elementId, json.text);
    }
}
