import { FontStyleInterface } from "../../shared";

export interface LinkPreviewBubbleStyleInterface {
    backgroundColor?: string,
    titleFont?: FontStyleInterface,
    titleColor?: string,
    subtitleFont?: FontStyleInterface,
    subtitleColor?: string,
    childContainerStyle?: Object
}

export class LinkPreviewBubbleStyle implements LinkPreviewBubbleStyleInterface {
    backgroundColor?: string
    titleFont?: FontStyleInterface
    titleColor?: string
    subtitleFont?: FontStyleInterface
    subtitleColor?: string
    childContainerStyle?: Object
    
    constructor(props: LinkPreviewBubbleStyleInterface) {
        this.backgroundColor = props.backgroundColor;
        this.titleFont = props.titleFont;
        this.titleColor = props.titleColor;
        this.subtitleFont = props.subtitleFont;
        this.subtitleColor = props.subtitleColor;
        this.childContainerStyle = props.childContainerStyle;
    }
}