import { BaseStyle, BaseStyleInterface, BorderStyle } from "../../base";

export interface MessageBubbleStyleInterface extends BaseStyleInterface {
}

export class MessageBubbleStyle extends BaseStyle {
    constructor({
        backgroundColor = "rgba(20,20,20,0.4)",
        border = new BorderStyle({}),
        borderRadius = 8,
        height = "auto",
        width = "auto",
    }: MessageBubbleStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        })
    }
}