import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle, useContext, useCallback } from "react";
import { View, FlatList, Text, Image, TouchableOpacity, ActivityIndicator, Modal, SafeAreaView, NativeModules } from "react-native";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { loadingIcon, rightArrowIcon, backIcon } from "./resources";
import { BaseStyle, BaseStyleInterface, CometChatContext, CometChatLiveReactions, CometChatUIKit, ImageType } from "../shared";
import { MessageBubbleStyle, MessageBubbleStyleInterface } from "../shared/views/CometChatMessageBubble/MessageBubbleStyle";
import { AvatarStyle, AvatarStyleInterface } from "../shared";
import { CometChatAvatar, CometChatDate, CometChatReceipt, DateStyle } from "../shared";
import { MessageListStyle, MessageListStyleInterface } from "./MessageListStyle";
import { CometChatMessageBubble } from "../shared/views/CometChatMessageBubble";
import { CallTypeConstants, MessageBubbleAlignmentType, MessageCategoryConstants, MessageListAlignmentType, MessageOptionConstants, MessageStatusConstants, MessageTimeAlignmentType, MessageTypeConstants, ReceiverTypeConstants, ViewAlignment } from "../shared/constants/UIKitConstants";
import { localize } from "../shared";
import { downArrowIcon } from "./resources";
import { Style } from "./style";
import { CometChatMessageTemplate } from "../shared/modals/CometChatMessageTemplate";
import { CometChatSoundManager } from "../shared";
import { MessageEvents } from "../shared/events/messages";
import { ChatConfigurator } from "../shared/framework/ChatConfigurator";
import { CometChatActionSheet, ActionSheetStyles, CometChatBottomSheet } from "../shared";
import { getUnixTimestamp, messageStatus } from "../shared/utils/CometChatMessageHelper";
import { DateStyleInterface } from "../shared/views/CometChatDate/DateStyle";
import { CometChatContextType } from "../shared/base/Types";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { ActionSheetStylesInterface } from "../shared/views/CometChatActionSheet/ActionSheetStyle";
import Clipboard from "@react-native-community/clipboard";
import { CometChatMessageInformation } from "../CometChatMessageInformation/CometChatMessageInformation";
// import { CometChatContacts, ForwardMessageConfigurationInterface } from "../CometChatContacts";
import { MessageInformationConfigurationInterface } from "../CometChatMessageInformation";

let templatesMap = new Map<string, CometChatMessageTemplate>();

let _defaultRequestBuilder: CometChat.MessagesRequestBuilder;


export interface CometChatMessageListProps {
    parentMessageId?: string,
    user?: CometChat.User,
    group?: CometChat.Group,
    EmptyStateView?: () => JSX.Element,
    emptyStateText?: String,
    ErrorStateView?: (e: CometChat.CometChatException) => JSX.Element,
    errorStateText?: String,
    LoadingStateView?: () => JSX.Element,
    disableReceipt?: boolean,
    disableSoundForMessages?: boolean,
    customSoundForMessages?: string,
    readIcon?: ImageType,
    deliveredIcon?: ImageType,
    sentIcon?: ImageType,
    waitIcon?: ImageType,
    errorIcon?: ImageType,
    alignment?: MessageListAlignmentType,
    showAvatar?: boolean,
    datePattern?: (message: CometChat.BaseMessage) => "timeFormat" | "dayDateFormat" | "dayDateTimeFormat",
    timeStampAlignment?: MessageTimeAlignmentType,
    dateSeperatorPattern?: (date: number) => string,
    templates?: Array<CometChatMessageTemplate>,
    messageRequestBuilder?: CometChat.MessagesRequestBuilder,
    newMessageIndicatorText?: string,
    scrollToBottomOnNewMessages?: boolean,
    // threadholdValue?: number,
    onThreadRepliesPress?: (messageObject: CometChat.BaseMessage, messageBubbleView: () => JSX.Element) => void,
    HeaderView?: ({ user, group, id }: { user?: CometChat.User, group?: CometChat.Group, id?: { uid?: string, guid?: string, parentMessageId?: string } }) => JSX.Element,
    FooterView?: ({ user, group, id }: { user?: CometChat.User, group?: CometChat.Group, id?: { uid?: string, guid?: string, parentMessageId?: string } }) => JSX.Element,
    wrapperMessageBubbleStyle?: MessageBubbleStyleInterface,
    avatarStyle?: AvatarStyleInterface,
    dateSeperatorStyle?: DateStyleInterface,
    actionSheetStyle?: ActionSheetStylesInterface,
    messageListStyle?: MessageListStyleInterface,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    // forwardMessageConfiguration?: ForwardMessageConfigurationInterface,
    messageInformationConfiguration?: MessageInformationConfigurationInterface
}

export interface CometChatMessageListActionsInterface {
    addMessage: (messageObject: object) => void,
    updateMessage: (messageObject: CometChat.BaseMessage, withMuid: boolean) => void,
    removeMessage: (messageObject: CometChat.BaseMessage) => void,
    deleteMessage: (messageObject: CometChat.BaseMessage) => void,
    scrollToBottom: () => void,
    createActionMessage: () => void, //todo: get clarification what is this method, when gets called and its responsibility
    updateMessageReceipt: (message: CometChat.BaseMessage) => void
}

export const CometChatMessageList = forwardRef<
    CometChatMessageListActionsInterface,
    CometChatMessageListProps>
    ((props: CometChatMessageListProps, ref) => {

        const {
            parentMessageId,
            user,
            group,
            EmptyStateView,
            emptyStateText,
            ErrorStateView,
            errorStateText,
            LoadingStateView,
            disableReceipt,
            disableSoundForMessages,
            customSoundForMessages,
            readIcon,
            deliveredIcon,
            sentIcon,
            waitIcon,
            errorIcon,
            alignment,
            showAvatar,
            datePattern,
            timeStampAlignment,
            dateSeperatorPattern,
            templates,
            messageRequestBuilder,
            newMessageIndicatorText,
            scrollToBottomOnNewMessages,
            onThreadRepliesPress,
            HeaderView,
            FooterView,
            wrapperMessageBubbleStyle,
            avatarStyle,
            dateSeperatorStyle,
            actionSheetStyle,
            messageListStyle,
            onError,
            onBack,
            // forwardMessageConfiguration
            messageInformationConfiguration
        } = props;

        const messageListenerId = "message_" + new Date().getTime();
        const callListenerId = "call_" + new Date().getTime();
        const groupListenerId = "group_" + new Date().getTime();
        const uiEventListener = "uiEvent_" + new Date().getTime();
        const uiEventListenerShow = "uiEvent_show_" + new Date().getTime();
        const uiEventListenerHide = "uiEvent_hide_" + new Date().getTime();
        const connectionListenerId = 'connectionListener_' + new Date().getTime();

        if (user) {
            _defaultRequestBuilder = new CometChat.MessagesRequestBuilder()
                .setLimit(30)
                .setTags([])
                .setUID(user["uid"]);
        }
        else if (group) {
            _defaultRequestBuilder = new CometChat.MessagesRequestBuilder()
                .setLimit(30)
                .setTags([])
                .setGUID(group["guid"]);
        }

        _defaultRequestBuilder.setTypes(ChatConfigurator.dataSource.getAllMessageTypes())
        _defaultRequestBuilder.setCategories(ChatConfigurator.dataSource.getAllMessageCategories())

        const { theme } = useContext<CometChatContextType>(CometChatContext);

        // creating style based on styles from users
        const _messageListStyle = new MessageListStyle({
            backgroundColor: theme?.palette.getBackgroundColor(),
            emptyStateTextColor: theme?.palette.getError(),
            emptyStateTextFont: theme?.typography.subtitle1,
            errorStateTextColor: theme?.palette.getAccent(),
            errorStateTextFont: theme?.typography.title1,
            loadingIconTint: theme?.palette.getAccent700(),
            nameTextColor: theme?.palette.getAccent(),
            nameTextFont: theme?.typography.name,
            threadReplyIconTint: theme?.palette.getAccent700(),
            threadReplySeparatorColor: theme?.palette.getAccent100(),
            threadReplyTextColor: theme?.palette.getPrimary(),
            threadReplyTextFont: theme?.typography.body,
            timestampTextColor: theme?.palette.getAccent500(),
            timestampTextFont: theme?.typography.caption1,
            ...messageListStyle
        });
        const _avatarStyle = new AvatarStyle({
            backgroundColor: _messageListStyle.backgroundColor,
            nameTextColor: _messageListStyle.nameTextColor,
            nameTextFont: _messageListStyle.nameTextFont,
            ...avatarStyle
        });
        const _dateSeperatorStyle = new DateStyle({
            textColor: _messageListStyle.timestampTextColor,
            textFont: theme?.typography.title2,
            ...dateSeperatorStyle
        });
        const messageBubbleDateStyle = new DateStyle({
            textColor: _messageListStyle.timestampTextColor,
            textFont: _messageListStyle.timestampTextFont
        });
        const _actionStyle = new ActionSheetStyles({
            ...actionSheetStyle
        });
        const _messageBubbleStyle = new MessageBubbleStyle({
            ...wrapperMessageBubbleStyle
        });

        // refs
        const currentScrollPosition = useRef(null);
        const messageListRef = useRef<FlatList>(null);
        const loggedInUser = useRef<CometChat.User>(null);
        const messageRequest = useRef<CometChat.MessagesRequest>(null);

        //updating users request builder
        let _updatedCustomRequestBuilder = _defaultRequestBuilder;
        if (messageRequestBuilder) {
            _updatedCustomRequestBuilder = messageRequestBuilder;
        }
        _updatedCustomRequestBuilder.hideReplies(true);
        if (user)
            _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setUID(user["uid"])
        if (group)
            _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setGUID(group["guid"])
        if (parentMessageId)
            _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setParentMessageId(parseInt(parentMessageId));
        let types = [], categories = [];
        if (templates.length) {
            types = templates.map(template => template.type);
            categories = templates.map(template => template.category);
        }
        else {
            types = ChatConfigurator.dataSource.getAllMessageTypes();
            categories = ChatConfigurator.dataSource.getAllMessageCategories();
        }

        _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setTypes(types);
        _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setCategories(categories);

        const msgRequestBuilder = useRef<CometChat.MessagesRequestBuilder>(_updatedCustomRequestBuilder);
        const lastMessageDate = useRef(new Date().getTime());

        // states
        const [messagesList, setMessagesList] = useState([]);
        const [listState, setListState] = useState("loading");
        const [loadingMessages, setLoadingMessages] = useState(false);
        const [unreadCount, setUnreadCount] = useState(0);
        const [showMessageOptions, setShowMessageOptions] = useState([]);
        const [liveReaction, setliveReaction] = useState(false);
        const [ExtensionsComponent, setExtensionsComponent] = useState(null);
        const [CustomListHeader, setCustomListHeader] = useState(null);
        const [messageInfo, setMessageInfo] = useState(false);
        // const [forwarding, setForwarding] = useState(false);

        const infoObject = useRef<CometChat.BaseMessage>();
        // const messageToForward = useRef<CometChat.BaseMessage>();
        const bottomSheetRef = useRef(null)
        const conversationId = useRef(null)
        const scrollPositionForNewMessageIndicator = useRef(15);
        let lastID = useRef(0);

        const scrollHandler = (event) => {
            currentScrollPosition.current = event.nativeEvent.contentOffset.y;
            if (currentScrollPosition.current < scrollPositionForNewMessageIndicator.current && unreadCount > 0) {
                markUnreadMessageAsRead();
            }
        }

        const markUnreadMessageAsRead = () => {
            if (messagesList[0].getReceiverType() == ReceiverTypeConstants.user) {
                for (let index = 0; index < unreadCount; index++) {
                    const message = messagesList[index];
                    if (index == 0)
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message });
                    CometChat.markAsRead(message);
                }
            }
            setUnreadCount(0);
        }

        const newMsgIndicatorPressed = () => {
            scrollToBottom();
            markUnreadMessageAsRead();
        }

        const getPreviousMessages = async () => {

            if (messagesList.length == 0)
                setListState("loading");
            else
                setLoadingMessages(true);
            // TODO: this condition is applied because somewhere from whiteboard extention group scope is set to undefined.
            if (group != undefined && group['scope'] == undefined) {
                let fetchedGroup = await CometChat.getGroup(group['guid']).catch(e => {
                    console.log("Error: fetching group", e);
                    onError && onError(e)
                })
                group['scope'] = fetchedGroup['scope'];
            }
            messageRequest.current.fetchPrevious()
                .then(msgs => {
                    let reversed = msgs.reverse();
                    if (messagesList.length === 0 && reversed?.length > 0) {
                        if (conversationId.current == null)
                            conversationId.current = reversed[0].getConversationId();
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccActiveChatChanged, { message: reversed[0] });

                    }
                    for (let index = 0; index < reversed.length; index++) {
                        const message: CometChat.BaseMessage = reversed[index];
                        if (!disableReceipt && !message.hasOwnProperty("readAt") && loggedInUser.current.getUid() != message['sender']['uid']) {
                            CometChat.markAsRead(message);
                            if (index == 0)
                                CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message });
                        } else
                            break;
                    }
                    setMessagesList([...messagesList, ...reversed]);
                    if (messagesList.length == 0)
                        setListState("");
                    else
                        setLoadingMessages(false);
                })
                .catch(e => {
                    if (messagesList.length == 0)
                        setListState("error");
                    else
                        setLoadingMessages(false);
                    console.log(e);
                    onError && onError(e)
                })
        }

        const getUpdatedPreviousMessages = () => {
            let messagesRequest = new CometChat.MessagesRequestBuilder().setLimit(50)
            if (user)
                messagesRequest = messagesRequest.setUID(user["uid"])
            if (group)
                messagesRequest = messagesRequest.setGUID(group["guid"])

            messagesRequest.setTypes([MessageCategoryConstants.message]);
            messagesRequest.setCategories([MessageCategoryConstants.action]);
            messagesRequest.setMessageId(lastID.current)

            messagesRequest.build()
                .fetchNext()
                .then(updatedMessages => {
                    let tmpList = [...messagesList];
                    for (let i = 0; i < updatedMessages.length; i++) {
                        let condition = (msg) => msg.getId() == updatedMessages[i]?.actionOn.getId()
                        let msgIndex = messagesList.findIndex(condition);
                        if (msgIndex > -1) {
                            tmpList[msgIndex] = updatedMessages[i]?.actionOn;
                        }
                    }
                    // console.log("UPDATES LIST LENGTH", tmpList.length)
                    // setMessagesList(tmpList);
                    getNewMessages(tmpList);
                })
                .catch(e => console.log("error while fetching updated msgs", e))
        }

        const getNewMessages = (updatedList) => {

            let newRequestBuilder = msgRequestBuilder.current;
            newRequestBuilder.setMessageId(lastID.current)

            newRequestBuilder.build()
                .fetchNext()
                .then(newMessages => {
                    let cleanUpdatedList = [...updatedList];
                    for (let i = 0; i < cleanUpdatedList.length; i++) {
                        if (cleanUpdatedList[i].id == lastID.current) break;
                        if (cleanUpdatedList[i].id == undefined)
                            cleanUpdatedList.splice(i, 1);
                    }
                    // console.log("newMessages", newMessages.length, JSON.stringify(newMessages))
                    if (cleanUpdatedList?.length > 0 && cleanUpdatedList?.[0]?.["muid"]) {
                        let localFileExists = newMessages.findIndex(msg => msg?.["muid"] == cleanUpdatedList?.[0]?.["muid"]);
                        if (localFileExists > -1) {
                            cleanUpdatedList.shift();
                        }
                    }
                    let tmpList = [...newMessages.reverse(), ...cleanUpdatedList];
                    setMessagesList(tmpList);
                    markMessageAsRead(tmpList[0]);
                    if (newMessages.length === 30) {
                        console.log("Looping..........")
                        getNewMessages(tmpList);
                    }
                })
                .catch(e => console.log("error while fetching updated msgs", e))
        }

        const loadTemplates = () => {
            let templates: CometChatMessageTemplate[] = ChatConfigurator.dataSource.getAllMessageTemplates(theme);
            templates.forEach(template => {

                if (templatesMap.get(`${template.category}_${template.type}`)) return
                templatesMap.set(`${template.category}_${template.type}`, template);
            });
        }

        const playNotificationSound = (message) => {

            if (disableSoundForMessages) return;

            if (message?.category === MessageCategoryConstants.message) {
                if (customSoundForMessages) {
                    CometChatSoundManager.play(
                        loggedInUser.current.getUid() == message['sender']['uid'] ? "outgoingMessage" : "incomingMessage",
                        customSoundForMessages
                    );
                } else {
                    CometChatSoundManager.play(
                        // "incomingMessage"
                        loggedInUser.current.getUid() == message['sender']['uid'] ? "outgoingMessage" : "incomingMessage"
                    );
                }
            }
        };

        const scrollToBottom = (scrollToFirstUnread = false) => {
            if (messageListRef && messagesList.length > 0) {
                messageListRef.current.scrollToIndex({ index: scrollToFirstUnread ? unreadCount - 1 : 0 });
            }
        };

        const markMessageAsRead = (message) => {
            if (!disableReceipt && !message?.readAt) {
                CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message });
                CometChat.markAsRead(message)
                    .catch((error) => {
                        console.log("Error", error);
                        onError && onError(error);
                        // errorHandler(error);
                    });
            }
        };

        function checkMessageInSameConversation(message: CometChat.BaseMessage): boolean {
            return (message.getReceiverType() == ReceiverTypeConstants.user &&
                user &&
                user?.getUid() == message.getReceiver()?.['uid']) ||
                (message.getReceiverType() == ReceiverTypeConstants.group &&
                    message.getReceiverId() &&
                    group &&
                    group?.getGuid() == message.getReceiverId());
        }

        function messageToSameConversation(message: CometChat.BaseMessage): boolean {
            return (message.getReceiverType() == ReceiverTypeConstants.user &&
                user &&
                user?.getUid() == message.getReceiverId()) ||
                (message.getReceiverType() == ReceiverTypeConstants.group &&
                    message.getReceiverId() &&
                    group &&
                    group?.getGuid() == message.getReceiverId());
        }
        function checkSameConversation(message: CometChat.BaseMessage): boolean {
            return conversationId.current != null && (message.getConversationId() == conversationId.current);
        }

        const newMessage = (newMessage, isReceived = true) => {
            let baseMessage = newMessage as CometChat.BaseMessage;
            if (checkSameConversation(baseMessage) || checkMessageInSameConversation(baseMessage) || messageToSameConversation(baseMessage)) {
                //need to add 
                if (baseMessage.getParentMessageId()) {
                    if (baseMessage.getParentMessageId() == parseInt(parentMessageId)) {
                        // add to list
                        setMessagesList([newMessage, ...messagesList]);
                    } else {
                        //increase count
                        let index = messagesList.findIndex(msg => msg.id === newMessage.parentMessageId);
                        let oldMsg: CometChat.BaseMessage = messagesList[index];
                        oldMsg.setReplyCount(oldMsg.getReplyCount() ? oldMsg.getReplyCount() + 1 : 1);
                        let tmpList = [...messagesList];
                        tmpList[index] = oldMsg;
                        setMessagesList(tmpList);
                    }
                } else if (parentMessageId == undefined) {
                    setMessagesList([newMessage, ...messagesList]);
                }
                // if scroll is not at bottom
                if (!scrollToBottomOnNewMessages && (Math.round(currentScrollPosition.current) >= scrollPositionForNewMessageIndicator.current)) {
                    if (baseMessage['sender']['uid'] == loggedInUser.current?.['uid']) {
                        scrollToBottom();
                        return;
                    }
                    CometChat.markAsDelivered(newMessage);
                    if (baseMessage.getReceiverType() == ReceiverTypeConstants.user) {
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageDelivered, { message: newMessage });
                    }
                    setUnreadCount(unreadCount + 1);
                } else {
                    scrollToBottom();
                    if (isReceived) {
                        markMessageAsRead(newMessage);
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message: newMessage });
                    }
                }
            }
            playNotificationSound(newMessage);
        }

        const messageEdited = (editedMessage: CometChat.BaseMessage, withMuid: boolean = false) => {
            let condition: (value: any, index: number, obj: any[]) => unknown;
            if (withMuid)
                condition = (msg) => msg['muid'] == editedMessage['muid']
            else
                condition = (msg) => msg.getId() == editedMessage.getId()
            let msgIndex = messagesList.findIndex(condition);
            if (msgIndex > -1) {
                let tmpList = [...messagesList];
                tmpList[msgIndex] = editedMessage;
                setMessagesList(tmpList);
            }
        }

        const removeMessage = (message: CometChat.BaseMessage) => {
            let msgIndex = messagesList.findIndex(msg => msg.getId() == message.getId());
            if (msgIndex == -1) return;

            let tmpList = [...messagesList];
            tmpList.splice(msgIndex, 1);
            setMessagesList(tmpList);
        }

        const deleteMessage = (message: CometChat.BaseMessage) => {
            CometChat.deleteMessage(message.getId().toString())
                .then(res => {
                    messageEdited(res, false);
                    setShowMessageOptions([]);
                })
                .catch(rej => {
                    console.log(rej);
                    onError && onError(rej);
                })
        }

        const showTransientMessage = (transientMessage) => {
            setliveReaction(true);
            setTimeout(() => {
                setliveReaction(false);
            }, 1500);
        }

        const createActionMessage = () => { }

        const updateMessageReceipt = (receipt) => {
            let index = messagesList.findIndex((msg, index) => msg['id'] == receipt['messageId'] || msg['messageId'] == receipt['messageId']);

            if (index == -1) return;

            let tmpList = [...messagesList];

            let tmpMsg = tmpList[index];
            if ((tmpMsg as CometChat.BaseMessage).getReceiverType() == ReceiverTypeConstants.group)
                return;
            if (receipt.hasOwnProperty('deliveredAt')) {
                tmpMsg['deliveredAt'] = receipt['deliveredAt'];
            }
            if (receipt.hasOwnProperty('readAt')) {
                tmpMsg['readAt'] = receipt['readAt'];
            }
            tmpMsg['updatedAt'] = receipt['timestamp'];

            setMessagesList(tmpList);
        }

        const handlePannel = (item) => {
            if (item.alignment === ViewAlignment.messageListBottom && item.child)
                setCustomListHeader(() => item.child)
            else
                setCustomListHeader(null)
        }

        useEffect(() => {
            CometChatUIEventHandler.addUIListener(
                uiEventListenerShow,
                {
                    showPanel: (item) => handlePannel(item)
                }
            )
            CometChatUIEventHandler.addUIListener(
                uiEventListenerHide,
                {
                    hidePanel: (item) => handlePannel(item)
                }
            )
            return () => {
                CometChatUIEventHandler.removeUIListener(uiEventListenerShow)
                CometChatUIEventHandler.removeUIListener(uiEventListenerHide)
            }
        }, [])
        useEffect(() => {
            //add listeners
            CometChat.addMessageListener(
                messageListenerId,
                new CometChat.MessageListener({
                    onTextMessageReceived: (textMessage) => {
                        newMessage(textMessage);
                    },
                    onMediaMessageReceived: (mediaMessage) => {
                        newMessage(mediaMessage);
                    },
                    onCustomMessageReceived: (customMessage) => {
                        newMessage(customMessage);
                    },
                    onMessagesDelivered: (messageReceipt) => {
                        updateMessageReceipt(messageReceipt);
                    },
                    onMessagesRead: (messageReceipt) => {
                        updateMessageReceipt(messageReceipt);
                    },
                    onMessageDeleted: (deletedMessage) => {
                        messageEdited(deletedMessage);
                    },
                    onMessageEdited: (editedMessage) => {
                        messageEdited(editedMessage);
                    },
                    onTransientMessageReceived: (transientMessage) => {
                        showTransientMessage(transientMessage)
                    }
                })
            );

            CometChat.addGroupListener(
                groupListenerId,
                new CometChat.GroupListener({
                    onGroupMemberScopeChanged: (message) => {
                        newMessage(message);
                    },
                    onGroupMemberLeft: (message) => {
                        newMessage(message);
                    },
                    onGroupMemberKicked: (message) => {
                        newMessage(message);
                    },
                    onGroupMemberBanned: (message) => {
                        newMessage(message);
                    },
                    onGroupMemberUnbanned: (message) => {
                    },
                    onMemberAddedToGroup: (message) => {
                        newMessage(message);
                    },
                    onGroupMemberJoined: (message) => {
                        newMessage(message);
                    },
                })
            );

            CometChatUIEventHandler.addMessageListener(
                uiEventListener,
                {
                    ccMessageSent: ({ message, status }) => {
                        if (status == MessageStatusConstants.inprogress) {
                            newMessage(message, false);
                        }

                        if (status == MessageStatusConstants.success) {
                            messageEdited(message, true);
                        }
                    },
                    ccMessageEdited: ({ message, status }) => {
                        if (status == messageStatus.success)
                            messageEdited(message, false);
                    },
                    ccMessageDeleted: ({ message }) => {
                        messageEdited(message, false);
                    },
                }
            )
            CometChatUIEventHandler.addGroupListener(
                uiEventListener,
                {
                    ccGroupMemberUnBanned: ({ message }) => {
                        newMessage(message, false)
                    },
                    ccGroupMemberBanned: ({ message }) => {
                        newMessage(message, false)
                    },
                    ccGroupMemberAdded: ({ message, usersAdded, userAddedIn }) => {
                        usersAdded.forEach(user => {
                            message['message'] = `${loggedInUser.current['name']} added ${user.name}`;
                            message['muid'] = String(getUnixTimestamp());
                            message['sentAt'] = getUnixTimestamp();
                            newMessage(message, false);
                        })
                    },
                    ccGroupMemberKicked: ({ message }) => {
                        newMessage(message, false)
                    },
                    ccGroupMemberScopeChanged: ({ action, updatedUser, scopeChangedTo, scopeChangedFrom, group }) => {
                        newMessage(action, false);
                    },
                    ccOwnershipChanged: ({ group, message }) => {
                        // newMessage(message, false); removed after discussion.
                    }
                }
            )

            CometChat.addCallListener(
                callListenerId,
                new CometChat.CallListener({
                    onIncomingCallReceived: (call) => {
                        newMessage(call);
                    },
                    onOutgoingCallAccepted: (call) => {
                        newMessage(call);
                    },
                    onOutgoingCallRejected: (call) => {
                        newMessage(call);
                    },
                    onIncomingCallCancelled: (call) => {
                        newMessage(call);
                    }
                })
            );

            CometChatUIEventHandler.addCallListener(
                uiEventListener,
                {
                    ccCallInitiated: ({ call }) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    },
                    ccOutgoingCall: ({ call }) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    },
                    ccCallAccepted: ({ call }) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    },
                    ccCallRejected: ({ call }) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    },
                    ccCallEnded: ({ call }) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    }
                }
            )
            CometChat.addConnectionListener(
                connectionListenerId,
                new CometChat.ConnectionListener({
                    onConnected: () => {
                        console.log("ConnectionListener => On Connected - Message List", messagesList.length);
                        getUpdatedPreviousMessages();
                    },
                    inConnecting: () => {
                        console.log("ConnectionListener => In connecting");
                    },
                    onDisconnected: () => {
                        console.log("ConnectionListener => On Disconnected");
                        if (!messagesList[0].id) {
                            for (let i = 0; i < messagesList.length; i++) {
                                if (messagesList[i].id) {
                                    lastID.current = messagesList[i].id;
                                    break;
                                }
                            }
                        } else {
                            lastID.current = messagesList[0].id;
                        }
                    }
                })
            );

            return () => {
                // clean up code like removing listeners
                CometChatUIEventHandler.removeMessageListener(uiEventListener);
                CometChatUIEventHandler.removeGroupListener(uiEventListener);
                CometChatUIEventHandler.removeCallListener(uiEventListener);

                CometChat.removeGroupListener(groupListenerId);
                CometChat.removeMessageListener(messageListenerId);
                CometChat.removeCallListener(callListenerId);
                CometChat.removeConnectionListener(connectionListenerId);
            }

        }, [messagesList, unreadCount, user, group]);

        useEffect(() => {
            CometChatUIEventHandler.addUIListener(uiEventListener, {
                ccToggleBottomSheet: (item) => {
                    bottomSheetRef.current?.togglePanel()
                },
            });

            return () => CometChatUIEventHandler.removeUIListener(uiEventListener);
        }, []);

        // effects
        useEffect(() => {
            CometChat.getLoggedinUser()
                .then(u => {
                    loggedInUser.current = u;
                    messageRequest.current = msgRequestBuilder.current.build();
                    getPreviousMessages();
                    loadTemplates();
                })
                .catch(e => {
                    console.log("Error while getting loggedInUser");
                    onError && onError(e);
                    loggedInUser.current = null;
                });
            return () => {
                onBack && onBack();
            }
        }, []);

        useImperativeHandle(ref, () => {
            return {
                addMessage: newMessage,
                updateMessage: messageEdited,
                removeMessage,
                deleteMessage,
                scrollToBottom,
                /// todo: not handeled yet
                createActionMessage,
                updateMessageReceipt,
            }
        });

        // functions returning view
        const getLeadingView = (item: CometChat.BaseMessage) => {
            if (showAvatar && (item.getSender()?.getUid() || item['sender']['uid']) !== loggedInUser.current['uid'] && item['category'] != MessageCategoryConstants.action) {
                return <CometChatAvatar
                    image={item.getSender().getAvatar() ? { uri: item.getSender().getAvatar() } : undefined}
                    name={item.getSender().getName()}
                    style={_avatarStyle}
                />
            }
            return null
        }

        const getHeaderView = (item: CometChat.BaseMessage) => {
            let senderName: string = "";
            if ((item.getSender()?.getUid() || item['sender']['uid']) != loggedInUser.current['uid'])
                senderName = item.getSender().getName();

            if (item.getCategory() == MessageCategoryConstants.action || item.getCategory() == MessageCategoryConstants.call)
                return null;

            return (
                <View style={{ flexDirection: "row" }}>
                    <Text style={[Style.nameStyle, {
                        color: _messageListStyle.nameTextColor,
                        ..._messageListStyle.nameTextFont,
                    }]}>{senderName}</Text>
                    {
                        timeStampAlignment == "bottom" || item['category'] == "action" ?
                            null :
                            <CometChatDate
                                timeStamp={((item.getDeletedAt() || item.getReadAt() || item.getDeliveredAt() || item.getSentAt()) * 1000) || getSentAtTimestamp(item)}
                                style={messageBubbleDateStyle}
                                pattern={"timeFormat"}
                                customDateString={datePattern && datePattern(item)}
                            />
                    }
                </View>
            )
        }

        const getFooterView = (item: CometChat.BaseMessage, bubbleAlignment: MessageBubbleAlignmentType): JSX.Element => {
            // return null if time alignment is top
            if (timeStampAlignment == "top" || item['category'] == "action") return null

            let isSender = (item.getSender()?.getUid() || item['sender']['uid']) == loggedInUser.current['uid'];
            let messageState;
            if (item.getReadAt())
                messageState = "READ";
            else if (item.getDeliveredAt())
                messageState = "DELIVERED";
            else if (item.getSentAt())
                messageState = "SENT";
            else if (isSender)
                messageState = "WAIT";
            else
                messageState = "ERROR"

            return <View style={[{ flexDirection: "row", justifyContent: bubbleAlignment === "right" ? "flex-end" : "flex-start" }]}>
                <CometChatDate
                    timeStamp={((item.getDeletedAt() || item.getReadAt() || item.getDeliveredAt() || item.getSentAt()) * 1000) || getSentAtTimestamp(item)}
                    style={messageBubbleDateStyle}
                    pattern={"timeFormat"}
                    customDateString={datePattern && datePattern(item)}
                />
                {
                    !disableReceipt && isSender ?
                        <CometChatReceipt
                            receipt={messageState}
                            deliveredIcon={deliveredIcon}
                            readIcon={readIcon}
                            sentIcon={sentIcon}
                            waitIcon={waitIcon}
                            errorIcon={errorIcon}
                        /> :
                        null
                }
            </View>
        }

        const getAlignment = (item: CometChat.BaseMessage): MessageBubbleAlignmentType => {
            if (item && item.getCategory() == MessageCategoryConstants.action)
                return "center";
            if (alignment == "standard" && (item.getSender()?.getUid() || item['sender']['uid']) == loggedInUser.current['uid'])
                return "right";
            return "left";
        }

        const openMessageInfo = (message) => {
            infoObject.current = message;
            setMessageInfo(true);
            setShowMessageOptions([]);
        }

        const openThreadView = (...params) => {
            if (onThreadRepliesPress) {
                onThreadRepliesPress(params[0], MessageView.bind(this, { message: params[0], isThreaded: true, showOptions: false }));
            }
            setShowMessageOptions([]);
            return onThreadRepliesPress
        }

        const editMessage = (item) => {
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, { message: item, status: messageStatus.inprogress });
            setShowMessageOptions([]);
        }

        const copyMessage = (item) => {
            Clipboard.setString(item['text']);
            setShowMessageOptions([]);
        }

        const getThreadView = (item: CometChat.BaseMessage) => {
            let isThreaded = item.getReplyCount() > 0;

            let style = {
                color: theme?.palette.getPrimary()
            }
            if (item['sender']['uid'] == loggedInUser.current['uid']) {
                style.color = theme?.palette.getSecondary();
            }

            return !isThreaded ? null :
                <TouchableOpacity
                    onPress={() => openThreadView(item, null)}
                    style={{ flexDirection: "row", margin: 4, borderTopWidth: 1, borderColor: theme?.palette.getAccent50(), justifyContent: "space-between", padding: 4 }}>
                    <Text style={style}>{`View ${item.getReplyCount()} replies`}</Text>
                    <Image style={{ resizeMode: "contain", tintColor: theme?.palette.getPrimary() }} source={rightArrowIcon} />
                </TouchableOpacity>
        }

        const privateMessage = (item: CometChat.BaseMessage) => {
            setShowMessageOptions([]);
            CometChat.getUser(item.getSender().getUid())
                .then(user => {
                    console.log({ user });
                    CometChatUIEventHandler.emitUIEvent('openChat', { user, group });
                })
                .catch(e => {
                    onError && onError(e);
                })
        }

        const shareMedia = async (messageObject: CometChat.BaseMessage) => {
            let textMessage = messageObject.data.text;
            let fileUrl = messageObject.data.url;

            const getFileName = () => {
                if (!fileUrl) return "";
                return (fileUrl.substring(fileUrl.lastIndexOf("/") + 1, fileUrl.length)).replace(" ", "_");
            }

            let shareObj = {
                "message": textMessage,
                "type": messageObject["type"],
                "mediaName": getFileName(), // get File name
                "fileUrl": fileUrl || "", // get File url
                "mimeType": messageObject["type"] === "text" ? "" : messageObject?.getAttachment()?.getMimeType(), // get Mime Type
            }

            NativeModules.FileManager.shareMessage(shareObj, (callback) => {
                console.log("shareMessage Callback", callback);
            });
        };

        const getStyle = (item: CometChat.BaseMessage): BaseStyleInterface => {
            let _style = new BaseStyle({
                ..._messageBubbleStyle,
                backgroundColor: theme?.palette.getAccent50()
            });

            if ((item.getSender()?.getUid() || item['sender']['uid']) == loggedInUser.current?.['uid'] && item.getCategory() == MessageCategoryConstants.message)
                _style.backgroundColor = theme?.palette.getPrimary();

            return _style;
        }

        // const clearForwarding = () => {
        //     messageToForward.current = null;
        //     setForwarding(false);
        // }

        // const showForwardMessage = (message: CometChat.BaseMessage) => {
        //     setShowMessageOptions([]);
        //     messageToForward.current = message;
        //     setForwarding(true);
        // }

        // const forwardingMessage = (receiverId, receiver, receiverType) => {
        //     return new Promise((resolve, reject) => {
        //         if (messageToForward.current.getCategory() == MessageCategoryConstants.message) {
        //             switch (messageToForward.current.getType()) {
        //                 case MessageTypeConstants.text:
        //                     let textMessage: CometChat.TextMessage = new CometChat.TextMessage(
        //                         receiverId,
        //                         messageToForward.current['text'],
        //                         ReceiverTypeConstants.user
        //                     );

        //                     textMessage.setReceiverId(`${receiverId}`);
        //                     textMessage.setSender(messageToForward.current['sender']);
        //                     textMessage.setReceiver(receiver);
        //                     textMessage.setMuid(`${getUnixTimestamp()}`);
        //                     textMessage['_composedAt'] = getUnixTimestamp();
        //                     textMessage.setReceiverType(receiverType);
        //                     CometChatUIKit.sendTextMessage(textMessage, resolve, reject)
        //                     break;
        //                 case MessageTypeConstants.image:
        //                 case MessageTypeConstants.video:
        //                 case MessageTypeConstants.audio:
        //                 case MessageTypeConstants.file:
        //                     let mediaMessage: CometChat.MediaMessage = new CometChat.MediaMessage(
        //                         receiverId,
        //                         messageToForward.current['file'],
        //                         messageToForward.current['type'],
        //                         ReceiverTypeConstants.user);


        //                     mediaMessage.setReceiverId(`${receiverId}`);
        //                     mediaMessage.setSender(messageToForward.current['sender']);
        //                     mediaMessage.setReceiver(receiver);
        //                     mediaMessage.setReceiverType(receiverType);
        //                     mediaMessage.setMuid(`${getUnixTimestamp()}`);
        //                     mediaMessage['_composedAt'] = getUnixTimestamp();

        //                     mediaMessage.setType(messageToForward.current.getType());
        //                     mediaMessage['_id'] = '_' + Math.random().toString(36).substr(2, 9);

        //                     mediaMessage.setData(messageToForward.current['data']);

        //                     CometChatUIKit.sendMediaMessage(mediaMessage, resolve, reject)
        //                     break;
        //                 default:
        //                     break;
        //             }
        //         }
        //     });
        // }

        // const forwardMessage = (list: {users:Array<CometChat.User>, groups:Array<CometChat.Group>}, navigate: boolean = false) => {
        //     const {users, groups} = list;
        //     setForwarding(false);
        //     CometChatUIEventHandler.emitMessageEvent('ccMessageForwarded',{users, groups, status: messageStatus.inprogress});
        //     let allSelected;
        //     if (users && users.length > 0) {
        //         allSelected = users?.map((item) => {
        //             return forwardingMessage(item.getUid(), item, ReceiverTypeConstants.user);
        //         })
        //     }
        //     if (groups && groups.length > 0)
        //         allSelected.push(...groups.map((item) => {
        //             return forwardingMessage(item.getGuid(), item, ReceiverTypeConstants.group);
        //         }));
        //     Promise.all(allSelected).then(complete => {
        //         clearForwarding();
        //         CometChatUIEventHandler.emitMessageEvent('ccMessageForwarded',{users, groups, status: messageStatus.success});
        //     });
        // }

        const openOptionsForMessage = (item: CometChat.BaseMessage, template: CometChatMessageTemplate) => {
            let options = template?.options ? template.options(loggedInUser.current, item, group) : [];
            let optionsWithPressHandling = options.map(option => {
                if (!option.onPress)
                    switch (option.id) {
                        case MessageOptionConstants.messageInformation:
                            option.onPress = openMessageInfo.bind(this, item);
                            break;
                        case MessageOptionConstants.replyInThread:
                            option.onPress = openThreadView.bind(this, item);
                            break;
                        case MessageOptionConstants.deleteMessage:
                            option.onPress = deleteMessage.bind(this, item);
                            break;
                        case MessageOptionConstants.editMessage:
                            option.onPress = editMessage.bind(this, item);
                            break;
                        case MessageOptionConstants.copyMessage:
                            option.onPress = copyMessage.bind(this, item);
                            break;
                        case MessageOptionConstants.sendMessagePrivately:
                            option.onPress = privateMessage.bind(this, item);
                            break;
                        // case MessageOptionConstants.forwardMessage:
                        //     option.onPress = showForwardMessage.bind(this, item);
                        //     break
                        case MessageOptionConstants.shareMessage:
                            option.onPress = shareMedia.bind(this, item);
                            break;
                    }
                if (option.id === MessageOptionConstants.reactToMessage) {
                    option.onPress = () => {
                        if (option.CustomView) {
                            let view = option.CustomView(item)
                            setExtensionsComponent(() => view)
                        }
                    }
                }
                return option;
            })
            setShowMessageOptions(optionsWithPressHandling);
        }

        const MessageView = (params: { message: CometChat.BaseMessage, showOptions?: boolean, isThreaded?: boolean }) => {
            const { message, showOptions = true, isThreaded = false } = params;
            let hasTemplate = templatesMap.get(`${message.getCategory()}_${message.getType()}`)
            if (templates?.length > 0) {
                let customTemplate = templates.find(template => template.type == message.getType() && template.category == message.getCategory())
                if (customTemplate)
                    hasTemplate = customTemplate;
            }
            if (hasTemplate) {

                if (hasTemplate.BubbleView) return hasTemplate.BubbleView(message);

                let bubbleAlignment: MessageBubbleAlignmentType = getAlignment(message);

                return <>
                    <TouchableOpacity onLongPress={() => showOptions ? openOptionsForMessage(message, hasTemplate) : undefined} >
                        <CometChatMessageBubble
                            id={`${message.getId()}`}
                            LeadingView={() => !isThreaded && getLeadingView(message)}
                            HeaderView={() => !isThreaded && getHeaderView(message)}
                            FooterView={() => getFooterView(message, bubbleAlignment)}
                            alignment={isThreaded ? "left" : bubbleAlignment}
                            ContentView={hasTemplate.ContentView?.bind(this, message, bubbleAlignment)}
                            ThreadView={() => !isThreaded && getThreadView(message)}
                            BottomView={() => ChatConfigurator.dataSource.getBottomView(message, bubbleAlignment)} // Note please rewrite this
                            style={getStyle(message)}
                        />
                    </TouchableOpacity>
                </>
            } else {
                return null;
            }
        }

        const getSentAtTimestamp = (item) => {
            if (!item['sentAt']) {
                return item['_composedAt'];
            }
            return item['sentAt'] * 1000;
        }

        const RenderMessageItem = ({ item, index }) => {
            let seperatorView = null;
            const previousMessageDate = messagesList[index + 1] ? new Date(getSentAtTimestamp(messagesList[index + 1])) : null;
            const currentMessageDate = new Date(getSentAtTimestamp(item));

            const currentDate = isNaN(currentMessageDate.getDate()) ? undefined : `${currentMessageDate.getDate()}-${currentMessageDate.getMonth()}-${currentMessageDate.getFullYear()}`;

            const previousDate = `${previousMessageDate?.getDate()}-${previousMessageDate?.getMonth()}-${previousMessageDate?.getFullYear()}`;

            if (currentDate != undefined && previousDate !== currentDate) {
                seperatorView = (
                    <View style={{ marginBottom: 10 }}>
                        <CometChatDate
                            timeStamp={getSentAtTimestamp(item)}
                            pattern={"dayDateFormat"}
                            style={_dateSeperatorStyle}
                            customDateString={dateSeperatorPattern ? dateSeperatorPattern(item['sentAt']) : undefined}
                        />
                    </View>
                )
            }
            lastMessageDate.current = getSentAtTimestamp(item);

            return <>
                <MessageView message={item} />
                {seperatorView}
            </>
        }

        const keyExtractor = useCallback((item) => `${item.id}_${item.muid}`, [])

        const itemSeperator = useCallback(() => <View style={{ height: 8 }} />, [])

        const getEmptyTextView = () => {
            if (EmptyStateView)
                return <EmptyStateView />

            return (
                <View style={Style.msgContainerStyle}>
                    <Text
                        style={[
                            Style.msgTxtStyle, {
                                ...(messageListStyle?.emptyStateTextFont),
                                color: messageListStyle?.emptyStateTextColor
                            }]}
                    >
                        {emptyStateText}
                    </Text>
                </View >
            )
        }

        const getErrorStateView = () => {
            if (ErrorStateView)
                return ErrorStateView(new CometChat.CometChatException({ message: "Something went wrong" }));
            return (
                <View style={Style.msgContainerStyle}>
                    <Text
                        style={[Style.msgTxtStyle, {
                            ...messageListStyle?.errorStateTextFont,
                            color: messageListStyle?.errorStateTextColor
                        }]}
                    >
                        {errorStateText}
                    </Text>
                </View>
            );
        }

        const getLoadingStateView = () => {
            if (LoadingStateView)
                return LoadingStateView;

            return (
                <View style={Style.msgContainerStyle}>
                    <ActivityIndicator size="large" color={messageListStyle?.loadingIconTint} />
                </View>
            )
        }

        const {
            height,
            width,
            backgroundColor,
            border,
            borderRadius,
        } = _messageListStyle;

        return (
            <View style={{ height, width, backgroundColor, borderRadius, ...border }}>
                {
                    listState == "loading" && messagesList.length == 0 ?
                        getLoadingStateView() :
                        listState == "error" ?
                            getErrorStateView() :
                            listState == "" ?
                                messagesList.length == 0 ?
                                    getEmptyTextView() :
                                    <View style={{ height: "100%", width: "100%" }}>
                                        {
                                            HeaderView && <View style={[Style.stickyHeaderFooterStyle, { top: 0 }]}>
                                                <HeaderView
                                                    group={group && group['guid']}
                                                    user={user && user['uid']}
                                                    id={{
                                                        guid: group && group['guid'],
                                                        uid: user && user['uid'],
                                                        parentMessageId: parentMessageId
                                                    }}
                                                />
                                            </View>
                                        }
                                        {
                                            loadingMessages && <ActivityIndicator size="small" color={_messageListStyle.loadingIconTint} />
                                        }
                                        <FlatList
                                            ref={messageListRef}
                                            inverted={true}
                                            ListEmptyComponent={getEmptyTextView}
                                            data={messagesList}
                                            ItemSeparatorComponent={itemSeperator}
                                            keyExtractor={keyExtractor}
                                            renderItem={RenderMessageItem}
                                            onEndReached={getPreviousMessages}
                                            onEndReachedThreshold={0.8}
                                            onScroll={scrollHandler}
                                            ListHeaderComponent={() => {
                                                if (CustomListHeader)
                                                    return <CustomListHeader />
                                                else return null
                                            }}
                                        />
                                        {
                                            FooterView && <View style={[Style.stickyHeaderFooterStyle, { bottom: 0 }]}>
                                                <FooterView
                                                    group={group && group['guid']}
                                                    user={user && user['uid']}
                                                    id={{
                                                        guid: group && group['guid'],
                                                        uid: user && user['uid'],
                                                        parentMessageId: parentMessageId
                                                    }}
                                                />
                                            </View>
                                        }
                                    </View> : null
                }
                {
                    liveReaction ?
                        <View style={{ alignItems: "flex-end" }}>
                            <CometChatLiveReactions />
                        </View> :
                        null
                }
                {
                    unreadCount > 0 ?
                        <TouchableOpacity
                            onPress={newMsgIndicatorPressed.bind(this)}
                            style={Style.newMessageIndicatorStyle}>
                            <Text style={[Style.newMessageIndicatorText]}>
                                {
                                    newMessageIndicatorText ?
                                        newMessageIndicatorText :
                                        `${unreadCount} ${localize("NEW_MESSAGE")}`
                                }
                            </Text>
                            <Image
                                source={downArrowIcon}
                                style={Style.newMessageIndicatorImage} />
                        </TouchableOpacity>
                        :
                        null
                }
                {/* {
                    forwarding &&
                    <Modal
                        style={{flex: 1, backgroundColor: theme.palette.getBackgroundColor()}}
                    >
                            <SafeAreaView style={{flex: 1}}>
                                <CometChatContacts
                                    {...forwardMessageConfiguration}
                                    onSubmitIconClick={(list) => {
                                        if (forwardMessageConfiguration?.onSubmitIconClick) {
                                            forwardMessageConfiguration.onSubmitIconClick(list);
                                            clearForwarding();
                                        } else {
                                            forwardMessage(list);
                                        }
                                    }}
                                    onClose={() => {
                                        clearForwarding();
                                        forwardMessageConfiguration?.onClose && forwardMessageConfiguration.onClose()
                                    }}
                                    selectionMode={forwardMessageConfiguration?.selectionMode || 'multiple'}
                                    selectionLimit={forwardMessageConfiguration?.selectionLimit || 5}
                                    onItemPress={forwardMessageConfiguration?.selectionMode == 'single' ?
                                        forwardMessageConfiguration?.onItemPress || (({ group, user }) => {
                                            forwardMessage({ users: user && [user], groups: group && [group] }, true);
                                        }) : undefined}
                                    hideSubmit={forwardMessageConfiguration?.selectionMode == 'single'}
                                />
                            </SafeAreaView>
                    </Modal>
                } */}

                <CometChatBottomSheet ref={bottomSheetRef} onClose={() => {
                    if (ExtensionsComponent) setExtensionsComponent(null)
                    setShowMessageOptions([])
                    infoObject.current = null;
                    setMessageInfo(false);
                }} isOpen={showMessageOptions.length > 0 || ExtensionsComponent || messageInfo}
                >
                    {
                        ExtensionsComponent ? ExtensionsComponent :
                            messageInfo ?
                                <CometChatMessageInformation
                                    message={infoObject.current}
                                    template={templatesMap.get(`${infoObject.current.getCategory()}_${infoObject.current.getType()}`)}
                                    sentIcon={sentIcon}
                                    deliveredIcon={deliveredIcon}
                                    readIcon={readIcon}
                                    {...messageInformationConfiguration}
                                    onBack={() => {
                                        infoObject.current = null;
                                        setMessageInfo(false);
                                        messageInformationConfiguration?.onBack && messageInformationConfiguration.onBack();
                                    }}
                                /> :
                                <CometChatActionSheet actions={showMessageOptions} style={_actionStyle} />
                    }
                </CometChatBottomSheet>
            </View>
        )
    });

CometChatMessageList.defaultProps = {
    timeStampAlignment: "bottom",
    templates: [],
    showAvatar: true,
    alignment: "standard",
    errorStateText: localize("SOMETHING_WRONG"),
    emptyStateText: localize("NO_MESSAGES_FOUND"),
    disableReceipt: false
}