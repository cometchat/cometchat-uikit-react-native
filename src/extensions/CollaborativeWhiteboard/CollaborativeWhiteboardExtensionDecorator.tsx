import { DataSource, DataSourceDecorator } from "../../shared/framework";
// @ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageBubbleAlignmentType , MetadataConstants, MessageCategoryConstants , MessageTypeConstants,ReceiverTypeConstants } from "../../shared/constants/UIKitConstants";
import { CometChatTheme } from "../../shared/resources/CometChatTheme";
import { ExtensionConstants } from "../ExtensionConstants";
import { ExtensionTypeConstants } from "../ExtensionConstants";
import { getExtentionData } from "../ExtensionModerator";
import { CollaborativeWhiteboardConfigurationInterface } from "./CollaborativeWhiteboardConfiguration";
import { localize } from "../../shared/resources/CometChatLocalize";
import { CometChatMessageComposerActionInterface } from "../../shared/helper/types";
import { CometChatMessageTemplate } from "../../shared/modals"; 
import { ChatConfigurator } from "../../shared/framework";
import { CometChatCollaborativeBubble } from "../CollaborativeBubble/CometChatCollaborativeBubble";
import { CometChatUIEvents, MessageEvents } from '../../shared/events';
// @ts-ignore
import React from 'react';
// @ts-ignore
import { View, Text} from 'react-native';
import {
    WHITEBOARDICON,COLLABORATIVEWHITEBOARDICON
} from "./resources";
import { CometChatUIEventHandler } from "../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";

export class CollaborativeWhiteboardExtensionDecorator extends DataSourceDecorator {

    whiteboardConfiguration ?:CollaborativeWhiteboardConfigurationInterface ;
    whiteboardUrl : string =  "v1/create";

    loggedInUser: CometChat.User;

    constructor( dataSource : DataSource, textModerationConfiguration ?:CollaborativeWhiteboardConfigurationInterface ){
        super(dataSource);
        if(textModerationConfiguration != undefined){

            this.whiteboardConfiguration = textModerationConfiguration
        }

        CometChat.getLoggedinUser()
            .then(u => { this.loggedInUser = u })
            .catch(err => console.log(err));
    }



    isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
    }

    getId(): string {
        return("CollaborativeWhiteBoard");
     }


     getLastConversationMessage(conversation  : CometChat.Conversation) : string {

        if(conversation['lastMessage']==undefined){
            return "";
        }

        if(conversation['lastMessage']['type'] == ExtensionTypeConstants.whiteboard  &&
            conversation['lastMessage']['category']==  MessageCategoryConstants.custom
            ){
          return localize('CUSTOM_MESSAGE_WHITEBOARD');
        }else{
           return super.getLastConversationMessage(conversation) ;     
        }
    

    };


    getAllMessageCategories(): string[] {
        var categoryList:string[]   = super.getAllMessageCategories();
        if(! categoryList.includes( MessageCategoryConstants.custom) ){
            categoryList.push(MessageCategoryConstants.custom);
        }
        return categoryList;
    }


    getAllMessageTypes(): string[] {
        var messagesTypes:string[]  = super.getAllMessageTypes();
        messagesTypes.push(ExtensionTypeConstants.whiteboard)
        return messagesTypes;
    }


    getAttachmentOptions(
        user?: any,
        group?: any,
        composerId?: any
    ): CometChatMessageComposerActionInterface[] {
      let attachmentOptions : CometChatMessageComposerActionInterface[] = super.getAttachmentOptions(user, group, composerId)
      if(composerId == undefined || (composerId as Map<any, any>).get("parentMessageId") == undefined)
          attachmentOptions.push({
              id: "whiteboard",
              title: localize("COLLABORATIVE_WHITEBOARD"),
              iconUrl: COLLABORATIVEWHITEBOARDICON,
              onPress: (user, group) => {
                  this.shareCollaborativeWhiteboard(user, group);
              },
          });
      return attachmentOptions;
    }


     shareCollaborativeWhiteboard (user ?: CometChat.User , group ?:CometChat.Group)  {
        CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccToggleBottomSheet, {
            isBottomSheetVisible: false,
        });
        let receiverId :string;
        let receiverType: string;

        if(user!=undefined){
            
            receiverId= user['uid'];
            receiverType = ReceiverTypeConstants.user
        }else if(group!=undefined){
            receiverId= group['guid'];
            receiverType = ReceiverTypeConstants.group
        }else{
           
        }
        
        
        CometChat.callExtension(
          ExtensionConstants.whiteboard,
          ExtensionConstants.post,
          this.whiteboardUrl,
          {
            receiver: receiverId,
            receiverType: receiverType,
          }
        ).then(response => {
           console.log("extension sent ",response )
        }).catch((error) => {
            console.log("error", error);
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageError, error);
        });
      }


    

    getAllMessageTemplates(theme: CometChatTheme): CometChatMessageTemplate[] {
        let templateList  :  CometChatMessageTemplate[] = super.getAllMessageTemplates(theme );



        templateList.push(new CometChatMessageTemplate({
            type: ExtensionTypeConstants.whiteboard,
            category: MessageCategoryConstants.custom,
            ContentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignmentType) => {
                if (this.isDeletedMessage(message)) {
                    return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
                } else {
                    return this.getCollaborativeBubble(message, _alignment);
                }
            },
            options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group)=>

            ChatConfigurator.dataSource.getMessageOptions(loggedInUser, messageObject,group),
        }));

        return templateList;
        
    }


    getCollaborativeBubble(message: CometChat.BaseMessage, _alignment: MessageBubbleAlignmentType){
        if (message && this.loggedInUser) {


            const whiteboardData = getExtentionData(
                message,
                MetadataConstants.extensions?.whiteboard
              );

              if (
                whiteboardData &&
                whiteboardData.board_url &&
                whiteboardData.board_url.trim().length
              ) {

                let username = this.loggedInUser?.['name']?.replace(" ", "_");
                
                let url:string = whiteboardData.board_url+"&username="+username

            return <CometChatCollaborativeBubble
            title = {localize("COLLABORATIVE_WHITEBOARD")}
            subTitle = {localize("OPEN_WHITEBOARD_TO_DRAW")}
            buttonText = {localize("OPEN_WHITEBOARD")}
            icon = {WHITEBOARDICON}
            url={url} 
              style={this.whiteboardConfiguration &&  this.whiteboardConfiguration.collaborativeBubbleStyle}
              /> ;
        }
 }

        return(  <View>
        <Text >{"no match"}</Text>
            </View>);
    }

    


}