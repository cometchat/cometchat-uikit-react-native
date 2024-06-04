import { ChatConfigurator } from "../../shared";
import { AIExtensionDataSource } from "../AIExtensionDataSource";
import { AIAssistBotDecorator } from "./AIAssistBotDecorator";
import { AIAssistBotConfiguration } from "./configuration";
export class AIAssistBotExtension extends AIExtensionDataSource {
  private configuration?: AIAssistBotConfiguration;
	
	constructor(configuration?: AIAssistBotConfiguration) {
	  super();
	  this.configuration = configuration;
	}
  
	override addExtension(): void {
    ChatConfigurator.enable((dataSource: any) => new AIAssistBotDecorator(dataSource, this.configuration));
  }

  override getExtensionId(): string {
    return "bots";
  }


}