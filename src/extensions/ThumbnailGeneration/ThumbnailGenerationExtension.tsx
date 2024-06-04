import {
  ExtensionsDataSource,
  ChatConfigurator,
  DataSource,
} from '../../shared/framework';
import { ThumbnailGenerationExtensionDecorator } from './ThumbnailGenerationDecorator';
// import { ThumbnailGenerationConfigurationInterface } from './ThumbnailGenerationConfiguration';
import { VideoBubbleStyleInterface } from '../../shared';
import { ExtensionConstants } from '../ExtensionConstants';
export interface ThumbnailGenerationConfigurationInterface {
  videoBubbleStyle: VideoBubbleStyleInterface;
}
export class ThumbnailGenerationExtension extends ExtensionsDataSource {
  ThumbnailGenerationConfigurationInterface?: ThumbnailGenerationConfigurationInterface;

  constructor(
    ThumbnailGenerationConfigurationConfiguration?: ThumbnailGenerationConfigurationInterface
  ) {
    super();
    if (ThumbnailGenerationConfigurationConfiguration != null) {
      this.ThumbnailGenerationConfigurationInterface =
        ThumbnailGenerationConfigurationConfiguration;
    }
  }

  /**
   * enable
   *  @description enables the Text moderation extension which includes Data profanity and data masking
   */

  //override addExtension method from ExtensionsDataSource interface
  override addExtension(): void {
    ChatConfigurator.enable((dataSource: DataSource) => {
      return new ThumbnailGenerationExtensionDecorator(
        dataSource,
        this.ThumbnailGenerationConfigurationInterface
      );
    });
  }

  //override getExtensionId method from ExtensionsDataSource interface
  override getExtensionId(): string {
    return ExtensionConstants.thumbnailGeneration;
  }
}
