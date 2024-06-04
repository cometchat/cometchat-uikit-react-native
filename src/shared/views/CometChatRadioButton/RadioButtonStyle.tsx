import { BorderStyle, BorderStyleInterface, FontStyle } from "../../base";

export interface RadioButtonStyleInterface {
    titleFont?: FontStyle;
    titleColor?: string;
    border?: BorderStyleInterface;
    activeBackgroundColor?: string;
    inactiveBackgroundColor?: string;
    optionColor?: string;
    optionFont?: FontStyle;
}

export class RadioButtonStyle extends BorderStyle {
    titleFont?: FontStyle;
    titleColor?: string;
    activeBackgroundColor?: string;
    inactiveBackgroundColor?: string;
    optionColor?: string;
    optionFont?: FontStyle;

    constructor({
        titleFont = new FontStyle({}),
        titleColor = "",
        activeBackgroundColor = "",
        inactiveBackgroundColor = "",
        optionColor = "",
        optionFont = new FontStyle({}),
        border = new BorderStyle({}),
    }: RadioButtonStyleInterface) {
        super(border);
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.activeBackgroundColor = activeBackgroundColor;
        this.inactiveBackgroundColor = inactiveBackgroundColor;
        this.optionColor = optionColor;
        this.optionFont = optionFont;
    }
}