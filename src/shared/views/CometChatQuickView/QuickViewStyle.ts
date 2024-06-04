import { BaseStyle, BorderStyle, FontStyle } from "../../base";

export interface QuickViewStyleInterface extends BaseStyle {
    background?: string;
    titleFont?: FontStyle;
    titleColor?: string;
    subtitlFont?: FontStyle;
    subtitleColor?: string;
    closeIconTint?: string;
    leadingBarTint?: string;
    leadingBarWidth?: number;

}

export class QuickViewStyle extends BaseStyle {
    background?: string;
    titleFont?: FontStyle;
    titleColor?: string;
    subtitlFont?: FontStyle;
    subtitleColor?: string;
    closeIconTint?: string;
    leadingBarTint?: string;
    leadingBarWidth?: number;


    constructor({
        height = "auto",
        width = "auto",
        backgroundColor = "rgba(20, 20, 20, 0.04)",
        border = new BorderStyle({}),
        borderRadius = 8,
        titleFont = new FontStyle({}),
        titleColor = "#000",
        subtitlFont = new FontStyle({}),
        subtitleColor = "#000",
        closeIconTint = "#000",
        leadingBarTint = "#000",
        leadingBarWidth = 0,
    }: QuickViewStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        });
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.subtitlFont = subtitlFont;
        this.subtitleColor = subtitleColor;
        this.closeIconTint = closeIconTint;
        this.leadingBarTint = leadingBarTint;
        this.leadingBarWidth = leadingBarWidth;
    }
}