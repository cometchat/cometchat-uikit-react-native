import { MessageBubbleAlignmentType } from "../constants/UIKitConstants";
import { CometChatMessageComposerActionInterface } from "../helper/types";
import { CometChatMessageOption, CometChatMessageTemplate } from "../modals";
import { CometChatTheme } from "../resources/CometChatTheme";
import { VideoBubbleStyleInterface, ImageBubbleStyleInterface, AudioBubbleStyleInterface, FileBubbleStyleInterface } from "../views";
import { DataSource } from "./DataSource";
import { CometChat } from "@cometchat/chat-sdk-react-native";

export class DataSourceDecorator implements DataSource {

   dataSource: DataSource;

   constructor(dataSource: DataSource) {
      this.dataSource = dataSource
   }

   getId(): string {
      throw new Error("Method not implemented.");
   }

   getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
      return this.dataSource.getTextMessageOptions(loggedInUser, messageObject, group)
   }

   getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
      return this.dataSource.getAudioMessageOptions(loggedInUser, messageObject, group)
   }

   getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
      return this.dataSource.getVideoMessageOptions(loggedInUser, messageObject, group)
   }

   getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
      return this.dataSource.getImageMessageOptions(loggedInUser, messageObject, group)
   }

   getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
      return this.dataSource.getFileMessageOptions(loggedInUser, messageObject, group);
   }

   getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
      return this.dataSource.getMessageOptions(loggedInUser, messageObject, group);
   }

   getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
      return this.dataSource.getCommonOptions(loggedInUser, messageObject, group);
   }

   getBottomView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) {
      return this.dataSource.getBottomView(message, alignment);
   }

   getDeleteMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme) {
      return this.dataSource.getDeleteMessageBubble(message, theme);
   }

   getVideoMessageBubble(videoUrl: string, thumbnailUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, videoBubbleStyle: VideoBubbleStyleInterface) {
      return this.dataSource.getVideoMessageBubble(videoUrl, thumbnailUrl, message, theme, videoBubbleStyle);
   }

   getTextMessageBubble(messageText: string, message: CometChat.TextMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme) {
      return this.dataSource.getTextMessageBubble(messageText, message, alignment, theme);
   }

   getImageMessageBubble(imageUrl: string, caption: string, style: ImageBubbleStyleInterface, message: CometChat.MediaMessage, theme: CometChatTheme) {
      return this.dataSource.getImageMessageBubble(imageUrl, caption, style, message, theme);
   }

   getAudioMessageBubble(audioUrl: string, title: string, style: AudioBubbleStyleInterface, message: CometChat.MediaMessage, theme: CometChatTheme) {
      return this.dataSource.getAudioMessageBubble(audioUrl, title, style, message, theme);
   }

   getFileMessageBubble(fileUrl: string, title: string, style: FileBubbleStyleInterface, message: CometChat.MediaMessage, theme: CometChatTheme) {
      return this.dataSource.getFileMessageBubble(fileUrl, title, style, message, theme);
   }

   getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme) {
      return this.dataSource.getGroupActionBubble(message, theme);
   }

   getTextMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme) {
      return this.dataSource.getTextMessageContentView(message, alignment, theme);
   }

   getAudioMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme) {
      return this.dataSource.getAudioMessageContentView(message, alignment, theme);
   }

   getVideoMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme) {
      return this.dataSource.getVideoMessageContentView(message, alignment, theme);
   }

   getImageMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme) {
      return this.dataSource.getImageMessageContentView(message, alignment, theme);
   }

   getFileMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme) {
      return this.dataSource.getFileMessageContentView(message, alignment, theme);
   }

   getTextMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
      return this.dataSource.getTextMessageTemplate(theme)
   }

   getAudioMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
      return this.dataSource.getAudioMessageTemplate(theme)
   }

   getVideoMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
      return this.dataSource.getVideoMessageTemplate(theme)
   }

   getImageMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
      return this.dataSource.getImageMessageTemplate(theme);
   }

   getFileMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
      return this.dataSource.getFileMessageTemplate(theme);
   }

   getAllMessageTemplates(theme: CometChatTheme): CometChatMessageTemplate[] {
      return this.dataSource.getAllMessageTemplates(theme);
   }

   getMessageTemplate(messageType: string, MessageCategory: string, theme: CometChatTheme): CometChatMessageTemplate {
      return this.dataSource.getMessageTemplate(messageType, MessageCategory, theme);
   }

   getGroupActionTemplate(theme: CometChatTheme): CometChatMessageTemplate {
      return this.dataSource.getGroupActionTemplate(theme);
   }

   getAllMessageTypes(): string[] {
      return this.dataSource.getAllMessageTypes();
   }

   getAllMessageCategories(): string[] {
      return this.dataSource.getAllMessageCategories();
   }

   getAuxiliaryOptions(user: CometChat.User, group: CometChat.Group, id: Map<string, any>, theme?:CometChatTheme) {
      return this.dataSource.getAuxiliaryOptions(user, group, id,theme);
   }

   getMessageTypeToSubtitle(messageType: string): string {
      return this.dataSource.getMessageTypeToSubtitle(messageType);
   }

   getAttachmentOptions(user?: any, group?: any, composerId?: any): CometChatMessageComposerActionInterface[] {
      return this.dataSource.getAttachmentOptions(user, group,composerId);
   };

   getAuxiliaryButtonOptions() {
      return this.dataSource.getAuxiliaryButtonOptions();
   };

   getLastConversationMessage(conversation: CometChat.Conversation): string {
      return this.dataSource.getLastConversationMessage(conversation);
   };

   getAuxiliaryHeaderAppbarOptions(user?: CometChat.User, group?: CometChat.Group, theme?: CometChatTheme) {
      return this.dataSource.getAuxiliaryHeaderAppbarOptions(user, group, theme);
   }
}