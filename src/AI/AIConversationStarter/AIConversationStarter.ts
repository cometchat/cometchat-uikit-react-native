import { AIConversationStarterDecorator } from "./AIConversationStarterDecorator";
import { ChatConfigurator } from "../../shared";
import { AIExtensionDataSource } from "../AIExtensionDataSource";
import { AIConversationStarterConfiguration } from "./configuration";
export class AIConversationStarterExtension extends AIExtensionDataSource {
  configuration?: AIConversationStarterConfiguration;
  constructor(configuration?: AIConversationStarterConfiguration) {
    super()
    this.configuration = configuration

  }
  override addExtension(): void {
    ChatConfigurator.enable((dataSource: any) => new AIConversationStarterDecorator(dataSource, this.configuration));
  }
  override getExtensionId(): string {
    return "conversation-starter";
  }

}