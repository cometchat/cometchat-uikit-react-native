import { TextBubbleStyle ,TextBubbleStyleInterface } from '../../shared';
import { CometChatTheme } from "../../shared/resources/CometChatTheme";

export interface TextModerationConfigurationInterface
   {

     /**
   *
   *
   * @type {TextBubbleStyleInterface}
   * @description gives textbub bubble styling properties
   */
    textBubbleStyle?: TextBubbleStyleInterface;
    
  
   }
export class TextModerationConfiguration implements TextModerationConfigurationInterface {
  textBubbleStyle: TextBubbleStyleInterface;

  constructor({
    textBubbleStyle = undefined,}:
     TextModerationConfigurationInterface){
      this.textBubbleStyle  = textBubbleStyle
    }
}
