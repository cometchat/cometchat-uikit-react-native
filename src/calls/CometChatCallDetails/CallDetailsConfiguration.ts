import { AvatarStyleInterface, CometChatDetailsTemplate, ImageType, ListItemStyleInterface } from "../../shared"
import { AvatarConfigurationInterface } from "../../shared/views/CometChatAvatar/AvatarConfiguration"
import { StatusIndicatorStyleInterface } from "../../shared/views/CometChatStatusIndicator/StatusIndicatorStyle"
// import { CometChatCallDetailsInterface } from "./CometChatCallDetails"
import { CometChat } from '@cometchat/chat-sdk-react-native'
import { CallDetailsStyleInterface } from "./CallDetailsStyle"

export interface CallDetailsConfigurationInterface {
    showCloseButton?: boolean
    closeButtonIconImage?: ImageType
    hideProfile?: boolean
    SubtitleView?: (props: { user?: CometChat.User, group?: CometChat.Group }) => JSX.Element
    CustomProfileView?: (props: { user?: CometChat.User }) => JSX.Element
    data?: (props: { message: CometChat.BaseMessage, user?: CometChat.User, group?: CometChat.Group }) => CometChatDetailsTemplate[]
    disableUsersPresence?: boolean
    onError?: (e: CometChat.CometChatException) => void
    onBack?: () => void
    avatarStyle?: AvatarStyleInterface
    statusIndicatorStyle?: StatusIndicatorStyleInterface
    listItemStyle?: ListItemStyleInterface
    callDetailsStyle?: CallDetailsStyleInterface
}

export class CallDetailsConfiguration implements CallDetailsConfigurationInterface {
    showCloseButton?: boolean
    closeButtonIconImage?: ImageType
    hideProfile: boolean
    SubtitleView: (props: { user?: CometChat.User; group?: CometChat.Group }) => JSX.Element
    CustomProfileView: (props: { user?: CometChat.User }) => JSX.Element
    data: (props: { message: CometChat.BaseMessage; user?: CometChat.User; group?: CometChat.Group }) => CometChatDetailsTemplate[]
    disableUsersPresence: boolean
    onError: (e: CometChat.CometChatException) => void
    onBack: () => void
    avatarStyle: AvatarStyleInterface
    statusIndicatorStyle: StatusIndicatorStyleInterface
    listItemStyle: ListItemStyleInterface
    callDetailsStyle: CallDetailsStyleInterface

    constructor({
        showCloseButton,
        closeButtonIconImage,
        hideProfile,
        SubtitleView,
        CustomProfileView,
        data,
        disableUsersPresence,
        onError,
        onBack,
        avatarStyle,
        statusIndicatorStyle,
        listItemStyle,
        callDetailsStyle,
    }: CallDetailsConfigurationInterface) {
        this.showCloseButton = showCloseButton;
        this.closeButtonIconImage = closeButtonIconImage;
        this.hideProfile = hideProfile;
        this.SubtitleView = SubtitleView;
        this.CustomProfileView = CustomProfileView;
        this.data = data;
        this.disableUsersPresence = disableUsersPresence;
        this.onError = onError;
        this.onBack = onBack;
        this.avatarStyle = avatarStyle;
        this.statusIndicatorStyle = statusIndicatorStyle;
        this.listItemStyle = listItemStyle;
        this.callDetailsStyle = callDetailsStyle;
    }
}