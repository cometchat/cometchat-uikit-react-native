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
    /**
     * font syle for special text
     */
    linkTextFont?: FontStyle,
    /**
     * color for special text
     */
    linkTextColor?: string
}

export class TextBubbleStyle extends BaseStyle {
    textColor: string
    textFont: FontStyle
    linkTextFont: FontStyle
    linkTextColor: string

    constructor({
        width = "auto",
        height = "auto",
        backgroundColor = "rgba(20,20,20,0.04)",
        border = new BorderStyle({}),
        borderRadius = 0,
        textColor = "rgb(20, 20, 20)",
        textFont = new FontStyle({fontSize: 17, fontWeight: "400"}),
        linkTextColor = "blue",
        linkTextFont = new FontStyle({fontSize: 17, fontWeight: "400"}),
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
        this.linkTextColor = linkTextColor;
        this.linkTextFont = new FontStyle({...linkTextFont});
    }
}