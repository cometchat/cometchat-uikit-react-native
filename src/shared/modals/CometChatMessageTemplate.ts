import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatOptions } from "./CometChatOptions";
import { MessageBubbleAlignmentType, MessageListAlignmentType } from "../constants/UIKitConstants";
import { CometChatMessageOption } from "./CometChatMessageOption";

interface MessageTemplateInterface {
    category: string,
    type: (typeof CometChat.MESSAGE_TYPE)[keyof typeof CometChat.MESSAGE_TYPE],
    ContentView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element,
    BubbleView?: (messageObject: CometChat.BaseMessage) => JSX.Element,
    HeaderView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element,
    FooterView?: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element,
    options?: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group) => CometChatMessageOption[],
}

export class CometChatMessageTemplate implements MessageTemplateInterface {
    category: string
    type: (typeof CometChat.MESSAGE_TYPE)[keyof typeof CometChat.MESSAGE_TYPE]
    ContentView: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element
    BubbleView: (messageObject: CometChat.BaseMessage) => JSX.Element
    HeaderView: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element
    FooterView: (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => JSX.Element
    options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group) => CometChatMessageOption[]

    constructor({
        category = "MESSAGE",
        type = CometChat.MESSAGE_TYPE.TEXT,
        ContentView,
        BubbleView,
        HeaderView,
        FooterView,
        options,
    }: MessageTemplateInterface) {
        this.category = category;
        this.type = type;
        this.ContentView = ContentView;
        this.BubbleView = BubbleView;
        this.HeaderView = HeaderView;
        this.FooterView = FooterView;
        this.options = options;
    }
}