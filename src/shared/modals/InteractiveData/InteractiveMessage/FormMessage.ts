import { ButtonElement } from "../InteractiveElements/index";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { ElementEntity } from "../InteractiveEntities/ElementEntity";
import { MessageTypeConstants } from "../../../constants/UIKitConstants";

interface FormData {
    title: string;
    formFields: ElementEntity[];
    submitElement: ButtonElement;
    goalCompletionText?: string;
}

/**
 * Represents a form message that extends CometChat's InteractiveMessage class.
 * @extends CometChat.InteractiveMessage
 */
export class FormMessage extends CometChat.InteractiveMessage {
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
    private formFields: Array<ElementEntity>;
    /**
     * The submit button of the form.
     */
    private submitElement: ButtonElement;

    /**
     * Represents a form message that can be sent via CometChat.
     */
    constructor(
        receiverId: string,
        receiverType: string,
        title: string,
        formFields: ElementEntity[],
        submitElement: ButtonElement
    ) {
        super(receiverId, receiverType, MessageTypeConstants.form, {});
        this.title = title || "";
        this.formFields = formFields || [];
        this.submitElement = submitElement;
        this.setInteractiveData({ title, formFields, submitElement });
    }

    /**
     * Sets the interactive form data for the message.
     * @param {InteractiveFormData} interactiveFormData - The interactive form data to be set.
     */
    setInteractiveData(formData: Partial<FormData>): void {
        const title = formData.title || this.title;
        const formFields = formData.formFields || this.formFields;
        const submitElement = formData.submitElement || this.submitElement;
        const goalCompletionText = formData.goalCompletionText || this.goalCompletionText;
        const data: FormData = {
            title: title,
            formFields: formFields,
            submitElement: submitElement,
        };
        if (goalCompletionText) {
            data.goalCompletionText = goalCompletionText;
        }
        super.setInteractiveData(data);
        if (title) this.title = title;
        if (formFields) this.formFields = formFields;
        if (submitElement) this.submitElement = submitElement;
        if (goalCompletionText) this.goalCompletionText = goalCompletionText;

    }

    getInteractiveData(): FormData {
        const data: FormData = {
            title: this.title,
            formFields: this.formFields,
            submitElement: this.submitElement,
        };

        if (this.goalCompletionText) {
            data["goalCompletionText"] = this.goalCompletionText;
        }
        return data;
    }

    /**
     * Returns the form fields of the form.
     * @returns An array of form fields.
     */
    getFormFields(): ElementEntity[] {
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
        this.setInteractiveData({ goalCompletionText });
    }

    static fromJSON(json: any): FormMessage {
        const data = json?.data?.interactiveData;
        const formFields = ((data?.formFields as []) || []).map((field: any) => {
            return ElementEntity.fromJSON(field);
        });
        const submitElement = ButtonElement.fromJSON(data.submitElement);
        const goalCompletionText = data?.goalCompletionText;

        const formMessage = new FormMessage(
            json.receiver,
            json.receiverType,
            data?.title,
            formFields,
            submitElement
        );
        if (goalCompletionText) {
            formMessage.setGoalCompletionText(goalCompletionText);
        }
        Object.assign(formMessage, json);
        return formMessage;
    }
}
