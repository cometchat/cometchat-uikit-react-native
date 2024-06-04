import { BaseStyle, BaseStyleInterface, FontStyle, FontStyleInterface } from "../../shared/base"

export interface CallBubbleStyleInterface extends BaseStyleInterface{
    titleColor?: string,
    titleFont?: FontStyleInterface,
    iconTint?: string,
    buttonBackgroundColor?: string,
    buttonTextColor?: string,
    buttonTextFont?: FontStyleInterface,
}

export class CallBubbleStyle extends BaseStyle implements CallBubbleStyleInterface {
    titleColor?: string
    titleFont?: FontStyleInterface
    iconTint?: string
    buttonBackgroundColor?: string
    buttonTextColor?: string
    buttonTextFont?: FontStyleInterface

    constructor ({
        backgroundColor,
        border,
        borderRadius,
        buttonBackgroundColor,
        buttonTextColor,
        buttonTextFont,
        iconTint,
        titleColor,
        titleFont = {fontSize: 18},
        height,
        width
    }: CallBubbleStyleInterface) {
        super({
            height,
            width,
            backgroundColor,
            border,
            borderRadius
        });
        this.buttonBackgroundColor = buttonBackgroundColor;
        this.buttonTextColor = buttonTextColor;
        this.buttonTextFont = buttonTextFont;
        this.iconTint = iconTint;
        this.titleColor = titleColor;
        this.titleFont = titleFont;
    }
}