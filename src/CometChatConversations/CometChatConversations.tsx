import React, { useContext } from "react";
import { View, Text } from "react-native";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import {
    AvatarStyleInterface,
    ChatConfigurator,
    CometChatConfirmDialog,
    CometChatConfirmDialogStyleInterface,
    CometChatContext,
    CometChatMentionsFormatter,
    CometChatTextFormatter,
    CometChatUrlsFormatter,
    MentionTextStyle,
    CometChatListActionsInterface,
    localize,
    CometChatUIKit,
    CometChatUiKitConstants
} from "../shared";
import { Style } from "./style";
import {
    backIcon, passwordGroupIcon,
    privateGroupIcon,
    sentIcon, readIcon, deliveredIcon,
    rightTickIcon, deleteIcon
} from "./resources";
import { ConversationsStyle, ConversationsStyleInterface } from "./ConversationsStyle";
import { ImageType } from "../shared";
import { GroupTypeConstants, MessageCategoryConstants, MessageStatusConstants, PASSWORD_GROUP_COLOR, PRIVATE_GROUP_COLOR, ReceiverTypeConstants } from "../shared/constants/UIKitConstants";
import { AvatarStyle, BadgeStyle, CometChatBadge, CometChatDate, CometChatListItem, CometChatReceipt, DateStyle, StatusIndicatorStyle } from "../shared";
import { ListItemStyle, ListItemStyleInterface } from "../shared";
import { CometChatContextType, MessageReceipt, SelectionMode } from "../shared/base/Types";
import { CometChatSoundManager } from "../shared"
import { CometChatConversationUtils } from "../shared";
import { CometChatList } from "../shared";
import { CometChatOptions } from "../shared";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { StatusIndicatorStyleInterface } from "../shared/views/CometChatStatusIndicator/StatusIndicatorStyle";
import { DateStyleInterface } from "../shared/views/CometChatDate/DateStyle";
import { BadgeStyleInterface } from "../shared/views/CometChatBadge";
import { InteractiveMessageUtils } from "../shared/utils/InteractiveMessageUtils";
import { CommonUtils } from "../shared/utils/CommonUtils";

const conversationListenerId = "chatlist_" + new Date().getTime();
const userListenerId = "chatlist_user_" + new Date().getTime();
const groupListenerId = "chatlist_group_" + new Date().getTime();
const messageListenerId = "chatlist_message_" + new Date().getTime();
const callListenerId = "call_" + new Date().getTime();

export interface ConversationInterface {
    /**
     * hide selection icon
     */
    hideSubmitIcon?: boolean,
    /**
     * toggle user presence view
     */
    disableUsersPresence?: boolean,
    /**
     * toggle react receipt view
     */
    disableReadReceipt?: boolean,
    /**
     * disable message receipts
     */
    disableReceipt?: boolean,
    /**
     * toggle typing indicator
     */
    disableTyping?: boolean,
    /**
     * toggle sound played when message is received
     */
    disableSoundForMessages?: boolean,
    /**
     * custom sound for received messages
     */
    customSoundForMessages?: string,
    /**
     * custom icon for protected group
     */
    protectedGroupIcon?: ImageType,
    /**
     * custom icon for private group
     */
    privateGroupIcon?: ImageType,
    /**
     * custom icon for read message
     */
    readIcon?: ImageType,
    /**
     * custom icon for delivered message
     */
    deliveredIcon?: ImageType,
    /**
     * custom icon for sent message
     */
    sentIcon?: ImageType,
    /**
     * custom icon for error message
     */
    errorIcon?: ImageType,
    /**
     * custom icon for waiting message
     */
    waitingIcon?: ImageType,
    /**
     * call back function which will get an conversation as an argument and returns an string.
     */
    datePattern?: (conversation: CometChat.Conversation) => string,
    /**
     * pass the custom view for list item
     */
    ListItemView?: (item: CometChat.Conversation) => JSX.Element,
    /**
     * pass the functional component for options in app bar
     */
    AppBarOption?: () => JSX.Element,
    /**
     * Pass array of CometChatOptions type
     * Tobe shown on swipe of list item
     */
    options?: (item: CometChat.Conversation) => CometChatOptions[],
    /**
     * toggle seperator
     */
    hideSeparator?: boolean,
    /**
     * icon for back button
     */
    backButtonIcon?: ImageType,
    /**
     * toggle back button view
     */
    showBackButton?: boolean,
    /**
     * select items pass "none" | "single" | "multitple"
     */
    selectionMode?: SelectionMode,
    /**
     * call back on seleciton is done
     */
    onSelection?: (item: Array<CometChat.Conversation>) => void,
    /**
     * title to be shown default "Chats"
     */
    title?: string,
    /**
     * Text to be displayed if no conversation found.
     */
    emptyStateText?: string,
    /**
     * Custom Functional component for empty state
     */
    EmptyStateView?: () => JSX.Element,
    /**
     * Text tobe displayed if there is an error while fetching conversations.
     */
    errorStateText?: string,
    /**
     * Custom functional component for error state.
     */
    ErrorStateView?: () => JSX.Element,
    /**
     * Custom functional component for loading state.
     */
    LoadingStateView?: () => JSX.Element,
    /**
     * Request builder to fetch conversations.
     */
    conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder,
    /**
     * Custom subtitle view
     */
    SubtitleView?: (item: CometChat.Conversation) => JSX.Element,
    /**
     * toogle error view
     */
    hideError?: boolean,
    /**
     * call back function for
     */
    onItemPress?: (item: CometChat.Conversation) => void,
    /**
     * callback function for long press
     */
    onItemLongPress?: (item: CometChat.Conversation) => void,
    /**
     * callback function will be called when error occured while fetching conversations
     */
    onError?: (e: CometChat.CometChatException) => void,
    /**
     * callback function for on back
     */
    onBack?: () => void,
    /**
     * style object for conversations
     */
    conversationsStyle?: ConversationsStyleInterface,
    /**
     * style object for list item
     */
    listItemStyle?: ListItemStyleInterface,
    /**
     * style object for avatar
     */
    avatarStyle?: AvatarStyleInterface,
    /**
     * style object for status indicator
     */
    statusIndicatorStyle?: StatusIndicatorStyleInterface,
    /**
     * style object for date
     */
    dateStyle?: DateStyleInterface,
    /**
     * style object for receipt
     */
    receiptStyle?: Object,
    /**
     * style object for badge
     */
    badgeStyle?: BadgeStyleInterface,
    /**
     * style object for confirm dialog
     */
    confirmDialogStyle?: CometChatConfirmDialogStyleInterface,
    /**
     * if true, mentions will be disabled. Default: false
     */
    disableMentions?: boolean,
    /**
     * Collection of text formatter class
     * @type {Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>}
    */
    textFormatters?: Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>;
}

/**
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @description CometChatConversations is a container component that wraps and
 * formats CometChatListBase and CometChatConversationList component, with no behavior of its own.
 *
 */
export const CometChatConversations = (props: ConversationInterface) => {
    /**
     * Props destructuring
     */
    const {
        disableUsersPresence = false,
        disableReadReceipt = false,
        disableReceipt = false,
        disableTyping = false,
        disableSoundForMessages = false,
        customSoundForMessages,
        datePattern,
        ListItemView,
        AppBarOption,
        options,
        hideSeparator = true,
        hideSubmitIcon = false,
        backButtonIcon,
        showBackButton = false,
        selectionMode = "single",
        onSelection,
        title = localize("CHATS"),
        emptyStateText,
        EmptyStateView,
        errorStateText,
        ErrorStateView,
        LoadingStateView,
        conversationsRequestBuilder,
        SubtitleView,
        hideError = false,
        onItemPress,
        onItemLongPress,
        onError,
        onBack,
        conversationsStyle,
        disableMentions,
        textFormatters
    } = props;

    //context
    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const activeSwipeRows = React.useRef({});

    const conversationListRef = React.useRef<CometChatListActionsInterface>(null);
    const loggedInUser = React.useRef(null);
    const [confirmDelete, setConfirmDelete] = React.useState(undefined);
    const [selecting, setSelecting] = React.useState(selectionMode === 'none' ? false : true);
    const [selectedConversation, setSelectedConversations] = React.useState([]);
    const onMemberAddedToGroupDebounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const _style = new ConversationsStyle({
        backgroundColor: theme?.palette?.getBackgroundColor(),
        backIconTint: theme?.palette?.getPrimary(),
        emptyTextColor: theme?.palette?.getAccent400(),
        emptyTextFont: theme?.typography?.caption2,
        errorTextColor: theme?.palette?.getError(),
        errorTextFont: theme?.typography?.subtitle1,
        lastMessageTextColor: theme?.palette.getAccent600(),
        lastMessageTextFont: theme?.typography.subtitle1,
        loadingIconTint: theme?.palette.getAccent700(),
        separatorColor: theme?.palette.getAccent100(),
        titleColor: theme?.palette.getAccent(),
        titleFont: theme?.typography.heading,
        typingIndictorTextColor: theme?.palette.getAccent600(),
        typingIndictorTextFont: theme?.typography.subtitle1,
        threadIndicatorTextColor: theme?.palette.getAccent800(),
        threadIndicatorTextFont: theme?.typography.text1,
        ...conversationsStyle
    });
    const _statusIndicatorStyle = new StatusIndicatorStyle(props?.statusIndicatorStyle || {});
    const _avatarStyle = new AvatarStyle({
        backgroundColor: theme?.palette?.getAccent600(),
        nameTextColor: theme?.palette?.getAccent(),
        nameTextFont: theme?.typography.body,
        ...props?.avatarStyle
    });

    const _listItemStyle = new ListItemStyle({
        backgroundColor: theme?.palette?.getBackgroundColor(),
        titleColor: theme?.palette.getAccent(),
        titleFont: theme?.typography.name,
        ...props?.listItemStyle
    });
    const _badgeStyle = new BadgeStyle({
        backgroundColor: theme?.palette?.getPrimary(),
        textColor: theme?.palette?.getSecondary(),
        textFont: theme?.typography?.caption2,
        ...props?.badgeStyle
    });
    // const _receiptStyle = new ReceiptStyle(props?.receiptStyle || {});
    const _dateStyle = new DateStyle({
        textColor: theme?.palette?.getAccent600(),
        textFont: theme?.typography?.caption1,
        ...props?.dateStyle
    });

    const _confirmDialogStyle = (props?.confirmDialogStyle || {});

    const ErrorView = () => {
        return (
            <View style={Style.listContainer}>
                <Text style={{ ..._style?.errorTextFont, color: _style?.errorTextColor }}>
                    {errorStateText || localize("SOMETHING_WRONG")}
                </Text>
            </View>
        );
    }

    const EmptyView = () => {
        if (EmptyStateView)
            return EmptyStateView();
        else
            return (
                <View style={Style.listContainer}>
                    <Text style={{ ..._style.emptyTextFont, color: _style.emptyTextColor }}>
                        {emptyStateText || localize("NO_CHATS_FOUND")}
                    </Text>
                </View>
            )
    }

    const userEventHandler = (...args) => {
        const { uid, blockedByMe, status } = args[0];
        if (!blockedByMe) {
            let item: CometChat.Conversation = conversationListRef.current.getListItem(`${uid}_user_${loggedInUser.current.uid}`) || conversationListRef.current.getListItem(`${loggedInUser.current.uid}_user_${uid}`);
            if (item) {
                let updatedConversation = CommonUtils.clone(item);
                updatedConversation.setConversationWith(args[0]);
                console.log(JSON.stringify(updatedConversation));
                conversationListRef.current.updateList(updatedConversation);
            }
        }
    }


    const getConversationRefFromTypingIndicator = (typingIndicator: CometChat.TypingIndicator) => {
        let list = conversationListRef.current.getAllListItems();
        return list.find((item: CometChat.Conversation) => {
            return (
                (typingIndicator.getReceiverType() == ReceiverTypeConstants.user &&
                    item.getConversationType() == ReceiverTypeConstants.user
                    && (item.getConversationWith() as CometChat.User).getUid() == typingIndicator.getSender().getUid())
                || (typingIndicator.getReceiverType() == ReceiverTypeConstants.group && item.getConversationType() == ReceiverTypeConstants.group
                    && (item.getConversationWith() as CometChat.Group).getGuid() == typingIndicator.getReceiverId())
            )
        })
    }

    /**
     * Listener callback for typing event
     * @param  {...any} args
     */
    const typingEventHandler = (...args) => {
        let conversation: CometChat.Conversation = getConversationRefFromTypingIndicator(args[0]);
        if (conversation) {
            let isTyping = args[1];
            let newConversation = conversation
            if (isTyping && !newConversation?.['lastMessage']?.["typing"]) {
                newConversation['lastMessage']["typing"] = args[0]?.receiverType === 'group' ?
                    `${args[0].sender.name} ${localize("IS_TYPING")}` :
                    localize("IS_TYPING");
            } else {
                delete newConversation['lastMessage']['typing'];
            }
            conversationListRef.current.updateList(newConversation);
        }

    }

    /**
   * Find conversation from state , check and  udpate its last message object.
   * conversation list item remains at the same place
   *
   * @param newMessage message object
   */
    const checkAndUpdateLastMessage = (newMessage: CometChat.BaseMessage) => {
        CometChat.CometChatHelper.getConversationFromMessage(newMessage)
            .then(conversation => {
                let conver: any = conversationListRef.current.getListItem(conversation.getConversationId())
                if (!conver) return;
                let lastMessageId = conver['lastMessage']['id']
                if (lastMessageId == newMessage['id']) {
                    conversationListRef.current.updateList(conversation)
                }
            })

    }


    /**
     *  Check if last message/unread count should be updated
     * 
     *  @param newMessage message object
     */
    const shouldUpdateLastMessageAndUnreadCount = (message : CometChat.BaseMessage) => {

        /****Start: Should Threaded Messages Update Conversation? */
        if(message.getParentMessageId() && !CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnMessageReplies()) {
            return false;
        }
         /****END: Should Threaded Messages Update Conversation? */

        /****Start: Should Custom Message Update Conversation? */
        if(message.getCategory() == CometChatUiKitConstants.MessageCategoryConstants.custom) {
            let customMessage = message as CometChat.CustomMessage;
            if (!customMessage.willUpdateConversation() && 
                !(customMessage.getMetadata() && (customMessage.getMetadata() as any)["incrementUnreadCount"]) && 
                !CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCustomMessages()) {
                    return false;
                 } 
            }
        /****End: Should Custom Message Update Conversation? */

        /****Start: Should Group Actions sent update conversation? */
        if(message.getCategory() == CometChatUiKitConstants.MessageCategoryConstants.action
           && message.getReceiverType() == CometChatUiKitConstants.ReceiverTypeConstants.group
        ) {
           return CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnGroupActions();
        }
        /****End: Should Group Actions sent update conversation? */        

        /****Start: Should Call Actions sent Update Conversation? */
        if(message.getCategory() == CometChatUiKitConstants.MessageCategoryConstants.call
        && !CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()
         ) {
           return false;
        }
        /****End: Should Call Actions sent Update Conversation */        

        return true;
    }

    /**
     * Find conversation from state and udpate its last message object.
     * Also remove from the current location and put it to 1st location.
     *
     * @param newMessage message object
     */
    const updateLastMessage = (newMessage: CometChat.BaseMessage) => {

        CometChat.CometChatHelper.getConversationFromMessage(newMessage)
            .then(conversation => {
                if (newMessage.getCategory() === MessageCategoryConstants.interactive) {
                    newMessage = InteractiveMessageUtils.convertInteractiveMessage(newMessage);
                }
                const oldConversation: CometChat.Conversation = conversationListRef.current.getListItem(conversation['conversationId']);
                if (oldConversation == undefined) {
                    CometChat.CometChatHelper.getConversationFromMessage(newMessage)
                        .then(newConversation => {
                            if (newConversation?.lastMessage?.sender?.uid !== loggedInUser.current?.['uid'])
                                newConversation.setUnreadMessageCount(1);
                            conversationListRef.current.updateAndMoveToFirst(newConversation);
                        })
                        .catch(err => onError && onError(err))
                    return;
                }
                oldConversation['lastMessage'] = newMessage;
                if (newMessage['sender']['uid'] != loggedInUser.current?.['uid'])
                    oldConversation.setUnreadMessageCount(oldConversation.getUnreadMessageCount() + 1);
                conversationListRef.current.updateAndMoveToFirst(oldConversation);
            })
            .catch(err => {
                console.log("Error", err);
            })
    }

    /**
     * play notification sound for incoming messages
     */
    const playNotificationSound = () => {
        // code for playing sound need to be added here.
        if (disableSoundForMessages) return;
        CometChatSoundManager.play(
            customSoundForMessages || CometChatSoundManager.SoundOutput.incomingMessageFromOther
        );
    }

    const shouldMarkAsDelivered = (message: object) => {
        return !disableReceipt && !message.hasOwnProperty("deliveredAt");
    }

    /**
     * marking the incoming messages as delivered
     */
    const markMessageAsDelivered = (message) => {
        if (message.hasOwnProperty('deletedAt')) return;

        if (shouldMarkAsDelivered(message)) {
            CometChat.markAsDelivered(message);
            playNotificationSound();
        }
    }

    /**
     *
     * When a text message / media message / custom message is received
     */
    const messageEventHandler = (...args) => {
        let message = args[0];
        !disableReadReceipt && markMessageAsDelivered(message);
        updateLastMessage(message);
    }

    /**
     * callback handler for group Add / Kicked / Banned / Scope Change
     * @param {obj} message
     */
    const groupHandler = (message, otherDetails: {action?: string, actionOn?: CometChat.User, actionBy?: CometChat.User, group?: CometChat.Group} = {}) => {
        let conversation : CometChat.Conversation = (conversationListRef.current.getListItem(message['conversationId']) as unknown as CometChat.Conversation); 
        let {action, actionOn, actionBy, group} = otherDetails;
          if (conversation) {
            if ((["kicked", "banned", "left"].includes(action)) && (actionOn.getUid() == loggedInUser.current.getUid())){
                conversationListRef.current.removeItemFromList(message.conversationId);
                return;
            } else {
                if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnGroupActions()) {
                   return;
                }
                conversation.setLastMessage(message);
                conversationListRef.current.updateList(conversation);
            }
          } else {
              CometChat.CometChatHelper.getConversationFromMessage(message)
                  .then(newConversation => {
                 const conversation : CometChat.Conversation = (conversationListRef.current.getListItem(message['conversationId']) as unknown as CometChat.Conversation); 
                      if (conversation) {
                          groupHandler(message);
                      } else {
                          conversationListRef.current.addItemToList(newConversation, 0);
                      }
                  });
          }
    }

    const conversationClicked = (conversation) => {
        if (onItemPress) {
            onItemPress(conversation);
            return;
        }
        if (!selecting) {
            //fire event
            return;
        }

        if (selectionMode == "none") return;

        let index = selectedConversation.findIndex(tmpConver => tmpConver.conversationWith.conversationId == conversation.conversationWith.conversationId);
        if (index < 0) {
            if (selectionMode == "single")
                setSelectedConversations([conversation])

            if (selectionMode == "multiple")
                setSelectedConversations([...selectedConversation, conversation]);
        } else {
            selectedConversation.splice(index, 1);
            setSelectedConversations([...selectedConversation]);
        }
    }

    const conversationLongPressed = (conversation) => {
        if (onItemLongPress) {
            onItemLongPress(conversation);
            return;
        }

        if (selectionMode == "none") return;

        setSelecting(true);
        setSelectedConversations([...selectedConversation, conversation]);
    }

    const removeItemFromSelectionList = (id) => {
        if (selecting) {
            let index = selectedConversation.find(member => member['uid'] == id);
            if (index > -1) {
                let tmpSelectedConversations = [...selectedConversation];
                tmpSelectedConversations.splice(index, 1);
                setSelectedConversations(tmpSelectedConversations);
            }
        }
    }

    const removeConversation = (id) => {
        let conversation = conversationListRef.current.getListItem(id);
        const { conversationWith, conversationType } = conversation;
        let conversationWithId = conversationType == "group" ? conversationWith.guid : conversationWith.uid;
        CometChat.deleteConversation(conversationWithId, conversationType)
            .then(success => {
                conversationListRef.current.removeItemFromList(id);
                removeItemFromSelectionList(id);
            })
            .catch(err => console.log(err))
    }

    const getMessagePreview = (conversations: CometChat.Conversation, uid) => {

        let lastMessage: CometChat.BaseMessage = conversations?.getLastMessage && conversations.getLastMessage();
        if (!lastMessage) return null;
        let messageText: string;
        if (lastMessage.getDeletedAt() !== undefined) {
            messageText = localize("THIS_MESSAGE_DELETED");
        } else {
            messageText = ChatConfigurator.getDataSource().getLastConversationMessage(conversations);

            if (lastMessage) {
                messageText = getFormattedText(lastMessage, messageText?.trim());
            }
        }
        let groupText = "";
        if (lastMessage.getReceiverType() == ReceiverTypeConstants.group) {
            if (lastMessage.getSender().getUid() == uid) {
                groupText = localize("YOU") + ": "
            } else {
                groupText = lastMessage.getSender().getName() + ": "
            }
        }

        return (
            <Text numberOfLines={1} ellipsizeMode={"tail"} style={[Style.subtitleTextStyle, {
                color: theme.palette.getAccent600(), fontSize: theme.typography.subtitle1.fontSize,
                fontWeight: theme.typography.subtitle1.fontWeight
            }]}>
                {groupText}{messageText}
            </Text>
        )
    }

    function getFormattedText(message: CometChat.BaseMessage, subtitle: string) {
        let messageTextTmp = subtitle;
        let allFormatters = [...(textFormatters || [])] || [];

        if (!disableMentions && message.getMentionedUsers().length) {
            let mentionsFormatter = ChatConfigurator.getDataSource().getMentionsFormatter();
            mentionsFormatter.setLoggedInUser(CometChatUIKit.loggedInUser);
            mentionsFormatter.setMentionsStyle(
                new MentionTextStyle({
                    loggedInUserTextStyle: {
                        color: theme.palette.getPrimary(),
                        ...theme.typography.title2,
                    },
                    textStyle: {
                        color: theme.palette.getPrimary(),
                        ...theme.typography.subtitle1,
                    }
                })
            );

            mentionsFormatter.setMessage(message);
            allFormatters.push(mentionsFormatter);
        }

        if (allFormatters && allFormatters.length) {
            for (let i = 0; i < allFormatters.length; i++) {
                let suggestionUsers = allFormatters[i].getSuggestionItems();
                allFormatters[i].setMessage(message);
                suggestionUsers.length > 0 && allFormatters[i].setSuggestionItems(suggestionUsers);
                let _formatter = CommonUtils.clone(allFormatters[i]);
                (messageTextTmp as string | JSX.Element) = _formatter.getFormattedText(messageTextTmp);
            }
        }

        return messageTextTmp;
    }

    const LastMessageView = (params: {
        conversations: CometChat.Conversation,
        typingText: string
    }) => {
        const lastMessage = params['conversations']['lastMessage'];
        if (!lastMessage) return null;
        let readReceipt;
        if (params.typingText) {
            return <View style={Style.row}>
                <Text numberOfLines={1} ellipsizeMode={"tail"} style={[Style.subtitleTextStyle, {
                    color: theme.palette.getPrimary(),
                    fontSize: theme.typography.subtitle1.fontSize, fontWeight: theme.typography.subtitle1.fontWeight
                }]} >{params.typingText}</Text>
            </View>
        }

        if (lastMessage && !disableReadReceipt && lastMessage['sender']['uid'] == loggedInUser.current?.uid && !lastMessage.getDeletedAt()) {
            let status: MessageReceipt = "ERROR";
            if (lastMessage?.hasOwnProperty('readAt'))
                status = "READ";
            else if (lastMessage?.hasOwnProperty("deliveredAt"))
                status = "DELIVERED";
            else if (lastMessage?.hasOwnProperty("sentAt"))
                status = "SENT";
            readReceipt = disableReceipt ? null : <CometChatReceipt
                receipt={status}
                deliveredIcon={props.deliveredIcon}
                errorIcon={props.errorIcon}
                readIcon={props.readIcon}
                sentIcon={props.sentIcon}
                waitIcon={props.waitingIcon}
            />;
        }

        let threadView;

        if (lastMessage?.getParentMessageId()) {
            threadView = <Text numberOfLines={1} style={[Style.subtitleTextStyle, { color: theme.palette.getAccent600() }]} >{localize("IN_A_THREAD")}</Text>
        }

        return (
            <View style={Style.column}>
                {threadView}
                <View style={Style.row}>
                    {readReceipt}
                    {getMessagePreview(params['conversations'], loggedInUser.current?.uid)}
                </View>
            </View>

        )
    }

    const TailView = (params: {
        timestamp: number,
        unreadCount: number,
        customPattern: Function,
    }) => {
        return <View style={{ alignItems: "flex-end" }}>
            <CometChatDate
                timeStamp={(params.timestamp) * 1000}
                style={_dateStyle}
                customDateString={params.customPattern && params.customPattern()}
                pattern={"dayDateTimeFormat"}
            />
            <CometChatBadge
                count={params.unreadCount}
                style={_badgeStyle}
            />
        </View>
    }

    const ConfirmDeletionDialog = () => {

        if (confirmDelete == undefined) return null;

        return <CometChatConfirmDialog
            title={localize("CONFIRM")}
            cancelButtonText={localize("CANCEL")}
            confirmButtonText={localize("DELETE")}
            messageText={localize("DELETE_CONFIRM_MESSAGE")}
            isOpen={true}
            onCancel={() => setConfirmDelete(undefined)}
            onConfirm={() => {
                {
                    removeConversation(confirmDelete);
                    setConfirmDelete(undefined);
                }
            }}
            style={_confirmDialogStyle}
        />
    }

    const getDefaultOptions = (conversation) => {
        let _defaultOptions = CometChatConversationUtils.getDefaultOptions();
        _defaultOptions[0].backgroundColor = theme?.palette.getError();
        _defaultOptions[0].icon = deleteIcon;
        _defaultOptions[0].title = localize("DELETE");
        _defaultOptions[0].titleStyle = { fontSize: 14, color: theme?.palette.getSecondary() };
        _defaultOptions[0].iconTint = theme?.palette.getSecondary();
        _defaultOptions[0].onPress = (id) => {
            setConfirmDelete(id);
        };
        return _defaultOptions
    }

    const updateConversationLastMessage = (message) => {
        if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnGroupActions()) {
            return;
        }
        try {
            let conversation: CometChat.Conversation = conversationListRef.current?.getListItem(message.conversationId)
            conversation.lastMessage = message
            conversationListRef.current?.updateAndMoveToFirst(conversation);
        } catch (error) {
            onError && onError(error)
        }
    }

    const updateUnreadMessageCount = (conversation: CometChat.Conversation) => {
        const oldConversation: CometChat.Conversation = (conversationListRef.current.getListItem(conversation['conversationId'])  as unknown as CometChat.Conversation);
        if (oldConversation == undefined) {
            conversation.setUnreadMessageCount(1);
            return conversation;
        }
        oldConversation.setUnreadMessageCount(oldConversation.getUnreadMessageCount() + 1);
        return oldConversation;
    }

    React.useEffect(() => {
        CometChat.getLoggedinUser()
            .then(u => { loggedInUser.current = u })
            .catch(err => console.log(err));

        CometChat.addUserListener(
            userListenerId,
            new CometChat.UserListener({
                onUserOnline: (onlineUser: any) => {
                    console.log(onlineUser);
                    userEventHandler(onlineUser);
                },
                onUserOffline: (offlineUser: any) => {
                    console.log(offlineUser);
                    userEventHandler(offlineUser);
                },
            })
        );

        CometChat.addCallListener(
            callListenerId,
            new CometChat.CallListener({
                onIncomingCallReceived: (call) => {
                    CometChat.CometChatHelper.getConversationFromMessage(call)
                        .then((conversation) => {
                            if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                                return;
                            }
                            conversation = updateUnreadMessageCount(conversation);
                            conversation.setLastMessage(call);
                            conversationListRef.current.updateList(conversation);
                        })
                        .catch((e) => {
                            onError && onError(e);
                        })
                },
                onOutgoingCallAccepted: (call) => {
                    CometChat.CometChatHelper.getConversationFromMessage(call)
                        .then((conversation) => {
                            if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                                return;
                            }
                            conversation = updateUnreadMessageCount(conversation);
                            conversation.setLastMessage(call);
                            conversationListRef.current.updateList(conversation);
                        })
                        .catch((e) => {
                            onError && onError(e);
                        })
                },
                onOutgoingCallRejected: (call) => {
                    CometChat.CometChatHelper.getConversationFromMessage(call)
                        .then((conversation) => {
                            if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                                return;
                            }
                            conversation = updateUnreadMessageCount(conversation);
                            conversation.setLastMessage(call);
                            conversationListRef.current.updateList(conversation);
                        })
                        .catch((e) => {
                            onError && onError(e);
                        })
                },
                onIncomingCallCancelled: (call) => {
                    CometChat.CometChatHelper.getConversationFromMessage(call)
                        .then((conversation) => {
                            if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                                return;
                            }
                            conversation = updateUnreadMessageCount(conversation);
                            conversation.setLastMessage(call);
                            conversationListRef.current.updateList(conversation);
                        })
                        .catch((e) => {
                            onError && onError(e);
                        })
                }
            })
        );

        CometChat.addGroupListener(
            groupListenerId,
            new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message) => {
                    groupHandler(
                        message
                    );
                },
                onGroupMemberKicked: (             
                    message: CometChat.Action,
                    kickedUser: CometChat.User,
                    kickedBy: CometChat.User,
                    kickedFrom: CometChat.Group) => {
                    groupHandler(
                        message,
                        {action: 'kicked', actionOn: kickedUser, actionBy: kickedBy, group: kickedFrom}
                    );
                },
                onGroupMemberLeft: (message: CometChat.Action, leavingUser: CometChat.User, group: CometChat.Group) => {
                    groupHandler(message, 
                    {action: 'left', actionOn: leavingUser, group}
                );
                },
                onGroupMemberUnbanned: (message) => {
                    groupHandler(message);
                },
                onGroupMemberBanned: (                    
                    message: CometChat.Action,
                    bannedUser: CometChat.User,
                    bannedBy: CometChat.User,
                    bannedFrom: CometChat.Group) => {
                    groupHandler(
                        message,
                        {action: 'banned', actionOn: bannedUser, actionBy: bannedBy, group: bannedFrom}
                    );
                },
                onMemberAddedToGroup: (              
                    message: CometChat.Action,
                    userAdded: CometChat.User,
                    userAddedBy: CometChat.User,
                    userAddedIn: CometChat.Group) => {
                    if (onMemberAddedToGroupDebounceTimer.current) {
                        clearTimeout(onMemberAddedToGroupDebounceTimer.current);
                    }
                    onMemberAddedToGroupDebounceTimer.current = setTimeout(() => {
                        groupHandler(
                            message,
                            {action: 'joined', actionOn: userAdded, actionBy: userAddedBy, group: userAddedIn}
                        );
                    }, 50)
                },
                onGroupMemberJoined: (message) => {
                    groupHandler(
                        message
                    );
                }
            })
        );

        CometChatUIEventHandler.addConversationListener(
            conversationListenerId,
            {
                ccConversationDeleted:
                    ({ conversation }: { conversation: CometChat.Conversation }) => {
                        CometChat.deleteConversation(conversation.getConversationId(), conversation.getConversationType())
                            .then(res => {
                                conversationListRef.current.removeItemFromList(conversation);
                                removeItemFromSelectionList(conversation.getConversationId())
                            })
                            .catch(err => {
                                console.log("Error", err);
                            });
                    }
            }
        );
        CometChatUIEventHandler.addMessageListener(
            messageListenerId,
            {
                ccMessageSent: ({ message, status }) => {
                    if (status == MessageStatusConstants.success) {
                        if(!shouldUpdateLastMessageAndUnreadCount(message)) {
                            return;
                        }
                        updateLastMessage(message);
                    }
                },
                ccMessageRead: ({ message }) => {
                    checkAndUpdateLastMessage(message)
                },
                ccMessageDeleted: ({ message }) => {
                    checkAndUpdateLastMessage(message)
                },
                ccMessageEdited: ({ message }) => {
                    checkAndUpdateLastMessage(message)
                },
                onTextMessageReceived: (textMessage) => {
                    if(!shouldUpdateLastMessageAndUnreadCount(textMessage)) {
                        return;
                    }
                    messageEventHandler(textMessage);
                    !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
                },
                onMediaMessageReceived: (mediaMessage) => {
                    if(!shouldUpdateLastMessageAndUnreadCount(mediaMessage)) {
                        return;
                    }
                    messageEventHandler(mediaMessage);
                    !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
                },
                onCustomMessageReceived: (customMessage) => {
                    if(!shouldUpdateLastMessageAndUnreadCount(customMessage)) {
                        return;
                    }
                    messageEventHandler(customMessage);
                    !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
                },
                onMessageDeleted: (deletedMessage) => {
                    checkAndUpdateLastMessage(deletedMessage)
                },
                onMessageEdited: (editedMessage) => {
                    checkAndUpdateLastMessage(editedMessage)
                },
                onMessagesRead: (messageReceipt) => {
                    messageEventHandler(messageReceipt);
                },
                onMessagesDelivered: (messageReceipt) => {
                    messageEventHandler(messageReceipt);
                },
                onTypingStarted: (typingIndicator) => {
                    typingEventHandler(typingIndicator, true);
                },
                onTypingEnded: (typingIndicator) => {
                    typingEventHandler(typingIndicator, false);
                },
                onFormMessageReceived: (formMessage) => {
                    if(!shouldUpdateLastMessageAndUnreadCount(formMessage)) {
                        return;
                    }
                    messageEventHandler(formMessage);
                    !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
                },
                onCardMessageReceived: (cardMessage) => {
                    if(!shouldUpdateLastMessageAndUnreadCount(cardMessage)) {
                        return;
                    }
                    messageEventHandler(cardMessage);
                    !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
                },
                onSchedulerMessageReceived: (schedulerMessage) => {
                    if(!shouldUpdateLastMessageAndUnreadCount(schedulerMessage)) {
                        return;
                    }
                    messageEventHandler(schedulerMessage);
                    !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
                },
                onCustomInteractiveMessageReceived: (customInteractiveMessage) => {
                    if(!shouldUpdateLastMessageAndUnreadCount(customInteractiveMessage)) {
                        return;
                    }
                    messageEventHandler(customInteractiveMessage);
                    !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
                }
            }
        );
        CometChatUIEventHandler.addGroupListener(
            groupListenerId,
            {
                ccGroupCreated: ({ group }) => {
                    CometChat.getConversation(group.getGuid(), CometChatUiKitConstants.ConversationTypeConstants.group).then(
                        conversation => {
                            conversationListRef.current?.addItemToList(conversation, 0);
                        }
                    )
                },
                ccGroupDeleted: ({ group }) => {
                    conversationListRef.current?.removeItemFromList(group['conversationId']);
                    removeItemFromSelectionList(group['conversationId'])
                },
                ccGroupLeft: ({ leftGroup }) => {
                    conversationListRef.current?.removeItemFromList(leftGroup['conversationId']);
                    removeItemFromSelectionList(leftGroup['conversationId'])
                },
                ccGroupMemberKicked: ({ message, kickedFrom }: { message: CometChat.BaseMessage, kickedFrom: CometChat.Group }) => {
                    if(!(shouldUpdateLastMessageAndUnreadCount(message))) {
                        return;
                    }
                    updateConversationLastMessage(message)
                },
                ccGroupMemberBanned: ({ message }) => {
                    if(!(shouldUpdateLastMessageAndUnreadCount(message))) {
                        return;
                    }
                    groupHandler(message);
                },
                ccGroupMemberUnBanned: ({ message }) => {
                    if(!(shouldUpdateLastMessageAndUnreadCount(message))) {
                        return;
                    }
                    groupHandler(message)
                },
                ccOwnershipChanged: ({ message }) => {
                    if(!(shouldUpdateLastMessageAndUnreadCount(message))) {
                        return;
                    }
                    CometChat.CometChatHelper.getConversationFromMessage(message)
                        .then(conversation => {
                            conversationListRef.current?.updateList(conversation);
                        })
                        .catch(e => {
                            onError && onError(e);
                        })
                },
                ccGroupMemberAdded: ({ message }: { message: CometChat.BaseMessage }) => {
                    updateConversationLastMessage(message)
                }
            }
        )

        CometChatUIEventHandler.addUserListener(
            userListenerId,
            {
                ccUserBlocked: ({ user }) => {
                    conversationListRef?.current?.removeItemFromList(user['conversationId']);
                    removeItemFromSelectionList(user['conversationId']);
                }
            }
        )

        CometChatUIEventHandler.addCallListener(
            callListenerId,
            {
                ccOutgoingCall: ({ call }) => {
                    CometChat.CometChatHelper.getConversationFromMessage(call)
                        .then((conversation) => {
                            if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                                return;
                            }
                            conversation = updateUnreadMessageCount(conversation);
                            conversationListRef.current.updateList(conversation);
                        })
                        .catch((e) => {
                            onError && onError(e);
                        })
                },
                ccCallAccepted: ({ call }) => {
                    CometChat.CometChatHelper.getConversationFromMessage(call)
                        .then((conversation) => {
                            if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                                return;
                            }
                            conversation = updateUnreadMessageCount(conversation);
                            conversationListRef.current.updateList(conversation);
                        })
                        .catch((e) => {
                            onError && onError(e);
                        })
                },
                ccCallRejected: ({ call }) => {
                    CometChat.CometChatHelper.getConversationFromMessage(call)
                        .then((conversation) => {
                            if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                                return;
                            }
                            conversation = updateUnreadMessageCount(conversation);
                            conversationListRef.current.updateList(conversation);
                        })
                        .catch((e) => {
                            onError && onError(e);
                        })
                },
                ccCallEnded: ({ call }) => {
                    CometChat.CometChatHelper.getConversationFromMessage(call)
                        .then((conversation) => {
                            if(!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                                return;
                            }
                            conversation = updateUnreadMessageCount(conversation);
                            conversationListRef.current.updateList(conversation);
                        })
                        .catch((e) => {
                            onError && onError(e);
                        })
                }
            }
        )

        return () => {
            CometChat.removeUserListener(userListenerId);
            CometChat.removeCallListener(callListenerId);
            CometChat.removeGroupListener(groupListenerId);
            CometChatUIEventHandler.removeMessageListener(messageListenerId);
            CometChatUIEventHandler.removeConversationListener(conversationListenerId);
            CometChatUIEventHandler.removeGroupListener(groupListenerId);
            CometChatUIEventHandler.removeUserListener(userListenerId);
        }
    }, []);

    const ConversationItemView = ({ item: conversation }) => {
        if (!conversation) return null;
        //custom view check
        if (ListItemView)
            return ListItemView(conversation);
        const { conversationWith, conversationType } = conversation;
        const lastMessage = CometChatConversationUtils.getLastMessage(conversation);
        const { name, type, conversationId } = conversationWith || {};
        let image: ImageType, backgroundColor: string, avatarIcon = conversationWith[conversationType == "group" ? 'icon' : "avatar"];
        if (type == GroupTypeConstants.password) {
            image = props?.protectedGroupIcon || passwordGroupIcon;
            backgroundColor = PASSWORD_GROUP_COLOR;
        }
        if (type == GroupTypeConstants.private) {
            image = props?.privateGroupIcon || privateGroupIcon;
            backgroundColor = PRIVATE_GROUP_COLOR;
        }
        if (conversationWith.status == "online") {
            backgroundColor = theme.palette.getSuccess();
        }
        if (selecting) {
            let index: number = selectedConversation.findIndex((value) => value.conversationWith.conversationId == conversationId);
            if (index >= 0) {
                image = rightTickIcon;
                backgroundColor = theme?.palette.getPrimary();
            }
        }

        return <CometChatListItem
            id={conversation.conversationId}
            avatarName={name}
            avatarURL={avatarIcon}
            hideSeparator={hideSeparator}
            SubtitleView={(SubtitleView && SubtitleView.bind(this, conversation)) || (() => <LastMessageView conversations={conversation} typingText={conversation?.['lastMessage']?.['typing']} />)
            }
            title={name}
            statusIndicatorIcon={image}
            statusIndicatorColor={disableUsersPresence ? "transparent" : backgroundColor}
            listItemStyle={_listItemStyle}
            TailView={() => <TailView
                customPattern={() => datePattern && props.datePattern(conversation)}
                timestamp={lastMessage && lastMessage['sentAt'] || conversationWith['createdAt']}
                unreadCount={conversation.unreadMessageCount}
            />}
            avatarStyle={_avatarStyle}
            statusIndicatorStyle={_statusIndicatorStyle}
            onPress={conversationClicked.bind(this, conversation)}
            onLongPress={conversationLongPressed.bind(this, conversation)}
            options={() => options ? options(conversation) : getDefaultOptions(conversation)}
            activeSwipeRows={activeSwipeRows.current}
            rowOpens={(id) => {
                Object.keys(activeSwipeRows.current).forEach(key => {
                    if(id !== key && activeSwipeRows.current[key]) {
                        activeSwipeRows.current[key]?.current?.closeRow?.()
                        delete activeSwipeRows.current[key]
                    }
                })
            }}
        />
    }

    /**
     * Component template
     */
    return (
        <View style={Style.container}>
            <ConfirmDeletionDialog />
            <CometChatList
                AppBarOptions={AppBarOption}
                onError={onError}
                ref={conversationListRef}
                requestBuilder={conversationsRequestBuilder || new CometChat.ConversationsRequestBuilder().setLimit(30)}
                title={title}
                hideSearch={true}
                hideSubmitIcon={hideSubmitIcon}
                listItemKey={"conversationId"}
                LoadingStateView={LoadingStateView}
                ListItemView={ConversationItemView}
                EmptyStateView={EmptyStateView ? EmptyStateView : () => <EmptyView />}
                ErrorStateView={ErrorStateView ? ErrorStateView : () => <ErrorView />}
                onBack={onBack}
                backButtonIcon={backButtonIcon}
                showBackButton={showBackButton}
                onSelection={(items) => {
                    onSelection && onSelection(items);
                    setSelecting(false);
                    setSelectedConversations([]);
                }}
                SubtitleView={props.SubtitleView}
                disableUsersPresence={disableUsersPresence}
                options={options}
                hideSeparator={hideSeparator}
                listStyle={{ ..._style, background: _style.backgroundColor }}
                selectionMode={selecting ? selectionMode : "none"}
                hideError={hideError}
            />
        </View>
    );
}
