import { BaseStyle, BaseStyleInterface, FontStyleInterface } from "../../shared/base";

export interface OutgoingCallStyleInterface extends BaseStyleInterface {
    titleColor?: string,
    subtitleColor?: string,
    titleFont?: FontStyleInterface,
    subtitleFont?: FontStyleInterface,
}

export class OutgoingCallStyle extends BaseStyle implements OutgoingCallStyleInterface {
    titleColor?: string
    subtitleColor?: string
    titleFont?: FontStyleInterface
    subtitleFont?: FontStyleInterface

    constructor({
        backgroundColor,
        border,
        borderRadius,
        height,
        subtitleColor,
        subtitleFont,
        titleColor,
        titleFont,
        width
    }: OutgoingCallStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        });
        this.subtitleColor = subtitleColor;
        this.subtitleFont = subtitleFont;
        this.titleColor = titleColor;
        this.titleFont = titleFont;
    }
}