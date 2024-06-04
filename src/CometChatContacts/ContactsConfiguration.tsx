import { CometChat } from "@cometchat/chat-sdk-react-native";
import { GroupsConfigurationInterface } from "../CometChatGroups";
import { UsersConfigurationInterface } from "../CometChatUsers";
import { ImageType } from "../shared/base";
import { ContactsStyleInterface } from "./ContactsStyle";

export interface ContactsConfigurationInterface {
    /**
    * users configuration
    */
    usersConfiguration?: UsersConfigurationInterface,
    /**
     * group configuration
     */
    groupsConfiguration?: GroupsConfigurationInterface,
    /**
     * icon for back image
     */
    backIcon?: ImageType,
    /**
     * style for the component
     */
    contactsStyle?: ContactsStyleInterface,
    /**
     * function will be called when pressed on back icon
     */
    onClose?: () => void,
    /**
     * selection mode can be 'single' | 'multiple'
     */
    selectionMode?: 'single' | 'multiple',
    /**
     * image for submit
     */
    submitIcon?: ImageType,
    /**
     * title for component
     */
    title?: string,
    /**
     * users tab title
     */
    userTabTitle?: string,
    /**
     * groups tab title
     */
    groupTabTitle?: string,
    /**
     * function will be called when submit icon is pressed.
     */
    onSubmitIconClick?: (props: { users: Array<CometChat.User>, groups: Array<CometChat.Group> }) => void,
    /**
     * function will be called when item is pressed.
     */
    onItemPress?: (param: { user?: CometChat.User, group?: CometChat.Group }) => void,
    /**
     * desides which tab should be shown 
     */
    tabVisibility?:  'user' | 'groups' | 'usersAndGroup',
    /**
     * maximum limit for item selection
     */
    selectionLimit?: number,
    /**
     * toggle submit
     */
    hideSubmit?: boolean,
}