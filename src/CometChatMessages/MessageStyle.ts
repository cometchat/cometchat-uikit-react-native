import { BaseStyleInterface, BorderStyleInterface, FontStyle, FontStyleInterface } from "../shared";

export interface MessageStyleInterface extends BaseStyleInterface {
    messageTextColor?: string,
    messageTextFont?: FontStyleInterface,
}

export class MessageStyle implements MessageStyleInterface {
    messageTextColor?: string;
    messageTextFont?: FontStyleInterface;
    height?: string | number;
    width?: string | number;
    backgroundColor?: string;
    border?: BorderStyleInterface;
    borderRadius?: number;

    constructor({
        messageTextColor,
        messageTextFont,
        backgroundColor,
        border,
        borderRadius,
        height,
        width,
    }: MessageStyleInterface) {
        this.messageTextColor = messageTextColor;
        this.messageTextFont = messageTextFont;
        this.backgroundColor = backgroundColor;
        this.border = border;
        this.borderRadius = borderRadius;
        this.height = height;
        this.width = width;
    }
}