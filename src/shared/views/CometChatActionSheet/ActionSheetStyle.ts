import { BorderStyle, FontStyle, BaseStyle, FontStyleInterface, BaseStyleInterface } from "../../base";

export interface ActionSheetStylesInterface extends BaseStyleInterface {
    layoutModeIconTint?: string;
    titleFont?: FontStyleInterface;
    titleColor?: string;
    listItemIconTint?: string;
    listItemTitleFont?: FontStyleInterface;
    listItemTitleColor?: string;
    listItemIconBackground?: string;
    listItemIconBorderRadius?: number;
    actionSheetSeparatorTint?: string;
    paddingHorizontal?: number;
}

/**
 * @class ActionSheetStyles
 */

export class ActionSheetStyles extends BaseStyle {
    layoutModeIconTint: string;
    titleFont: FontStyleInterface;
    titleColor: string;
    listItemIconTint: string;
    listItemTitleFont: FontStyleInterface;
    listItemTitleColor: string;
    listItemIconBackground: string;
    listItemIconBorderRadius: number;
    actionSheetSeparatorTint: string;
    paddingHorizontal?: number;
    /**
     * @param {object} param0 
     * @param {any} width
     * @param {any} height
     * @param {string} backgroundColor
     * @param {object} border
     * @param {number} borderRadius
     * @param {string} layoutModeIconTint
     * @param {object} titleFont
     * @param {string} titleColor
     * @param {object} listItemIconTint
     * @param {string} listItemIconBackground
     * @param {number} listItemIconBorderRadius
     * @param {object} listItemTitleFont
     * @param {string} listItemTitleColor
     */
    constructor(props: ActionSheetStylesInterface) {
        super({
            width: props.width,
            height: props.height,
            backgroundColor: props.backgroundColor,
            border: props.border,
            borderRadius: props.borderRadius,
        });
        if (props)
          for (const [key, value] of Object.entries(props)) {
            this[key] = value;
          }
    }
}
