import { BorderStyle, BorderStyleInterface, FontStyle } from "../../base";

export interface TextInputStyleInterface {
    titleFont?: FontStyle;
    titleColor?: string;
    border?: BorderStyleInterface;
    placeholderColor?: string;
}

export class TextInputStyle extends BorderStyle {
    titleFont?: FontStyle;
    titleColor?: string;
    placeholderColor?: string;

    constructor({
        titleFont = new FontStyle({}),
        titleColor,
        placeholderColor = "",
        border = new BorderStyle({}),
    }: TextInputStyleInterface) {
        super(border);
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.placeholderColor = placeholderColor;
    }
}