import { DataSource, DataSourceDecorator } from "../../shared/framework";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageBubbleAlignmentType } from "../../shared/constants/UIKitConstants";
import { CometChatTheme } from "../../shared/resources/CometChatTheme";
import { ExtensionConstants } from "../ExtensionConstants";
import { getExtentionData } from "../ExtensionModerator";
import { TextModerationConfigurationInterface } from "./TextModerationConfiguration";

import { MessageTypeConstants, MessageCategoryConstants } from "../../shared/constants/UIKitConstants";

export class TextModerationExtensionDecorator extends DataSourceDecorator {

    textModerationConfiguration ?:TextModerationConfigurationInterface ;

    constructor( dataSource : DataSource, textModerationConfiguration ?:TextModerationConfigurationInterface ){
        super(dataSource);
        if(textModerationConfiguration != undefined){

            this.textModerationConfiguration = textModerationConfiguration
        }
    }

    getTextMessageBubble(messageText: string, message: CometChat.TextMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme) {
        
        var text : string = this.checkModeration(message)
        return super.getTextMessageBubble(text , message , alignment, theme);
     }


     checkModeration(messageObject : CometChat.TextMessage):string {
        
         var messageText :string  =  messageObject['text']  ;

        const maskedData = getExtentionData(
            messageObject,
            ExtensionConstants.dataMasking
        );

        if (
            maskedData &&
            maskedData.hasOwnProperty("data") &&
            maskedData.data.hasOwnProperty(ExtensionConstants.sensitiveData) &&
            maskedData.data.hasOwnProperty(ExtensionConstants.messageMasked) &&
            maskedData.data.sensitive_data === "yes"
        ) {
            messageText = maskedData.data.message_masked;
        }

        //profanity extensions data
        const profaneData = getExtentionData(
            messageObject,
            ExtensionConstants.profanityFilter
        );
            
        if (
            profaneData &&
            profaneData.hasOwnProperty(ExtensionConstants.profanity) &&
            profaneData.hasOwnProperty(ExtensionConstants.messageClean) &&
            profaneData.profanity === "yes"
        ) {
            messageText = profaneData.message_clean;
        }

        return messageText;
    }


    getId(): string {
        return("textModeration");
     }


     getLastConversationMessage(conversation  : CometChat.Conversation) : string {

        if(conversation['lastMessage']==undefined){
            return "";
        }

        if(conversation['lastMessage'].type == MessageTypeConstants.text &&
            conversation['lastMessage'].category==  MessageCategoryConstants.message
            ){
            let text : string = this.checkModeration(conversation['lastMessage']);
          return text;
        }else{

           return super.getLastConversationMessage(conversation) ;     
        }
    

    };

}