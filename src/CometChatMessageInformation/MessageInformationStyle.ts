import { BaseStyleInterface, FontStyleInterface } from "../shared"

export interface MessageInformationStyleInterface extends BaseStyleInterface{
    titleTextColor?: string,
    titleTextFont?: FontStyleInterface,
    readIconTint?: string,
    deliveredIconTint?: string,
    subtitleTextColor?: string,
    subtitleTextFont?: FontStyleInterface,
    dividerTint?: string,
    sendIconTint?: string,
}