import { ChatConfigurator } from "../../shared";
import { AIExtensionDataSource } from "../AIExtensionDataSource";
import { AIConversationSummaryDecorator } from "./AIConversationSummaryDecorator";
import { AIConversationSummaryConfiguration } from "./configuration";

export class AIConversationSummaryExtension extends AIExtensionDataSource {
  private configuration?: AIConversationSummaryConfiguration;

  constructor(configuration?: AIConversationSummaryConfiguration) {
    super();
    this.configuration = configuration;
  }

  override addExtension(): void {
    ChatConfigurator.enable((dataSource: any) => new AIConversationSummaryDecorator(dataSource, this.configuration));
  }

  override getExtensionId(): string {
    return "conversation-summary";
  }
}