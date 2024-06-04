import { BaseStyle, BaseStyleInterface } from "../../shared/base";

export interface CallButtonStyleInterface extends BaseStyleInterface {
    voiceCallIconTint?: string,
    videoCallIconTint?: string,
    buttonPadding?: number,
}

export class CallButtonStyle extends BaseStyle{
    voiceCallIconTint?: string
    videoCallIconTint?: string
    buttonPadding?: number

    constructor({
        backgroundColor,
        border,
        borderRadius,
        buttonPadding = 16,
        height = "auto",
        videoCallIconTint,
        voiceCallIconTint,
        width = "auto"
    }: CallButtonStyleInterface) {
        super({
            height,
            width,
            backgroundColor,
            border,
            borderRadius
        });
        this.voiceCallIconTint = voiceCallIconTint;
        this.videoCallIconTint = videoCallIconTint;
        this.buttonPadding = buttonPadding;
    }
}