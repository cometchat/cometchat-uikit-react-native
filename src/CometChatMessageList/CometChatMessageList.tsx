import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle, useContext, useCallback, memo, useLayoutEffect } from "react";
import { View, FlatList, Text, Image, TouchableOpacity, ActivityIndicator, Modal, SafeAreaView, NativeModules, ScrollView, Dimensions, Platform, Keyboard } from "react-native";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { LeftArrowCurve, RightArrowCurve } from "./resources";
import { BaseStyle, BaseStyleInterface, CometChatContext, CometChatMentionsFormatter, CometChatTextFormatter, CometChatUIKit, CometChatUrlsFormatter, ImageType, SuggestionItem } from "../shared";
import { MessageBubbleStyle, MessageBubbleStyleInterface } from "../shared/views/CometChatMessageBubble/MessageBubbleStyle";
import { AvatarStyle, AvatarStyleInterface } from "../shared";
import { CometChatAvatar, CometChatDate, CometChatReceipt, DateStyle } from "../shared";
import { MessageListStyle, MessageListStyleInterface } from "./MessageListStyle";
import { CometChatMessageBubble } from "../shared/views/CometChatMessageBubble";
import { CallTypeConstants, MessageCategoryConstants, MessageOptionConstants, MessageStatusConstants, MessageTypeConstants, ReceiverTypeConstants, ViewAlignment } from "../shared/constants/UIKitConstants";
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
import { CometChatContextType, MessageBubbleAlignmentType, MessageListAlignmentType, MessageTimeAlignmentType } from "../shared/base/Types";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { ActionSheetStylesInterface } from "../shared/views/CometChatActionSheet/ActionSheetStyle";
import { CometChatMessageInformation } from "../CometChatMessageInformation/CometChatMessageInformation";
// import { CometChatContacts, ForwardMessageConfigurationInterface } from "../CometChatContacts";
import { MessageInformationConfigurationInterface } from "../CometChatMessageInformation";
import { InteractiveMessageUtils } from "../shared/utils/InteractiveMessageUtils";
import { CometChatEmojiKeyboard, EmojiKeyboardStyle } from "../shared/views/CometChatEmojiKeyboard";
import { CometChatReactionList, ReactionListConfigurationInterface } from "../shared/views/CometChatReactionList";
import { CometChatQuickReactions, QuickReactionsConfigurationInterface } from "../shared/views/CometChatQuickReactions";
import { CometChatReactions, ReactionsConfigurationInterface } from "../shared/views/CometChatReactions";
import { CommonUtils } from "../shared/utils/CommonUtils";
import Clipboard from "@react-native-clipboard/clipboard";
import { commonVars } from "../shared/base/vars";

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
    hideError?: boolean,
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
    /**
     * This function returns a string for custom date representation based on the provided message object.
     * 
     * @param baseMessage - The message object.
     * @returns The string for custom date representation.
     */
    datePattern?: (message: CometChat.BaseMessage) => string,
    timeStampAlignment?: MessageTimeAlignmentType,
    dateSeparatorPattern?: (date: number) => string,
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
    messageInformationConfiguration?: MessageInformationConfigurationInterface,
    /**
     * Hide the header of the action sheet
     */
    hideActionSheetHeader?: boolean,
    /**
     * Message Reaction Configuration @ReactionsConfigurationInterface
     */
    reactionsConfiguration?: ReactionsConfigurationInterface,
    /**
     * Message Reaction List Configuration @ReactionListConfigurationInterface
     */
    reactionListConfiguration?: ReactionListConfigurationInterface,
    /**
     * Quick Reaction Configuration @QuickReactionsConfigurationInterface
     */
    quickReactionConfiguration?: QuickReactionsConfigurationInterface,
    /**
     * Emoji Keyboard style @EmojiKeyboardStyle
     */
    emojiKeyboardStyle?: EmojiKeyboardStyle,
    /**
     * Disables the reactions functionality
     */
    disableReactions?: boolean,
    disableMentions?: boolean,
    /**
     * Collection of text formatter class
     * @type {Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>}
    */
    textFormatters?: Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>;
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

export const CometChatMessageList = memo(forwardRef<
    CometChatMessageListActionsInterface,
    CometChatMessageListProps>
    ((props: CometChatMessageListProps, ref) => {

        const {
            parentMessageId,
            user,
            group,
            EmptyStateView,
            emptyStateText = localize("NO_MESSAGES_FOUND"),
            ErrorStateView,
            errorStateText = localize("SOMETHING_WRONG"),
            hideError,
            LoadingStateView,
            disableReceipt = false,
            disableSoundForMessages,
            customSoundForMessages,
            readIcon,
            deliveredIcon,
            sentIcon,
            waitIcon,
            errorIcon,
            alignment = "standard",
            showAvatar = true,
            datePattern,
            timeStampAlignment = "bottom",
            dateSeparatorPattern,
            templates = [],
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
            messageInformationConfiguration,
            hideActionSheetHeader,
            reactionsConfiguration,
            disableReactions,
            reactionListConfiguration,
            quickReactionConfiguration,
            emojiKeyboardStyle,
            disableMentions,
            textFormatters
        } = props;

        const callListenerId = "call_" + new Date().getTime();
        const groupListenerId = "group_" + new Date().getTime();
        const uiEventListener = "uiEvent_" + new Date().getTime();
        const callEventListener = 'callEvent_' + new Date().getTime();
        const uiEventListenerShow = "uiEvent_show_" + new Date().getTime();
        const uiEventListenerHide = "uiEvent_hide_" + new Date().getTime();
        const connectionListenerId = 'connectionListener_' + new Date().getTime();

        useLayoutEffect(() => {
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

            //updating users request builder
            let _updatedCustomRequestBuilder = _defaultRequestBuilder;
            if (messageRequestBuilder) {
                _updatedCustomRequestBuilder = messageRequestBuilder;
                if (user)
                    _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setUID(user["uid"])
                if (group)
                    _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setGUID(group["guid"])
            } else {
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
            }

            msgRequestBuilder.current = _updatedCustomRequestBuilder;

        }, []);

        const { theme } = useContext<CometChatContextType>(CometChatContext);
        let Keyboard_Height = 0;
        let scrollPos = 0;

        // creating style based on styles from users
        const _messageListStyle = useRef(new MessageListStyle({
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
        })).current;
        const _avatarStyle = useRef(new AvatarStyle({
            nameTextColor: _messageListStyle.nameTextColor,
            nameTextFont: _messageListStyle.nameTextFont,
            ...avatarStyle
        })).current;
        const _dateSeperatorStyle = useRef(new DateStyle({
            textColor: _messageListStyle.timestampTextColor,
            textFont: theme?.typography.title2,
            ...dateSeperatorStyle
        })).current;
        const messageBubbleDateStyle = useRef(new DateStyle({
            textColor: _messageListStyle.timestampTextColor,
            textFont: _messageListStyle.timestampTextFont
        })).current;
        const _actionStyle = useRef(new ActionSheetStyles({
            actionSheetSeparatorTint: 'transparent',
            ...actionSheetStyle
        })).current;
        const _messageBubbleStyle = useRef(new MessageBubbleStyle({
            ...wrapperMessageBubbleStyle
        })).current;

        // refs
        const currentScrollPosition = useRef({ y: null, scrollViewHeight: 0, layoutHeight: 0 });
        const previousScrollPosition = useRef({ y: 0, scrollViewHeight: 0 });
        const messagesLength = useRef(0);
        const prevMessagesLength = useRef(0);
        const messageListRef = useRef<ScrollView>(null);
        const loggedInUser = useRef<CometChat.User>(null);
        const messageRequest = useRef<CometChat.MessagesRequest>(null);
        const messagesContentListRef = useRef([]);

        const msgRequestBuilder = useRef<CometChat.MessagesRequestBuilder>();
        const lastMessageDate = useRef(new Date().getTime());

        // states
        const [messagesList, setMessagesList] = useState([]);
        const [listState, setListState] = useState("loading");
        const [loadingMessages, setLoadingMessages] = useState(false);
        const [unreadCount, setUnreadCount] = useState(0);
        const [showMessageOptions, setShowMessageOptions] = useState([]);
        const [ExtensionsComponent, setExtensionsComponent] = useState(null);
        const [CustomListHeader, setCustomListHeader] = useState(null);
        const [messageInfo, setMessageInfo] = useState(false);
        const [ongoingCallView, setOngoingCallView] = useState(null);
        const [selectedMessage, setSelectedMessage] = useState(null);
        const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
        const [showReactionList, setShowReactionList] = useState(false);
        const [selectedEmoji, setSelectedEmoji] = useState(null);
        // const [forwarding, setForwarding] = useState(false);

        const infoObject = useRef<CometChat.BaseMessage>();
        const inProgressMessages = useRef([]);
        // const messageToForward = useRef<CometChat.BaseMessage>();
        const bottomSheetRef = useRef(null)
        const conversationId = useRef(null)
        let lastID = useRef(0);

        const scrollHandler = (event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const screenHeight = Dimensions.get('window').height;

            // Calculate the scroll position
            const scrollPosition = layoutMeasurement.height + contentOffset.y;
            const scrollEndPosition = contentSize.height - screenHeight;

            currentScrollPosition.current.y = contentOffset.y;

            if (currentScrollPosition.current.layoutHeight != layoutMeasurement.height) {
                currentScrollPosition.current.layoutHeight = layoutMeasurement.height;
            }
            if (currentScrollPosition.current.scrollViewHeight !== contentSize.height) {
                currentScrollPosition.current.scrollViewHeight = contentSize.height;
            }

            // Check if the scroll position is at the end
            if (scrollPosition >= scrollEndPosition && unreadCount > 0) {
                markUnreadMessageAsRead();
            }
        }

        const markUnreadMessageAsRead = () => {
            for (let index = 0; index < unreadCount; index++) {
                const message = messagesContentListRef.current[messagesContentListRef.current.length - (index + 1)];
                if (index == 0)
                    CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message });
                CometChat.markAsRead(message);
                setUnreadCount(0);
            }
        }

        const newMsgIndicatorPressed = () => {
            scrollToBottom();
            markUnreadMessageAsRead();
        };

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
                    if (messagesList.length === 0 && msgs?.length > 0) {
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccActiveChatChanged, { message: reversed[0], user: user, group: group, theme: theme, parentMessageId: parentMessageId });
                        if (conversationId.current == null)
                            conversationId.current = reversed[0].getConversationId();

                    }
                    else if (messagesList.length === 0 && !props?.parentMessageId) {
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccActiveChatChanged, { message: reversed[0], user: user, group: group, theme: theme, parentMessageId: parentMessageId });

                    }

                    for (let index = 0; index < reversed.length; index++) {
                        const message: CometChat.BaseMessage = reversed[index];
                        if (message && !disableReceipt && !message.hasOwnProperty("readAt") && loggedInUser.current.getUid() != message['sender']['uid']) {
                            CometChat.markAsRead(message);
                            if (index == 0)
                                CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message });
                        } else
                            break;
                    }
                    reversed = reversed.map((item: CometChat.BaseMessage, index) => {
                        if (item.getCategory() === MessageCategoryConstants.interactive) {
                            return InteractiveMessageUtils.convertInteractiveMessage(item);
                        } else {
                            return item;
                        }
                    })
                    if (reversed.length > 0) {
                        let reversedData = [...reversed.reverse()];
                        messagesContentListRef.current = [...reversedData, ...messagesContentListRef.current];
                        setMessagesList([...reversedData, ...messagesList]);
                    }
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
                    for (let i = (cleanUpdatedList.length - 1); i >= 0; i--) {
                        if (cleanUpdatedList[i].id == lastID.current) break;
                        if (cleanUpdatedList[i].id == undefined || Number.isNaN(parseInt(cleanUpdatedList[i].id)))
                            cleanUpdatedList.splice(i, 1);
                    }
                    // console.log("newMessages", newMessages.length, JSON.stringify(newMessages))
                    if (cleanUpdatedList?.length > 0 && cleanUpdatedList?.[cleanUpdatedList.length - 1]?.["muid"]) {
                        let localFileExists = newMessages.findIndex(msg => msg?.["muid"] == cleanUpdatedList?.[cleanUpdatedList.length - 1]?.["muid"]);
                        if (localFileExists > -1) {
                            cleanUpdatedList.shift();
                        }
                    }
                    let tmpList = [...cleanUpdatedList, ...newMessages];
                    tmpList = tmpList.map((item: CometChat.BaseMessage, index) => {
                        if (item.getCategory() === MessageCategoryConstants.interactive) {
                            return InteractiveMessageUtils.convertInteractiveMessage(item);
                        } else {
                            return item;
                        }
                    })
                    if (inProgressMessages.current.length) {
                        const filteredInProgressMessages = inProgressMessages.current.filter(secondItem =>
                            !tmpList.some(firstItem => firstItem.muid === secondItem.muid)
                        );
                        const combinedArray = tmpList.concat(filteredInProgressMessages);
                        tmpList = combinedArray
                    }
                    messagesContentListRef.current = tmpList;
                    setMessagesList(tmpList);
                    bottomHandler(tmpList[tmpList.length - 1], true);
                    if (newMessages.length === 30) {
                        getNewMessages(tmpList);
                    }
                    newRequestBuilder.setMessageId(undefined)
                })
                .catch(e => console.log("error while fetching updated msgs", e))
        }

        const loadTemplates = useCallback(() => {

            let _formatters = textFormatters || [];

            let templates: CometChatMessageTemplate[] = ChatConfigurator.dataSource.getAllMessageTemplates(theme, {
                textFormatters: _formatters,
                disableMentions: disableMentions
            });

            templates.forEach(template => {

                if (templatesMap.get(`${template.category}_${template.type}`)) return
                templatesMap.set(`${template.category}_${template.type}`, template);
            });
        }, [])


        const getPlainString = (underlyingText: string, messageObject: CometChat.BaseMessage) => {

            let _plainString = underlyingText;

            let regexes: Array<RegExp> = []
            let users: { key: string, value: SuggestionItem } = {};


            let edits: Array<{
                "endIndex": number,
                "replacement": string,
                "startIndex": number,
                "user": SuggestionItem
            }> = [];

            let allFormatters = [...(textFormatters || [])];
            let mentionsTextFormatter = ChatConfigurator.getDataSource().getMentionsFormatter(loggedInUser.current);
            allFormatters.push(mentionsTextFormatter);

            allFormatters.forEach((formatter: CometChatMentionsFormatter, key) => {
                regexes.push(formatter.getRegexPattern());
                let suggestionUsers = formatter.getSuggestionItems();
                if (formatter instanceof CometChatMentionsFormatter) {
                    let mentionUsers = (messageObject?.getMentionedUsers && messageObject?.getMentionedUsers()).map(item => new SuggestionItem({
                        id: item.getUid(),
                        name: item.getName(),
                        promptText: "@" + item.getName(),
                        trackingCharacter: "@",
                        underlyingText: `<@uid:${item.getUid()}>`,
                        hideLeadingIcon: false

                    })) || [];
                    suggestionUsers = [...suggestionUsers, ...mentionUsers];
                }
                suggestionUsers?.length > 0 && suggestionUsers.forEach(item => users[item.underlyingText] = item);
            })

            regexes.forEach(regex => {
                let match;
                while ((match = regex.exec(_plainString)) !== null) {
                    const user = users[match[0]];
                    if (user) {
                        edits.push({
                            startIndex: match.index,
                            endIndex: regex.lastIndex,
                            replacement: user.promptText,
                            user
                        });
                    }
                }
            });

            // Sort edits by startIndex to apply them in order
            edits.sort((a, b) => a.startIndex - b.startIndex);

            // Get an array of the entries in the map using the spread operator
            const entries = [...edits].reverse();

            // Iterate over the array in reverse order
            entries.forEach(({ endIndex, replacement, startIndex, user }) => {

                let pre = _plainString.substring(0, startIndex);
                let post = _plainString.substring(endIndex);

                _plainString = pre + replacement + post;

            });

            return _plainString;

        }

        const playNotificationSound = useCallback((message) => {

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
        }, []);

        const scrollToBottom = useCallback((scrollToFirstUnread = false) => {
            if (messageListRef.current && messagesContentListRef.current.length > 0) {
                let firstUnreadPosition = previousScrollPosition.current.scrollViewHeight;
                if (scrollToFirstUnread) {
                    setTimeout(() => {
                        messageListRef.current.scrollTo({ x: 0, y: firstUnreadPosition, animated: false });
                    }, 0)
                } else {
                    setTimeout(() => {
                        messageListRef.current.scrollToEnd({ animated: true });
                    }, 0)
                }
            }
        }, []);

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
            return (message?.getReceiverType() == ReceiverTypeConstants.user &&
                user &&
                user?.getUid() == message.getReceiver()?.['uid']) ||
                (message?.getReceiverType() == ReceiverTypeConstants.group &&
                    message.getReceiverId() &&
                    group &&
                    group?.getGuid() == message.getReceiverId());
        }

        function messageToSameConversation(message: CometChat.BaseMessage): boolean {
            return (message?.getReceiverType() == ReceiverTypeConstants.user &&
                user &&
                user?.getUid() == message.getReceiverId()) ||
                (message?.getReceiverType() == ReceiverTypeConstants.group &&
                    message.getReceiverId() &&
                    group &&
                    group?.getGuid() == message.getReceiverId());
        }
        function checkSameConversation(message: CometChat.BaseMessage): boolean {
            return conversationId.current != null && (message.getConversationId() == conversationId.current);
        }

        function isNearBottom() {
            const { layoutHeight, scrollViewHeight, y } = currentScrollPosition.current;

            let scrollPos = scrollViewHeight - (layoutHeight + y);
            let scrollPosFromBottomInPercentage = (scrollPos / layoutHeight) * 100;

            if (scrollPosFromBottomInPercentage <= 30) { // 30% from bottom
                return true;
            }
            return false;

        }

        const newMessage = (newMessage, isReceived = true) => {
            let baseMessage = newMessage as CometChat.BaseMessage;
            if (baseMessage.getCategory() === MessageCategoryConstants.interactive) {
                newMessage = InteractiveMessageUtils.convertInteractiveMessage(baseMessage);
            }
            if (checkSameConversation(baseMessage) || checkMessageInSameConversation(baseMessage) || messageToSameConversation(baseMessage)) {
                //need to add
                if (newMessage.getParentMessageId()) {
                    if (newMessage.getParentMessageId() == parseInt(parentMessageId)) {
                        // add to list
                        messagesContentListRef.current = [...messagesContentListRef.current, newMessage];
                        inProgressMessages.current = [...inProgressMessages.current, newMessage]
                        setMessagesList(prev => [...prev, newMessage]);
                    } else {
                        //increase count
                        let index = messagesList.findIndex(msg => msg.id === newMessage.parentMessageId);
                        let oldMsg: CometChat.BaseMessage = CommonUtils.clone(messagesList[index]);
                        oldMsg.setReplyCount(oldMsg.getReplyCount() ? oldMsg.getReplyCount() + 1 : 1);
                        // if ((newMessage?.sender?.uid !== loggedInUser.current?.['uid'])) {
                        //     oldMsg.setUnreadReplyCount(oldMsg.getUnreadReplyCount() ? oldMsg.getUnreadReplyCount() + 1 : 1);
                        // }
                        let tmpList = [...messagesList];
                        tmpList[index] = oldMsg;
                        messagesContentListRef.current = tmpList;
                        setMessagesList(tmpList);
                        inProgressMessages.current = [...inProgressMessages.current, newMessage]
                    }
                } else if (parentMessageId == undefined) {
                    messagesContentListRef.current = [...messagesContentListRef.current, newMessage];
                    inProgressMessages.current = [...inProgressMessages.current, newMessage]
                    setMessagesList(prev => [...prev, newMessage]);
                }
                bottomHandler(newMessage, isReceived);
            }

            playNotificationSound(newMessage);
        }

        const bottomHandler = (newMessage: CometChat.BaseMessage, isReceived?: boolean) => {

            // if scroll is not at bottom
            if (!scrollToBottomOnNewMessages && currentScrollPosition.current.y && (Math.round(currentScrollPosition.current.y) <= currentScrollPosition.current.scrollViewHeight)) {
                if ((parentMessageId && newMessage.parentMessageId == parseInt(parentMessageId)) || (!parentMessageId && !newMessage.parentMessageId && (newMessage.getSender()?.getUid() || newMessage?.['sender']?.['uid']) == loggedInUser.current?.['uid'])) {
                    scrollToBottom();
                    return;
                }
                CometChat.markAsDelivered(newMessage);
                if (newMessage?.getReceiverType() == ReceiverTypeConstants.user) {
                    CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageDelivered, { message: newMessage });
                }
                if (isNearBottom()) {
                    scrollToBottom();
                    if (isReceived) {
                        markMessageAsRead(newMessage);
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message: newMessage });
                    }
                } else if ((!parentMessageId && !(newMessage.parentMessageId)) || (parentMessageId && newMessage.parentMessageId == parseInt(parentMessageId))) {
                    setUnreadCount(unreadCount + 1);
                }
            } else {
                scrollToBottom();
                if (isReceived) {
                    markMessageAsRead(newMessage);
                    CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message: newMessage });
                }
            }
        }

        const markParentMessageAsRead = (message: CometChat.BaseMessage) => {
            let condition: (value: any, index: number, obj: any[]) => unknown;
            condition = (msg) => msg.getId() == message?.['parentMessageId'];
            let msgIndex = messagesList.findIndex(condition);
            if (msgIndex > -1) {
                let tmpList = [...messagesList];
                if (message.getCategory() === MessageCategoryConstants.interactive) {
                    message = InteractiveMessageUtils.convertInteractiveMessage(message);
                }
                tmpList[msgIndex]?.setUnreadReplyCount(0);
                messagesContentListRef.current = tmpList;
                setMessagesList(tmpList);
            }
        }

        const messageEdited = (editedMessage: CometChat.BaseMessage, withMuid: boolean = false) => {
            let condition: (value: any, index: number, obj: any[]) => unknown;
            if (withMuid) {
                condition = (msg) => msg['muid'] == editedMessage['muid']
                inProgressMessages.current = inProgressMessages.current.filter(item => item.muid !== editedMessage['muid'])
            }
            else
                condition = (msg) => msg.getId() == editedMessage.getId()
            let msgIndex = messagesList.findIndex(condition);
            if (msgIndex > -1) {
                let tmpList = [...messagesList];
                if (editedMessage.getCategory() === MessageCategoryConstants.interactive) {
                    editedMessage = InteractiveMessageUtils.convertInteractiveMessage(editedMessage);
                }
                tmpList[msgIndex] = CommonUtils.clone(editedMessage);
                messagesContentListRef.current = tmpList;
                setMessagesList(tmpList);
            }
        }

        const removeMessage = (message: CometChat.BaseMessage) => {
            let msgIndex = messagesList.findIndex(msg => msg.getId() == message.getId());
            if (msgIndex == -1) return;

            let tmpList = [...messagesList];
            tmpList.splice(msgIndex, 1);
            messagesContentListRef.current = tmpList;
            setMessagesList(tmpList);
        }

        const deleteMessage = (message: CometChat.BaseMessage) => {
            CometChat.deleteMessage(message.getId().toString())
                .then(res => {
                    CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageDeleted, { message: res });
                    setShowMessageOptions([]);
                })
                .catch(rej => {
                    console.log(rej);
                    onError && onError(rej);
                })
        }

        const createActionMessage = () => { }

        const updateMessageReceipt = (receipt) => {
            let index = messagesList.findIndex((msg, index) => msg['id'] == receipt['messageId'] || msg['messageId'] == receipt['messageId']);

            if (index == -1) return;

            let tmpList: Array<CometChat.BaseMessage> = [...messagesList];

            for (let i = index; i > 0; i--) {

                if (tmpList[i]?.getReadAt && tmpList[i]?.getReadAt()) break;

                let tmpMsg = tmpList[i];
                if ((tmpMsg as CometChat.BaseMessage)?.getReceiverType() == ReceiverTypeConstants.group)
                    return;
                if (tmpMsg.getCategory() === MessageCategoryConstants.interactive) {
                    tmpMsg = InteractiveMessageUtils.convertInteractiveMessage(tmpMsg);
                }
                if (receipt.getDeliveredAt) {
                    tmpMsg.setDeliveredAt(receipt.getDeliveredAt());
                }
                if (receipt.getReadAt) {
                    tmpMsg.setReadAt(receipt.getReadAt());
                }

                tmpList[i] = CommonUtils.clone(tmpMsg);
            }

            messagesContentListRef.current = tmpList;
            setMessagesList(tmpList);
        }

        const handlePannel = (item) => {
            if (item.alignment === ViewAlignment.messageListBottom && CommonUtils.checkIdBelongsToThisComponent(item.id, user, group, parentMessageId)) {
                if (item.child)
                    setCustomListHeader(() => item.child)
                else
                    setCustomListHeader(null)
            }

        }

        useEffect(() => {

            const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => onKeyboardVisibiltyChange(true, e?.endCoordinates?.height));
            const hideSubscription = Keyboard.addListener('keyboardDidHide', () => onKeyboardVisibiltyChange(false));

            CometChatUIEventHandler.addUIListener(
                uiEventListenerShow,
                {
                    showPanel: (item) => handlePannel(item),
                    // ccMentionClick: (item) => {
                    //     // console.log("item", item)
                    // }
                }
            )
            CometChatUIEventHandler.addUIListener(
                uiEventListenerHide,
                {
                    hidePanel: (item) => handlePannel(item)
                }
            )
            CometChatUIEventHandler.addUIListener(uiEventListener, {
                ccToggleBottomSheet: (item) => {
                    bottomSheetRef.current?.togglePanel()
                },
            });
            CometChatUIEventHandler.addCallListener(callEventListener, {
                ccShowOngoingCall: (CometChatOngoingComponent) => {
                    //show ongoing call
                    setOngoingCallView(CometChatOngoingComponent?.child);
                },
            });
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
                showSubscription.remove();
                hideSubscription.remove();
                CometChatUIEventHandler.removeUIListener(uiEventListenerShow)
                CometChatUIEventHandler.removeUIListener(uiEventListenerHide)
                CometChatUIEventHandler.removeUIListener(uiEventListener);
                CometChatUIEventHandler.removeCallListener(callEventListener);
                onBack && onBack();
            }
        }, [])

        useEffect(() => {
            //add listeners

            let reactionListeners = disableReactions ? {} : {
                onMessageReactionAdded: (reaction: CometChat.ReactionEvent) => {
                    updateMessageReaction(reaction, true);
                },
                onMessageReactionRemoved: (reaction: CometChat.ReactionEvent) => {
                    updateMessageReaction(reaction, false);
                }
            }

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
                        if (status == MessageStatusConstants.error) {
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
                    ccMessageRead: ({ message }) => {
                        if (!parentMessageId && message.parentMessageId) {
                            // markParentMessageAsRead(message); //NOTE: uncomment this when want unread count in thread view
                        }
                    },
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
                    onFormMessageReceived: (formMessage) => {
                        newMessage(formMessage);
                    },
                    onCardMessageReceived: (cardMessage) => {
                        newMessage(cardMessage);
                    },
                    onSchedulerMessageReceived: (schedulerMessage) => {
                        newMessage(schedulerMessage);
                    },
                    onCustomInteractiveMessageReceived: (customInteractiveMessage) => {
                        newMessage(customInteractiveMessage);
                    },
                    onInteractionGoalCompleted: (interactionReceipt: CometChat.InteractionReceipt) => {
                        if (loggedInUser?.current?.['uid'] === interactionReceipt?.getSender()?.getUid()) {
                            // && String(message?.getId()) == String(interactionReceipt.getMessageId())
                            let msgIndex = messagesList.findIndex(item => {
                                console.log("getId", item.getId(), interactionReceipt.getMessageId());
                                return item.getId() == interactionReceipt.getMessageId()
                            });
                            console.log("msgIndex", msgIndex)
                            if (msgIndex === -1) return;
                            const interaction = interactionReceipt.getInteractions() || [];
                            let editedMessage = messagesList[msgIndex];
                            editedMessage = InteractiveMessageUtils.convertInteractiveMessage(editedMessage);
                            editedMessage.setInteractions(interaction);
                            messageEdited(editedMessage);
                        }
                    },
                    ...reactionListeners
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
                        if (!messagesList[messagesList.length - 1].id) {
                            for (let i = (messagesList.length - 1); i >= 0; i--) {
                                if (messagesList[i].id) {
                                    lastID.current = messagesList[i].id;
                                    break;
                                }
                            }
                        } else {
                            lastID.current = messagesList[messagesList.length - 1].id;
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
                CometChat.removeCallListener(callListenerId);
                CometChat.removeConnectionListener(connectionListenerId);
            }

        }, [messagesList, unreadCount, user, group]);

        useEffect(() => {
            prevMessagesLength.current = messagesLength.current || messagesContentListRef.current.length;
            messagesLength.current = messagesContentListRef.current.length;
        }, [messagesContentListRef.current])

        useEffect(() => {
            if (selectedEmoji) {
                setShowReactionList(true);
            }
        }, [selectedEmoji])

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

        const onKeyboardVisibiltyChange = (isVisible: boolean, keyboardHeight?: number | undefined) => {
            if (messageListRef.current) {
                if (isVisible) {
                    Keyboard_Height = keyboardHeight;
                    scrollPos = (currentScrollPosition.current.y + Keyboard_Height) - (commonVars.safeAreaInsets.top / 2);
                    messageListRef.current.scrollTo({ y: scrollPos, animated: false })
                } else {
                    messageListRef.current.scrollTo({ y: scrollPos - Keyboard_Height + (commonVars.safeAreaInsets.top / 2), animated: false })
                }
            }
        }

        const getMessageById = (messageId: string): CometChat.BaseMessage => {
            const message = messagesList.find((message) => message.getId() === messageId);
            return message;
        }

        function isReactionOfThisList(receipt: CometChat.ReactionEvent) {
            const receiverId = receipt?.getReceiverId();
            const receiverType = receipt?.getReceiverType();
            const reactedById = receipt?.getReaction()?.getReactedBy()?.getUid();
            const parentMessageId = receipt?.getParentMessageId();
            const listParentMessageId = parentMessageId && String(parentMessageId);
            if (listParentMessageId) {
                if (parentMessageId === listParentMessageId) {
                    return true;
                } else {
                    return false
                }
            } else {
                if (receipt.getParentMessageId()) {
                    return false
                }
                if (user) {
                    if (receiverType === ReceiverTypeConstants.user && (receiverId === user.getUid() || reactedById === user.getUid())) {
                        return true
                    }
                } else if (group) {
                    if (receiverType === ReceiverTypeConstants.group && (receiverId === group.getGuid())) {
                        return true
                    }
                }
            }
            return false
        }

        const updateMessageReaction = (message: CometChat.ReactionEvent, isAdded: boolean): void => {
            let _isReactionOfThisList = isReactionOfThisList(message);
            if (!_isReactionOfThisList) return;

            const messageId = message?.getReaction()?.getMessageId();
            const messageObject = getMessageById(messageId);
            if (!messageObject) return;

            let action: any;
            if (isAdded) {
                action = CometChat.REACTION_ACTION.REACTION_ADDED;
            } else {
                action = CometChat.REACTION_ACTION.REACTION_REMOVED;
            }
            const modifiedMessage = CometChat.CometChatHelper.updateMessageWithReactionInfo(
                messageObject,
                message.getReaction(),
                action
            )
            if (modifiedMessage instanceof CometChat.CometChatException) {
                onError && onError(modifiedMessage);
                return;
            }
            messageEdited(modifiedMessage, false);
        }

        // functions returning view
        const getLeadingView = useCallback((item: CometChat.BaseMessage) => {
            if (showAvatar && (alignment === "leftAligned" || (item.getSender()?.getUid() || item?.['sender']?.['uid']) !== loggedInUser.current['uid'] && item['category'] != MessageCategoryConstants.action)) {
                return <CometChatAvatar
                    image={(item?.getSender()?.getAvatar && item?.getSender()?.getAvatar()) ? { uri: item.getSender().getAvatar() } : undefined}
                    name={(item?.getSender()?.getName && item?.getSender()?.getName()) ? item?.getSender()?.getName() : ""}
                    style={_avatarStyle}
                />
            }
            return null
        }, [])

        const getHeaderView = useCallback((item: CometChat.BaseMessage) => {
            let senderName: string = "";
            if (alignment === "leftAligned" || ((item.getSender()?.getUid() || item?.['sender']?.['uid']) != loggedInUser.current['uid']))
                senderName = item.getSender()?.getName ? item.getSender()?.getName() : "";

            if (item.getCategory() == MessageCategoryConstants.action || item.getCategory() == MessageCategoryConstants.call)
                return null;

            return (
                <View style={{ flexDirection: "row" }}>
                    {Boolean(senderName) && <Text style={[Style.nameStyle, {
                        color: _messageListStyle.nameTextColor,
                        ..._messageListStyle.nameTextFont,
                    }]}>{senderName}</Text>}
                    {
                        timeStampAlignment == "bottom" || item['category'] == "action" ?
                            null :
                            <CometChatDate
                                timeStamp={((item.getDeletedAt() || item.getReadAt() || item.getDeliveredAt() || item.getSentAt()) * 1000) || getSentAtTimestamp(item)}
                                style={messageBubbleDateStyle}
                                pattern={"timeFormat"}
                                customDateString={datePattern && datePattern(item)}
                                dateAlignment="center"
                            />
                    }
                </View>
            )
        }, [])

        const getStatusInfoView = useCallback((item: CometChat.TextMessage | CometChat.MediaMessage | CometChat.CustomMessage | CometChat.InteractiveMessage | CometChat.BaseMessage, bubbleAlignment: MessageBubbleAlignmentType): JSX.Element => {
            // return null if time alignment is top
            if (timeStampAlignment == "top" || item['category'] == "action" || item['deletedAt']) return null

            let isSender = (item.getSender()?.getUid() || item?.['sender']?.['uid']) == loggedInUser.current['uid'];
            let messageState;
            if (item.getReadAt())
                messageState = "READ";
            else if (item.getDeliveredAt())
                messageState = "DELIVERED";
            else if (item.getSentAt())
                messageState = "SENT";
            else if (item?.data?.metaData?.error)
                messageState = "ERROR"
            else if (isSender)
                messageState = "WAIT";
            else
                messageState = "ERROR"

            let isAudioVideo = (item?.getType() === "image" || item?.getType() === "video");
            return <View style={[
                isAudioVideo ? {
                    flexDirection: "row", justifyContent: bubbleAlignment === "right" ? "flex-end" : "flex-start", alignSelf: "flex-end", paddingVertical: 2, paddingHorizontal: 5,
                    position: "absolute", borderRadius: 10, backgroundColor: theme.palette.getAccent500("dark"), zIndex: 1, bottom: 5, right: 5,
                }
                    :
                    { flexDirection: "row", justifyContent: bubbleAlignment === "right" ? "flex-end" : "flex-start", alignSelf: "flex-end", padding: 5 }
            ]}>
                <CometChatDate
                    timeStamp={((item.getDeletedAt() || item.getReadAt() || item.getDeliveredAt() || item.getSentAt()) * 1000) || getSentAtTimestamp(item)}
                    style={{ ...messageBubbleDateStyle, textFont: isAudioVideo ? theme.typography.caption3 : messageBubbleDateStyle.textFont }}
                    pattern={"timeFormat"}
                    customDateString={datePattern && datePattern(item)}
                    dateAlignment="center"
                />
                {
                    (!disableReceipt && alignment !== "leftAligned") && isSender ?
                        <View style={{ marginLeft: 2, alignItems: "center", justifyContent: "center" }}>
                            <CometChatReceipt
                                receipt={messageState}
                                deliveredIcon={deliveredIcon}
                                readIcon={readIcon}
                                sentIcon={sentIcon}
                                waitIcon={waitIcon}
                                errorIcon={errorIcon}
                                style={{
                                    height: isAudioVideo && 8, width: isAudioVideo && 10,
                                    tintColor: (messageState === "READ" && item?.getType() === "text") ? theme.palette.getBackgroundColor() :
                                        messageState === "WAIT" ? theme?.palette?.getAccent400() : undefined
                                }}
                            />
                        </View>
                        :
                        null
                }
            </View>
        }, [])

        const getFooterView = useCallback((
            messageObject: CometChat.BaseMessage,
            alignment: MessageBubbleAlignmentType
        ) => {
            let hasReaction = messageObject?.getReactions && messageObject?.getReactions() && messageObject?.getReactions().length > 0;
            return (
                <View style={{
                    minHeight: hasReaction ? 27 : 0,
                }}>
                    <CometChatReactions
                        messageObject={messageObject}
                        onReactionPress={(reaction: CometChat.ReactionCount, messageObject: CometChat.BaseMessage) => reactToMessage(reaction.getReaction(), messageObject)}
                        onReactionLongPress={(reaction: CometChat.ReactionCount, messageObject: CometChat.BaseMessage) => onReactionLongPress(reaction.getReaction(), messageObject)}
                        alignment={alignment}
                        {...reactionsConfiguration}
                    />
                </View>
            );
        }, [])

        const onReactionLongPress = (emoji: string, messageObj?: CometChat.BaseMessage) => { //TODO: check useCallBAck
            setSelectedMessage(messageObj);
            setSelectedEmoji(emoji);
        }

        const getAlignment = useCallback((item: CometChat.BaseMessage): MessageBubbleAlignmentType => {
            if (item && item.getCategory() == MessageCategoryConstants.action)
                return "center";
            if (alignment == "standard" && (item.getSender()?.getUid() || item?.['sender']?.['uid']) == loggedInUser.current['uid'])
                return "right";
            return "left";
        }, [])

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
            let copyMessage = getPlainString(item['text'], item);
            Clipboard.setString(copyMessage);
            setShowMessageOptions([]);
        }

        const getThreadView = useCallback((item: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
            let isThreaded = item.getReplyCount() > 0;

            let style = [{
                color: theme?.palette.getAccent900(),
                marginRight: alignment === "right" ? 3 : 0,
                marginLeft: alignment === "left" ? 3 : 0
            }, theme?.typography?.subtitle1];

            // let unreadReplyCount = item?.getUnreadReplyCount && item?.getUnreadReplyCount();

            return !isThreaded ? null :
                <TouchableOpacity
                    onPress={() => openThreadView(item, null)}
                    style={{
                        flexDirection: "row",
                        marginRight: 4,
                        paddingHorizontal: 4,
                        marginTop: 2,
                        alignSelf: alignment === "right" ? "flex-end" : "flex-start",
                    }}
                >
                    {alignment === "left" && <Image style={{ resizeMode: "contain", tintColor: theme?.palette.getAccent600() }} source={LeftArrowCurve} />}
                    <Text style={style}>{`${item.getReplyCount()} ${item.getReplyCount() > 1 ? localize("REPLIES") : localize("REPLY")}`}</Text>

                    {/**  NOTE: uncomment below code when want unread count in thread view  **/}
                    {/* {alignment === "left" && !!unreadReplyCount &&
                        <View style={{
                            borderRadius: 10, marginLeft: 3,
                            paddingHorizontal: 7,
                            alignment: "center", justifyContent: "center",
                            backgroundColor: theme?.palette?.getPrimary()
                        }}>
                            <Text style={[theme?.typography?.subtitle4,
                            {
                                color: theme?.palette?.getBackgroundColor(),
                                textAlign: "center"
                            }]}
                            >{unreadReplyCount}</Text>
                        </View>
                    } */}
                    {/* {alignment === "right" && !!unreadReplyCount &&
                        <View style={{
                            borderRadius: 10, marginRight: 3, paddingVertical: 2, paddingHorizontal: 6,
                            backgroundColor: theme?.palette?.getPrimary()
                        }}>
                            <Text style={[theme?.typography?.subtitle4,
                            { color: theme?.palette?.getBackgroundColor() }]}
                            >{unreadReplyCount}</Text>
                        </View>
                    } */}
                    {/**  NOTE: uncomment above code when want unread count in thread view  **/}

                    {alignment === "right" && <Image style={[{ resizeMode: "contain", tintColor: theme?.palette.getAccent600() },
                    {
                        transform: [{ scaleX: -1 }]
                    }
                    ]} source={LeftArrowCurve} />}
                </TouchableOpacity>
        }, [])

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

        const shareMedia = async (messageObject: CometChat.MediaMessage) => {
            let _plainString = getPlainString(messageObject?.data?.text || "", messageObject);

            let textMessage = _plainString;
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
                "mimeType": messageObject["type"] === "text" ? "" : (messageObject as CometChat.MediaMessage)?.getAttachment()?.getMimeType(), // get Mime Type
            }

            NativeModules.FileManager.shareMessage(shareObj, (callback) => {
                console.log("shareMessage Callback", callback);
            });
        };

        const getStyle = useCallback((item: CometChat.BaseMessage): BaseStyleInterface => {
            let _style = new BaseStyle({
                ..._messageBubbleStyle,
                backgroundColor: theme?.palette.getAccent50()
            });

            if (item.getCategory() == MessageCategoryConstants.interactive) {
                if (item.getType() === MessageTypeConstants.form || item.getType() === MessageTypeConstants.card) {
                    _style.width = "100%"
                }
            }

            if ((item.getSender()?.getUid() || item?.['sender']?.['uid']) == loggedInUser.current?.['uid'])
                _style.backgroundColor = (alignment !== "leftAligned" && (item.getType() === MessageTypeConstants.text || item.getType() === MessageTypeConstants.meeting)) ? theme?.palette.getPrimary() : theme?.palette.getAccent50();

            if (item?.getDeletedBy()) {
                _style.backgroundColor = 'transparent';
            }

            return _style;
        }, []);

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
        //                     CometChatUIKit.sendTextMessage(textMessage).then(resolve).catch(reject)
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

        //                     CometChatUIKit.sendMediaMessage(mediaMessage).then(resolve).catch(reject);
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

        const openOptionsForMessage = useCallback((item: CometChat.BaseMessage, template: CometChatMessageTemplate) => {
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
        }, [])

        const MessageView = useCallback((params: { message: CometChat.BaseMessage, showOptions?: boolean, isThreaded?: boolean }) => {
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

                const onLongPress = () => {
                    if (message.getDeletedBy() != null) return;
                    setSelectedMessage(message)
                    openOptionsForMessage(message, hasTemplate)
                }

                return <TouchableOpacity activeOpacity={1} onLongPress={() => showOptions ? onLongPress() : undefined} >
                    <CometChatMessageBubble
                        id={`${message.getId()}`}
                        LeadingView={() => !isThreaded && getLeadingView(message)}
                        HeaderView={hasTemplate.HeaderView ? hasTemplate.HeaderView?.bind(this, message, bubbleAlignment) : () => !isThreaded && getHeaderView(message)}
                        FooterView={hasTemplate.FooterView ? hasTemplate.FooterView?.bind(this, message, bubbleAlignment) : () => (disableReactions || isThreaded) ? null : getFooterView(message, bubbleAlignment)}
                        alignment={isThreaded ? "left" : bubbleAlignment}
                        ContentView={hasTemplate.ContentView?.bind(this, message, bubbleAlignment)}
                        ThreadView={() => !isThreaded && !message.getDeletedBy() && getThreadView(message, bubbleAlignment)}
                        BottomView={hasTemplate.BottomView && hasTemplate.BottomView?.bind(this, message, bubbleAlignment)}
                        StatusInfoView={hasTemplate.StatusInfoView ? hasTemplate.StatusInfoView?.bind(this, message, bubbleAlignment) : () => getStatusInfoView(message, bubbleAlignment)}
                        style={getStyle(message)}
                    />
                </TouchableOpacity>
            } else {
                return null;
            }
        }, []);

        const getSentAtTimestamp = useCallback((item) => {
            if (!item['sentAt']) {
                return item['_composedAt'];
            }
            return item['sentAt'] * 1000;
        }, [])


        const reactToMessage = (emoji: string, messageObj?: CometChat.BaseMessage) => {

            const msgObj = CommonUtils.clone(messageObj) || CommonUtils.clone(selectedMessage);

            const messageId = msgObj?.getId();
            const reactions = msgObj?.getReactions() || [];
            const emojiObject = reactions?.find(
                (reaction: any) => {
                    return reaction?.reaction == emoji;
                }
            );
            if (emojiObject && emojiObject?.getReactedByMe()) {
                const updatedReactions = [];
                reactions.forEach((reaction) => {
                    if (reaction?.getReaction() == emoji) {
                        if (reaction?.getCount() === 1) {
                            return;
                        } else {
                            reaction.setCount(reaction?.getCount() - 1);
                            reaction.setReactedByMe(false);
                            updatedReactions.push(reaction);
                        }
                    } else {
                        updatedReactions.push(reaction);
                    }
                });

                const newMessageObj = CommonUtils.clone(msgObj);
                newMessageObj.setReactions(updatedReactions);

                CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, { message: newMessageObj, status: messageStatus.success });
                CometChat.removeReaction(messageId, emoji).then((message) => {
                }).catch((error) => {
                    CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, { message: msgObj, status: messageStatus.success });
                    console.log(error);
                });
            } else {
                const updatedReactions = [];
                const reactionAvailable = reactions.find((reaction) => {
                    return reaction?.getReaction() == emoji;
                });
                reactions.forEach((reaction) => {
                    if (reaction?.getReaction() == emoji) {
                        reaction.setCount(reaction?.getCount() + 1);
                        reaction.setReactedByMe(true);
                        updatedReactions.push(reaction);
                    } else {
                        updatedReactions.push(reaction);
                    }
                });
                if (!reactionAvailable) {
                    const react: CometChat.ReactionCount = new CometChat.ReactionCount(emoji, 1, true);
                    updatedReactions.push(react);
                }

                const newMessageObj = CommonUtils.clone(msgObj);

                newMessageObj.setReactions(updatedReactions);

                CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, { message: newMessageObj, status: messageStatus.success });

                CometChat.addReaction(messageId, emoji)
                    .then((response: any) => {
                    })
                    .catch((error: any) => {
                        console.log(error);
                        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, { message: msgObj, status: messageStatus.success });
                    });
            }

            setShowMessageOptions([]);
        }

        const RenderMessageItem = useCallback(memo(function RenderMessageItem({ item, index }: {
            item: any;
            index: number;
        }) {
            let seperatorView = null;
            const previousMessageDate = messagesContentListRef.current[index - 1] ? new Date(getSentAtTimestamp(messagesContentListRef.current[index - 1])) : null;
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
                            customDateString={dateSeparatorPattern ? dateSeparatorPattern(item['sentAt']) : undefined}
                            dateAlignment="center"
                        />
                    </View>
                )
            }
            lastMessageDate.current = getSentAtTimestamp(item);

            return <React.Fragment key={index}>
                {seperatorView}
                <MessageView message={item} />
            </React.Fragment>
        }), []);

        const keyExtractor = useCallback((item) => `${item.id}_${item.muid}`, [])

        const itemSeperator = useCallback(() => <View style={{ height: 8 }} />, [])

        const getEmptyTextView = useCallback(() => {
            if (EmptyStateView)
                return <EmptyStateView />
            return (
                <>
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
                    {CustomListHeader && <CustomListHeader />}
                </>
            )
        }, [])

        const getErrorStateView = useCallback(() => {
            if (hideError) return null;
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
        }, [])

        const getLoadingStateView = useCallback(() => {
            if (LoadingStateView)
                return <LoadingStateView />;

            return (
                <View style={Style.msgContainerStyle}>
                    <ActivityIndicator size="large" color={messageListStyle?.loadingIconTint} />
                </View>
            )
        }, [])

        const handleScroll = (event) => {
            if (event.nativeEvent.contentOffset.y == 0) {
                getPreviousMessages();
            }
            scrollHandler(event);
        };

        const onContentSizeChange = useCallback((contentWidth, contentHeight) => {
            if (currentScrollPosition.current.y == 0 && currentScrollPosition.current.scrollViewHeight) {
                let diff = contentHeight - currentScrollPosition.current.scrollViewHeight;
                if (messagesLength.current > prevMessagesLength.current && diff > 0 && !(unreadCount > 0)) {
                    messageListRef.current.scrollTo({ y: diff, animated: false })
                }
            }

            if (currentScrollPosition.current.scrollViewHeight) {
                if (!previousScrollPosition.current.scrollViewHeight) {
                    previousScrollPosition.current.scrollViewHeight = contentHeight;
                }

                if (currentScrollPosition.current.scrollViewHeight !== contentHeight) {
                    previousScrollPosition.current.scrollViewHeight = currentScrollPosition.current.scrollViewHeight;
                    currentScrollPosition.current.scrollViewHeight = contentHeight;
                }
            }
        }, [])

        const {
            height,
            width,
            backgroundColor,
            border,
            borderRadius,
        } = _messageListStyle;

        return (
            <View style={{
                height, width, backgroundColor, borderRadius, ...border,
                paddingStart: 8, paddingEnd: 8,
            }}>
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
                                            loadingMessages &&
                                            <View style={{ position: "absolute", alignSelf: "center" }}>
                                                <ActivityIndicator size="small" color={_messageListStyle.loadingIconTint} />
                                            </View>
                                        }

                                        <ScrollView
                                            ref={messageListRef}
                                            onScroll={handleScroll}
                                            scrollEventThrottle={16} // control how often the scroll event will be fired
                                            onLayout={() => {
                                                !currentScrollPosition.current.scrollViewHeight && messageListRef.current.scrollToEnd({ animated: false })
                                            }}
                                            onContentSizeChange={onContentSizeChange}
                                        >

                                            {messagesList?.length ? (
                                                messagesList
                                                    // .slice(0)
                                                    // .reverse()
                                                    .map((item, index) => (
                                                        <View
                                                            key={keyExtractor(item)}>
                                                            <RenderMessageItem item={item} index={index} />
                                                            {itemSeperator()}
                                                        </View>
                                                    ))
                                            ) : (
                                                getEmptyTextView()
                                            )}
                                        </ScrollView>
                                        {CustomListHeader && <CustomListHeader />}
                                        {ongoingCallView}
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
                    sliderMaxHeight={Dimensions.get('window').height * 0.5}
                    sliderMinHeight={Dimensions.get('window').height * 0.5}
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
                                <View>
                                    {!disableReactions && <CometChatQuickReactions
                                        // quickReactions={quickReactions}
                                        onReactionPress={reactToMessage}
                                        onAddReactionPress={() => {
                                            setShowMessageOptions([])
                                            setShowEmojiKeyboard(true)
                                        }}
                                        {...quickReactionConfiguration}
                                    />}
                                    <View style={{
                                        maxHeight: (Dimensions.get('window').height * 0.5) - (disableReactions ? 0 : 100),
                                        minHeight: (Dimensions.get('window').height * 0.5) - (disableReactions ? 0 : 100),
                                        overflow: "scroll"
                                    }}>
                                        <CometChatActionSheet hideHeader={hideActionSheetHeader} actions={showMessageOptions} style={_actionStyle} />
                                    </View>
                                </View>
                    }
                </CometChatBottomSheet>
                <CometChatBottomSheet
                    isOpen={showEmojiKeyboard}
                    onClose={() => setShowEmojiKeyboard(false)}
                >
                    <CometChatEmojiKeyboard
                        onClick={(item) => {
                            setShowEmojiKeyboard(false)
                            reactToMessage(item, selectedMessage)
                        }}
                        style={{
                            height: (Dimensions.get('window').height * 0.5) - 54,
                            ...emojiKeyboardStyle
                        }}
                    />
                </CometChatBottomSheet>

                <CometChatBottomSheet
                    isOpen={showReactionList}
                    onClose={() => {
                        setShowReactionList(false);
                        setSelectedEmoji(null);
                    }}
                    sliderMaxHeight={Dimensions.get('window').height * 0.5}
                    sliderMinHeight={Dimensions.get('window').height * 0.5}
                >
                    <CometChatReactionList
                        messageObject={selectedMessage}
                        selectedReaction={selectedEmoji}
                        {...reactionListConfiguration}
                        onPress={(messageReaction: CometChat.Reaction, messageObject: CometChat.BaseMessage) => {
                            if (reactionListConfiguration?.onPress) {
                                reactionListConfiguration.onPress(messageReaction, messageObject);
                                return;
                            }
                            reactToMessage(messageReaction?.getReaction(), messageObject);
                            if (messageObject?.getReactions()?.length === 1 && messageObject?.getReactions()?.[0]?.['count'] == 1) {
                                setShowReactionList(false);
                                setSelectedEmoji(null);
                            }
                        }}
                    />
                </CometChatBottomSheet>
            </View>
        )
    }));