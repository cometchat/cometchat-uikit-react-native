import { ActionEntity } from "../InteractiveEntities/ActionEntity";
import { ButtonAction } from "../../../constants/UIKitConstants";

/**
 * Represents a URL navigation action that can be performed on a dynamic form.
 */

export class URLNavigationAction extends ActionEntity {
    /**
     * The URL to navigate to.
     */
    private url: string;

    /**
     * Creates a new instance of the URLNavigationAction class.
     * @param {string} url - The URL to navigate to.
     */
    constructor(url: string) {
        super(ButtonAction.urlNavigation);
        this.url = url || "https://example.com";
    }

    /**
     * Returns the URL to navigate to.
     * @returns {string} The URL to navigate to.
     */
    getURL(): string {
        return this.url;
    }

    static fromJSON(json: any): URLNavigationAction {
        return new URLNavigationAction(json.url);
    }
}
