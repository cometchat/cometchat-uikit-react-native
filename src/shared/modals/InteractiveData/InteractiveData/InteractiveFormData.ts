import {
    ButtonElement,
    CheckboxElement,
    DropdownElement,
    LabelElement,
    RadioButtonElement,
    SingleSelectElement,
    TextInputElement
} from "../InteractiveElements/index"

import { ElementEntity } from "../InteractiveEntities/ElementEntity";

/**
 * Represents the data of an interactive form.
 */
export class InteractiveFormData {
    /**
     * The title of the form.
     */
    private title: string;
    /**
     * The goal completion text of the form.
     */
    private goalCompletionText?: string;
    /**
     * The form fields of the form.
     */
    private formFields: Array<
        LabelElement |
        TextInputElement |
        CheckboxElement |
        DropdownElement |
        RadioButtonElement |
        SingleSelectElement |
        ButtonElement
    >;
    /**
     * The submit button of the form.
     */
    private submitElement: ButtonElement;
    /**
     * Creates a new instance of InteractiveFormData.
     * @param title - The title of the form.
     * @param formFields - The form fields of the form.
     * @param submitElement - The submit button of the form.
     */
    constructor(title: string, formFields: Array<
        LabelElement |
        TextInputElement |
        CheckboxElement |
        DropdownElement |
        RadioButtonElement |
        SingleSelectElement |
        ButtonElement
    >, submitElement: ButtonElement) {
        this.title = title || "";
        this.formFields = formFields || [];
        this.submitElement = submitElement;
    }

    /**
     * Returns the form fields of the form.
     * @returns An array of form fields.
     */
    getFormFields(): Array<
        LabelElement |
        TextInputElement |
        CheckboxElement |
        DropdownElement |
        RadioButtonElement |
        SingleSelectElement |
        ButtonElement
    > {
        return this.formFields;
    }

    /**
     * Returns the title of the form.
     * @returns The title of the form.
     */
    getTitle(): string {
        return this.title;
    }

    /**
     * Returns the submit button of the form.
     * @returns The submit button of the form.
     */
    getSubmitElement(): ButtonElement {
        return this.submitElement;
    }

    /**
     * Returns the goal completion text of the form.
     * @returns The goal completion text of the form.
     */
    getGoalCompletionText(): string | undefined {
        return this.goalCompletionText;
    }

    /**
     * Sets the goal completion text of the form.
     * @param goalCompletionText - The goal completion text of the form.
     */
    setGoalCompletionText(goalCompletionText: string): void {
        this.goalCompletionText = goalCompletionText;
    }

    static fromJSON(json: any): InteractiveFormData {
        const formFields = (json?.formFields as [] || []).map((field: any) => {
            return ElementEntity.fromJSON(field);
        }) as any;
        const submitElement = ButtonElement.fromJSON(json.submitElement);
        const interactiveFormData = new InteractiveFormData(json.title, formFields, submitElement);
        if (json.goalCompletionText)
            interactiveFormData.setGoalCompletionText(json.goalCompletionText);
        return interactiveFormData;
    }
}
