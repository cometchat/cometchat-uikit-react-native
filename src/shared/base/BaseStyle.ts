import { BorderStyle, BorderStyleInterface } from './BorderStyle';

/**
 * @class BaseStyle
 * @description BaseStyle class is the parent class used for defining the basic styling props.
 * @param {string} width
 * @param {string|number} height
 * @param {string} backgroundColor
 * @param {number} borderRadius
 * @param {object} border

 */
export class BaseStyle {
  height?: string | number;
  width?: string | number;
  backgroundColor?: string;
  border?: BorderStyleInterface;
  borderRadius?: number;
  constructor({
    width = '100%',
    height = '100%',
    backgroundColor = 'white',
    border = new BorderStyle({}),
    borderRadius = 8,
  }: BaseStyleInterface) {
    this.height = height;
    this.width = width;
    this.backgroundColor = backgroundColor;
    this.border = border;
    this.borderRadius = borderRadius;
  }
}

export interface BaseStyleInterface {
  height?: number | string;
  width?: number | string;
  backgroundColor?: string;
  border?: BorderStyleInterface;
  borderRadius?: number;
}
