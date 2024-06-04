import {  AIConversationStarterDecorator } from "./AIConversationStarterDecorator";
import { ExtensionsDataSource,ChatConfigurator } from "../../shared";
import { AIExtensionDataSource } from "../AIExtensionDataSource";
import { AIConversationStarterConfiguration } from "./configuration";
import { AIEnablerConfiguration } from "../configuration";
export class AIConversationStarterExtension extends AIExtensionDataSource {
  configuration?:AIConversationStarterConfiguration;
  constructor(configuration?:AIConversationStarterConfiguration){
    super()
    this.configuration = configuration

  }
  override addExtension(): void {
    ChatConfigurator.enable((dataSource: any) => new AIConversationStarterDecorator(dataSource,this.configuration));
  }
  override getExtensionId(): string {
    return "conversation-starter";
  }
  override enable(): void {
    this.addExtension()
  }
 override  getConfiguration():AIConversationStarterConfiguration{
return this.configuration
  }
  override   setConfiguration(config?:AIEnablerConfiguration):void{
    this.configuration = {...this.configuration,...config}
    this.configuration.conversationStarterStyle = {
      ...this.configuration.conversationStarterStyle,
      ...(config?.listItemStyle || config?.listStyle)
    };
  };

}