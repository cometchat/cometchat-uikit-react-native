import { BaseStyle, BorderStyle, FontStyle } from "../../base";

export interface FileBubbleStyleInterface extends BaseStyle {
    /**
     * tint for icon
     */
    iconTint?: string,
    /**
     * font style for title
     */
    titleFont?: FontStyle,
    /**
     * color for title
     */
    titleColor?: string,
    /**
     * font style for subtitle
     */
    subtitleFont?: FontStyle,
    /**
     * color for subtitle
     */
    subtitleColor?: string,
}

export class FileBubbleStyle extends BaseStyle {
    iconTint: string
    subtitleColor: string
    subtitleFont: FontStyle
    titleColor: string
    titleFont: FontStyle

    constructor({
        height = "auto",
        width = "auto",
        backgroundColor = "rgba(20, 20, 20, 0.04)",
        border = new BorderStyle({}),
        borderRadius = 8,
        iconTint = "rgb(51, 153, 255)",
        subtitleColor = "rgba(20, 20, 20, 0.58)",
        subtitleFont = new FontStyle({}),
        titleColor,
        titleFont = new FontStyle({fontSize: 17, fontWeight:"500"}),
    }: FileBubbleStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        });
        this.iconTint = iconTint;
        this.subtitleColor = subtitleColor;
        this.subtitleFont = subtitleFont;
        this.titleColor = titleColor;
        this.titleFont = titleFont;
    }
}