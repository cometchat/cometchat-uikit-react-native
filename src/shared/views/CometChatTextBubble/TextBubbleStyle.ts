import { BaseStyle, BaseStyleInterface, BorderStyle, FontStyle } from "../../base";

export interface TextBubbleStyleInterface extends BaseStyleInterface {
    /**
     * color for text
     */
    textColor?: string,
    /**
     * font style for text
     */
    textFont?: FontStyle,
}

export class TextBubbleStyle extends BaseStyle {
    textColor: string
    textFont: FontStyle

    constructor({
        width = "auto",
        height = "auto",
        backgroundColor = "rgba(20,20,20,0.04)",
        border = new BorderStyle({}),
        borderRadius = 0,
        textColor = "rgb(20, 20, 20)",
        textFont = new FontStyle({fontSize: 17, fontWeight: "400"}),
    }: TextBubbleStyleInterface) {
        super({
            width,
            height,
            backgroundColor,
            border,
            borderRadius
        });
        this.textColor = textColor;
        this.textFont = new FontStyle({...textFont});
    }
}