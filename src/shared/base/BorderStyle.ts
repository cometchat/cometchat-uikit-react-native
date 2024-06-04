/**
 * *
 * @class BorderStyle
 * @description BorderStyle class is used for defining the border.
 * @param  {number} borderWidth
 * @param  {string} borderStyle
 * @param  {string} borderColor
 */
export class BorderStyle {
  borderWidth?: number;
  borderStyle?: 'solid' | 'dotted' | 'dashed';
  borderColor?: string;
  constructor({
    borderWidth = 0,
    borderStyle = 'solid',
    borderColor = 'transparent',
  }: BorderStyleInterface) {
    this.borderWidth = borderWidth;
    this.borderStyle = borderStyle;
    this.borderColor = borderColor;
  }
}

export interface BorderStyleInterface {
  borderWidth?: number;
  borderStyle?: 'solid' | 'dotted' | 'dashed';
  borderColor?: string;
}
