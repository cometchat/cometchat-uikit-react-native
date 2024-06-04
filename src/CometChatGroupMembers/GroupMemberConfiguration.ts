import { ImageType } from "../shared";
import { CometChatOptions } from "../shared/modals/CometChatOptions";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";

export interface GroupMemberConfigurationInterface {
    SubtitleView?: (groupMember: CometChat.GroupMember) => JSX.Element,
    disableUserPresence?: boolean,
    ListItemView?: (groupMember: CometChat.GroupMember) => JSX.Element,
    AppBarOptions?: () => JSX.Element,
    options?: (groupMember: CometChat.GroupMember) => CometChatOptions[],
    hideSeperator?: boolean,
    searchPlaceHolder?: string,
    backButtonIcon?: ImageType,
    showBackButton?: boolean,
    selectionMode?: "none" | "single" | "multiple",
    onSelection?: (groupMembers: Array<CometChat.GroupMember>) => void,
    searchBoxIcon?: ImageType,
    hideSearch?: boolean,
    title?: string,
    EmptyStateView?: () => JSX.Element,
    ErrorStateView?: () => JSX.Element,
    LoadingStateView?: () => JSX.Element,
    emptyStateText?: string,
    errorStateText?: string,
    groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder,
    searchRequestBuilder?: CometChat.GroupMembersRequestBuilder,
    onItemPressed?: (groupMember: CometChat.GroupMember) => void,
    onItemLongPressed?: (groupMember: CometChat.GroupMember) => void,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    hideError?: boolean,
    TailView?: (groupMember: CometChat.GroupMember) => JSX.Element
}

export class GroupMemberConfiguration implements GroupMemberConfigurationInterface {
    SubtitleView?: (groupMember: CometChat.GroupMember) => JSX.Element;
    disableUserPresence?: boolean;
    ListItemView?: (groupMember: CometChat.GroupMember) => JSX.Element;
    AppBarOptions?: () => JSX.Element;
    options?: (groupMember: CometChat.GroupMember) => CometChatOptions[];
    hideSeperator?: boolean;
    searchPlaceHolder?: string;
    backButtonIcon?: ImageType;
    showBackButton?: boolean;
    selectionMode?: "none" | "single" | "multiple";
    onSelection?: (groupMembers: Array<CometChat.GroupMember>) => void;
    searchBoxIcon?: ImageType;
    hideSearch?: boolean;
    title?: string;
    EmptyStateView?: () => JSX.Element;
    ErrorStateView?: () => JSX.Element;
    LoadingStateView?: () => JSX.Element;
    emptyStateText?: string;
    errorStateText?: string;
    groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    onItemPressed?: (groupMember: CometChat.GroupMember) => void;
    onItemLongPressed?: (groupMember: CometChat.GroupMember) => void;
    onError?: (e: CometChat.CometChatException) => void;
    onBack?: () => void;
    hideError?: boolean;
    TailView?: (groupMember: CometChat.GroupMember) => JSX.Element;

    constructor(params: GroupMemberConfigurationInterface) {
        this.SubtitleView = params.SubtitleView;
        this.disableUserPresence = params.disableUserPresence;
        this.ListItemView = params.ListItemView;
        this.AppBarOptions = params.AppBarOptions;
        this.options = params.options;
        this.hideSeperator = params.hideSeperator;
        this.searchPlaceHolder = params.searchPlaceHolder;
        this.backButtonIcon = params.backButtonIcon;
        this.showBackButton = params.showBackButton;
        this.selectionMode = params.selectionMode;
        this.onSelection = params.onSelection;
        this.searchBoxIcon = params.searchBoxIcon;
        this.hideSearch = params.hideSearch;
        this.title = params.title;
        this.EmptyStateView = params.EmptyStateView;
        this.ErrorStateView = params.ErrorStateView;
        this.LoadingStateView = params.LoadingStateView;
        this.emptyStateText = params.emptyStateText;
        this.errorStateText = params.errorStateText;
        this.groupMemberRequestBuilder = params.groupMemberRequestBuilder;
        this.searchRequestBuilder = params.searchRequestBuilder;
        this.onItemPressed = params.onItemPressed;
        this.onItemLongPressed = params.onItemLongPressed;
        this.onError = params.onError;
        this.onBack = params.onBack;
        this.hideError = params.hideError;
        this.TailView = params.TailView;
    }
}