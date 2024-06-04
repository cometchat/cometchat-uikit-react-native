import { BaseStyle, BaseStyleInterface, BorderStyleInterface, FontStyleInterface } from "../../base";

export interface ButtonStyleInterface extends BaseStyleInterface {
    iconTint?: string,
    textFont?: FontStyleInterface,
    textColor?: string,
    iconBackgroundColor?: string,
    iconCornerRadius?: number,
    iconBorder?: BorderStyleInterface,
}

export class ButtonStyle extends BaseStyle implements ButtonStyleInterface {
    iconTint?: string
    textFont?: FontStyleInterface
    textColor?: string
    iconBackgroundColor?: string
    iconCornerRadius?: number
    iconBorder?: BorderStyleInterface

    constructor({
        height,
        width,
        backgroundColor,
        border,
        borderRadius,
        iconTint,
        textFont,
        textColor,
        iconBackgroundColor,
        iconCornerRadius,
        iconBorder,
    }: ButtonStyleInterface){
        super({
            height,
            width,
            backgroundColor,
            border,
            borderRadius,
        });
        this.iconTint = iconTint;
        this.textFont = textFont;
        this.textColor = textColor;
        this.iconBackgroundColor = iconBackgroundColor;
        this.iconCornerRadius = iconCornerRadius;
        this.iconBorder = iconBorder;
    }
}