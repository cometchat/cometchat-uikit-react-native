import { BaseStyle, FontStyle } from "../../base";

export interface QuickReactionsStyleInterface extends BaseStyle {
    emojiBackgroundColor?: string;
    addReactionIconTint?: string;
    borderBottomColor?: string;
}

export class QuickReactionsStyle extends BaseStyle {
    emojiBackgroundColor?: string;
    addReactionIconTint?: string;
    borderBottomColor?: string;

    constructor({
        height,
        width,
        backgroundColor,
        border,
        borderRadius,
        emojiBackgroundColor,
        addReactionIconTint,
        borderBottomColor,
    }: QuickReactionsStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        })
        this.emojiBackgroundColor = emojiBackgroundColor;
        this.addReactionIconTint = addReactionIconTint;
        this.borderBottomColor = borderBottomColor;
    }
}