import { FontStyleInterface } from "../../shared";

export interface LinkPreviewConfigurationInterface {
    titleFontStyle: FontStyleInterface,
    titleFontColor: string,
    subtitleFontStyle: FontStyleInterface,
    subtitleFontColor: string,
}

export class LinkPreviewConfiguration implements LinkPreviewConfiguration {
    subtitleFontColor: string;
    subtitleFontStyle: FontStyleInterface;
    titleFontColor: string;
    titleFontStyle: FontStyleInterface;
    
    constructor({
        subtitleFontColor,
        subtitleFontStyle,
        titleFontColor,
        titleFontStyle
    }: LinkPreviewConfigurationInterface) {
        this.subtitleFontColor = subtitleFontColor
        this.subtitleFontStyle = subtitleFontStyle
        this.titleFontColor = titleFontColor
        this.titleFontStyle = titleFontStyle
    }
}