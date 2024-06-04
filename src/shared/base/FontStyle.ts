/**
 * @class FontStyle
 * @description
 * @param {String} fontFamily
 * @param {String} fontWeight
 * @param {String} fontSize
 */
export class FontStyle {
  fontFamily?: string | undefined;
  fontWeight?: 'normal'| 'bold'| '100'| '200'| '300'| '400'| '500'| '600'| '700'| '800'| '900';
  fontSize?: number;

  constructor({
    fontFamily = undefined,
    fontWeight = 'normal',
    fontSize = 16,
  }: FontStyleInterface) {
    this.fontFamily = fontFamily;
    this.fontWeight = fontWeight;
    this.fontSize = fontSize;
  }
}
export interface FontStyleInterface {
  fontFamily?: string | undefined;
  fontWeight?: 'normal'| 'bold'| '100'| '200'| '300'| '400'| '500'| '600'| '700'| '800'| '900';
  fontSize?: number;
}
