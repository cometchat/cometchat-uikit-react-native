import { BaseStyle, BaseStyleInterface, BorderStyleInterface, FontStyleInterface } from "../../shared";

export interface IncomingCallStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface,
    titleColor?: string,
    subtitleFont?: FontStyleInterface,
    subtitleColor?: string,
    onlineStatusColor?: string,
    declineButtonTextColor?: string,
    declineButtonTextFont?: FontStyleInterface,
    declineButtonBackgroundColor?: string,
    declineButtonBorder?: BorderStyleInterface,
    acceptButtonTextColor?: string,
    acceptButtontextFont?: FontStyleInterface,
    acceptButtonBackgroundColor?: string,
    acceptButtonBorder?: BorderStyleInterface,
}

export class IncomingCallStyle extends BaseStyle implements IncomingCallStyle {
    titleFont?: FontStyleInterface
    titleColor?: string
    subtitleFont?: FontStyleInterface
    subtitleColor?: string
    onlineStatusColor?: string
    declineButtonTextColor?: string
    declineButtonTextFont?: FontStyleInterface
    declineButtonBackgroundColor?: string
    declineButtonBorder?: BorderStyleInterface
    acceptButtonTextColor?: string
    acceptButtontextFont?: FontStyleInterface
    acceptButtonBackgroundColor?: string
    acceptButtonBorder?: BorderStyleInterface

    constructor({
        width,
        height,
        backgroundColor = "rgb(50, 50, 51)",
        border,
        borderRadius,
        titleFont,
        titleColor,
        subtitleFont,
        subtitleColor,
        onlineStatusColor,
        declineButtonTextColor,
        declineButtonTextFont,
        declineButtonBackgroundColor,
        declineButtonBorder,
        acceptButtonTextColor,
        acceptButtontextFont,
        acceptButtonBackgroundColor,
        acceptButtonBorder
    }: IncomingCallStyleInterface){
        super({
            height,
            backgroundColor,
            border,
            borderRadius,
            width,
        });
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.subtitleFont = subtitleFont;
        this.subtitleColor = subtitleColor;
        this.onlineStatusColor = onlineStatusColor;
        this.declineButtonTextColor = declineButtonTextColor;
        this.declineButtonTextFont = declineButtonTextFont;
        this.declineButtonBackgroundColor = declineButtonBackgroundColor;
        this.declineButtonBorder = declineButtonBorder;
        this.acceptButtonTextColor = acceptButtonTextColor;
        this.acceptButtontextFont = acceptButtontextFont;
        this.acceptButtonBackgroundColor = acceptButtonBackgroundColor;
        this.acceptButtonBorder = acceptButtonBorder;
    }
}