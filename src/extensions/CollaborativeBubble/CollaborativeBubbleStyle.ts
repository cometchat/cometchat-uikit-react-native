import { BaseStyle, BaseStyleInterface, FontStyleInterface, FontStyle } from "../../shared/base"; 

/**
 * @class WhiteboardStyle
 * @description Class to create style object for collaborative white board message compoment.
 */



export interface CollaborativeBubbleStyleInterface extends BaseStyleInterface {
    /**
     * color for text
     */
    iconTint?: string,
    /**
     * titleColor for text
     */
    titleColor ?: string,
    /**
     * titleFont for special text
     */
    titleFont ?: FontStyleInterface,
    /**
     * color for special text
     */
    subTitleFont ?: FontStyleInterface,

     /**
     * subTitleColor for special text
     */
    subTitleColor ?: string,

    /**
     * buttonBackgroundColor for special text
     */
    buttonBackgroundColor ?: string,

    /**
     * buttonTextColor for special text
     */
    buttonTextColor ?: string,

    /**
     * buttonTextFont for special text
     */
    buttonTextFont ?: FontStyleInterface,

    /**
     * dividerTint for special text
     */
    dividerTint ?: string

}


export class CollaborativeBubbleStyle extends BaseStyle {
    public iconTint: string;
    public titleColor: string;
    public titleFont: FontStyleInterface;
    public subTitleFont: FontStyleInterface;
    public subTitleColor: string;
    public buttonBackgroundColor: string;
    public buttonTextColor: string;
    public buttonTextFont: FontStyleInterface;
    public dividerTint: string;
    constructor( {
        width = 228,
        height = 142,
        iconTint = "rgba(20, 20, 20, 0.69)",
        titleFont = new FontStyle({fontSize: 15, fontWeight: "500"}),
        titleColor = "rgba(20,20,20,1)",
        backgroundColor = "transparent",
        subTitleFont = new FontStyle({fontSize: 13, fontWeight: "400"}),
        subTitleColor = "rgba(20,20,20,0.58)",
        borderRadius = 10,
        buttonTextColor = "rgba(51,153,255,1)",
        buttonTextFont = new FontStyle({fontSize: 16, fontWeight: "700"}),
        buttonBackgroundColor = 'transparent',
        dividerTint = "rgba(20, 20, 20, 0.1)",
        }: CollaborativeBubbleStyleInterface) {
        super({
        height,
        width,
        backgroundColor,
        borderRadius,
        });
        this.iconTint = iconTint;
        this.titleColor = titleColor;
        this.titleFont = titleFont;
        this.subTitleFont = subTitleFont;
        this.subTitleColor = subTitleColor;
        this.buttonBackgroundColor = buttonBackgroundColor;
        this.buttonTextColor = buttonTextColor;
        this.buttonTextFont = buttonTextFont;
        this.dividerTint = dividerTint;
        }
}