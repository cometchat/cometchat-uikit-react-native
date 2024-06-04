import { BaseStyleInterface, BorderStyleInterface, FontStyleInterface } from "../shared";

export interface ContactsStyleInterface extends BaseStyleInterface {
    /**
     * Font for title 
     */
    titleTextFont?: FontStyleInterface,
    /**
     * title text color
     */
    titleTextColor?: string,
    /**
     * tint color for back icon
     */
    backIconTint?: string,
    /**
     * width for a tab
     */
    tabWidth?: string | number,
    /**
     * height for a tab
     */
    tabHeight?: string | number,
    /**
     * border property for tab
     */
    tabBorder?: BorderStyleInterface,
    /**
     * border radius for a tab
     */
    tabBorderRadius?: number,
    /**
     * background colour for tab
     */
    tabBackgroundColor?: string,
    /**
     * font style for tab title
     */
    tabTitleTextFont?: FontStyleInterface,
    /**
     * text colour for tab title
     */
    tabTitleTextColor?: string,
    /**
     * text colout when tab is active
     */
    activeTabTitleTextColor?: string,
    /**
     * background colour when tab is active
     */
    activeTabBackgroundColor?: string,
    /**
     * border style when tab is active
     */
    activeTabBorder?: BorderStyleInterface,
    /**
     * tint colout for selection icon
     */
    selectionIconTint?: string, 
}