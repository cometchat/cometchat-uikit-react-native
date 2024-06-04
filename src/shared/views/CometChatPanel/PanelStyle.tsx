import { BaseStyle, FontStyle } from "../../base";

export interface PanelStyleInterface extends BaseStyle {
    titleFont?: FontStyle,
    titleColor?: string,
    closeIconTint?: string,
    textFont?: FontStyle,
    textColor?: string
}

export class PanelStyle extends BaseStyle {
    titleFont?: FontStyle;
    titleColor?: string;
    closeIconTint?: string;
    textFont?: FontStyle;
    textColor?: string;

    constructor({
        height,
        width,
        backgroundColor,
        border,
        borderRadius,
        closeIconTint,
        titleFont,
        titleColor,
        textColor,
        textFont
    }: PanelStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        })
        this.closeIconTint = closeIconTint;
        this.titleColor = titleColor;
        this.titleFont = titleFont;
        this.textColor = textColor;
        this.textFont = textFont;
    }
}