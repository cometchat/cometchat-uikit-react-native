import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle, useContext, useCallback, memo, useLayoutEffect } from "react";
import { View, FlatList, Text, Image, TouchableOpacity, ActivityIndicator, Modal, SafeAreaView, NativeModules, ScrollView, Dimensions, Platform, Keyboard, TextStyle, ViewProps } from "react-native";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { LeftArrowCurve, RightArrowCurve } from "./resources";
import { CometChatContext, CometChatMentionsFormatter, CometChatTextFormatter, CometChatUIKit, CometChatUiKitConstants, CometChatUrlsFormatter, ImageType, SuggestionItem } from "../shared";
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
import { CometChatContextType, MessageBubbleAlignmentType, MessageListAlignmentType, MessageReceipt, MessageTimeAlignmentType } from "../shared/base/Types";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { ActionSheetStylesInterface } from "../shared/views/CometChatActionSheet/ActionSheetStyle";
import { CometChatMessageInformation } from "../CometChatMessageInformation/CometChatMessageInformation";
// import { CometChatContacts, ForwardMessageConfigurationInterface } from "../CometChatContacts";
import { CometChatMessageInformationConfigurationInterface } from "../CometChatMessageInformation";
import { InteractiveMessageUtils } from "../shared/utils/InteractiveMessageUtils";
import { CometChatEmojiKeyboard, EmojiKeyboardStyle } from "../shared/views/CometChatEmojiKeyboard";
import { CometChatReactionList, ReactionListConfigurationInterface } from "../shared/views/CometChatReactionList";
import { CometChatQuickReactions, QuickReactionsConfigurationInterface } from "../shared/views/CometChatQuickReactions";
import { CometChatReactions, ReactionsConfigurationInterface } from "../shared/views/CometChatReactions";
import { CommonUtils } from "../shared/utils/CommonUtils";
//@ts-ignore
import Clipboard from "@react-native-clipboard/clipboard";
import { commonVars } from "../shared/base/vars";
import { anyObject } from "../shared/utils";

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
    /**
     * @deprecated
     * 
     * This property is deprecated as of version 4.3.18 due to newer property 'hideReceipt'. It will be removed in subsequent versions.
    */
    disableReceipt?: boolean,
    hideReceipt?: boolean,
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
    onThreadRepliesPress?: (messageObject: CometChat.BaseMessage, messageBubbleView: () => JSX.Element | null) => void,
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
    messageInformationConfiguration?: CometChatMessageInformationConfigurationInterface,
    /**
     * Hide the header of the action sheet
     */
    /**
     * @deprecated
     * 
     * This property is deprecated as of version 4.3.20, as it is no longer needed. It will be removed in subsequent versions.
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
            hideReceipt= false,
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
            hideActionSheetHeader = true,
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
        const messageEventListener = "messageEvent_" + new Date().getTime();
        const groupEventListener = "groupEvent_" + new Date().getTime();

        useLayoutEffect(() => {
            if (user) {
                _defaultRequestBuilder = new CometChat.MessagesRequestBuilder()
                    .setLimit(30)
                    .setTags([])
                    .setUID(user.getUid());
            }
            else if (group) {
                _defaultRequestBuilder = new CometChat.MessagesRequestBuilder()
                    .setLimit(30)
                    .setTags([])
                    .setGUID(group.getGuid());
            }

            _defaultRequestBuilder.setTypes(ChatConfigurator.dataSource.getAllMessageTypes())
            _defaultRequestBuilder.setCategories(ChatConfigurator.dataSource.getAllMessageCategories())

            //updating users request builder
            let _updatedCustomRequestBuilder = _defaultRequestBuilder;
            if (messageRequestBuilder) {
                _updatedCustomRequestBuilder = messageRequestBuilder;
                if (user)
                    _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setUID(user.getUid())
                if (group)
                    _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setGUID(group.getGuid())
            } else {
                _updatedCustomRequestBuilder.hideReplies(true);
                if (user)
                    _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setUID(user.getUid())
                if (group)
                    _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setGUID(group.getGuid())
                if (parentMessageId)
                    _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setParentMessageId(parseInt(parentMessageId));
                let types: any[] = [], categories: any[] = [];
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
            loadingIconTint: theme?.palette.getPrimary(),
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
            backgroundColor: theme?.palette?.getBackgroundColor(),
            ...actionSheetStyle
        })).current;
        const _messageBubbleStyle = useRef(new MessageBubbleStyle({
            ...wrapperMessageBubbleStyle
        })).current;

        // refs
        const currentScrollPosition = useRef({ y: null, scrollViewHeight: 0, layoutHeight: 0, contentHeight: 0 });
        const previousScrollPosition = useRef({ y: 0, scrollViewHeight: 0 });
        const messagesLength = useRef(0);
        const prevMessagesLength = useRef(0);
        const messageListRef = useRef<ScrollView | null>(null);
        const loggedInUser = useRef<CometChat.User | null | any>(null);
        const messageRequest = useRef<CometChat.MessagesRequest | null>(null);
        const messagesContentListRef = useRef<any[]>([]);

        const msgRequestBuilder = useRef<CometChat.MessagesRequestBuilder>();
        const lastMessageDate = useRef(new Date().getTime());

        // states
        const [messagesList, setMessagesList] = useState<any[]>([]);
        const [listState, setListState] = useState("loading");
        const [loadingMessages, setLoadingMessages] = useState(false);
        const [unreadCount, setUnreadCount] = useState(0);
        const [showMessageOptions, setShowMessageOptions] = useState<any[]>([]);
        const [ExtensionsComponent, setExtensionsComponent] = useState<JSX.Element | null>(null);
        const [CustomListHeader, setCustomListHeader] = useState<any>(null);
        const [messageInfo, setMessageInfo] = useState(false);
        const [ongoingCallView, setOngoingCallView] = useState(null);
        const [selectedMessage, setSelectedMessage] = useState<any>(null);
        const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
        const [showReactionList, setShowReactionList] = useState(false);
        const [selectedEmoji, setSelectedEmoji] = useState<string | undefined>(undefined);
        // const [forwarding, setForwarding] = useState(false);

        const infoObject = useRef<CometChat.BaseMessage | null>();
        const inProgressMessages = useRef<any[]>([]);
        // const messageToForward = useRef<CometChat.BaseMessage>();
        const bottomSheetRef = useRef<any>(null)
        const conversationId = useRef(null)
        let lastID = useRef(0);
        let isKeyBoardVisible = useRef(false);

        const scrollHandler = (event: any) => {
            /********************************************************************************
             * layoutMeasurement.height: The height of the visible area within the ScrollView.
             * contentOffset.y: The current vertical scroll position (distance from the top of the content).
                                The y value in contentOffset indicates how far the top edge of the visible area is from the top of the scrollable content.
                                The x value (if applicable) indicates how far the left edge of the visible area is from the left of the scrollable content.
                                For example:
                                   If contentOffset.y is 0, the top of the visible area is aligned with the top of the content.
                                   If contentOffset.y is 50, the top of the visible area is 50 units (pixels) below the top of the content.
             * contentSize.height: The total height of the scrollable content.
            *********************************************************************************/
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const screenHeight = Dimensions.get('window').height;

            // Calculate the scroll position
            const scrollPosition = layoutMeasurement.height + contentOffset.y;
            const scrollEndPosition = contentSize.height - screenHeight;

            currentScrollPosition.current.y = contentOffset.y;
            currentScrollPosition.current.contentHeight = contentSize.height;

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
            messageListRef.current?.scrollToEnd({ animated: true });
            markUnreadMessageAsRead();
        };

        const getPreviousMessages = async () => {

            if (messagesList.length == 0)
                setListState("loading");
            else
                setLoadingMessages(true);
            // TODO: this condition is applied because somewhere from whiteboard extention group scope is set to undefined.
            if (group != undefined && group.getGuid() == undefined) {
                let fetchedGroup: any = await CometChat.getGroup(group.getGuid()).catch((e: any) => {
                    console.log("Error: fetching group", e);
                    onError && onError(e)
                })
                group.setScope(fetchedGroup['scope']);
            }
            messageRequest.current?.fetchPrevious()
                .then((msgs: any[]) => {
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
                        if (message && !disableReceipt && !message.hasOwnProperty("readAt") && loggedInUser.current?.getUid() != message?.getSender()?.getUid()) {
                            CometChat.markAsRead(message);
                            if (index == 0)
                                CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message });
                        } else
                            break;
                    }
                    reversed = reversed.map((item: CometChat.BaseMessage, index: any) => {
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
                .catch((e: any) => {
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
                messagesRequest = messagesRequest.setUID(user.getUid())
            if (group)
                messagesRequest = messagesRequest.setGUID(group.getGuid())

            messagesRequest.setTypes([MessageCategoryConstants.message]);
            messagesRequest.setCategories([MessageCategoryConstants.action]);
            messagesRequest.setMessageId(lastID.current)

            messagesRequest.build()
                .fetchNext()
                .then((updatedMessages: string | any[]) => {
                    let tmpList = [...messagesContentListRef.current];
                    for (let i = 0; i < updatedMessages.length; i++) {
                        let condition = (msg: any) => msg.getId() == updatedMessages[i]?.actionOn.getId()
                        let msgIndex = messagesContentListRef.current.findIndex(condition);
                        if (msgIndex > -1) {
                            tmpList[msgIndex] = updatedMessages[i]?.actionOn;
                        }
                    }
                    // console.log("UPDATES LIST LENGTH", tmpList.length)
                    // setMessagesList(tmpList);
                    getNewMessages(tmpList);
                })
                .catch((e: any) => console.log("error while fetching updated msgs", e))
        }

        const getNewMessages = (updatedList: any[]) => {

            let newRequestBuilder = msgRequestBuilder.current;
            newRequestBuilder?.setMessageId(lastID.current)

            newRequestBuilder?.build()
                .fetchNext()
                .then((newMessages: any[]) => {
                    let cleanUpdatedList = [...updatedList];
                    let finalOutput = CommonUtils.mergeArrays(cleanUpdatedList, newMessages, "id");
                    let tmpList = [...finalOutput];
                    tmpList = tmpList.map((item: CometChat.BaseMessage, index) => {
                        if (item.getCategory() === MessageCategoryConstants.interactive) {
                            return InteractiveMessageUtils.convertInteractiveMessage(item);
                        } else {
                            return item;
                        }
                    })
                    if (inProgressMessages.current.length) {
                        const filteredInProgressMessages = inProgressMessages.current.filter(secondItem =>
                            tmpList.some(firstItem => firstItem.muid === secondItem.muid)
                        );
                        const combinedArray = CommonUtils.mergeArrays(tmpList, filteredInProgressMessages, "muid");
                        tmpList = combinedArray
                    }
                    messagesContentListRef.current = tmpList;
                    setMessagesList(tmpList);
                    for(let i = newMessages.length - 1; i >= 0; i--) {
                        if(newMessages[i].getSender().getUid() !== loggedInUser.current.getUid()) {
                           bottomHandler(newMessages[i], true);
                           break;
                        }
                     }
                    if (newMessages.length === 30) {
                        getNewMessages(tmpList);
                    }
                    newRequestBuilder?.setMessageId(undefined)
                })
                .catch((e: any) => console.log("error while fetching updated msgs", e))
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
            let users: any = {};


            let edits: Array<{
                "endIndex": number,
                "replacement": string,
                "startIndex": number,
                "user": SuggestionItem
            }> = [];

            let allFormatters = [...(textFormatters || [])];
            let mentionsTextFormatter = ChatConfigurator.getDataSource().getMentionsFormatter(loggedInUser.current);
            allFormatters.push(mentionsTextFormatter);

            allFormatters.forEach((formatter, key) => {
                regexes.push(formatter.getRegexPattern());
                let suggestionUsers = formatter.getSuggestionItems();
                if (formatter instanceof CometChatMentionsFormatter) {
                    let mentionUsers = (messageObject?.getMentionedUsers && messageObject?.getMentionedUsers()).map((item: { getUid: () => any; getName: () => string; }) => new SuggestionItem({
                        id: item.getUid(),
                        name: item.getName(),
                        promptText: "@" + item.getName(),
                        trackingCharacter: "@",
                        underlyingText: `<@uid:${item.getUid()}>`,
                        hideLeadingIcon: false

                    })) || [];
                    suggestionUsers = [...suggestionUsers, ...mentionUsers];
                }
                suggestionUsers?.length > 0 && suggestionUsers.forEach((item: any) => users[item.underlyingText] = item);
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

        const playNotificationSound = useCallback((message: any) => {

            if (disableSoundForMessages) return;

            if (message?.category === MessageCategoryConstants.message) {
                if (customSoundForMessages) {
                    CometChatSoundManager.play(
                        loggedInUser.current?.getUid() == message['sender']['uid'] ? "outgoingMessage" : "incomingMessage",
                        customSoundForMessages
                    );
                } else {
                    CometChatSoundManager.play(
                        // "incomingMessage"
                        loggedInUser.current?.getUid() == message['sender']['uid'] ? "outgoingMessage" : "incomingMessage"
                    );
                }
            }
        }, []);

        const scrollToBottom = useCallback((scrollToFirstUnread = false) => {
            if (messageListRef.current && messagesContentListRef.current.length > 0) {
                let firstUnreadPosition = previousScrollPosition.current.scrollViewHeight;
                if (scrollToFirstUnread) {
                    setTimeout(() => {
                        messageListRef.current?.scrollTo({ x: 0, y: firstUnreadPosition, animated: false });
                    }, 0)
                } else {
                    setTimeout(() => {
                        messageListRef.current?.scrollToEnd({ animated: true });
                    }, 0)
                }
            }
        }, []);

        const markMessageAsRead = (message: any) => {
            if (!disableReceipt && !message?.readAt) {
                CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message });
                CometChat.markAsRead(message)
                    .catch((error: any) => {
                        console.log("Error", error);
                        onError && onError(error);
                        // errorHandler(error);
                    });
            }
        };

        function checkMessageInSameConversation(message: CometChat.BaseMessage | any): boolean {
            return (message?.getReceiverType() == ReceiverTypeConstants.user &&
                user &&
                user?.getUid() == message.getReceiver()?.['uid']) ||
                (message?.getReceiverType() == ReceiverTypeConstants.group &&
                    message.getReceiverId() &&
                    group &&
                    group?.getGuid() == message.getReceiverId() || false);
        }

        function messageToSameConversation(message: CometChat.BaseMessage): boolean {
            return (message?.getReceiverType() == ReceiverTypeConstants.user &&
                user &&
                user?.getUid() == message.getReceiverId()) ||
                (message?.getReceiverType() == ReceiverTypeConstants.group &&
                    message.getReceiverId() &&
                    group &&
                    group?.getGuid() == message.getReceiverId() || false);
        }
        function checkSameConversation(message: CometChat.BaseMessage): boolean {
            return message.getConversationId() == conversationId.current || 
                  (message.getSender()?.getUid() === user?.getUid() && message.getReceiverType() == CometChatUiKitConstants.ReceiverTypeConstants.user);
        }

        function isNearBottom() {
            const { layoutHeight, scrollViewHeight, y }: any = currentScrollPosition.current;

            let scrollPos = scrollViewHeight - (layoutHeight + y);
            let scrollPosFromBottomInPercentage = (scrollPos / layoutHeight) * 100;

            if (scrollPosFromBottomInPercentage <= 30) { // 30% from bottom
                return true;
            }
            return false;

        }

        const newMessage = (newMessage: any, isReceived = true) => {
            let baseMessage = newMessage as CometChat.BaseMessage;
            if (baseMessage.getCategory() === MessageCategoryConstants.interactive) {
                newMessage = InteractiveMessageUtils.convertInteractiveMessage(baseMessage);
            }
            if (checkSameConversation(baseMessage) || checkMessageInSameConversation(baseMessage) || messageToSameConversation(baseMessage)) {
                if(!disableReceipt) {
                  CometChat.markAsDelivered(newMessage);
                }
                //need to add
                if (newMessage.getParentMessageId()) {
                    if (parentMessageId && newMessage.getParentMessageId() == parseInt(parentMessageId)) {
                        // add to list
                        messagesContentListRef.current = [...messagesContentListRef.current, newMessage];
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
                        return;
                    }
                } else if (parentMessageId == undefined) {
                    messagesContentListRef.current = [...messagesContentListRef.current, newMessage];
                    setMessagesList(prev => [...prev, newMessage]);
                }
                bottomHandler(newMessage, isReceived);
            }

            playNotificationSound(newMessage);
        }

        const isAtBottom = () => {
            if(
                [null, undefined].includes(currentScrollPosition.current.y) 
                || !currentScrollPosition.current.layoutHeight
                || !currentScrollPosition.current.contentHeight
            ) {
                return true;
            } 
            else if (currentScrollPosition.current.layoutHeight + currentScrollPosition.current.y! >= currentScrollPosition.current.contentHeight) {
                return true;
            }

            return false;
        }

        const bottomHandler = (newMessage: CometChat.BaseMessage | any, isReceived?: boolean) => {
            if ((newMessage.getSender()?.getUid() || newMessage?.['sender']?.['uid']) == loggedInUser.current?.['uid']) {
                scrollToBottom();
                return;
            }
            if(!isReceived) {
                return;
            }
            if (
                (!parentMessageId && newMessage.getParentMessageId()) 
                || (parentMessageId && !newMessage.getParentMessageId()) 
                || (parentMessageId && newMessage.getParentMessageId() && parentMessageId != newMessage.getParentMessageId())
            ) {
                return;
            }
            if (isAtBottom() || isNearBottom()) {
                 scrollToBottom();
                 markMessageAsRead(newMessage)
            } else {
                if(scrollToBottomOnNewMessages) {
                    scrollToBottom();
                    markMessageAsRead(newMessage);
                } else {
                    setUnreadCount(unreadCount + 1);
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
                //inProgressMessages.current = inProgressMessages.current.filter((item: anyObject) => item.muid !== editedMessage['muid'])
            }
            else
                condition = (msg) => msg.getId() == editedMessage.getId()
            let msgIndex = messagesContentListRef.current.findIndex(condition);
            if (msgIndex > -1) {
                let tmpList = [...messagesContentListRef.current];
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
                .then((res: any) => {
                    CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageDeleted, { message: res });
                    setShowMessageOptions([]);
                })
                .catch((rej: any) => {
                    console.log(rej);
                    onError && onError(rej);
                })
        }

        const createActionMessage = () => { }

        const updateMessageReceipt = (receipt: any) => {
            if(receipt?.getReceiverType() === ReceiverTypeConstants.group && ![receipt.RECEIPT_TYPE.DELIVERED_TO_ALL_RECEIPT, receipt.RECEIPT_TYPE.READ_BY_ALL_RECEIPT].includes(receipt?.getReceiptType())) {
                return;
            }
            let index = messagesContentListRef.current.findIndex((msg, index) => msg['id'] == receipt['messageId'] || msg['messageId'] == receipt['messageId']);

            if (index == -1) return;

            let tmpList: Array<CometChat.BaseMessage> = [...messagesContentListRef.current];

            for (let i = index; i >= 0; i--) {

                if (tmpList[i]?.getReadAt && tmpList[i]?.getReadAt()) break;

                let tmpMsg = tmpList[i];
                if (!Number.isNaN(Number(tmpMsg.getId()))) {

                    if (tmpMsg.getCategory() === MessageCategoryConstants.interactive) {
                        tmpMsg = InteractiveMessageUtils.convertInteractiveMessage(tmpMsg);
                    }
                    if (receipt.getDeliveredAt) {
                        tmpMsg.setDeliveredAt(receipt.getDeliveredAt());
                    }
                    if (receipt.getReadAt) {
                        tmpMsg.setReadAt(receipt.getReadAt());
                    }

                }
                tmpList[i] = CommonUtils.clone(tmpMsg);
            }

            messagesContentListRef.current = tmpList;
            setMessagesList(tmpList);
        }

        const handlePannel = (item: any) => {
            if (item.alignment === ViewAlignment.messageListBottom && (user || group) && CommonUtils.checkIdBelongsToThisComponent(item.id, user, group, parentMessageId || '')) {
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
            CometChat.getLoggedinUser()
                .then((u: any) => {
                    loggedInUser.current = u;
                    messageRequest.current = msgRequestBuilder.current?.build() || null;
                    getPreviousMessages();
                    loadTemplates();
                })
                .catch((e: any) => {
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
                    onGroupMemberScopeChanged: (message: any) => {
                        newMessage(message);
                    },
                    onGroupMemberLeft: (message: any) => {
                        newMessage(message);
                    },
                    onGroupMemberKicked: (message: any) => {
                        newMessage(message);
                    },
                    onGroupMemberBanned: (message: any) => {
                        newMessage(message);
                    },
                    onGroupMemberUnbanned: (message: any) => {
                        newMessage(message);
                    },
                    onMemberAddedToGroup: (message: any) => {
                        newMessage(message);
                    },
                    onGroupMemberJoined: (message: any) => {
                        newMessage(message);
                    },
                })
            );

            CometChatUIEventHandler.addMessageListener(
                messageEventListener,
                {
                    ccMessageSent: ({ message, status }: any) => {
                        if (status == MessageStatusConstants.inprogress) {
                            inProgressMessages.current = [...inProgressMessages.current, message]
                            newMessage(message, false);
                        }

                        if (status == MessageStatusConstants.success) {
                            messageEdited(message, true);
                        }
                        if (status == MessageStatusConstants.error) {
                            messageEdited(message, true);
                        }
                    },
                    ccMessageEdited: ({ message, status }: any) => {
                        if (status == messageStatus.success)
                            messageEdited(message, false);
                    },
                    ccMessageDeleted: ({ message }: any) => {
                        messageEdited(message, false);
                    },
                    ccMessageRead: ({ message }: any) => {
                        if (!parentMessageId && message.parentMessageId) {
                            // markParentMessageAsRead(message); //NOTE: uncomment this when want unread count in thread view
                        }
                    },
                    onTextMessageReceived: (textMessage: any) => {
                        newMessage(textMessage);
                    },
                    onMediaMessageReceived: (mediaMessage: any) => {
                        newMessage(mediaMessage);
                    },
                    onCustomMessageReceived: (customMessage: any) => {
                        newMessage(customMessage);
                    },
                    onMessagesDelivered: (messageReceipt: any) => {
                        updateMessageReceipt(messageReceipt);
                    },
                    onMessagesRead: (messageReceipt: any) => {
                        updateMessageReceipt(messageReceipt);
                    },
                    onMessageDeleted: (deletedMessage: any) => {
                        messageEdited(deletedMessage);
                    },
                    onMessageEdited: (editedMessage: any) => {
                        messageEdited(editedMessage);
                    },
                    onFormMessageReceived: (formMessage: any) => {
                        newMessage(formMessage);
                    },
                    onCardMessageReceived: (cardMessage: any) => {
                        newMessage(cardMessage);
                    },
                    onSchedulerMessageReceived: (schedulerMessage: any) => {
                        newMessage(schedulerMessage);
                    },
                    onCustomInteractiveMessageReceived: (customInteractiveMessage: any) => {
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
                            let editedMessage: any = messagesList[msgIndex];
                            editedMessage = InteractiveMessageUtils.convertInteractiveMessage(editedMessage);
                            editedMessage.setInteractions(interaction);
                            messageEdited(editedMessage);
                        }
                    },
                    ...reactionListeners,
                    onMessagesDeliveredToAll: (messageReceipt: CometChat.MessageReceipt) => {
                        updateMessageReceipt(messageReceipt);
                    },
                    onMessagesReadByAll: (messageReceipt: CometChat.MessageReceipt) => {
                        updateMessageReceipt(messageReceipt);
                    },
                }
            )
            CometChatUIEventHandler.addGroupListener(
                groupEventListener,
                {
                    ccGroupMemberUnBanned: ({ message }: any) => {
                        newMessage(message, false)
                    },
                    ccGroupMemberBanned: ({ message }: any) => {
                        newMessage(message, false)
                    },
                    ccGroupMemberAdded: ({ message, usersAdded, userAddedIn }: any) => {
                        usersAdded.forEach((user: any) => {
                            message['message'] = `${loggedInUser.current?.getName()} added ${user.name}`;
                            message['muid'] = String(getUnixTimestamp());
                            message['sentAt'] = getUnixTimestamp();
                            message['actionOn'] = user;
                            newMessage(message, false);
                        })
                    },
                    ccGroupMemberKicked: ({ message }: any) => {
                        newMessage(message, false)
                    },
                    ccGroupMemberScopeChanged: ({ action, updatedUser, scopeChangedTo, scopeChangedFrom, group }: any) => {
                        newMessage(action, false);
                    },
                    ccOwnershipChanged: ({ group, message }: any) => {
                        // newMessage(message, false); removed after discussion.
                    }
                }
            )

            CometChat.addCallListener(
                callListenerId,
                new CometChat.CallListener({
                    onIncomingCallReceived: (call: any) => {
                        newMessage(call);
                    },
                    onOutgoingCallAccepted: (call: any) => {
                        newMessage(call);
                    },
                    onOutgoingCallRejected: (call: any) => {
                        newMessage(call);
                    },
                    onIncomingCallCancelled: (call: any) => {
                        newMessage(call);
                    }
                })
            );

            CometChatUIEventHandler.addCallListener(
                callEventListener,
                {
                    ccCallInitiated: ({ call }: any) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    },
                    ccOutgoingCall: ({ call }: any) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    },
                    ccCallAccepted: ({ call }: any) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    },
                    ccCallRejected: ({ call }: any) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    },
                    ccCallEnded: ({ call }: any) => {
                        if (call['type'] == CallTypeConstants.audio || call['type'] == CallTypeConstants.video) {
                            newMessage(call);
                        }
                    },
                    ccShowOngoingCall: (CometChatOngoingComponent) => {
                        //show ongoing call
                        setOngoingCallView(CometChatOngoingComponent?.child);
                    },
                }
            )
            CometChat.addConnectionListener(
                connectionListenerId,
                new CometChat.ConnectionListener({
                    onConnected: () => {
                        if(lastID.current) {
                           getUpdatedPreviousMessages();
                        }
                    },
                    inConnecting: () => {
                    },
                    onDisconnected: () => {
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
                CometChatUIEventHandler.removeMessageListener(messageEventListener);
                CometChatUIEventHandler.removeGroupListener(groupEventListener);
                CometChatUIEventHandler.removeCallListener(callEventListener);

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
        //@ts-ignore
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
                if (isVisible && currentScrollPosition.current.y && keyboardHeight) {
                    Keyboard_Height = keyboardHeight;
                    scrollPos = (currentScrollPosition.current.y + Keyboard_Height) - ((commonVars.safeAreaInsets.top as number) / 2);
                    messageListRef.current.scrollTo({ y: scrollPos, animated: false })
                    isKeyBoardVisible.current = true;
                } else {
                    isKeyBoardVisible.current = false;
                    /**
                     * Do not have to scroll back if the list is at the bottom because we are already adjusting 
                       for the change in contentSize when we are at bottom which means if the list is at the bottom
                       and we open the keyboard, the following line 
                       (`messageListRef.current.scrollTo({ y: scrollPos, animated: false })`) in the above "if" 
                       condition already puts the list at the bottom again.
                       Hence, running the below for isAtBottom() will scroll to a wrong position.
                     */
                    if(!isAtBottom()) {
                       messageListRef.current.scrollTo({ y: scrollPos - Keyboard_Height + ((commonVars.safeAreaInsets.top as number) / 2), animated: false });
                    }
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
        const getLeadingView = useCallback((item: CometChat.BaseMessage | any) => {
            if (showAvatar && (alignment === "leftAligned" || (item.getSender()?.getUid() || item?.['sender']?.['uid']) !== loggedInUser.current?.getUid() && item['category'] != MessageCategoryConstants.action)) {
                return <CometChatAvatar
                    image={(item?.getSender()?.getAvatar && item?.getSender()?.getAvatar()) ? { uri: item.getSender().getAvatar() } : undefined}
                    name={(item?.getSender()?.getName && item?.getSender()?.getName()) ? item?.getSender()?.getName() : ""}
                    style={_avatarStyle}
                />
            }
            return null
        }, [])

        const getHeaderView = useCallback((item: CometChat.BaseMessage | any) => {
            let senderName: string = "";
            if (alignment === "leftAligned" || ((item.getSender()?.getUid() || item?.['sender']?.['uid']) != loggedInUser.current?.getUid()))
                senderName = (item.getSender()?.getName() || "").trim();

            if (item.getCategory() == MessageCategoryConstants.action || item.getCategory() == MessageCategoryConstants.call)
                return null;

            return (
                <View style={{ flexDirection: "row" }}>
                    {Boolean(senderName) && <Text style={[Style.nameStyle, {
                        color: _messageListStyle.nameTextColor,
                        ..._messageListStyle.nameTextFont,
                    }] as TextStyle} numberOfLines={1} ellipsizeMode={"tail"} >{senderName}</Text>}
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

        const getStatusInfoView = useCallback((item: CometChat.TextMessage | CometChat.MediaMessage | CometChat.CustomMessage | CometChat.InteractiveMessage | CometChat.BaseMessage | any, bubbleAlignment: MessageBubbleAlignmentType, currentIndex?: number): JSX.Element | null => {
            // return null if time alignment is top
            if (timeStampAlignment == "top" || item['category'] == "action" || item['deletedAt']) return null

            let isSender = (item.getSender()?.getUid() || item?.['sender']?.['uid']) == loggedInUser.current?.getUid();
            let messageState, nextItemIsRead, nextItemIsDelivered;
            if(currentIndex !== undefined) {
                nextItemIsRead = messagesContentListRef.current[currentIndex + 1] && messagesContentListRef.current[currentIndex + 1].getReadAt();
                nextItemIsDelivered = messagesContentListRef.current[currentIndex + 1] && messagesContentListRef.current[currentIndex + 1].getDeliveredAt();
            }
            if (item.getReadAt() || nextItemIsRead)
                messageState = "READ";
            else if (item.getDeliveredAt() || nextItemIsDelivered)
                messageState = "DELIVERED";
            else if (item.getSentAt())
                messageState = "SENT";
            else if (item?.getData()?.metaData?.error)
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
                    (!(disableReceipt || hideReceipt) && alignment !== "leftAligned") && isSender ?
                        <View style={{ marginLeft: 2, alignItems: "center", justifyContent: "center" }}>
                            <CometChatReceipt
                                receipt={messageState}
                                deliveredIcon={deliveredIcon}
                                readIcon={readIcon}
                                sentIcon={sentIcon}
                                waitIcon={waitIcon}
                                errorIcon={errorIcon}
                                style={{
                                    tintColor: (messageState === "READ" && item?.getType() === "text") ? theme.palette.getBackgroundColor() :
                                        messageState === "WAIT" ? theme?.palette?.getAccent400() : undefined,
                                    ...(isAudioVideo ? {height: 8, width: 10} : {})
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

        const getAlignment = useCallback((item: CometChat.BaseMessage | any): MessageBubbleAlignmentType => {
            if (item && item.getCategory() == MessageCategoryConstants.action)
                return "center";
            if (alignment == "standard" && (item.getSender()?.getUid() || item?.['sender']?.['uid']) == loggedInUser.current?.getUid())
                return "right";
            return "left";
        }, [])

        const openMessageInfo = (message: any) => {
            infoObject.current = message;
            setMessageInfo(true);
            setShowMessageOptions([]);
        }

        const openThreadView = (...params: any[]) => {
            if (onThreadRepliesPress) {
                onThreadRepliesPress(params[0], MessageView.bind(this, { message: params[0], isThreaded: true, showOptions: false }));
            }
            setShowMessageOptions([]);
            return onThreadRepliesPress
        }

        const editMessage = (item: any) => {
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, { message: item, status: messageStatus.inprogress });
            setShowMessageOptions([]);
        }

        const copyMessage = (item: any) => {
            let copyMessage = getPlainString(item['text'], item);
            Clipboard.setString(copyMessage);
            setShowMessageOptions([]);
        }

        const getThreadView = useCallback((item: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
            let isThreaded = item.getReplyCount() > 0;

            let style = [{
                color: theme?.palette.getAccent900(),
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
                    {alignment === "left" && <Image style={{ resizeMode: "contain", tintColor: theme?.palette.getAccent600(), width: 30, height: 18 }} source={LeftArrowCurve} />}
                    <Text style={style  as TextStyle}>{`${item.getReplyCount()} ${item.getReplyCount() > 1 ? localize("REPLIES") : localize("REPLY")}`}</Text>

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

                    {alignment === "right" && <Image style={[{ resizeMode: "contain", tintColor: theme?.palette.getAccent600(), width: 30, height: 18 },
                    {
                        transform: [{ scaleX: -1 }]
                    }
                    ]} source={LeftArrowCurve} />}
                </TouchableOpacity>
        }, [])

        const privateMessage = (item: CometChat.BaseMessage) => {
            setShowMessageOptions([]);
            CometChat.getUser(item.getSender().getUid())
                .then((user: any) => {
                    console.log({ user });
                    CometChatUIEventHandler.emitUIEvent('openChat', { user, group });
                })
                .catch((e: any) => {
                    onError && onError(e);
                })
        }

        const shareMedia = async (messageObject: CometChat.MediaMessage | any) => {
            let _plainString = getPlainString(messageObject?.getData()['text'] || "", messageObject);

            let textMessage = _plainString;
            let fileUrl = messageObject.getData()['url'];

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

            NativeModules.FileManager.shareMessage(shareObj, (callback: any) => {
                console.log("shareMessage Callback", callback);
            });
        };

        const getStyle = useCallback((item: CometChat.BaseMessage | any): MessageBubbleStyleInterface => {
            let _style = new MessageBubbleStyle({
                ..._messageBubbleStyle,
                backgroundColor: theme?.palette.getAccent50()
            });

            if (item.getCategory() == MessageCategoryConstants.interactive) {
                if (item.getType() === MessageTypeConstants.form || item.getType() === MessageTypeConstants.card) {
                    _style.width = "100%"
                }
            } else {
                _style.alignSelf =  getAlignment(item) === "left" ? "flex-start" :  "flex-end";
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

        const openOptionsForMessage = useCallback((item: CometChat.BaseMessage | any, template: CometChatMessageTemplate) => {
            let options = template?.options ? loggedInUser.current ? template.options(loggedInUser.current, item, group) : [] : [];
            let optionsWithPressHandling = options.map(option => {
                if (!option.onPress){
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
                }else{
                    // If overriding `onPress`, make sure to pass `item` explicitly
                    const customOnPress = option.onPress;
                    option.onPress = () =>{
                        customOnPress(item);
                        setShowMessageOptions([]);
                    } 
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

        const MessageView = useCallback((params: { message: CometChat.BaseMessage, showOptions?: boolean, isThreaded?: boolean, currentIndex?: number }) => {
            const { message, showOptions = true, isThreaded = false, currentIndex } = params;
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
                    hasTemplate && openOptionsForMessage(message, hasTemplate)
                }

                return <TouchableOpacity activeOpacity={1} onLongPress={() => showOptions ? onLongPress() : undefined} >
                    <CometChatMessageBubble
                        id={`${message.getId()}`}
                        LeadingView={() => !isThreaded ? getLeadingView(message) : null}
                        HeaderView={hasTemplate.HeaderView ? hasTemplate.HeaderView?.bind(this, message, bubbleAlignment) : () => !isThreaded ? getHeaderView(message) : null}
                        FooterView={hasTemplate.FooterView ? hasTemplate.FooterView?.bind(this, message, bubbleAlignment) : () => (disableReactions || isThreaded) ? null : getFooterView(message, bubbleAlignment)}
                        alignment={isThreaded ? "left" : bubbleAlignment}
                        ContentView={hasTemplate.ContentView?.bind(this, message, bubbleAlignment)}
                        ThreadView={() => !isThreaded ? !message.getDeletedBy() ? getThreadView(message, bubbleAlignment) : null : null}
                        BottomView={hasTemplate.BottomView && hasTemplate.BottomView?.bind(this, message, bubbleAlignment)}
                        StatusInfoView={hasTemplate.StatusInfoView ? hasTemplate.StatusInfoView?.bind(this, message, bubbleAlignment) : () => getStatusInfoView(message, bubbleAlignment, currentIndex)}
                        style={getStyle(message)}
                    />
                </TouchableOpacity>
            } else {
                return null;
            }
        }, []);

        const getSentAtTimestamp = useCallback((item: any) => {
            return item.getSentAt() ? (item.getSentAt() * 1000) : Date.now();
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
                const updatedReactions: any[] = [];
                reactions.forEach((reaction: any) => {
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
                CometChat.removeReaction(messageId, emoji).then((message: any) => {
                }).catch((error: any) => {
                    CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, { message: msgObj, status: messageStatus.success });
                    console.log(error);
                });
            } else {
                const updatedReactions: any[] = [];
                const reactionAvailable = reactions.find((reaction: any) => {
                    return reaction?.getReaction() == emoji;
                });
                reactions.forEach((reaction: any) => {
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
            let seperatorView: JSX.Element | null = null;
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
                <MessageView message={item} currentIndex={index} />
            </React.Fragment>
        }), []);

        const keyExtractor = useCallback((item: any) => `${item.id}_${item.muid}`, [])

        const itemSeperator = useCallback(() => <View style={{ height: 8 }} />, [])

        const getEmptyTextView = useCallback(() => {
            if (EmptyStateView)
                return (
                    <>
                        <ScrollView contentContainerStyle={Style.msgContainerStyle}>
                            <EmptyStateView />
                        </ScrollView>
                    </>
                ) 
            return (
                <>
                    <ScrollView contentContainerStyle={Style.msgContainerStyle}>
                        <View>
                            <Text
                                style={[
                                    Style.msgTxtStyle, {
                                        ...(messageListStyle?.emptyStateTextFont),
                                        color: messageListStyle?.emptyStateTextColor
                                    }] as TextStyle}
                            >
                                {emptyStateText}
                            </Text>
                        </View >
                    </ScrollView>
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
                        }] as TextStyle}
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
                    <ActivityIndicator size="large" color={_messageListStyle?.loadingIconTint} />
                </View>
            )
        }, [])

        const handleScroll = (event: any) => {
            if (event.nativeEvent.contentOffset.y == 0) {
                getPreviousMessages();
            }
            scrollHandler(event);
        };

        const onContentSizeChange = useCallback((contentWidth: any, contentHeight: any) => {
            if (currentScrollPosition.current.y == 0 && currentScrollPosition.current.scrollViewHeight) {
                let diff = contentHeight - currentScrollPosition.current.scrollViewHeight;
                if (messagesLength.current > prevMessagesLength.current && diff > 0 && !(unreadCount > 0)) {
                    messageListRef.current?.scrollTo({ y: diff, animated: false })
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
            
            /**
             * If Keyboard is open, recalculate the scroll position when content size changes
             */
            if(isKeyBoardVisible.current == true) {
                /**
                 * WITHOUT the isAtBottom() check, the following will happen:
                 *   1. nearToBottom() is true (which is up to 2 messages from bottom)
                 *   2. A new message is received (or any event that changes the content size) 
                        but the UI issue is mainly with a new message
                 *   3. Since the content size has increased, we are not nearToBotom() anymore
                        and so the unread banner will be displayed to click and scroll to bottom
                 *   4. If there's not isAtBottomCheck() below, `onKeyboardVisibilityChange()` runs
                        to adjust for the change in content size and this triggers a scroll
                        messageListRef.current.scrollTo({ y: scrollPos, animated: false })
                 *   5. And the nearToBottom() is true again since we have accounted for the change
                        in contentSize and the banner disappears and the list scrolls to the bottom
                 *
                 * The above breaks the UI!
                 */

                /**
                 * Why not do this for isAtBottom() || !isNearBottom()?
                 *    - (isAtBottom() || !isNearBottom()) means notAtBottom() and notNearBottom()
                         This means there's content under the keyboard but that's not the end. 
                         Everytime a new message is received contentSize will change and that will
                         trigger a position recalculation and a scroll and the list will keep scrolling
                         till we reach bottom (that is if we keep receiving messages).
                 * 
                 */
                if (isAtBottom()) {            
                   /** 
                    *  Why is this required?
                    *    1. Let's say the scroll is nearToBottom() and the keyboard is open
                    *    2. User receives a new message and the content size changes.
                    *    3. The Message List scrolls to the bottom since the scroll was nearToBottom()
                    *    4. User closes the keyboard and the list scrolls back to the previous message
                    *       that was nearToBottom()
                    *    5. The position to scroll back to needs to be recalculated since the contentSize
                            has changed. Calling `onKeyboardVisibiltyChange()` does this.
                    *  
                    */       
                    onKeyboardVisibiltyChange(true, Keyboard_Height);
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
            } as ViewProps}>
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
                                                    group={group && (group as any)['guid']}
                                                    user={user && (user as any)['uid']}
                                                    id={{
                                                        guid: group && (group as any)['guid'],
                                                        uid: user && (user as any)['uid'],
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
                                                !currentScrollPosition.current.scrollViewHeight && messageListRef.current?.scrollToEnd({ animated: false })
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
                                                    group={group && (group as any)['guid']}
                                                    user={user && (user as any)['uid']}
                                                    id={{
                                                        guid: group && (group as any)['guid'],
                                                        uid: user && (user as any)['uid'],
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
                }} isOpen={showMessageOptions.length > 0 || Boolean(ExtensionsComponent) || messageInfo}
                    sliderMaxHeight={Dimensions.get('window').height * 0.5}
                    sliderMinHeight={Dimensions.get('window').height * 0.5}
                >
                    {
                        ExtensionsComponent ? ExtensionsComponent :
                            messageInfo && infoObject.current ? 
                                <CometChatMessageInformation
                                    message={infoObject.current}
                                    template={templatesMap.get(`${infoObject.current?.getCategory()}_${infoObject.current?.getType()}`)}
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
                        theme={theme}
                    />
                </CometChatBottomSheet>

                <CometChatBottomSheet
                    isOpen={showReactionList}
                    onClose={() => {
                        setShowReactionList(false);
                        setSelectedEmoji(undefined);
                    }}
                    sliderMaxHeight={Dimensions.get('window').height * 0.5}
                    sliderMinHeight={Dimensions.get('window').height * 0.5}
                >
                    <CometChatReactionList
                        messageObject={selectedMessage}
                        selectedReaction={selectedEmoji}
                        {...reactionListConfiguration}
                        onPress={(messageReaction: CometChat.Reaction | any, messageObject: CometChat.BaseMessage | any) => {
                            if (reactionListConfiguration?.onPress) {
                                reactionListConfiguration.onPress(messageReaction, messageObject);
                                return;
                            }
                            reactToMessage(messageReaction?.getReaction(), messageObject);
                            if (messageObject?.getReactions()?.length === 1 && messageObject?.getReactions()?.[0]?.['count'] == 1) {
                                setShowReactionList(false);
                                setSelectedEmoji(undefined);
                            }
                        }}
                    />
                </CometChatBottomSheet>
            </View>
        )
    }));