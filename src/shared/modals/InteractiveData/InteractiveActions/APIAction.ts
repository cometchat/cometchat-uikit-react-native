import { ButtonAction, HTTPSRequestMethods } from "../../../constants/UIKitConstants";

import { ActionEntity } from "../InteractiveEntities/ActionEntity";

/**
 * Represents an API action that can be performed on a dynamic form.
 */

export class APIAction extends ActionEntity {
    /**
     * The URL to which the API action should be performed.
     */
    private url: string;
    /**
     * The HTTP method to be used for the API action.
     */
    private method: string;
    /**
     * The payload to be sent with the API action.
     */
    private payload?: Object;
    /**
     * The headers to be sent with the API action.
     */
    private headers?: Object;
    /**
     * The key to be used to insert the data in the provided payload.
     */
    private dataKey?: string = "CometChatData";

    /**
     * Creates a new instance of the APIAction class.
     * @param {string} url - The URL to which the API action should be performed.
     * @param {string} method - The HTTP method to be used for the API action.
     */
    constructor(url: string, method: string) {
        super(ButtonAction.apiAction);
        this.url = url || "https://example.com";
        this.method = method || HTTPSRequestMethods.POST;
    }

    /**
     * Returns the URL to which the API action should be performed.
     * @returns {string} The URL to which the API action should be performed.
     */
    getURL(): string {
        return this.url;
    }

    /**
     * Returns the HTTP method to be used for the API action.
     * @returns {string} The HTTP method to be used for the API action.
     */
    getMethod(): string {
        return this.method;
    }

    /**
     * Returns the payload to be sent with the API action.
     * @returns {Object} The payload to be sent with the API action.
     */
    getPayload(): Object | undefined {
        return this.payload;
    }

    /**
     * Sets the payload to be sent with the API action.
     * @param {Object} payload - The payload to be sent with the API action.
     */
    setPayload(payload: Object): void {
        this.payload = payload;
    }

    /**
     * Returns the headers to be sent with the API action.
     * @returns {Object} The headers to be sent with the API action.
     */
    getHeaders(): Object | undefined {
        return this.headers;
    }

    /**
     * Sets the headers to be sent with the API action.
     * @param {Object} headers - The headers to be sent with the API action.
     */
    setHeaders(headers: Object): void {
        this.headers = headers;
    }

    /**
     * Returns the key to be used to insert the data in the provided payload.
     * @returns {string} The key to be used to insert the data in the provided payload.
     */
    getDataKey(): string | undefined {
        return this.dataKey;
    }

    /**
     * Sets the key to be used to insert the data in the provided payload.
     * @param {string} dataKey - The key to be used to insert the data in the provided payload.
     */
    setDataKey(dataKey: string): void {
        this.dataKey = dataKey;
    }

    static fromJSON(json: any): APIAction {
        const apiAction = new APIAction(json.url, json.method);

        if (json.payload)
            apiAction.setPayload(json.payload);
        if (json.headers)
            apiAction.setHeaders(json.headers);
        if (json.dataKey)
            apiAction.setDataKey(json.dataKey);

        return apiAction;
    }
}
