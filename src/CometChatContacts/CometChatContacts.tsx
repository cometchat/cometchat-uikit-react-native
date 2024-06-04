import { Image, TouchableOpacity, View } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { CometChatUsers, UsersConfigurationInterface } from '../CometChatUsers'
import { CometChatGroups, GroupsConfigurationInterface } from '../CometChatGroups'
import { CometChat } from '@cometchat/chat-sdk-react-native'
import { ImageType } from '../shared/helper/types'
import { ContactsStyleInterface } from './ContactsStyle'
import { Header } from './Header'
import { CometChatContext, localize } from '../shared'
import { ICONS } from '../shared/assets/images'
import { CometChatTabs } from '../CometChatTabs'

export interface CometChatContactsInterface {
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
     * users configuration
     */
    usersConfiguration?: UsersConfigurationInterface,
    /**
     * group configuration
     */
    groupsConfiguration?: GroupsConfigurationInterface,
    /**
     * function will be called when submit icon is pressed.
     */
    onSubmitIconClick?: (props: { users: Array<CometChat.User>, groups: Array<CometChat.Group> }) => void,
    /**
     * icon for back image
     */
    backIcon?: ImageType,
    /**
     * function will be called when item is pressed.
     */
    onItemPress?: (param: { user?: CometChat.User, group?: CometChat.Group }) => void,
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
     * desides which tab should be shown 
     */
    tabVisibility?:  'user' | 'groups' | 'usersAndGroup',
    /**
     * image for submit
     */
    submitIcon?: ImageType,
    /**
     * maximum limit for item selection
     */
    selectionLimit?: number,
    /**
     * toggle submit
     */
    hideSubmit?: boolean,
}

export const CometChatContacts = (props: CometChatContactsInterface) => {
    const {
        title = localize('NEW_CONVERSATION'),
        backIcon = ICONS.BACK,
        userTabTitle = localize('USERS'),
        groupTabTitle = localize('GROUPS'),
        usersConfiguration,
        groupsConfiguration,
        onItemPress,
        onClose,
        contactsStyle = {},
        onSubmitIconClick,
        hideSubmit,
        selectionLimit,
        selectionMode = "none",
        submitIcon,
        tabVisibility = 'usersAndGroup'
    } = props;

    const { theme } = useContext(CometChatContext);
    const [tabs, setTabs] = useState([])

    const userList = useRef(null);
    const groupList = useRef(null);

    const {
        titleTextFont = theme.typography.heading,
        titleTextColor = theme.palette.getAccent(),
        tabBorder,
        tabHeight = 36,
        tabWidth,
        tabBorderRadius = 18,
        activeTabBackgroundColor = theme.palette.getPrimary(),
        activeTabBorder,
        activeTabTitleTextColor = theme.palette.getSecondary(),
        backgroundColor = theme.palette.getBackgroundColor(),
        border,
        borderRadius = 18,
        backIconTint = theme.palette.getPrimary(),
        height,
        selectionIconTint = theme.palette.getPrimary(),
        tabBackgroundColor = theme.palette.getAccent200(),
        tabTitleTextColor = theme.palette.getAccent(),
        tabTitleTextFont = theme.typography.text1,
        width,
    } = contactsStyle;

    const submitSelection = () => {
        let selectedUsers = userList.current?.getSelectedItems();
        let selectedGroups = groupList.current?.getSelectedItems();

        onSubmitIconClick && onSubmitIconClick({
            users: selectedUsers,
            groups: selectedGroups
        })
    }

    const MakeSelection = () => {
        if (hideSubmit) return null;

        return <TouchableOpacity onPress={submitSelection}>
            <Image source={ICONS.CHECK_MARK} />
        </TouchableOpacity>
    }

    useEffect(() => {
        let tabOptions = [];
        let userTab = {
            id: "user",
            isActive: true,
            title: userTabTitle,
            childView: () => {
                return <CometChatUsers
                    ref={userList}
                    selectionMode={selectionMode}
                    onItemPress={(user) => {
                        onItemPress && onItemPress({user});
                    }}
                    title=''
                    hideSubmitIcon={true}
                    {...usersConfiguration}
                />
            }
        };
        let groupTab = {
            id: "group",
            isActive: false,
            title: groupTabTitle,
            childView: () => {
                return <CometChatGroups
                ref={groupList}
                selectionMode={selectionMode}
                // groupRequestBuilder={new CometChat.GroupsRequestBuilder().}
                onItemPress={(group) => {
                    onItemPress && onItemPress({group});
                }}
                title=''
                hideSubmitIcon={true}
                {...groupsConfiguration}
                />
            }
        }
        switch (tabVisibility) {
            case 'groups':
                tabOptions.push(groupTab)
                break;
            case 'user':
                tabOptions.push(userTab);
                break;
            default:
                tabOptions.push(userTab, groupTab);
        }
        setTabs(tabOptions);
    },[]);

    return (
        <View style={[{ flex: 1 }, border, [height, width, backgroundColor, borderRadius]]}>
            <Header
                AppBarOptions={MakeSelection}
                showBackButton={true}
                title={title}
                hideSearch={true}
                onBack={onClose}
                backButtonIcon={backIcon}
                backIconTint={backIconTint}
                titleColor={titleTextColor}
                titleFontStyle={titleTextFont}
                selectionIcon={submitIcon}
                selectionIconTint={selectionIconTint}
            />
            <CometChatTabs
                tabAlignment='top'
                keepAlive={true}
                tabs={tabs}
                style={{
                    height: tabHeight,
                    width: tabWidth,
                    backgroundColor: tabBackgroundColor,
                    border: tabBorder,
                    borderRadius: tabBorderRadius,
                    tabTitleTextFont,
                    activeTabBackgroundColor: activeTabBackgroundColor,
                    activeTabTitleTextColor: activeTabTitleTextColor,
                    tabTitleTextColor: tabTitleTextColor,
                    activeTabBorder: activeTabBorder,
                    tabBackgroundColor: tabBackgroundColor
                }}
            />
        </View>
    )
}
