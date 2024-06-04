import { BaseStyle, BaseStyleInterface, BorderStyle, FontStyle } from "../../base";

export interface AudioBubbleStyleInterface extends BaseStyleInterface {
    iconTint?: string,
    titleFont?: FontStyle,
    titleColor?: string,
    subtitleFont?: FontStyle,
    subtitleColor?: string,
}

export class AudioBubbleStyle extends BaseStyle {
    iconTint: string
    titleFont: FontStyle
    titleColor: string
    subtitleFont: FontStyle
    subtitleColor: string

    constructor({
        height = "auto",
        width = "auto",
        backgroundColor = "transparent",
        border = new BorderStyle({}),
        borderRadius = 8,
        iconTint = "rgb(51, 153, 255)",
        titleFont = new FontStyle({fontSize: 15, fontWeight: "700"}),
        titleColor = "rgba(20,20,20,0.78)",
        subtitleFont = new FontStyle({fontSize: 13, fontWeight: "400"}),
        subtitleColor = "rgba(20,20,20,0.58)",
    }: AudioBubbleStyleInterface) {
        super({
            height,
            width,
            backgroundColor,
            border,
            borderRadius
        });
        this.iconTint = iconTint;
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.subtitleFont = subtitleFont;
        this.subtitleColor = subtitleColor;
    }
}