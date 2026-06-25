import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatTheme } from "../../theme/type";
import {
  AdditionalAttachmentOptionsParams,
  AdditionalAuxiliaryHeaderOptionsParams,
  AdditionalAuxiliaryOptionsParams,
  AdditionalParams,
  MessageBubbleAlignmentType,
} from "../base/Types";
import {
  CometChatMentionsFormatter,
  CometChatTextFormatter,
  CometChatUrlsFormatter,
} from "../formatters";
import { CometChatMessageComposerAction } from "../helper/types";
import { CometChatMessageOption } from "../modals/CometChatMessageOption";
import { CometChatMessageTemplate } from "../modals/CometChatMessageTemplate";
import { JSX } from "react";

export interface DataSource {
  //message options based on types
  getTextMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): Array<CometChatMessageOption>;
  getAudioMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): Array<CometChatMessageOption>;
  getVideoMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): Array<CometChatMessageOption>;
  getImageMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): Array<CometChatMessageOption>;
  getFileMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): Array<CometChatMessageOption>;
  getMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): Array<CometChatMessageOption>;
  getCommonOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): Array<CometChatMessageOption>;

  //views
  getBottomView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType
  ): JSX.Element | null;
  getReplyView?(
    message: CometChat.BaseMessage,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element | null;
  getDeleteMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element;
  getVideoMessageBubble(
    videoUrl: string,
    thumbnailUrl: string,
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element | null;
  getTextMessageBubble(
    messageText: string,
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element;
  getImageMessageBubble(
    imageUrl: string,
    caption: string,
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element;
  getAudioMessageBubble(
    audioUrl: string,
    title: string,
    style: any, //ToDoM: remove any
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element;
  getFileMessageBubble(
    fileUrl: string,
    title: string,
    style: any, //ToDoM: remove any
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element;
  getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element | null;
  getAgentAssistantMessageBubble: (message: CometChat.BaseMessage, theme: CometChatTheme) => JSX.Element;
  getAgentAssistantMessageTemplate: (theme: CometChatTheme, additionalParams?: AdditionalParams) => CometChatMessageTemplate;
  //content views
  getTextMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element;
  getAudioMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ): JSX.Element;
  getVideoMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ): JSX.Element | null;
  getImageMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ): JSX.Element | null;
  getFileMessageContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ): JSX.Element;

  //templates
  getTextMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getAudioMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getVideoMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getImageMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getFileMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getAllMessageTemplates(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): Array<CometChatMessageTemplate>;
  getMessageTemplate(
    messageType: string,
    MessageCategory: string,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams,
    message?: CometChat.BaseMessage
  ): CometChatMessageTemplate | null;
  getGroupActionTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getFormMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getSchedulerMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getCardMessageTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getCardBubbleTemplate(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate;
  getCardBubbleContentView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element;

  //attachment options
  // getAttachmentOptions(theme: CometChatTheme, conversation: CometChat.User | CometChat.Group): Array<CometChatMessageComposerAction>

  getAllMessageTypes(): Array<string>;
  getAllMessageCategories(): Array<string>;

  //auxiliary options
  getAuxiliaryOptions(
    user?: CometChat.User,
    group?: CometChat.Group,
    id?: Map<string, any>,
    additionalAuxiliaryParams?: AdditionalAuxiliaryOptionsParams
  ): JSX.Element[];

  getId(): string;

  //unknown
  getMessageTypeToSubtitle(messageType: string): string;
  //Message Composer
  getAttachmentOptions: (
    theme: CometChatTheme,
    user?: any,
    group?: any,
    composerId?: any,
    additionalAttachmentOptionsParams?: AdditionalAttachmentOptionsParams
  ) => any;
  getAuxiliaryButtonOptions: () => any;

  getLastConversationMessage(
    conversation: CometChat.Conversation,
    theme?: CometChatTheme
  ): string | JSX.Element;

  getAuxiliaryHeaderAppbarOptions(
    user?: CometChat.User,
    group?: CometChat.Group,
    additionalAuxiliaryHeaderOptionsParams?: AdditionalAuxiliaryHeaderOptionsParams
  ): JSX.Element | null;

  getAllTextFormatters(loggedInUser?: CometChat.User, theme?: CometChatTheme): CometChatTextFormatter[];
  getMentionsFormatter(
    loggedInUser?: CometChat.User,
    theme?: CometChatTheme
  ): CometChatMentionsFormatter;
  getUrlsFormatter(loggedInUser?: CometChat.User): CometChatUrlsFormatter;
  
  getMessagePreviewSubtitle(message: CometChat.BaseMessage): string;
}
