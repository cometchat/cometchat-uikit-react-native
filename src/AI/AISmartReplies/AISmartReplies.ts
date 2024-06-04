import { AISmartRepliesExtensionDecorator } from "./AISmartRepliesDecorator";
import { ChatConfigurator } from "../../shared";
import { AIExtensionDataSource } from "../AIExtensionDataSource";
import { AISmartRepliesConfiguration } from "./configuration";
export class AISmartRepliesExtension extends AIExtensionDataSource {
  private configuration?: AISmartRepliesConfiguration;

  constructor(configuration?: AISmartRepliesConfiguration) {
    super();
    this.configuration = configuration;
  }
  override addExtension(): void {
    ChatConfigurator.enable((dataSource: any) => new AISmartRepliesExtensionDecorator(dataSource, this.configuration));
  }
  override getExtensionId(): string {
    return "smart-replies";
  }

}
