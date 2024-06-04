import { StatusIndicatorStyle } from './StatusIndicatorStyle';
//@ts-ignore
import { StyleProp, ViewStyle } from 'react-native';
import { ImageType } from '../../base';
/**
 * @class StatusIndicatorConfiguration
 * @description StatusIndicatorConfiguration class is used for defining the StatusIndicator template.
 * @param {object} style
 * @param {string} backgroundImage
 */
export class StatusIndicatorConfiguration {
  style?: StyleProp<ViewStyle>;
  backgroundImage?: ImageType;
  constructor({
    style = new StatusIndicatorStyle({}),
    backgroundImage,
  }: StatusIndicatorConfigurationInterface) {
    this.style = style;
    this.backgroundImage = backgroundImage;
  }
}
export interface StatusIndicatorConfigurationInterface {
  style?: StyleProp<ViewStyle>;
  backgroundImage?: ImageType;
}
