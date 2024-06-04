import { BaseStyle, BaseStyleInterface, FontStyleInterface } from "../../shared";

export interface CallDetailsStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface,
    titleColor?: string,
    backIconTint?: string,
    closeIconTint?: string,
    onlineStatusColor?: string,
    privateGroupIconBackground?: string,
    protectedGroupIconBackground?: string,
}

export class CallDetailsStyle extends BaseStyle {
    titleFont?: FontStyleInterface
    titleColor?: string
    backIconTint?: string
    closeIconTint?: string
    onlineStatusColor?: string
    privateGroupIconBackground?: string
    protectedGroupIconBackground?: string

    constructor({
        titleFont,
        titleColor,
        backIconTint,
        closeIconTint,
        onlineStatusColor,
        privateGroupIconBackground,
        protectedGroupIconBackground,
        backgroundColor,
        border,
        borderRadius,
        height,
        width,
    }: CallDetailsStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width,
        });
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.backIconTint = backIconTint;
        this.closeIconTint = closeIconTint;
        this.onlineStatusColor = onlineStatusColor;
        this.privateGroupIconBackground = privateGroupIconBackground;
        this.protectedGroupIconBackground = protectedGroupIconBackground;

    }
}