import { BaseStyle, BorderStyle } from '../../base';

/**
 * @class StatusIndicatorStyle
 * @description style template for StatusIndicator
 * @param  {} height
 * @param  {} width
 * @param  {} border
 * @param  {} borderRadius
 * @param  {} backgroundColor
 */

export class StatusIndicatorStyle extends BaseStyle {
  constructor({
    height = 12,
    width = 12,
    border = new BorderStyle({}),
    borderRadius = 6,
    backgroundColor = '',
  }: StatusIndicatorStyleInterface) {
    super({
      width,
      height,
      backgroundColor,
      border,
      borderRadius,
    });
  }
}

export interface StatusIndicatorStyleInterface {
  height?: string | number;
  width?: string | number;
  border?: BorderStyle;
  borderRadius?: number;
  backgroundColor?: string;
}
