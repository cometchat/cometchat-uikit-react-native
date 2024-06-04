import { ExtensionsDataSource, ChatConfigurator, DataSource } from "../../shared/framework";
import { CollaborativeWhiteboardExtensionDecorator } from "./CollaborativeWhiteboardExtensionDecorator";
import { CollaborativeWhiteboardConfigurationInterface } from "./CollaborativeWhiteboardConfiguration";
import { ExtensionConstants } from "../ExtensionConstants";



export class CollaborativeWhiteboardExtension extends ExtensionsDataSource {

    collaborativeWhiteBoardConfigurationInterface ?:CollaborativeWhiteboardConfigurationInterface;

    constructor(collaborativeWhiteboardConfigurationConfiguration ?:CollaborativeWhiteboardConfigurationInterface){
        super();
        if(collaborativeWhiteboardConfigurationConfiguration!=null){
            this.collaborativeWhiteBoardConfigurationInterface = collaborativeWhiteboardConfigurationConfiguration;
        }

    }


 /**
 * enable
 *  @description enables the Text moderation extension which includes Data profanity and data masking
 */

    //override addExtension method from ExtensionsDataSource interface
    override addExtension(): void {
        ChatConfigurator.enable(( dataSource : DataSource )=>{
            return new CollaborativeWhiteboardExtensionDecorator(dataSource , this.collaborativeWhiteBoardConfigurationInterface);
        }  )
    }
  
    //override getExtensionId method from ExtensionsDataSource interface
    override getExtensionId(): string {
      return ExtensionConstants.whiteboard;
    }

}