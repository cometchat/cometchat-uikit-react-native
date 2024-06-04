import { BaseStyle, BaseStyleInterface, BorderStyle } from "../../base";

export interface VideoBubbleStyleInterface extends BaseStyleInterface {
    /**
     * tint for play icon
     */
    playIconTint?: string,
    /**
     * play icon background color
     */
    playIconBackgroundColor?: string
}

export class VideoBubbleStyle extends BaseStyle {
    playIconTint: string
    playIconBackgroundColor: string
    
    constructor({
        height = 24,
        width = 24,
        backgroundColor = "transparent",
        border = new BorderStyle({}),
        borderRadius = 0,
        playIconBackgroundColor = "rgba(20,20,20,0.4)",
        playIconTint = "white"
    }: VideoBubbleStyleInterface) {
        super({
            height,
            width,
            backgroundColor,
            border,
            borderRadius
        });
        this.playIconTint = playIconTint;
        this.playIconBackgroundColor = playIconBackgroundColor;
    }
}