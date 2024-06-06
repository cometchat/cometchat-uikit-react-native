import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatMessageOption } from "./CometChatMessageOption";
import { MessageBubbleAlignmentType } from "../base/Types";

/**
 * Represents the interface for a message template.
 */
interface MessageTemplateInterface {
    /**
     * The category of the message template.
     */
    category: string,

    /**
     * The type of the message template.
     */
    type: (typeof CometChat.MESSAGE_TYPE)[keyof typeof CometChat.MESSAGE_TYPE],

    /**
     * The content view of the message template.
     * @param messageObject - The message object.
     * @param alignment - The alignment of the message bubble.
     * @returns The JSX element representing the content view.
     */
    ContentView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element,

    /**
     * The bubble view of the message template.
     * @param messageObject - The message object.
     * @returns The JSX element representing the bubble view.
     */
    BubbleView?: (messageObject: CometChat.BaseMessage) => JSX.Element,

    /**
     * The bottom view of the message template.
     * @param messageObject - The message object.
     * @returns The JSX element representing the bottom view.
     */
    BottomView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element,

    /**
     * The header view of the message template.
     * @param messageObject - The message object.
     * @param alignment - The alignment of the message bubble.
     * @returns The JSX element representing the header view.
     */
    HeaderView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element,

    /**
     * The status info view of the message template for DateTime and Receipt.
     * @param messageObject - The message object.
     * @param alignment - The alignment of the message bubble.
     * @returns The JSX element representing the status info view.
     */
    StatusInfoView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element,

    /**
     * The footer view of the message template.
     * @param messageObject - The message object.
     * @param alignment - The alignment of the message bubble.
     * @returns The JSX element representing the footer view.
     */
    FooterView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element,

    /**
     * The options of the message template.
     * @param loggedInUser - The logged in user.
     * @param messageObject - The message object.
     * @param group - The group.
     * @returns The array of CometChatMessageOption.
     */
    options?: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group?: CometChat.Group) => CometChatMessageOption[],
}

/**
 * Represents a message template for CometChat.
 */
export class CometChatMessageTemplate implements MessageTemplateInterface {
    /**
     * The category of the message template.
     */
    category: string;
    /**
     * The type of the message template.
     */
    type: (typeof CometChat.MESSAGE_TYPE)[keyof typeof CometChat.MESSAGE_TYPE];
    /**
     * The content view of the message template.
     * @param messageObject - The message object.
     * @param alignment - The alignment of the message bubble.
     * @returns The JSX element representing the content view.
     */
    ContentView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element;
    /**
     * The bubble view of the message template.
     * @param messageObject - The message object.
     * @returns The JSX element representing the bubble view.
     */
    BubbleView?: (messageObject: CometChat.BaseMessage) => JSX.Element;
    /**
     * The bottom view of the message template.
     * @param messageObject - The message object.
     * @returns The JSX element representing the bottom view.
     */
    BottomView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element;
    /**
     * The header view of the message template.
     * @param messageObject - The message object.
     * @param alignment - The alignment of the message bubble.
     * @returns The JSX element representing the header view.
     */
    HeaderView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element;
    /**
     * The status info view of the message template for DateTime and Receipt.
     * @param messageObject - The message object.
     * @param alignment - The alignment of the message bubble.
     * @returns The JSX element representing the status info view.
     */
    StatusInfoView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element;
    /**
     * The footer view of the message template.
     * @param messageObject - The message object.
     * @param alignment - The alignment of the message bubble.
     * @returns The JSX element representing the footer view.
     */
    FooterView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element;
    /**
     * The options of the message template.
     * @param loggedInUser - The logged in user.
     * @param messageObject - The message object.
     * @param group - The group.
     * @returns The array of CometChatMessageOption.
     */
    options?: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group?: CometChat.Group) => CometChatMessageOption[];

    /**
     * Constructs a new instance of the CometChatMessageTemplate class.
     * @param {MessageTemplateInterface} options - The options for the message template.
     */
    constructor({
        category = "MESSAGE",
        type = CometChat.MESSAGE_TYPE.TEXT,
        ContentView,
        BottomView,
        BubbleView,
        HeaderView,
        StatusInfoView,
        FooterView,
        options,
    }: MessageTemplateInterface) {
        this.category = category;
        this.type = type;
        this.ContentView = ContentView;
        this.BottomView = BottomView;
        this.BubbleView = BubbleView;
        this.HeaderView = HeaderView;
        this.StatusInfoView = StatusInfoView;
        this.FooterView = FooterView;
        this.options = options;
    }
}