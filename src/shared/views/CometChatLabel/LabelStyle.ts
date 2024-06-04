import { FontStyle } from "../../base";

export interface LabelStyleInterface {
    labelColor?: string;
    labelFont?: FontStyle;
}

export class LabelStyle {
    labelFont?: FontStyle;
    labelColor?: string;

    constructor({
        labelFont = new FontStyle({}),
        labelColor = "#000000",
    }: LabelStyleInterface) {
        this.labelFont = labelFont;
        this.labelColor = labelColor;
    }
}