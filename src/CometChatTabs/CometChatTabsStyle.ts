import { BaseStyle, BaseStyleInterface, BorderStyleInterface, FontStyleInterface } from "../shared";

export interface CometChatTabsStyleInterface extends BaseStyleInterface {
    tabTitleTextFont?: FontStyleInterface,
    tabTitleTextColor?: string,
    activeTabTitleTextColor?: string,
    activeTabBackgroundColor?: string,
    activeTabBorder?: BorderStyleInterface,
}

export class CometChatTabsStyle extends BaseStyle implements CometChatTabsStyleInterface {
    tabTitleTextFont?: FontStyleInterface
    tabTitleTextColor?: string
    activeTabTitleTextColor?: string
    activeTabBackgroundColor?: string
    activeTabBorder?: BorderStyleInterface

    constructor({
        backgroundColor,
        border,
        borderRadius = 0,
        height = 60,
        width = "100%",
        tabTitleTextFont,
        tabTitleTextColor,
        activeTabTitleTextColor,
        activeTabBackgroundColor,
        activeTabBorder,
    }: CometChatTabsStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        });
        this.tabTitleTextFont = tabTitleTextFont;
        this.tabTitleTextColor = tabTitleTextColor;
        this.activeTabTitleTextColor = activeTabTitleTextColor;
        this.activeTabBackgroundColor = activeTabBackgroundColor;
        this.activeTabBorder = activeTabBorder;
    }
}