import { TextBubbleStyle ,TextBubbleStyleInterface } from '../../shared';
import { CometChatTheme } from "../../shared/resources/CometChatTheme";
import { CollaborativeBubbleStyleInterface } from '../CollaborativeBubble/CollaborativeBubbleStyle';

export interface CollaborativeDocumentConfigurationInterface
   {

     /**
   *
   *
   * @type {TextBubbleStyleInterface}
   * @description gives textbub bubble styling properties
   */
    collaborativeBubbleStyle?: CollaborativeBubbleStyleInterface;
    
    
   }
   export class CollaborativeDocumentConfiguration implements CollaborativeDocumentConfigurationInterface {
    collaborativeBubbleStyle: CollaborativeBubbleStyleInterface;
  
    constructor({
      collaborativeBubbleStyle = undefined,}:
      CollaborativeDocumentConfigurationInterface){
        this.collaborativeBubbleStyle  = collaborativeBubbleStyle
      }
  }