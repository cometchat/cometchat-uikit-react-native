import { BaseStyle, BaseStyleInterface, FontStyle, FontStyleInterface } from "../../shared";

export interface CallLogHistoryStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface;
    titleColor?: string;
    loadingTint?: string;
    emptyTextFont?: FontStyleInterface;
    emptyTextColor?: string
    errorTextFont?: FontStyleInterface;
    errorTextColor?: string;
    backIconTint?: string;
    dateTextFont?: FontStyleInterface;
    dateTextColor?: string;
    dateSeparatorTextFont?: FontStyleInterface;
    dateSeparatorTextColor?: string;
    callDurationTextFont?: FontStyleInterface;
    callDurationTextColor?: string;
    callStatusTextFont?: FontStyleInterface;
    callStatusTextColor?: string;
    separatorColor?: string;
}

export class CallLogHistoryStyle extends BaseStyle {
    titleFont?: FontStyleInterface;
    titleColor?: string;
    loadingTint?: string;
    emptyTextFont?: FontStyleInterface;
    emptyTextColor?: string
    errorTextFont?: FontStyleInterface;
    errorTextColor?: string;
    backIconTint?: string;
    dateTextFont?: FontStyleInterface;
    dateTextColor?: string;
    dateSeparatorTextFont?: FontStyleInterface;
    dateSeparatorTextColor?: string;
    callDurationTextFont?: FontStyleInterface;
    callDurationTextColor?: string;
    callStatusTextFont?: FontStyleInterface;
    callStatusTextColor?: string;
    separatorColor?: string;

    constructor(style: Partial<CallLogHistoryStyle>) {
        super({});
        Object.assign(this, style);
    }
}