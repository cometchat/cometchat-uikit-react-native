import { ExtensionsDataSource, ChatConfigurator, DataSource } from "../../shared/framework";
import { CollaborativeDocumentExtensionDecorator } from "./CollaborativeDocumentExtensionDecorator";
import { CollaborativeDocumentConfiguration, CollaborativeDocumentConfigurationInterface } from "./CollaborativeDocumentConfiguration";
import { ExtensionConstants } from "../ExtensionConstants";



export class CollaborativeDocumentExtension extends ExtensionsDataSource {

    collaborativeDocumentConfigurationInterface ?:CollaborativeDocumentConfigurationInterface;

    constructor(collaborativeDocumentConfigurationConfiguration ?:CollaborativeDocumentConfigurationInterface){
        super();
        if(collaborativeDocumentConfigurationConfiguration!=null){
            this.collaborativeDocumentConfigurationInterface = collaborativeDocumentConfigurationConfiguration;
        }

    }


 /**
 * enable
 *  @description enables the Document  extension which includes Data profanity and data masking
 */

    override addExtension(): void {
        ChatConfigurator.enable(( dataSource : DataSource )=>{
            return new CollaborativeDocumentExtensionDecorator(dataSource , this.collaborativeDocumentConfigurationInterface);
        }  )
    }
    
    override getExtensionId(): string {
        return ExtensionConstants.document;
    }



}