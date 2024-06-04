import { BaseStyle, BaseStyleInterface, FontStyleInterface } from "../../shared";

export interface CallLogDetailsStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface,
    titleColor?: string,
    closeIconTint?: string,
}

export class CallLogDetailsStyle extends BaseStyle {
    titleFont?: FontStyleInterface
    titleColor?: string
    closeIconTint?: string

    constructor({
        titleFont,
        titleColor,
        closeIconTint,
        backgroundColor,
        border,
        borderRadius,
        height,
        width,
    }: CallLogDetailsStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width,
        });
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.closeIconTint = closeIconTint;

    }
}