import { BaseStyle, BaseStyleInterface, FontStyle, FontStyleInterface } from "../../shared";

export interface CallLogsStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface,
    titleColor?: string,
    loadingTint?: string,
    emptyTextFont?: FontStyleInterface,
    emptyTextColor?: string,
    errorTextColor?: string,
    errorTextFont?: FontStyleInterface,
    separatorColor?: string,
    infoIconTint?: string,
    missedCallIconTint?: string,
    outgoingCallIconTint?: string,
    incomingCallIconTint?: string,
    subtitleTextFont?: FontStyleInterface,
    subtitleTextColor?: string,
    dateTextFont?: FontStyleInterface,
    dateTextColor?: string,
    dateSeparatorTextFont?: FontStyleInterface,
    dateSeparatorTextColor?: string,
}

export class CallLogsStyle extends BaseStyle {
    titleFont?: FontStyleInterface;
    titleColor?: string;
    loadingTint?: string;
    emptyTextFont?: FontStyleInterface;
    emptyTextColor?: string
    errorTextColor?: string;
    errorTextFont?: FontStyleInterface;
    separatorColor?: string;
    infoIconTint?: string;
    missedCallIconTint?: string;
    outgoingCallIconTint?: string;
    incomingCallIconTint?: string;
    subtitleTextFont?: FontStyleInterface;
    subtitleTextColor?: string;
    dateTextFont?: FontStyleInterface;
    dateTextColor?: string;
    dateSeparatorTextFont?: FontStyleInterface;
    dateSeparatorTextColor?: string;

    constructor({
        titleFont = { fontSize: 20, fontWeight: "600" },
        backgroundColor = "white",
        border,
        borderRadius,
        height,
        titleColor = "#000",
        width,
        loadingTint,
        emptyTextFont,
        emptyTextColor,
        errorTextColor,
        errorTextFont,
        separatorColor,
        infoIconTint,
        missedCallIconTint,
        outgoingCallIconTint,
        incomingCallIconTint,
        subtitleTextFont,
        subtitleTextColor,
        dateTextFont,
        dateTextColor,
        dateSeparatorTextFont,
        dateSeparatorTextColor
    }: CallLogsStyleInterface) {
        super({
            backgroundColor: backgroundColor,
            border: border,
            borderRadius: borderRadius,
            height: height,
            width: width
        });
        this.titleColor = titleColor;
        this.titleFont = titleFont;
        this.loadingTint = loadingTint;
        this.emptyTextFont = emptyTextFont;
        this.emptyTextColor = emptyTextColor;
        this.errorTextColor = errorTextColor;
        this.errorTextFont = errorTextFont;
        this.separatorColor = separatorColor;
        this.infoIconTint = infoIconTint;
        this.missedCallIconTint = missedCallIconTint;
        this.outgoingCallIconTint = outgoingCallIconTint;
        this.incomingCallIconTint = incomingCallIconTint;
        this.subtitleTextFont = subtitleTextFont;
        this.subtitleTextColor = subtitleTextColor;
        this.dateTextFont = dateTextFont;
        this.dateTextColor = dateTextColor;
        this.dateSeparatorTextFont = dateSeparatorTextFont;
        this.dateSeparatorTextColor = dateSeparatorTextColor;
    }
}