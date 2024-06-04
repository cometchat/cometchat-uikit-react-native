import { AvatarStyle, AvatarStyleInterface } from './AvatarStyle';

/**
 * @class AvatarConfiguration
 * @description AvatarConfiguration class is used for defining the Avatar template.
 */
export class AvatarConfiguration {
  style?: AvatarStyleInterface;
  resizeMode?: string;
  /**
   * @param {Object} param0
   * @field style - Object of AvatarStyle class
   * @field resizeMode - resize mode for image
   */
  constructor({
    style = new AvatarStyle({}),
    resizeMode = 'cover',
  }: AvatarConfigurationInterface) {
    this.style = style;
    this.resizeMode = resizeMode;
  }
}

export interface AvatarConfigurationInterface {
  style?: AvatarStyleInterface;
  resizeMode?: string;
}
