import { BaseStyle, BorderStyleInterface, FontStyle } from "../../base";

export interface ReactionsStyleInterface extends BaseStyle {
    emojiFont?: FontStyle;
    countColor?: string;
    countFont?: FontStyle;
    primaryBackgroundColor?: string;
    primaryBorder?: BorderStyleInterface;
}

export class ReactionsStyle extends BaseStyle {
    emojiFont?: FontStyle;
    countColor?: string;
    countFont?: FontStyle;
    primaryBackgroundColor?: string;
    primaryBorder?: BorderStyleInterface;

    constructor({
        height,
        width,
        backgroundColor,
        border,
        borderRadius,
        emojiFont,
        countColor,
        countFont,
        primaryBackgroundColor,
        primaryBorder,
    }: ReactionsStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        })
        this.emojiFont = emojiFont;
        this.countColor = countColor;
        this.countFont = countFont;
        this.primaryBackgroundColor = primaryBackgroundColor;
        this.primaryBorder = primaryBorder;
    }
}