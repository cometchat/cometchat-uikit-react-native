import { BaseStyle, BaseStyleInterface, BorderStyle } from "../../base";

export interface MessageBubbleStyleInterface extends BaseStyleInterface {
    alignSelf?: string | null;
}

export class MessageBubbleStyle extends BaseStyle {
    alignSelf?: string | null;
    constructor({
        backgroundColor = "rgba(20,20,20,0.4)",
        border = new BorderStyle({}),
        borderRadius = 8,
        height = "auto",
        width = "auto",
        alignSelf = null
    }: MessageBubbleStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        })
        this.alignSelf = alignSelf;
    }
}