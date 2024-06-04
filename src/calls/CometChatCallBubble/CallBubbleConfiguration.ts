import React from "react";
import { CallBubbleStyle, CallBubbleStyleInterface } from "./CallBubbleStyle";
import { ImageType } from "../../shared";
export interface CallBubbleConfigurationInterface {
    icon?: ImageType,
    onClick?: () => void,
    style?: CallBubbleStyleInterface,
}
export class CallBubbleConfiguration implements CallBubbleConfigurationInterface {
    icon?: ImageType
    onClick?: () => void
    style?: CallBubbleStyle

    constructor({
        icon,
        onClick,
        style
    }: CallBubbleConfigurationInterface) {
        this.icon = icon;
        this.onClick = onClick;
        this.style = style;
    }
}