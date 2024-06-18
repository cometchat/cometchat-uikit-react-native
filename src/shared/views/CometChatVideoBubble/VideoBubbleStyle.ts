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
     /**
     * player loading icon color
     */
    playerLoadingIconColor?: string
     /**
     * player play icon color
     */
    playerPlayIconColor?: string
     /**
     * player pause icon color
     */
    playerPauseIconColor?: string
     /**
     * player back icon color
     */
    playerBackIconColor?: string
     /**
     * player volume icon color
     */
    playerVolumeIconColor?: string
}

export class VideoBubbleStyle extends BaseStyle {
    playIconTint: string
    playIconBackgroundColor: string
      /**
     * player loading icon color
     */
      playerLoadingIconColor?: string
      /**
      * player play icon color
      */
     playerPlayIconColor?: string
      /**
      * player pause icon color
      */
     playerPauseIconColor?: string
      /**
      * player back icon color
      */
     playerBackIconColor?: string
      /**
      * player volume icon color
      */
     playerVolumeIconColor?: string

    constructor({
        height = 24,
        width = 24,
        backgroundColor = "transparent",
        border = new BorderStyle({}),
        borderRadius,
        playIconBackgroundColor = "rgba(20,20,20,0.4)",
        playIconTint = "white",
        playerLoadingIconColor = "white",
        playerPlayIconColor = "white",
        playerPauseIconColor = "white",
        playerBackIconColor = "white",
        playerVolumeIconColor = "white",
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
        this.playerLoadingIconColor = playerLoadingIconColor
        this.playerPlayIconColor = playerPlayIconColor
        this.playerPauseIconColor = playerPauseIconColor
        this.playerBackIconColor = playerBackIconColor
        this.playerVolumeIconColor = playerVolumeIconColor
    }
}