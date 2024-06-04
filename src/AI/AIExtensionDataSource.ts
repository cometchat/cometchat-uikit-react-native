import { ExtensionsDataSource } from "../shared/framework/ExtensionsDataSource";
import { AIEnablerConfiguration } from "./configuration";

export abstract class AIExtensionDataSource extends ExtensionsDataSource {
   getConfiguration():any{
    
   };
   setConfiguration(config?:AIEnablerConfiguration):void{
    
   };

}