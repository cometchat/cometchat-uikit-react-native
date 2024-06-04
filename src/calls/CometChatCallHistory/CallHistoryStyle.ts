import { BaseStyle, BaseStyleInterface, FontStyle, FontStyleInterface } from "../../shared";

export interface CallHistoryStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface,
    titleColor?: string,
}

export class CallHistoryStyle extends BaseStyle implements CallHistoryStyleInterface {
    titleFont?: FontStyleInterface;
    titleColor?: string;
    loadingTint?: string;
    emptyTextFont?: FontStyleInterface;
    emptyTextColor?: string

    constructor({
        titleFont = { fontSize: 20, fontWeight: "600"},
        backgroundColor = "white",
        border,
        borderRadius,
        height,
        titleColor = "#000",
        width
    }: CallHistoryStyleInterface) {
        super({
            backgroundColor: backgroundColor,
            border: border,
            borderRadius: borderRadius,
            height: height,
            width: width
        });
        this.titleColor = titleColor;
        this.titleFont = titleFont;
    }
}