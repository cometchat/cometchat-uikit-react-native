import { BaseStyle, BaseStyleInterface, FontStyle, FontStyleInterface } from "../../shared";

export interface CallParticipantsStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface,
    titleColor?: string,
    dateTextFont?: FontStyleInterface;
    dateTextColor?: string;
    emptyTextFont?: FontStyleInterface;
    emptyTextColor?: string;
    backIconTint?: string;
    durationTextFont?: FontStyleInterface;
    durationTextColor?: string;
}

export class CallParticipantsStyle extends BaseStyle {
    titleFont?: FontStyleInterface;
    titleColor?: string;
    emptyTextFont?: FontStyleInterface;
    emptyTextColor?: string;
    dateTextFont?: FontStyleInterface;
    dateTextColor?: string;
    backIconTint?: string;
    durationTextFont?: FontStyleInterface;
    durationTextColor?: string;

    constructor({
        titleFont = { fontSize: 20, fontWeight: "600" },
        backgroundColor = "white",
        border,
        borderRadius,
        height,
        titleColor = "#000",
        dateTextFont,
        dateTextColor,
        emptyTextColor,
        emptyTextFont,
        backIconTint,
        durationTextColor,
        durationTextFont,
        width
    }: CallParticipantsStyleInterface) {
        super({
            backgroundColor: backgroundColor,
            border: border,
            borderRadius: borderRadius,
            height: height,
            width: width
        });
        this.titleColor = titleColor;
        this.titleFont = titleFont;
        this.dateTextFont = dateTextFont;
        this.dateTextColor = dateTextColor;
        this.emptyTextColor = emptyTextColor;
        this.emptyTextFont = emptyTextFont;
        this.backIconTint = backIconTint;
        this.durationTextColor = durationTextColor;
        this.durationTextFont = durationTextFont;
    }
}