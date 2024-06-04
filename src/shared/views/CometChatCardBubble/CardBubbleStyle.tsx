import { BaseStyle, FontStyle } from "../../base";
import { ButtonStyleInterface } from "../CometChatButton";
import { ImageBubbleStyleInterface } from "../CometChatImageBubble";

export interface CardBubbleStyleInterface extends BaseStyle {
    textFont?: FontStyle;
    textColor?: string;
    padding?: number;
    buttonStyle?: ButtonStyleInterface;
    imageStyle?: ImageBubbleStyleInterface;
    imageResizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
}

export class CardBubbleStyle extends BaseStyle {
    textFont?: FontStyle;
    textColor?: string;
    padding?: number;
    buttonStyle?: ButtonStyleInterface;
    imageStyle?: ImageBubbleStyleInterface;
    imageResizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";

    constructor({
        height = "auto",
        width = "auto",
        backgroundColor,
        borderRadius,
        textFont,
        textColor,
        padding,
        buttonStyle,
        imageStyle,
        imageResizeMode = "cover",
    }: CardBubbleStyleInterface) {
        super({
            backgroundColor,
            borderRadius,
            height,
            width
        });
        this.textFont = textFont;
        this.textColor = textColor;
        this.padding = padding;
        this.buttonStyle = buttonStyle;
        this.imageStyle = imageStyle;
        this.imageResizeMode = imageResizeMode;
    }
}