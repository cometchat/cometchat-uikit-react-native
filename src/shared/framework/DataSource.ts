//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageBubbleAlignmentType } from "../constants/UIKitConstants";
import { CometChatMessageOption } from "../modals/CometChatMessageOption";
import { CometChatMessageTemplate } from "../modals/CometChatMessageTemplate";
import { CometChatTheme } from "../resources/CometChatTheme";
import { AudioBubbleStyleInterface } from "../views/CometChatAudioBubble";
import { FileBubbleStyleInterface } from "../views/CometChatFileBubble";
import { ImageBubbleStyleInterface } from "../views/CometChatImageBubble";
import { VideoBubbleStyleInterface } from "../views/CometChatVideoBubble";
import { CometChatMessageComposerActionInterface } from "../helper/types";
import { AIOptionsStyle } from "../../AI/AIOptionsStyle";
import { CardMessage, FormMessage } from "../modals/InteractiveData";
import { FormBubbleStyle } from "../views/CometChatFormBubble/FormBubbleStyle";
import { CardBubbleStyle } from "../views/CometChatCardBubble/CardBubbleStyle";

export interface DataSource {
    //message options based on types
    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): Array<CometChatMessageOption>
    getFormMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): Array<CometChatMessageOption>
    getCardMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): Array<CometChatMessageOption>
    getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): Array<CometChatMessageOption>
    getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): Array<CometChatMessageOption>
    getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): Array<CometChatMessageOption>
    getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): Array<CometChatMessageOption>
    getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): Array<CometChatMessageOption>
    getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): Array<CometChatMessageOption>

    
    //views
    getBottomView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType): JSX.Element
    getDeleteMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element
    getVideoMessageBubble(videoUrl: string, thumbnailUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, videoBubbleStyle: VideoBubbleStyleInterface)
    getTextMessageBubble(messageText: string, message: CometChat.TextMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element
    getFormMessageBubble(message: FormMessage, theme: CometChatTheme, style?: FormBubbleStyle, onSubmitClick?: (data: any) => void): JSX.Element
    getCardMessageBubble(message: CardMessage, theme: CometChatTheme, style?: CardBubbleStyle, onSubmitClick?: (data: any) => void): JSX.Element
    getImageMessageBubble(imageUrl: string,caption: string,style: ImageBubbleStyleInterface,message: CometChat.MediaMessage, theme: CometChatTheme): JSX.Element
    getAudioMessageBubble(audioUrl: string, title: string, style: AudioBubbleStyleInterface, message: CometChat.MediaMessage, theme: CometChatTheme): JSX.Element
    getFileMessageBubble(fileUrl: string,title: string,style: FileBubbleStyleInterface, message: CometChat.MediaMessage , theme: CometChatTheme): JSX.Element
    getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element


    //content views
    getTextMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element
    getFormMessageContentView(message: FormMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element
    getCardMessageContentView(message: CardMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element
    getAudioMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element
    getVideoMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element
    getImageMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element
    getFileMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element


    //templates
    getTextMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate
    getFormMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate
    getCardMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate
    getAudioMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate
    getVideoMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate
    getImageMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate
    getFileMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate
    getAllMessageTemplates(theme: CometChatTheme): Array<CometChatMessageTemplate>
    getMessageTemplate(messageType: string, MessageCategory: string, theme: CometChatTheme): CometChatMessageTemplate | null
    getGroupActionTemplate(theme: CometChatTheme): CometChatMessageTemplate

    //attachment options
    // getAttachmentOptions(theme: CometChatTheme, conversation: CometChat.User | CometChat.Group): Array<CometChatMessageComposerAction>

    getAllMessageTypes():Array<string>
    getAllMessageCategories():Array<string>

    //auxiliary options
    getAuxiliaryOptions(user: CometChat.User, group: CometChat.Group, id: Map<string, any>, theme?:CometChatTheme): JSX.Element[]

    getId():string
    
    //unknown
    getMessageTypeToSubtitle(messageType: string): string
    //Message Composer
    getAttachmentOptions: (user?: any, group?: any, composerId?: any) => any;
    getAuxiliaryButtonOptions: () => any;

    getLastConversationMessage(conversation  : CometChat.Conversation): string
    
    getAuxiliaryHeaderAppbarOptions(user?: CometChat.User, group?: CometChat.Group, theme?: CometChatTheme): JSX.Element

    getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: Map<String, any>, AIOptionsStyle?: AIOptionsStyle): Array<(CometChatMessageComposerActionInterface | CometChatMessageOption)> 
}