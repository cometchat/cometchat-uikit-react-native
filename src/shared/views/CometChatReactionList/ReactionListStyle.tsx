import { BaseStyle, FontStyle } from "../../base";

export interface ReactionListStyleInterface extends BaseStyle {
    subtitleColor?: string;
    subtitleFont?: FontStyle;
    tailViewFont?: FontStyle;
    activeEmojiBackgroundColor?: string;
    sliderEmojiCountFont?: FontStyle;
    sliderEmojiCountColor?: string;
    sliderEmojiFont?: FontStyle;
    errorTextColor?: string;
    errorTextFont?: FontStyle;
    loadingTint?: string;
    separatorColor?: string;
}

export class ReactionListStyle extends BaseStyle {
    subtitleColor?: string;
    subtitleFont?: FontStyle;
    tailViewFont?: FontStyle;
    activeEmojiBackgroundColor?: string;
    sliderEmojiCountFont?: FontStyle;
    sliderEmojiCountColor?: string;
    sliderEmojiFont?: FontStyle;
    errorTextColor?: string;
    errorTextFont?: FontStyle;
    loadingTint?: string;
    separatorColor?: string;

    constructor({
        height,
        width,
        backgroundColor,
        border,
        borderRadius,
        subtitleColor,
        subtitleFont,
        tailViewFont,
        activeEmojiBackgroundColor,
        sliderEmojiCountFont,
        sliderEmojiCountColor,
        sliderEmojiFont,
        errorTextColor,
        errorTextFont,
        loadingTint,
        separatorColor
    }: ReactionListStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        })
        this.subtitleColor = subtitleColor;
        this.subtitleFont = subtitleFont;
        this.tailViewFont = tailViewFont;
        this.activeEmojiBackgroundColor = activeEmojiBackgroundColor;
        this.sliderEmojiCountFont = sliderEmojiCountFont;
        this.sliderEmojiCountColor = sliderEmojiCountColor;
        this.sliderEmojiFont = sliderEmojiFont;
        this.errorTextColor = errorTextColor;
        this.errorTextFont = errorTextFont;
        this.loadingTint = loadingTint;
        this.separatorColor = separatorColor;
    }
}