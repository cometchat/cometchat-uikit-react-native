import { BaseStyle, BaseStyleInterface, FontStyleInterface } from '../../base';

/**
 * @class ListItemStyle
 * @description ListItemStyle class is used for defining the ListItemStyle template.
 * @param {any} width
 * @param {any} height
 * @param {string} backgroundColor
 * @param {object} border
 * @param {any} borderRadius
 * @param {string} titleColor
 * @param {object} titleFont
 * @param {string} subtitleColor
 * @param {object} subtitleFont
 * @param {string} typingIndicatorTextColor
 * @param {object} typingIndicatorTextFont
 * @param {string} threadIndicatorTextColor
 * @param {object} threadIndicatorTextFont
 */
export class ListItemStyle extends BaseStyle {
  titleColor?: string;
  titleFont?: FontStyleInterface

  constructor({
    width = '100%',
    height = 72,
    backgroundColor = 'white',
    border = { borderWidth: 0, borderStyle: 'solid', borderColor: 'black' },
    borderRadius = 0,
    titleColor = 'rgb(20,20,20)',
    titleFont = { fontSize: 17, fontWeight: '500' },
  }: ListItemStyleInterface) {
    super({
      width,
      height,
      backgroundColor,
      border,
      borderRadius,
    });
    this.titleColor = titleColor;
    this.titleFont = titleFont;
  }
}
export interface ListItemStyleInterface extends BaseStyleInterface {
  titleColor?: string;
  titleFont?: FontStyleInterface
}
