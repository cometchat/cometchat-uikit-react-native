import { BaseStyle, BaseStyleInterface } from '../../base/BaseStyle';
import { FontStyle, FontStyleInterface } from '../../base/FontStyle';

export class DateStyle extends BaseStyle {
  textColor?: string;
  textFont?: FontStyle;
  constructor({
    textColor = 'black',
    border = { borderWidth: 0, borderColor: 'black', borderStyle: 'solid' },
    backgroundColor = 'transparent',
    borderRadius = 0,
    textFont = new FontStyle({}),
  }: DateStyleInterface) {
    super({
      border,
      borderRadius,
      backgroundColor,
    });
    this.textColor = textColor;
    this.textFont = textFont;
  }
}
export interface DateStyleInterface extends BaseStyleInterface {
  textColor?: string;
  textFont?: FontStyleInterface;
}
