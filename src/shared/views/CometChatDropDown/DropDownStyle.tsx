import { BorderStyle, BorderStyleInterface, FontStyle } from "../../base";

export interface DropDownStyleInterface {
    titleFont?: FontStyle;
    titleColor?: string;
    border?: BorderStyleInterface;
    activeBackgroundColor?: string;
    inactiveBackgroundColor?: string;
    optionColor?: string;
    optionFont?: FontStyle;
}

export class DropDownStyle {
    titleFont?: FontStyle;
    titleColor?: string;
    border?: BorderStyleInterface;
    activeBackgroundColor?: string;
    inactiveBackgroundColor?: string;
    optionColor?: string;
    optionFont?: FontStyle;

    constructor({
        titleFont = new FontStyle({}),
        titleColor = "",
        border = new BorderStyle({}),
        activeBackgroundColor = "",
        inactiveBackgroundColor = "",
        optionColor = "",
        optionFont = new FontStyle({}),
    }: DropDownStyleInterface) {
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.border = border;
        this.activeBackgroundColor = activeBackgroundColor;
        this.inactiveBackgroundColor = inactiveBackgroundColor;
        this.optionColor = optionColor;
        this.optionFont = optionFont;
    }
}