import { BaseStyle, BaseStyleInterface, BorderStyle, BorderStyleInterface, FontStyle, FontStyleInterface } from "../shared";

export interface TabItemStyleInterface extends BaseStyleInterface {
    iconTint?: string,
    activeIconTint?: string,
    titleTextFont?: FontStyleInterface,
    titleTextColor?: string,
    activeTitleTextFont?: FontStyleInterface,
    activeTitleTextColor?: string,
    activeBackgroundColor?: string,
    activeTabBorder?: BorderStyleInterface,
}

export class TabItemStyle extends BaseStyle implements TabItemStyleInterface {
    iconTint: string;
    activeIconTint: string;
    titleTextFont: FontStyleInterface;
    titleTextColor: string;
    activeTitleTextFont: FontStyleInterface;
    activeTitleTextColor: string;
    activeBackgroundColor: string;
    activeTabBorder?: BorderStyleInterface;

    constructor({
        activeTabBorder,
        activeBackgroundColor = "white",
        activeIconTint = "rgb(51, 153, 255)",
        activeTitleTextColor = "rgb(51, 153, 255)",
        activeTitleTextFont = new FontStyle({fontSize: 16, fontWeight: "500"}),
        iconTint = "rgb(20, 20, 20)",
        titleTextColor = "rgb(20, 20, 20)",
        titleTextFont = new FontStyle({fontSize: 16, fontWeight: "500"}),
        backgroundColor = "transparent",
        border = new BorderStyle({}),
        borderRadius = 0,
        height = 70,
        width = 70
    }: TabItemStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        });
        this.activeTabBorder = activeTabBorder;
        this.activeBackgroundColor = activeBackgroundColor;
        this.activeIconTint = activeIconTint;
        this.activeTitleTextColor = activeTitleTextColor;
        this.activeTitleTextFont = activeTitleTextFont;
        this.iconTint = iconTint;
        this.titleTextColor = titleTextColor;
        this.titleTextFont = titleTextFont;
    }
}