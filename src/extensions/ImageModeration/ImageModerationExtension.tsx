import {
  ExtensionsDataSource,
  ChatConfigurator,
  DataSource,
} from '../../shared/framework';
import { ExtensionConstants } from '../ExtensionConstants';
import { ImageModerationExtensionDecorator } from './ImageModerationDecorator';
import { ImageModerationFilterInterface } from './ImageModerationFilter';
export interface ImageModerationConfigurationInterface
  extends Omit<ImageModerationFilterInterface, 'message' | 'ChildView'> {}
export class ImageModerationExtension extends ExtensionsDataSource {
  ImageModerationConfigurationInterface?: ImageModerationConfigurationInterface;

  constructor(
    ImageModerationConfigurationConfiguration?: ImageModerationConfigurationInterface
  ) {
    super();
    if (ImageModerationConfigurationConfiguration != null) {
      this.ImageModerationConfigurationInterface =
        ImageModerationConfigurationConfiguration;
    }
  }

  /**
   * enable
   *  @description enables the Text moderation extension which includes Data profanity and data masking
   */

  //override addExtension method from ExtensionsDataSource interface
  override addExtension(): void {
    ChatConfigurator.enable((dataSource: DataSource) => {
      return new ImageModerationExtensionDecorator(
        dataSource,
        this.ImageModerationConfigurationInterface
      );
    });
  }

  //override getExtensionId method from ExtensionsDataSource interface
  override getExtensionId(): string {
    return ExtensionConstants.imageModeration;
  }
}
