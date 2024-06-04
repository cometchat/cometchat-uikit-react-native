import { ChatConfigurator, ExtensionsDataSource } from "../../shared/framework";
import { ExtensionConstants } from "../ExtensionConstants";
import { StickerConfiguration, StickerConfigurationInterface } from "./StickerConfiguration";
import { StickersExtensionDecorator } from "./StickersExtensionDecorator";

export class StickersExtension extends ExtensionsDataSource {

  //Configuration prop taken as optional field in constructor
  configuration?: StickerConfigurationInterface

  constructor(stickerConfiguration?: StickerConfigurationInterface) {
    super();
    this.configuration = new StickerConfiguration({
      ...stickerConfiguration
    });
  }

  //override addExtension method from ExtensionsDataSource interface
  override addExtension(): void {
    ChatConfigurator.enable((dataSource) => {
      return new StickersExtensionDecorator({
        dataSource,
        configration: this.configuration
      })
    });
  }

  //override getExtensionId method from ExtensionsDataSource interface
  override getExtensionId(): string {
    return ExtensionConstants.stickers;
  }
}