import { BaseStyle, BaseStyleInterface } from "../../base";

export interface ImageBubbleStyleInterface extends Omit<BaseStyleInterface, "border"> {
    border?: {borderWidth: number, borderColor: string};
    /**
     * The aspect ratio for the image. Can only be used when either height or width is provided. If both values are provided, then the aspectRatio value will be ignored.
     * @type number
     * @example 1.77 or 16/9 for horizontal image
     * @example 0.8 or 4/5 for vertical image
     * @example 1 for square image
     **/
    aspectRatio?: number;
}

export class ImageBubbleStyle extends BaseStyle {
    aspectRatio: number;
    constructor({
        backgroundColor = "transparent",
        border = {borderWidth: 0, borderColor: "rgb(0,0,0)"},
        borderRadius,
        height = "auto",
        width = "auto",
        aspectRatio,
    }: ImageBubbleStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width,
        });
        this.aspectRatio = aspectRatio;
    }
}