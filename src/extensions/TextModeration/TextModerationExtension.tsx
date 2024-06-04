import { ExtensionsDataSource, ChatConfigurator, DataSource } from "../../shared/framework";
import { TextModerationExtensionDecorator } from "./TextModerationExtensionDecorator";
import { TextModerationConfiguration, TextModerationConfigurationInterface } from "./TextModerationConfiguration";
import { ExtensionConstants } from "../ExtensionConstants";
import { CometChat } from "@cometchat/chat-sdk-react-native";


export class TextModerationExtension extends ExtensionsDataSource {

    textModerationConfigurationInterface ?:TextModerationConfigurationInterface;

    constructor(textModerationConfiguration ?:TextModerationConfigurationInterface){
      super();
        if(textModerationConfiguration!=null){
            this.textModerationConfigurationInterface = textModerationConfiguration;
        }

    }


 /**
 * enable
 *  @description enables the Text moderation extension which includes Data profanity and data masking
 */
    enable() {
        const promise1 = CometChat.isExtensionEnabled(ExtensionConstants.profanityFilter);
        const promise2 = CometChat.isExtensionEnabled(ExtensionConstants.dataMasking);
        Promise.all([promise1, promise2]).then((values) => {
          if(values.includes(true))
          {
            this.addExtension();
          }
        });
    }

    //override addExtension method from ExtensionsDataSource interface
    override addExtension(): void {
        ChatConfigurator.enable(( dataSource : DataSource )=>{
            return new TextModerationExtensionDecorator(dataSource , this.textModerationConfigurationInterface);
        }  )
    }
  
    //override getExtensionId method from ExtensionsDataSource interface
    override getExtensionId(): string {
      return ExtensionConstants.profanityFilter;
    }



}