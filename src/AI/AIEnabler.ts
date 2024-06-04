import {  ChatConfigurator, DataSource } from "../shared";
import { AIConversationStarterExtension } from "./AIConversationStarter/AIConversationStarter";
import {  AIEnablerDecorator } from "./AIEnablerDecorator";
import { AIExtensionDataSource } from "./AIExtensionDataSource";
import { AISmartRepliesExtension } from "./AISmartReplies/AISmartReplies";
import {CometChat} from '@cometchat/chat-sdk-react-native'
import { AIEnablerConfiguration } from "./configuration";
export class AIEnabler extends AIExtensionDataSource {
    defaultAIFeatures:AIExtensionDataSource[] | undefined;
    configuration?:AIEnablerConfiguration = {}
    constructor(defaultFeatures?:AIExtensionDataSource[], configuration?:AIEnablerConfiguration){
        super()
        this.configuration = configuration
        this.defaultAIFeatures = defaultFeatures
    }
  override addExtension(): void {

  }
  override getExtensionId(): string {
    return "ai-enabler";
  }
  override enable(): void {
    let features = {}
    if (this.defaultAIFeatures && this.defaultAIFeatures?.length >= 1) {
      const promiseArray = this.defaultAIFeatures.map((feature) => {
        return new Promise((resolve, reject) => {
          CometChat.isAIFeatureEnabled(feature.getExtensionId())
            .then((response) => {
              if (response) {
       
                if (feature.getExtensionId() !== "conversation-starter") {
                  feature?.enable();
                  features[feature.getExtensionId()] = {
                    enabled: true,
                    configuration: feature.getConfiguration(),
                    enabler: feature,
                  };
                }
                else{
                  feature.setConfiguration(this.configuration)
                  feature.enable();
                }
              }
              resolve(true); 
            })
            .catch((err) => {
              console.error(err);
              reject(err); 
            });
        });
      });
    
      Promise.all(promiseArray)
        .then(() => {
          if (Object.keys(features).length > 0) {
            ChatConfigurator.enable(
              (dataSource: DataSource) =>
                new AIEnablerDecorator(dataSource, features, this.configuration)
            );
          }
        })
        .catch((err) => {
          console.error('An error occurred:', err);
        });
    }
else if(this.defaultAIFeatures?.length == 0){
return;
}
else{
  let defaultFeatures: AIExtensionDataSource[] = [new AISmartRepliesExtension(), new AIConversationStarterExtension()];

  const promiseArray = defaultFeatures.map((feature) => {
    return new Promise((resolve, reject) => {
      CometChat.isAIFeatureEnabled(feature.getExtensionId())
        .then((response) => {
          if (response) {
       
            if (feature.getExtensionId() !== "conversation-starter") {
              feature?.enable();
              features[feature.getExtensionId()] = {
                enabled: true,
                configuration: feature.getConfiguration(),
                enabler: feature,
              };
            }
            else{
              feature.setConfiguration(this.configuration)
              feature.enable();
            }
          }
          resolve(true); 
        })
        .catch((err) => {
          console.error(err);
          reject(err); 
        });
    });
  });

  Promise.all(promiseArray)
    .then(() => {
      if (Object.keys(features).length > 0) {
        ChatConfigurator.enable(
          (dataSource: DataSource) =>
            new AIEnablerDecorator(dataSource, features, this.configuration)
        );
      }
    })
    .catch((err) => {
      console.error('An error occurred:', err);
    });
}
 }

}