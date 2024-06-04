import { BaseStyle, FontStyle } from "../shared";

export interface AIBaseStyleInterface extends BaseStyle {
    emptyStateTextFont?: FontStyle;
    emptyStateTextColor?: string;
    loadingStateTextFont?: FontStyle;
    loadingStateTextColor?: string;
    errorStateTextFont?: FontStyle;
    errorStateTextColor?: string;
    loadingIconTint?: string;
    emptyIconTint?: string;
    errorIconTint?: string;
}

export class AIBaseStyle extends BaseStyle {
    emptyStateTextFont?: FontStyle;
    emptyStateTextColor?: string;
    loadingStateTextFont?: FontStyle;
    loadingStateTextColor?: string;
    errorStateTextFont?: FontStyle;
    errorStateTextColor?: string;
    loadingIconTint?: string;
    emptyIconTint?: string;
    errorIconTint?: string;
    constructor({
        emptyIconTint,
        emptyStateTextColor,
        emptyStateTextFont,
        errorIconTint,
        errorStateTextColor,
        errorStateTextFont,
        loadingIconTint,
        loadingStateTextColor,
        loadingStateTextFont,
        backgroundColor,
        border,
        borderRadius,
        height,
        width
    }: AIBaseStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        })
        this.emptyIconTint = emptyIconTint;
        this.emptyStateTextColor = emptyStateTextColor;
        this.emptyStateTextFont = emptyStateTextFont;
        this.errorIconTint = errorIconTint;
        this.errorStateTextColor = errorStateTextColor;
        this.errorStateTextFont = errorStateTextFont;
        this.loadingIconTint = loadingIconTint;
        this.loadingStateTextColor = loadingStateTextColor;
        this.loadingStateTextFont = loadingStateTextFont;
    }
}
