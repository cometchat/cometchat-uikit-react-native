import { BorderStyleInterface, FontStyleInterface } from '../../base';
import { BaseStyle, BaseStyleInterface } from '../../base/BaseStyle';

export class AvatarStyle extends BaseStyle {
  nameTextFont?: FontStyleInterface;
  nameTextColor?: string;
  outerView?: BorderStyleInterface;
  outerViewSpacing?: number;
  /**
   *
   * @param {Object} param0
   * @field height
   * @field width
   * @field border
   * @field borderRadius
   * @field backgroundColor
   * @field nameTextColor
   * @field nameTextFont
   * @field outerView
   * @field outerViewSpacing
   */
  constructor({
    height = 40,
    width = 40,
    border = { borderWidth: 1, borderStyle: 'solid', borderColor: 'black' },
    borderRadius = 30,
    backgroundColor = 'rgba(20,20,20,0.58)',
    nameTextColor = 'rgba(255, 255, 255,0.89)',
    nameTextFont = {
      fontFamily: undefined,
      fontWeight: 'normal',
      fontSize: 18,
    },
    outerView = { borderWidth: 0, borderStyle: 'solid', borderColor: 'black' },
    outerViewSpacing = 0,
  }: AvatarStyleInterface) {
    super({
      border,
      borderRadius,
      backgroundColor,
      height,
      width,

    });
    this.nameTextFont = nameTextFont;
    this.nameTextColor = nameTextColor;
    this.outerView = outerView;
    this.outerViewSpacing = outerViewSpacing;
  }
}

export interface AvatarStyleInterface extends BaseStyleInterface {
  nameTextFont?: FontStyleInterface;
  nameTextColor?: string;
  outerView?: BorderStyleInterface;
  outerViewSpacing?: number;
}
