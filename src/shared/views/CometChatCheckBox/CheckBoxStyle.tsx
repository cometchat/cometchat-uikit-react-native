import { BorderStyle, BorderStyleInterface, FontStyle } from "../../base";

export interface CheckBoxStyleInterface {
    titleFont?: FontStyle;
    titleColor?: string;
    border?: BorderStyleInterface;
    activeBackgroundColor?: string;
    inactiveBackgroundColor?: string;
    optionColor?: string;
    optionFont?: FontStyle;
    checkboxTintColor?: string;
}

export class CheckBoxStyle {
    titleFont?: FontStyle;
    titleColor?: string;
    border?: BorderStyleInterface;
    activeBackgroundColor?: string;
    inactiveBackgroundColor?: string;
    optionColor?: string;
    optionFont?: FontStyle;
    checkboxTintColor?: string;

    constructor({
        titleFont = new FontStyle({}),
        titleColor = "",
        border = new BorderStyle({}),
        activeBackgroundColor = "",
        inactiveBackgroundColor = "",
        optionColor = "",
        optionFont = new FontStyle({}),
        checkboxTintColor = "",
    }: CheckBoxStyleInterface) {
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.border = border;
        this.activeBackgroundColor = activeBackgroundColor;
        this.inactiveBackgroundColor = inactiveBackgroundColor;
        this.optionColor = optionColor;
        this.optionFont = optionFont;
        this.checkboxTintColor = checkboxTintColor;
    }
}