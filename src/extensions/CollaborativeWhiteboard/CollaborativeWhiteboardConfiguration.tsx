import { TextBubbleStyle ,TextBubbleStyleInterface } from '../../shared';
import { CometChatTheme } from "../../shared/resources/CometChatTheme";
import { CollaborativeBubbleStyleInterface } from '../CollaborativeBubble/CollaborativeBubbleStyle';

export interface CollaborativeWhiteboardConfigurationInterface
   {

     /**
   *
   *
   * @type {TextBubbleStyleInterface}
   * @description gives textbub bubble styling properties
   */
    collaborativeBubbleStyle?: CollaborativeBubbleStyleInterface;
    
    
   }
   export class CollaborativeWhiteboardConfiguration implements CollaborativeWhiteboardConfigurationInterface {
    collaborativeBubbleStyle: CollaborativeBubbleStyleInterface;
  
    constructor({
      collaborativeBubbleStyle = undefined,}:
      CollaborativeWhiteboardConfigurationInterface){
        this.collaborativeBubbleStyle  = collaborativeBubbleStyle
      }
  }