import { AvatarStyleInterface, ListItemStyleInterface, localize } from "../shared";
import { ImageType } from "../shared";
import { DatePattern,SelectionMode } from "../shared/base/Types";
import { AvatarStyle, BadgeStyle, DateStyle, ListItemStyle, StatusIndicatorStyle } from "../shared";
import { CometChatOptions } from "../shared";
// import { ConversationListConfiguration } from "../CometChatConversationList/ConversationListConfiguration";
import { ConversationsStyle, ConversationsStyleInterface } from "./ConversationsStyle";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { StatusIndicatorStyleInterface } from "../shared/views/CometChatStatusIndicator/StatusIndicatorStyle";
import { DateStyleInterface } from "../shared/views/CometChatDate/DateStyle";
import { BadgeStyleInterface } from "../shared/views/CometChatBadge";

export interface ConversationsConfigurationInterface {
    disableUsersPresence?: boolean,
    disableReceipt?: boolean,
    disableTyping?: boolean,
    disableSoundForMessages?: boolean,
    customSoundForMessages?: string,
    protectedGroupIcon?: ImageType,
    privateGroupIcon?: ImageType,
    readIcon?: ImageType,
    deliveredIcon?: ImageType,
    sentIcon?: ImageType,
    datePattern?: (conversation: CometChat.Conversation) => DatePattern,
    ListItemView?: (item: CometChat.Conversation) => JSX.Element,
    AppBarOption?: () => JSX.Element,
    options?: (item: CometChat.Conversation) => CometChatOptions[],
    hideSeparator?: boolean,
    searchPlaceholder?: string,
    backButtonIcon?: ImageType,
    showBackButton?: boolean,
    selectionMode?: SelectionMode,
    onSelection?: (items: Array<CometChat.Conversation>) => void,
    selectedConversations?: () => Array<CometChat.Conversation>,
    searchBoxIcon?: ImageType,
    hideSearch?: boolean,
    EmptyStateView?: () => JSX.Element,
    ErrorStateView?: () => JSX.Element,
    LoadingStateView?: () => JSX.Element,
    conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder,
    SubtitleView?: (item: CometChat.Conversation) => JSX.Element,
    onItemPress?: (item: CometChat.Conversation) => void,
    onItemLongPress?: (item: CometChat.Conversation) => void,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    statusIndicatorStyle?: StatusIndicatorStyleInterface,
    avatarStyle?: AvatarStyleInterface,
    receiptStyle?: any,
    dateStyle?: DateStyleInterface,
    conversationsStyle?: ConversationsStyleInterface,
    listItemStyle?: ListItemStyleInterface,
    badgeStyle?: BadgeStyleInterface
}

/**
 * @class ConversationsConfiguration
 */
export class ConversationsConfiguration implements ConversationsConfigurationInterface {
    disableUsersPresence?: boolean;
    disableReceipt?: boolean;
    disableTyping?: boolean;
    disableSoundForMessages?: boolean;
    customSoundForMessages?: string;
    protectedGroupIcon?: ImageType;
    privateGroupIcon?: ImageType;
    readIcon?: ImageType;
    deliveredIcon?: ImageType;
    sentIcon?: ImageType;
    datePattern?: (conversation: CometChat.Conversation) => DatePattern;
    ListItemView?: (item: CometChat.Conversation) => JSX.Element;
    AppBarOption?: () => JSX.Element;
    options?: (item: CometChat.Conversation) => CometChatOptions[];
    hideSeparator?: boolean;
    searchPlaceholder?: string;
    backButtonIcon?: ImageType;
    showBackButton?: boolean;
    selectionMode?: SelectionMode;
    onSelection?: (items: Array<CometChat.Conversation>) => void;
    selectedConversations?: () => Array<CometChat.Conversation>;
    searchBoxIcon?: ImageType;
    hideSearch?: boolean;
    EmptyStateView?: () => JSX.Element;
    ErrorStateView?: () => JSX.Element;
    LoadingStateView?: () => JSX.Element;
    conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
    SubtitleView?: (item: CometChat.Conversation) => JSX.Element;
    onItemPress?: (item: CometChat.Conversation) => void;
    onItemLongPress?: (item: CometChat.Conversation) => void;
    onError?: (e: CometChat.CometChatException) => void;
    onBack?: () => void;
    statusIndicatorStyle?: StatusIndicatorStyleInterface;
    avatarStyle?: AvatarStyleInterface;
    receiptStyle?: any;
    dateStyle?: DateStyleInterface;
    conversationsStyle?: ConversationsStyleInterface;
    listItemStyle?: ListItemStyleInterface;
    badgeStyle?: BadgeStyleInterface;

    constructor({
        disableUsersPresence = false,
        disableReceipt = false,
        disableTyping = false,
        disableSoundForMessages = false,
        customSoundForMessages = undefined,
        protectedGroupIcon = undefined,
        privateGroupIcon = undefined,
        readIcon = undefined,
        deliveredIcon = undefined,
        sentIcon = undefined,
        datePattern = undefined,
        ListItemView = undefined,
        AppBarOption = undefined,
        options = undefined,
        hideSeparator = true,
        searchPlaceholder = localize("SEARCH"),
        backButtonIcon = undefined,
        showBackButton = false,
        selectionMode = "none",
        onSelection = undefined,
        selectedConversations = undefined,
        searchBoxIcon = undefined,
        hideSearch = true,
        EmptyStateView = undefined,
        ErrorStateView = undefined,
        LoadingStateView = undefined,
        conversationsRequestBuilder = undefined,
        SubtitleView = undefined,
        onItemPress = undefined,
        onItemLongPress = undefined,
        onError = undefined,
        onBack = undefined,
        statusIndicatorStyle = undefined,
        avatarStyle = undefined,
        receiptStyle = {},
        dateStyle = undefined,
        conversationsStyle = undefined,
        listItemStyle = undefined,
        badgeStyle = undefined,
    }: ConversationsConfigurationInterface) {
        this.disableUsersPresence = disableUsersPresence;
        this.disableReceipt = disableReceipt;
        this.disableTyping = disableTyping;
        this.disableSoundForMessages = disableSoundForMessages;
        this.customSoundForMessages = customSoundForMessages;
        this.protectedGroupIcon = protectedGroupIcon;
        this.privateGroupIcon = privateGroupIcon;
        this.readIcon = readIcon;
        this.deliveredIcon = deliveredIcon;
        this.sentIcon = sentIcon;
        this.datePattern = datePattern;
        this.ListItemView = ListItemView;
        this.AppBarOption = AppBarOption;
        this.options = options;
        this.hideSeparator = hideSeparator;
        this.searchPlaceholder = searchPlaceholder;
        this.backButtonIcon = backButtonIcon;
        this.showBackButton = showBackButton;
        this.selectionMode = selectionMode;
        this.onSelection = onSelection;
        this.selectedConversations = selectedConversations;
        this.searchBoxIcon = searchBoxIcon;
        this.hideSearch = hideSearch;
        this.EmptyStateView = EmptyStateView;
        this.ErrorStateView = ErrorStateView;
        this.LoadingStateView = LoadingStateView;
        this.conversationsRequestBuilder = conversationsRequestBuilder;
        this.SubtitleView = SubtitleView;
        this.onItemPress = onItemPress;
        this.onItemLongPress = onItemLongPress;
        this.onError = onError;
        this.onBack = onBack;
        this.statusIndicatorStyle = statusIndicatorStyle
        this.avatarStyle = avatarStyle
        this.receiptStyle = receiptStyle
        this.dateStyle = dateStyle
        this.conversationsStyle = conversationsStyle
        this.listItemStyle = listItemStyle
        this.badgeStyle = badgeStyle
    }
}