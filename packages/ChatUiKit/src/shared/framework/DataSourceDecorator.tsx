import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatTheme } from "../../theme/type";
import { AdditionalAttachmentOptionsParams, AdditionalAuxiliaryHeaderOptionsParams, AdditionalAuxiliaryOptionsParams, AdditionalParams, MessageBubbleAlignmentType } from "../base/Types";
import {
  CometChatMentionsFormatter,
  CometChatTextFormatter,
  CometChatUrlsFormatter,
} from "../formatters";
import { CometChatMessageComposerAction } from "../helper/types";
import { CometChatMessageOption, CometChatMessageTemplate } from "../modals";
import { DataSource } from "./DataSource";
import { JSX } from "react";

export class DataSourceDecorator implements DataSource {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  getId(): string {
    throw new Error("Method not implemented.");
  }

  getTextMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams,
  ): CometChatMessageOption[] {
    return this.dataSource.getTextMessageOptions(loggedInUser, messageObject, theme, group, additionalParams);
  }

  getAudioMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams,
  ): CometChatMessageOption[] {
    return this.dataSource.getAudioMessageOptions(loggedInUser, messageObject, theme, group, additionalParams);
  }

  getVideoMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams,
  ): CometChatMessageOption[] {
    return this.dataSource.getVideoMessageOptions(loggedInUser, messageObject, theme, group, additionalParams);
  }

  getImageMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams,
  ): CometChatMessageOption[] {
    return this.dataSource.getImageMessageOptions(loggedInUser, messageObject, theme, group, additionalParams);
  }

  getFileMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams,
  ): CometChatMessageOption[] {
    return this.dataSource.getFileMessageOptions(loggedInUser, messageObject, theme, group, additionalParams);
  }

  getMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams,
  ): CometChatMessageOption[] {
    return this.dataSource.getMessageOptions(loggedInUser, messageObject, theme, group, additionalParams);
  }

  getCommonOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams,
  ): CometChatMessageOption[] {
    return this.dataSource.getCommonOptions(loggedInUser, messageObject, theme, group, additionalParams);
  }

  getBottomView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) {
    return this.dataSource.getBottomView(message, alignment);
  }

  getDeleteMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme) {
    return this.dataSource.getDeleteMessageBubble(message, theme);
  }

  getVideoMessageBubble(
    videoUrl: string,
    thumbnailUrl: string,
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element | null {
    return this.dataSource.getVideoMessageBubble(videoUrl, thumbnailUrl, message, theme);
  }

  getTextMessageBubble(
    messageText: string,
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ) {
    return this.dataSource.getTextMessageBubble(
      messageText,
      message,
      alignment,
      theme,
      additionalParams
    );
  }

  getImageMessageBubble(
    imageUrl: string,
    caption: string,
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ) {
    return this.dataSource.getImageMessageBubble(imageUrl, caption, message, theme);
  }

  getAudioMessageBubble(
    audioUrl: string,
    title: string,
    style: {}, //ToDoM: remove any
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ) {
    return this.dataSource.getAudioMessageBubble(audioUrl, title, style, message, theme);
  }

  getFileMessageBubble(
    fileUrl: string,
    title: string,
    style: any, //ToDoM: remove any
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ) {
    return this.dataSource.getFileMessageBubble(fileUrl, title, style, message, theme);
  }

  getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme) {
    return this.dataSource.getGroupActionBubble(message, theme);
  }

    getAgentAssistantMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element {
    return this.dataSource.getAgentAssistantMessageBubble(message, theme);
  }
  getAgentAssistantMessageTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return this.dataSource.getAgentAssistantMessageTemplate(theme, additionalParams);
  }

  getTextMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ) {
    return this.dataSource.getTextMessageContentView(message, alignment, theme, additionalParams);
  }

  getAudioMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ) {
    return this.dataSource.getAudioMessageContentView(message, alignment, theme);
  }

  getVideoMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ) {
    return this.dataSource.getVideoMessageContentView(message, alignment, theme);
  }

  getImageMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ) {
    return this.dataSource.getImageMessageContentView(message, alignment, theme);
  }

  getFileMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ) {
    return this.dataSource.getFileMessageContentView(message, alignment, theme);
  }

  getTextMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate {
    return this.dataSource.getTextMessageTemplate(theme, additionalParams);
  }

  getFormMessageTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return this.dataSource.getFormMessageTemplate(theme, additionalParams);
  }

  getSchedulerMessageTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return this.dataSource.getSchedulerMessageTemplate(theme, additionalParams);
  }

  getCardMessageTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return this.dataSource.getCardMessageTemplate(theme, additionalParams);
  }

  getCardBubbleTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return this.dataSource.getCardBubbleTemplate(theme, additionalParams);
  }

  getCardBubbleContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element {
    return this.dataSource.getCardBubbleContentView(message, alignment, theme, additionalParams);
  }

  getAudioMessageTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return this.dataSource.getAudioMessageTemplate(theme, additionalParams);
  }

  getVideoMessageTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return this.dataSource.getVideoMessageTemplate(theme, additionalParams);
  }

  getImageMessageTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return this.dataSource.getImageMessageTemplate(theme, additionalParams);
  }

  getFileMessageTemplate(theme: CometChatTheme, additionalParams?: AdditionalParams): CometChatMessageTemplate {
    return this.dataSource.getFileMessageTemplate(theme, additionalParams);
  }

  getAllMessageTemplates(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate[] {
    return this.dataSource.getAllMessageTemplates(theme, additionalParams);
  }

  getMessageTemplate(
    messageType: string,
    MessageCategory: string,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams,
    message?: CometChat.BaseMessage
  ): CometChatMessageTemplate | null {
    return this.dataSource.getMessageTemplate(messageType, MessageCategory, theme, additionalParams, message);
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

  getAuxiliaryOptions(
    user: CometChat.User,
    group: CometChat.Group,
    id: Map<string, any>,
    additionalAuxiliaryParams?: AdditionalAuxiliaryOptionsParams
  ) {
    return this.dataSource.getAuxiliaryOptions(user, group, id, additionalAuxiliaryParams);
  }

  getMessageTypeToSubtitle(messageType: string): string {
    return this.dataSource.getMessageTypeToSubtitle(messageType);
  }

  getAttachmentOptions(
    theme: CometChatTheme,
    user?: any,
    group?: any,
    composerId?: any,
    additionalAttachmentOptionsParams?: AdditionalAttachmentOptionsParams
  ): CometChatMessageComposerAction[] {
    return this.dataSource.getAttachmentOptions(theme, user, group, composerId, additionalAttachmentOptionsParams);
  }

  getAuxiliaryButtonOptions() {
    return this.dataSource.getAuxiliaryButtonOptions();
  }

  getLastConversationMessage(
    conversation: CometChat.Conversation,
    theme?: CometChatTheme
  ): string | JSX.Element {
    return this.dataSource.getLastConversationMessage(conversation, theme);
  }

  getAuxiliaryHeaderAppbarOptions(
    user?: CometChat.User,
    group?: CometChat.Group,
    additionalAuxiliaryHeaderOptionsParams?: AdditionalAuxiliaryHeaderOptionsParams
  ) {
    return this.dataSource.getAuxiliaryHeaderAppbarOptions(user, group, additionalAuxiliaryHeaderOptionsParams);
  }

  getAllTextFormatters(loggedInUser?: CometChat.User, theme?: CometChatTheme): CometChatTextFormatter[] {
    return [
      this.dataSource.getMentionsFormatter(loggedInUser, theme),
      this.dataSource.getUrlsFormatter(loggedInUser),
    ];
  }

  getMentionsFormatter(loggedInUser?: CometChat.User, theme?: CometChatTheme): CometChatMentionsFormatter {
    return this.dataSource.getMentionsFormatter(loggedInUser, theme);
  }

  getUrlsFormatter(loggedInUser?: CometChat.User): CometChatUrlsFormatter {
    return this.dataSource.getUrlsFormatter(loggedInUser);
  }

  getMessagePreviewSubtitle(message: CometChat.BaseMessage): string {
    return this.dataSource.getMessagePreviewSubtitle(message);
  }

  getReplyView(
    message: CometChat.BaseMessage,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element | null {
    return this.dataSource.getReplyView?.(message, theme, additionalParams) || null;
  }
}
