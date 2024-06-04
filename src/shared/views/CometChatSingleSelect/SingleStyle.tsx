import { BorderStyle, BorderStyleInterface, FontStyle } from "../../base";

export interface SingleSelectStyleInterface {
    titleFont?: FontStyle;
    titleColor?: string;
    border?: BorderStyleInterface;
    optionColorActive?: string;
    optionColorInactive?: string;
    optionFont?: FontStyle;
}

export class SingleSelectStyle {
    titleFont?: FontStyle;
    titleColor?: string;
    border?: BorderStyleInterface;
    optionColorActive?: string;
    optionColorInactive?: string;
    optionFont?: FontStyle;

    constructor({
        titleFont = new FontStyle({}),
        titleColor = "",
        border = new BorderStyle({}),
        optionColorActive = "",
        optionColorInactive = "",
        optionFont = new FontStyle({}),
    }: SingleSelectStyleInterface) {
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.border = border;
        this.optionColorActive = optionColorActive;
        this.optionColorInactive = optionColorInactive;
        this.optionFont = optionFont;
    }
}