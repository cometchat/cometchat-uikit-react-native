import React from "react";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatMessageTypes, GroupMemberScope, MessageBubbleAlignmentType, MessageCategoryConstants, MessageOptionConstants, MessageTypeConstants } from "../constants/UIKitConstants";
import { CometChatMessageOption } from "../modals/CometChatMessageOption";
import { CometChatMessageTemplate } from "../modals/CometChatMessageTemplate";
import { DataSource } from "./DataSource";
import { localize } from "../resources/CometChatLocalize";
import { CometChatTextBubble } from "../views/CometChatTextBubble"
import { CometChatVideoBubble, VideoBubbleStyleInterface } from "../views/CometChatVideoBubble";
import { CometChatTheme } from "../resources/CometChatTheme";
import { CometChatImageBubble, ImageBubbleStyleInterface } from "../views/CometChatImageBubble";
import { AudioBubbleStyleInterface, CometChatAudioBubble } from "../views/CometChatAudioBubble";
import { CometChatFileBubble, FileBubbleStyleInterface } from "../views/CometChatFileBubble";
import { ChatConfigurator } from "./ChatConfigurator";
import { CometChatMessageComposerActionInterface } from "../helper/types";
import { ICONS } from "./resources";
import { CometChatConversationUtils } from "../utils/conversationUtils";
import { AIOptionsStyle } from "../../AI/AIOptionsStyle";
import { CometChatFormBubble, CometChatCardBubble } from "../views";
import { CardMessage, FormMessage } from "../modals/InteractiveData";
import { FormBubbleStyle } from "../views/CometChatFormBubble/FormBubbleStyle";
import { CardBubbleStyle } from "../views/CometChatCardBubble/CardBubbleStyle";

function isAudioMessage(message: CometChat.BaseMessage): message is CometChat.MediaMessage {
    return message.getCategory() == CometChat.CATEGORY_MESSAGE &&
        message.getType() == CometChat.MESSAGE_TYPE.AUDIO;
}

function isVideoMessage(message: CometChat.BaseMessage): message is CometChat.MediaMessage {
    return message.getCategory() == CometChat.CATEGORY_MESSAGE &&
        message.getType() == CometChat.MESSAGE_TYPE.VIDEO;
}

function isFileMessage(message: CometChat.BaseMessage): message is CometChat.MediaMessage {
    return message.getCategory() == CometChat.CATEGORY_MESSAGE &&
        message.getType() == CometChat.MESSAGE_TYPE.FILE;
}

function isActionMessage(message: CometChat.BaseMessage): message is CometChat.Action {
    return message.getCategory() == CometChat.CATEGORY_ACTION
}

function isTextMessage(message: CometChat.BaseMessage): message is CometChat.TextMessage {
    return message.getCategory() == CometChat.CATEGORY_MESSAGE &&
        message.getType() == CometChat.MESSAGE_TYPE.TEXT
}

function isImageMessage(message: CometChat.BaseMessage): message is CometChat.MediaMessage {
    return message.getCategory() == CometChat.CATEGORY_MESSAGE &&
        message.getType() == CometChat.MESSAGE_TYPE.IMAGE
}

function isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
}

export class MessageDataSource implements DataSource {

    getEditOption(): CometChatMessageOption {
        return {
            id: MessageOptionConstants.editMessage,
            title: localize("EDIT_MESSAGE"),
            icon: ICONS.EDIT
        }
    }

    getDeleteOption(): CometChatMessageOption {
        return {
            id: MessageOptionConstants.deleteMessage,
            title: localize("DELETE"),
            icon: ICONS.DELETE
        }
    }
    getReplyOption(): CometChatMessageOption {
        return {
            id: MessageOptionConstants.replyMessage,
            title: localize("REPLY"),
            icon: ICONS.REPLY
        }
    }
    getReplyInThreadOption(): CometChatMessageOption {
        return {
            id: MessageOptionConstants.replyInThread,
            title: localize("REPLY"),
            icon: ICONS.THREAD
        }
    }
    getShareOption(): CometChatMessageOption {
        return {
            id: MessageOptionConstants.shareMessage,
            title: localize("SHARE"),
            icon: ICONS.SHARE
        }
    }
    getCopyOption(): CometChatMessageOption {
        return {
            id: MessageOptionConstants.copyMessage,
            title: localize("COPY_MESSAGE"),
            icon: ICONS.COPY
        }
    }
    // getForwardOption(): CometChatMessageOption {
    //     return {
    //         id: MessageOptionConstants.forwardMessage,
    //         title: localize("FORWARD"),
    //         icon: ICONS.FORWARD
    //     }
    // }
    getInformationOption(): CometChatMessageOption {
        return {
            id: MessageOptionConstants.messageInformation,
            title: localize("INFORMATION"),
            icon: ICONS.INFO
        }
    }

    getPrivateMessageOption(): CometChatMessageOption {
        return {
            id: MessageOptionConstants.sendMessagePrivately,
            title: localize('SEND_MESSAGE_IN_PRIVATE'),
            icon: ICONS.PRIVATE_MESSAGE
        }
    }

    isSentByMe(loggedInUser: CometChat.User, message: CometChat.BaseMessage) {
        return loggedInUser.getUid() == message.getSender().getUid();
    }

    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
        let msgOptions = [];
        msgOptions.push(this.getCopyOption());
        let _isSentByMe = this.isSentByMe(loggedInUser, messageObject);
        let canEdit = false;
        if (group) {
            canEdit = group['scope'] != GroupMemberScope.participant; //need clarification on why only moderator can edit and not participant or admin.
        }
        if (_isSentByMe || canEdit)
            msgOptions.push(this.getEditOption())

        let optionsList: Array<CometChatMessageOption> = ChatConfigurator.dataSource.getCommonOptions(loggedInUser, messageObject, group);
        if (isDeletedMessage(messageObject))
            return optionsList;

        return [...msgOptions, ...optionsList];
    }

    getFormMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
        let optionsList: Array<CometChatMessageOption> = [];
        if (!isDeletedMessage(messageObject))
            optionsList.push(...ChatConfigurator.dataSource.getCommonOptions(loggedInUser, messageObject, group));
        return optionsList;
    }

    getCardMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
        let optionsList: Array<CometChatMessageOption> = [];
        if (!isDeletedMessage(messageObject))
            optionsList.push(...ChatConfigurator.dataSource.getCommonOptions(loggedInUser, messageObject, group));
        return optionsList;
    }

    getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
        let optionsList: Array<CometChatMessageOption> = [];
        if (!isDeletedMessage(messageObject))
            optionsList.push(...ChatConfigurator.dataSource.getCommonOptions(loggedInUser, messageObject, group));
        return optionsList;
    }
    getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
        let optionsList: Array<CometChatMessageOption> = [];
        if (!isDeletedMessage(messageObject))
            optionsList.push(...ChatConfigurator.dataSource.getCommonOptions(loggedInUser, messageObject, group));
        return optionsList
    }
    getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
        let optionsList: Array<CometChatMessageOption> = [];
        if (!isDeletedMessage(messageObject))
            optionsList.push(...ChatConfigurator.dataSource.getCommonOptions(loggedInUser, messageObject, group));
        return optionsList;
    }
    getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
        let optionsList: Array<CometChatMessageOption> = [];
        if (!isDeletedMessage(messageObject))
            optionsList.push(...ChatConfigurator.dataSource.getCommonOptions(loggedInUser, messageObject, group));
        return optionsList;
    }
    getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
        let optionsList: Array<CometChatMessageOption> = [...ChatConfigurator.dataSource.getCommonOptions(loggedInUser, messageObject, group)];
        if (isDeletedMessage(messageObject))
            return optionsList;
        if (messageObject.getCategory() == MessageCategoryConstants.message) {
            let type: string = messageObject.getType();
            switch (type) {
                case MessageTypeConstants.audio:
                    optionsList.push(...ChatConfigurator.dataSource.getAudioMessageOptions(loggedInUser, messageObject, group));
                    break;
                case MessageTypeConstants.video:
                    optionsList.push(...ChatConfigurator.dataSource.getVideoMessageOptions(loggedInUser, messageObject, group));
                    break;
                case MessageTypeConstants.image:
                    optionsList.push(...ChatConfigurator.dataSource.getImageMessageOptions(loggedInUser, messageObject, group));
                    break;
                case MessageTypeConstants.text:
                    optionsList.push(...ChatConfigurator.dataSource.getTextMessageOptions(loggedInUser, messageObject, group));
                    break;
                case MessageTypeConstants.file:
                    optionsList.push(...ChatConfigurator.dataSource.getFileMessageOptions(loggedInUser, messageObject, group));
                    break;
            }

        }
        return optionsList;
    }
    getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, group: CometChat.Group): CometChatMessageOption[] {
        let optionsList: Array<CometChatMessageOption> = [];
        let _isSentByMe = this.isSentByMe(loggedInUser, messageObject);
        let canDelete = false;
        if ((group?.getScope() != undefined && group?.getScope() != GroupMemberScope.participant) || _isSentByMe) {
            canDelete = true;
        }
        if (!messageObject.getParentMessageId()) {
            optionsList.push(this.getReplyInThreadOption());
        }
        if (isTextMessage(messageObject) || isImageMessage(messageObject) || isFileMessage(messageObject) || isVideoMessage(messageObject) || isAudioMessage(messageObject)) {
            optionsList.push(this.getShareOption());
        }

        if (_isSentByMe && !isDeletedMessage(messageObject)) {
            optionsList.push(this.getInformationOption());
            // if (!isDeletedMessage(messageObject)) {
            //     optionsList.push(this.getForwardOption())
            // }
        }

        if (Boolean(group) && !_isSentByMe) {
            optionsList.push(this.getPrivateMessageOption());
        }

        if (_isSentByMe && !isDeletedMessage(messageObject)) {
            if (!group || (group && canDelete)) {
                optionsList.push(this.getDeleteOption());
            }
        }

        return optionsList;
    }

    getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element {
        if (isActionMessage(message)) {
            return <CometChatTextBubble
                text={`${message.getMessage()}`}
                textContainerStyle={{ marginStart: 4, marginEnd: 4 }}
                style={{
                    backgroundColor: theme?.palette?.getAccent50(),
                    textFont: {
                        fontSize: theme?.typography?.subtitle2?.fontSize,
                        fontWeight: theme?.typography?.subtitle2?.fontWeight,
                    },
                    textColor: theme?.palette?.getAccent600()
                }}
            />;
        }
        return null;
    }

    getBottomView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType): JSX.Element {
        return null;
    }

    getDeleteMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme): JSX.Element {
        return <CometChatTextBubble
            textContainerStyle={{ marginStart: 4, marginEnd: 4 }}
            text={localize("MESSAGE_IS_DELETED")}
            style={{
                backgroundColor: "transparent",
                textFont: {
                    fontSize: theme?.typography?.subtitle2?.fontSize,
                    fontWeight: theme?.typography?.subtitle2?.fontWeight,
                },
                textColor: theme?.palette?.getAccent600()
            }}
        />
    }

    getVideoMessageBubble(videoUrl: string, thumbnailUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, videoBubbleStyle: VideoBubbleStyleInterface) {
        if (isVideoMessage(message)) {
            return <CometChatVideoBubble
                videoUrl={videoUrl}
                thumbnailUrl={{ uri: thumbnailUrl }}
                style={{ height: 200, width: 200, borderRadius: 8, ...videoBubbleStyle }}
            />
        }
        return null;
    }

    getTextMessageBubble(messageText: string, message: CometChat.TextMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element {
        return <CometChatTextBubble
            text={messageText}
            style={{
                backgroundColor: "transparent",
                textFont: theme?.typography.body,
                textColor: alignment == "right" ? theme?.palette.getSecondary() : theme?.palette?.getAccent(),
                borderRadius: 8
            }}
        />
    }

    getFormMessageBubble(message: FormMessage, theme: CometChatTheme, style?: FormBubbleStyle, onSubmitClick?: (data: any) => void): JSX.Element {
        return <CometChatFormBubble
            message={message}
            onSubmitClick={onSubmitClick}
            style={style}
        />
    }
    getCardMessageBubble(message: CardMessage, theme: CometChatTheme, style?: CardBubbleStyle, onSubmitClick?: (data: any) => void): JSX.Element {
        return <CometChatCardBubble
            message={message}
            onSubmitClick={onSubmitClick}
            style={style}
        />
    }

    getImageMessageBubble(imageUrl: string, caption: string, style: ImageBubbleStyleInterface, message: CometChat.MediaMessage, theme: CometChatTheme): JSX.Element {
        if (isImageMessage(message)) {
            return <CometChatImageBubble
                imageUrl={{ uri: imageUrl }}
                style={{ height: 200, width: 200, borderRadius: 8, ...style }}
            />
        }
        return null;
    }

    getAudioMessageBubble(audioUrl: string, title: string, style: AudioBubbleStyleInterface, message: CometChat.MediaMessage, theme: CometChatTheme): JSX.Element {
        if (isAudioMessage(message)) {
            return <CometChatAudioBubble
                audioUrl={audioUrl}
                title={title}
                style={{ width: 200, borderRadius: 8, ...style }}
            />
        }
        return null;
    }

    getFileMessageBubble(fileUrl: string, title: string, style: FileBubbleStyleInterface, message: CometChat.MediaMessage, theme: CometChatTheme): JSX.Element {
        if (isFileMessage(message)) {
            return <CometChatFileBubble
                fileUrl={fileUrl}
                title={title}
                style={{ width: 200, ...style }}
            />
        }
        return null;
    }
    getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element {
        return ChatConfigurator.dataSource.getTextMessageBubble(message.getText(), message, alignment, theme);
    }
    getFormMessageContentView(message: FormMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element {
        return ChatConfigurator.dataSource.getFormMessageBubble(message, theme);
    }
    getCardMessageContentView(message: CardMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element {
        return ChatConfigurator.dataSource.getCardMessageBubble(message, theme);
    }
    getAudioMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element {
        let attachment = message.getAttachment();
        return ChatConfigurator.dataSource.getAudioMessageBubble(attachment.getUrl(), attachment.getName(), {
            iconTint: alignment == "right" ? theme?.palette?.getSecondary() : theme?.palette?.getPrimary(),
            backgroundColor: alignment == "left" ? theme?.palette?.getAccent50() : theme?.palette?.getPrimary(),
            titleColor: alignment == "right" ? theme?.palette.getSecondary() : theme?.palette.getAccent(),
            titleFont: theme?.typography.body,
            subtitleColor: alignment == "right" ? theme?.palette.getSecondary() : theme?.palette.getAccent(),
            subtitleFont: theme?.typography.subtitle1,
        }, message, theme);
    }
    getVideoMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element {
        let attachment = message.getAttachment();
        return ChatConfigurator.dataSource.getVideoMessageBubble(
            attachment.getUrl(),
            undefined,
            message,
            theme,
            {
                backgroundColor: alignment == "left" ? theme?.palette.getAccent50() : theme?.palette.getPrimary(),
                playIconBackgroundColor: theme?.palette?.getAccent50(),
                playIconTint: alignment == "left" ? theme?.palette.getPrimary() : theme?.palette.getSecondary(),
            }
        );
    }
    getImageMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element {
        let attachment = message.getAttachment();
        let url: string = attachment.getUrl();
        if (url == undefined)
            url = message['data']['url'];

        return ChatConfigurator.dataSource.getImageMessageBubble(url, attachment.getName(), {
            backgroundColor: alignment == "left" ? theme?.palette.getAccent50() : theme?.palette.getPrimary()
        }, message, theme);
    }
    getFileMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element {
        let attachment = message.getAttachment();
        return ChatConfigurator.dataSource.getFileMessageBubble(attachment.getUrl(), attachment.getName(),
            {
                iconTint: alignment == "right" ? theme?.palette.getSecondary() : theme?.palette?.getPrimary(),
                backgroundColor: alignment == "left" ? theme?.palette.getAccent50() : theme?.palette.getPrimary(),
                titleColor: alignment == "right" ? theme?.palette.getSecondary() : theme?.palette.getAccent(),
                titleFont: theme?.typography.body,
                subtitleColor: alignment == "right" ? theme?.palette.getSecondary() : theme?.palette.getAccent(),
                subtitleFont: theme?.typography.subtitle1,
            }
            , message, theme);
    }

    getTextMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: MessageTypeConstants.text,
            category: MessageCategoryConstants.message,
            ContentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignmentType) => {
                if (isDeletedMessage(message)) {
                    return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
                } else {
                    return ChatConfigurator.dataSource.getTextMessageContentView(message, _alignment, theme);
                }
            },
            options: (loggedInuser, message, group) => ChatConfigurator.dataSource.getTextMessageOptions(loggedInuser, message, group),
        });
    }

    getFormMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: MessageTypeConstants.form,
            category: MessageCategoryConstants.interactive,
            ContentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignmentType) => {
                if (isDeletedMessage(message)) {
                    return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
                } else {
                    return ChatConfigurator.dataSource.getFormMessageContentView(message, _alignment, theme);
                }
            },
            options: (loggedInuser, message, group) => ChatConfigurator.dataSource.getFormMessageOptions(loggedInuser, message, group),
        });
    }

    getCardMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: MessageTypeConstants.card,
            category: MessageCategoryConstants.interactive,
            ContentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignmentType) => {
                if (isDeletedMessage(message)) {
                    return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
                } else {
                    return ChatConfigurator.dataSource.getCardMessageContentView(message, _alignment, theme);
                }
            },
            options: (loggedInuser, message, group) => ChatConfigurator.dataSource.getCardMessageOptions(loggedInuser, message, group),
        });
    }

    getAudioMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: MessageTypeConstants.audio,
            category: MessageCategoryConstants.message,
            ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
                if (isDeletedMessage(message)) {
                    return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
                } else
                    return ChatConfigurator.dataSource.getAudioMessageContentView(message, alignment, theme);
            },
            options: (loggedInuser, message, group) => ChatConfigurator.dataSource.getAudioMessageOptions(loggedInuser, message, group),
        })
    }
    getVideoMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: MessageTypeConstants.video,
            category: MessageCategoryConstants.message,
            ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
                if (isDeletedMessage(message)) {
                    return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
                } else
                    return ChatConfigurator.dataSource.getVideoMessageContentView(message, alignment, theme);
            },
            options: (loggedInuser, message, group) => ChatConfigurator.dataSource.getVideoMessageOptions(loggedInuser, message, group),
        })
    }
    getImageMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: MessageTypeConstants.image,
            category: MessageCategoryConstants.message,
            ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
                if (isDeletedMessage(message)) {
                    return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
                } else
                    return ChatConfigurator.dataSource.getImageMessageContentView(message, alignment, theme);
            },
            options: (loggedInuser, message, group) => ChatConfigurator.dataSource.getImageMessageOptions(loggedInuser, message, group),
        })
    }
    getFileMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: MessageTypeConstants.file,
            category: MessageCategoryConstants.message,
            ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
                if (isDeletedMessage(message)) {
                    return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
                } else
                    return ChatConfigurator.dataSource.getFileMessageContentView(message, alignment, theme);
            },
            options: (loggedInuser, message, group) => ChatConfigurator.dataSource.getFileMessageOptions(loggedInuser, message, group),
        });
    }
    getGroupActionTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: MessageTypeConstants.groupMember,
            category: MessageCategoryConstants.action,
            ContentView: (message: CometChat.BaseMessage,
                alignment: MessageBubbleAlignmentType) => {
                return ChatConfigurator.dataSource.getGroupActionBubble(message, theme);
            }
        });
    }

    getAllMessageTemplates(theme: CometChatTheme): CometChatMessageTemplate[] {
        return [
            ChatConfigurator.dataSource.getTextMessageTemplate(theme),
            ChatConfigurator.dataSource.getFormMessageTemplate(theme),
            ChatConfigurator.dataSource.getCardMessageTemplate(theme),
            ChatConfigurator.dataSource.getAudioMessageTemplate(theme),
            ChatConfigurator.dataSource.getVideoMessageTemplate(theme),
            ChatConfigurator.dataSource.getFileMessageTemplate(theme),
            ChatConfigurator.dataSource.getImageMessageTemplate(theme),
            ChatConfigurator.dataSource.getGroupActionTemplate(theme)
        ];
    }

    getMessageTemplate(messageType: string, MessageCategory: string, theme: CometChatTheme): CometChatMessageTemplate {
        // let _theme: CometChatTheme = useContext("theme")         ???
        let template: CometChatMessageTemplate;

        //in case of call message return undefined
        if (MessageCategory == MessageCategoryConstants.call) return template;

        switch (messageType) {
            case MessageTypeConstants.text:
                template = ChatConfigurator.dataSource.getTextMessageTemplate(theme)
                break;
            case MessageTypeConstants.audio:
                template = ChatConfigurator.dataSource.getAudioMessageTemplate(theme)
                break;
            case MessageTypeConstants.video:
                template = ChatConfigurator.dataSource.getVideoMessageTemplate(theme)
                break;
            case MessageTypeConstants.groupActions:
            case MessageTypeConstants.groupMember:
                template = ChatConfigurator.dataSource.getGroupActionTemplate(theme)
                break;
            case MessageTypeConstants.file:
                template = ChatConfigurator.dataSource.getFileMessageTemplate(theme)
                break;
            case MessageTypeConstants.form:
                template = ChatConfigurator.dataSource.getFormMessageTemplate(theme)
                break;
            case MessageTypeConstants.card:
                template = ChatConfigurator.dataSource.getCardMessageTemplate(theme)
                break;
        }
        return template;
    }

    getAllMessageTypes(): string[] {
        return [
            CometChatMessageTypes.text,
            CometChatMessageTypes.image,
            CometChatMessageTypes.audio,
            CometChatMessageTypes.video,
            CometChatMessageTypes.file,
            MessageTypeConstants.groupActions,
            MessageTypeConstants.groupMember,
            MessageTypeConstants.form,
            MessageTypeConstants.card
        ];
    }
    getAllMessageCategories(): string[] {
        return [MessageCategoryConstants.message, MessageCategoryConstants.action, MessageCategoryConstants.interactive];
    }
    getAuxiliaryOptions(user: CometChat.User, group: CometChat.Group, id: Map<string, any>, theme?:CometChatTheme): JSX.Element[] {
        return [];
    }
    getAuxiliaryHeaderAppbarOptions(user?: CometChat.User, group?: CometChat.Group): JSX.Element {
        return null;
    }
    getId(): string {
        return "messageUtils";
    }
    getMessageTypeToSubtitle(messageType: string): string {
        let subtitle: string = messageType;
        switch (messageType) {
            case MessageTypeConstants.text:
                subtitle = localize("TEXT");
                break;
            case MessageTypeConstants.image:
                subtitle = localize("MESSAGE_IMAGE");
                break;
            case MessageTypeConstants.video:
                subtitle = localize("MESSAGE_VIDEO");
                break;
            case MessageTypeConstants.file:
                subtitle = localize("MESSAGE_FILE");
                break;
            case MessageTypeConstants.audio:
                subtitle = localize("MESSAGE_AUDIO");
                break;
            default:
                subtitle = messageType;
                break;
        }
        return subtitle;
    }
    usersActionList = () => [
        {
            id: MessageTypeConstants.takePhoto,
            title: localize('TAKE_PHOTO'),
            iconUrl: ICONS.IMAGE,
            onClick: null,
        },
        {
            id: MessageTypeConstants.image,
            title: localize('ATTACH_IMAGE'),
            iconUrl: ICONS.IMAGE,
            onClick: null,
        },
        {
            id: MessageTypeConstants.audio,
            title: localize('ATTACH_AUDIO'),
            iconUrl: ICONS.AUDIO,
            onClick: null,
        },
        {
            id: MessageTypeConstants.video,
            title: localize('ATTACH_VIDEO'),
            iconUrl: ICONS.VIDEO,
            onClick: null,
        },
        {
            id: MessageTypeConstants.file,
            title: localize('ATTACH_FILE'),
            iconUrl: ICONS.FILE,
            onClick: null,
        },
    ];
    groupActionList = () => [
        {
            id: MessageTypeConstants.takePhoto,
            title: localize('TAKE_PHOTO'),
            iconUrl: ICONS.IMAGE,
            onClick: null,
        },
        {
            id: MessageTypeConstants.image,
            title: localize('ATTACH_IMAGE'),
            iconUrl: ICONS.IMAGE,
            onClick: null,
        },
        {
            id: MessageTypeConstants.audio,
            title: localize('ATTACH_AUDIO'),
            iconUrl: ICONS.AUDIO,
            onClick: null,
        },
        {
            id: MessageTypeConstants.video,
            title: localize('ATTACH_VIDEO'),
            iconUrl: ICONS.VIDEO,
            onClick: null,
        },
        {
            id: MessageTypeConstants.file,
            title: localize('ATTACH_FILE'),
            iconUrl: ICONS.FILE,
            onClick: null,
        },
    ];
    getAttachmentOptions(
        user?: any,
        group?: any,
        composerId?: any
    ): CometChatMessageComposerActionInterface[] {
        if (user) {
            return this.usersActionList();
        } else if (group) {
            return this.groupActionList();
        } else {
            return this.usersActionList();
        }
    }
    getAuxiliaryButtonOptions() {
        return null;
    }

    getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: Map<String, any>, AIOptionsStyle?: AIOptionsStyle) {
        return [];
    }

    getLastConversationMessage(conversation: CometChat.Conversation): string {
        return CometChatConversationUtils.getMessagePreview(conversation.getLastMessage());
    };

}