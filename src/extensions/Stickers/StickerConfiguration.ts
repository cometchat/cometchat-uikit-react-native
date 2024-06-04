import { StickerStyle, StickerStyleInterface } from './StickerStyle';

export interface StickerConfigurationInterface {
  style?: StickerStyleInterface;
}

export class StickerConfiguration implements StickerConfigurationInterface {
  style?: StickerStyleInterface;

  constructor({ style }: StickerConfigurationInterface) {
    this.style = new StickerStyle({
      height: 100,
      width: 100,
      ...style,
    });
  }
}
