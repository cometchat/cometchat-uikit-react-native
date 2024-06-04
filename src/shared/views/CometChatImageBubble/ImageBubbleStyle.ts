import { BaseStyle, BaseStyleInterface } from "../../base";

export interface ImageBubbleStyleInterface extends Omit<BaseStyleInterface, "border"> {
    border?: {borderWidth: number, borderColor: string}
}

export class ImageBubbleStyle extends BaseStyle {
    constructor({
        backgroundColor = "transparent",
        border = {borderWidth: 0, borderColor: "rgb(0,0,0)"},
        borderRadius,
        height = "auto",
        width = "auto"
    }: ImageBubbleStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        });
    }
}