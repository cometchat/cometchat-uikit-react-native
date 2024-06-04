import React from "react";
import { View, Text, Alert, TouchableOpacity, Image, Modal } from "react-native";
import { kickIcon, banIcon, downArrowIcon, rightTickIcon } from "./resources";
import { CometChatOptions } from "../shared/modals/CometChatOptions";
import { AvatarStyle, AvatarStyleInterface, CometChatContext, ListItemStyle, ListItemStyleInterface, StatusIndicatorStyle } from "../shared";
import { GroupMembersStyle, GroupMembersStyleInterface } from "./GroupMemberStyle";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatListItem } from "../shared";
import { CometChatList, CometChatListProps } from "../shared";
import { BorderStyle, FontStyle } from "../shared";
import { getDefaultGroupMemberOptions, validateGroupMemberOptions } from "../shared/utils/DetailsUtils/DetailsUtils";
import { GroupMemberOptionBan, GroupMemberOptionConstants, GroupMemberOptionKick, MessageTypeConstants, ON_GROUP_MEMBER_KICKED } from "../shared/constants/UIKitConstants";
import { localize } from "../shared";
import { Style } from "./style";
import { GroupScopeStyle, GroupScopeStyleInterface } from "./GroupScopeStyle";
import { CometChatGroupsEvents } from "../shared/events";
import { getUnixTimestamp } from "../shared/utils/CometChatMessageHelper";
import { CometChatContextType } from "../shared/base/Types";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { StatusIndicatorStyleInterface } from "../shared/views/CometChatStatusIndicator/StatusIndicatorStyle";

// Note: Omit all the unwanted props
export interface CometChatGroupsMembersInterface extends
    Omit<CometChatListProps,
        "requestBuilder" |
        "listItemKey" |
        "statusIndicatorStyle" |
        "avatarStyle" |
        "listItemStyle" |
        "ListItemView" |
        "searchRequestBuilder" |
        "onSelection"
    > {
    /**
     * Custom view for subtitle
     * @param item object of CometChat.GroupMember
     * @returns JSX.Element
     */
    SubtitleView?: (item: CometChat.GroupMember) => JSX.Element;
    /**
     * Custom tail view
     * @param item object of CometChat.GroupMember
     * @returns JSX.Element
     */
    TailView?: (item: CometChat.GroupMember) => JSX.Element;
    /**
     * Custom view for empty state
     * @returns JSX.Element
     */
    EmptyStateView?: () => JSX.Element;
    /**
     * Custom view for error state
     * @returns JSX.Element
     */
    ErrorStateView?: () => JSX.Element;
    /**
     * Custom view for loading state
     * @returns JSX.Element
     */
    LoadingStateView?: () => JSX.Element;
    /**
     * callback for press on ListItem
     * @param groupMember object of CometChat.GroupMember
     * @returns void
     */
    onItemPress?: (groupMember: CometChat.GroupMember) => void;
    /**
     * callback for long press on ListItem
     * @param groupMember object of CometChat.GroupMember
     * @returns void
     */
    onItemLongPress?: (groupMember: CometChat.GroupMember) => void;
    /**
     * callback for on selection of groupmembers.
     * @param list array of selected GroupMembers
     * @returns void
     */
    onSelection?: (list: CometChat.GroupMember[]) => void,
    /**
     * pass search request builder object 
     */
    searchRequestBuilder?: CometChat.GroupMembersRequestBuilder,
    /**
     * pass group member request builder object
     */
    groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder,
    /**
     * pass CometChat SDK's group object
     */
    group: CometChat.Group,
    /**
     * style for group member
     */
    groupMemberStyle?: GroupMembersStyleInterface,
    /**
     * style for list item
     */
    listItemStyle?: ListItemStyleInterface,
    /**
     * style for avatar
     */
    avatarStyle?: AvatarStyleInterface,
    /**
     * style for status indicator
     */
    statusIndicatorStyle?: StatusIndicatorStyleInterface,
    /**
     * style for group scope change dialog
     */
    groupScopeStyle?: GroupScopeStyleInterface,
    /**
     * custom ListItem view
     */
    ListItemView?: (item: CometChat.GroupMember) => JSX.Element,
    /**
     * callback for GroupMembers options
     */
    options?: (item: CometChat.GroupMember) => CometChatOptions[]
}

const groupListenerId = "grouplist_" + new Date().getTime();

export const CometChatGroupsMembers = (props: CometChatGroupsMembersInterface) => {

    const {
        SubtitleView,
        ListItemView,
        AppBarOptions,
        options,
        hideSeparator,
        searchPlaceholderText,
        backButtonIcon,
        showBackButton,
        selectionMode = "multiple",
        onSelection,
        searchBoxIcon,
        hideSearch,
        title = localize("MEMBERS"),
        EmptyStateView,
        emptyStateText,
        ErrorStateView,
        errorStateText,
        LoadingStateView,
        groupMemberRequestBuilder,
        searchRequestBuilder,
        group,
        hideError,
        onItemPress,
        onItemLongPress,
        onError,
        onBack,
        groupMemberStyle,
        listItemStyle,
        avatarStyle,
        statusIndicatorStyle,
        groupScopeStyle,
        TailView,
        selectionIcon
    } = props;

    const { theme } = React.useContext<CometChatContextType>(CometChatContext);

    const _groupMemberStyle = new GroupMembersStyle({
        backgroundColor: theme?.palette.getBackgroundColor(),
        backIconTint: theme?.palette.getPrimary(),
        emptyTextColor: theme?.palette.getAccent400(),
        emptyTextFont: theme?.typography.caption2,
        errorTextColor: theme?.palette.getError(),
        errorTextFont: theme?.typography.subtitle1,
        searchBackgroundColor: theme?.palette.getAccent600(),
        searchIconTint: theme?.palette.getAccent600(),
        searchTextColor: theme?.palette.getAccent(),
        searchTextFont: theme?.typography.caption1,
        separatorColor: theme?.palette.getAccent100(),
        titleColor: theme?.palette.getAccent(),
        titleFont: theme?.typography.title1,
        onlineStatusColor: theme?.palette.getSuccess(),
        ...groupMemberStyle
    });
    const _avatarStyle = new AvatarStyle({
        backgroundColor: theme?.palette.getSecondary(),
        nameTextColor: theme?.palette.getAccent(),
        nameTextFont: theme?.typography.title1,
        ...avatarStyle
    });
    const _statusIndicatorStyle = new StatusIndicatorStyle(statusIndicatorStyle || {});
    const _listItemStyle = new ListItemStyle({
        backgroundColor: theme?.palette?.getBackgroundColor(),
        titleColor: theme?.palette.getAccent(),
        titleFont: theme?.typography.name,
        ...listItemStyle
    });
    const _groupScopeStyle = new GroupScopeStyle({
        backgroundColor: theme?.palette.getBackgroundColor(),
        arrowIconTint: theme?.palette.getPrimary(),
        optionTextColor: theme?.palette.getAccent(),
        selectedOptionBackgroundColor: theme?.palette.getAccent400(),
        optionTextFont: theme?.typography.text1,
        selectedOptionTextColor: theme?.palette.getAccent(),
        selectedOptionTextFont: theme?.typography.text1,
        ...groupScopeStyle
    });

    const groupMemberListenerId = 'groupMemberList_' + new Date().getTime();
    const groupRef = React.useRef(null);
    const itemRef = React.useRef(null);
    const loggedInUser = React.useRef(null);

    const [selecting, setSelecting] = React.useState(selectionMode ? true : false);
    const [selectedMembers, setSelectedMembers] = React.useState([]);

    const swipeOptions = (member, onKick, onBan): CometChatOptions[] => {
        let arr: CometChatOptions[] = getDefaultGroupMemberOptions(group, member, theme);
        return arr.map(option => {
            if (option.id == GroupMemberOptionConstants.kick)
                option.onPress = onKick;
            if (option.id == GroupMemberOptionConstants.ban)
                option.onPress = onBan;
            return option;
        });
    }

    const removeMemerFromSelectionList = (id) => {
        if (selecting) {
            let index = selectedMembers.find(member => member['uid'] == id);
            if (index > -1) {
                let tmpSelectedMembers = [...selectedMembers];
                tmpSelectedMembers.splice(index, 1);
                setSelectedMembers(tmpSelectedMembers);
            }
}
    }

    const banUser = (user) => {
        //logic to ban user
        CometChat.banGroupMember(group['guid'], user.uid)
            .then((response) => {
                groupRef.current && groupRef.current.removeItemFromList(user.uid);
                removeMemerFromSelectionList(user['uid']);
                let action: CometChat.Action = new CometChat.Action(group['guid'], MessageTypeConstants.groupMember, CometChat.RECEIVER_TYPE.GROUP, CometChat.CATEGORY_ACTION as CometChat.MessageCategory);
                action.setActionBy(loggedInUser.current);
                action.setActionOn(user);
                action.setActionFor(group);
                action.setMessage(`${loggedInUser.current.name} banned ${user.name}`);
                action.setSentAt(getUnixTimestamp());
                action.setMuid(String(getUnixTimestamp()));
                action.setSender(loggedInUser.current);
                action.setReceiver(group);

                //reducing members count by one
                group.setMembersCount(group.getMembersCount() - 1);

                CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupMemberBanned, { message: action, kickedUser: user, kickedBy: loggedInUser.current, kickedFrom: group });
            })
            .catch((err) => {
                console.log("ban user", err);
                onError(err);
            })
    }

    const kickUser = (id, user) => {
        //logic to kick user
        CometChat.kickGroupMember(group['guid'], id)
            .then((response) => {
                groupRef.current && groupRef.current.removeItemFromList(id);
                removeMemerFromSelectionList(id);
                //reducing members count by one
                group.setMembersCount(group.getMembersCount() - 1);

                let action: CometChat.Action = new CometChat.Action(group['guid'], MessageTypeConstants.groupActions, CometChat.RECEIVER_TYPE.GROUP, CometChat.CATEGORY_ACTION as CometChat.MessageCategory);
                action.setActionBy(loggedInUser.current);
                action.setActionOn(user);
                action.setActionFor(group);
                action.setMessage(`${loggedInUser.current.name} kicked ${user.name}`);
                action.setSentAt(getUnixTimestamp());
                action.setMuid(String(getUnixTimestamp()));
                action.setSender(loggedInUser.current);
                action.setReceiver(group);

                CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupMemberKicked, { message: action, kickedUser: user, kickedBy: loggedInUser.current, kickedFrom: group });
            })
            .catch((err) => {
                console.log("kick user", err);
                onError(err);
            })
    }

    const itemPress = (item) => {
        if (!selecting) return;

        if (selectionMode == "single")
            setSelectedMembers([item]);

        if (selectionMode == "multiple")
            setSelectedMembers([...selectedMembers, item]);
    }

    const itemLongPress = (item) => {
        if (!selecting) setSelecting(true);

        if (selectionMode == "single") {
            if (selectedMembers.length > 0 && selectedMembers[0].uid == item.uid)
                setSelectedMembers([]);
            else
                setSelectedMembers([item]);
            return;
        }

        const index: number = selectedMembers.findIndex((value) => value.uid == item.uid)
        if (index >= 0) {
            let tmp = [...selectedMembers]
            tmp.splice(index, 1);
            setSelectedMembers([...tmp]);
        } else {
            setSelectedMembers([...selectedMembers, group]);
        }
        return;
    }

    const ItemView = ({ item: member, ...props }) => {
        if (ListItemView)
            return <ListItemView {...member} />

        let image, backgroundColor
        if (selecting) {
            let index: number = selectedMembers.findIndex((value) => value.uid == member.uid);
            if (index >= 0) {
                image = rightTickIcon;
                backgroundColor = theme?.palette.getBackgroundColor();
            }
        }

        //Note: Check props which are need here
        return <CometChatListItem
            id={member.uid}
            onPress={itemPress.bind(this, member)}
            onLongPress={itemLongPress.bind(this, member)}
            SubtitleView={SubtitleView ? () => <SubtitleView {...member} /> : null}  //Note: should return prop to SubtitleView
            statusIndicatorIcon={image}
            statusIndicatorColor={backgroundColor}
            title={member.uid == loggedInUser.current.uid ? "You" : member.name}
            avatarName={member.name}
            avatarURL={member.avatar}
            listItemStyle={_listItemStyle}
            avatarStyle={_avatarStyle}
            statusIndicatorStyle={_statusIndicatorStyle}
            TailView={TailView ? () => <TailView {...member} /> : ScopeChangeUI.bind(this, member, groupScopeStyle)}  //Note: should return prop to TailView
            options={() => (options && options(member)) || swipeOptions(member, (id) => kickUser(id, member), () => banUser(member))}  //Note: should have options 
        />
    }

    const ScopeChangeUI = (member, style) => {

        const [showChangeScope, setShowChangeScope] = React.useState(false);

        const {
            height = "100%",
            width = "100%",
            backgroundColor = _groupMemberStyle.backgroundColor,
            border = new BorderStyle({}),
            borderRadius = 4,
            titleTextFont = new FontStyle({ fontSize: 14 }),
        } = style || {};

        const onOptionSelection = (newScope) => {
            if (member['scope'] == group['scope'] && group['owner'] == member['uid']) {
                Alert.alert("you can not remove yourself from admin as Transfer Ownership is not yet done.");
                return;
            }
            CometChat.updateGroupMemberScope(group['guid'], member.uid, newScope)
                .then((res) => {
                    let updatedMember = { ...member, scope: newScope };
                    groupRef.current?.updateList(updatedMember);
                    setShowChangeScope(false);
                    let action: CometChat.Action = new CometChat.Action(group['guid'], "groupMember", CometChat.RECEIVER_TYPE.GROUP, CometChat.CATEGORY_ACTION as CometChat.MessageCategory);
                    action.setActionBy(loggedInUser.current);
                    action.setActionOn(member);
                    action.setActionFor(group);
                    action.setMessage(`${loggedInUser.current.name} made ${member.name} ${newScope}`);
                    action.setSentAt(getUnixTimestamp());
                    action.setMuid(String(getUnixTimestamp()));
                    action.setSender(loggedInUser.current);
                    action.setReceiver(group);
                    CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupMemberScopeChanged, { action, updatedUser: updatedMember, scopeChangedTo: newScope, scopeChangedFrom: member.scope, group });
                })
                .catch(err => {
                    console.log("Error:", err);
                    setShowChangeScope(false);
                    onError && onError(err);
                });
        }

        const OptionButton = ({ title, isCurrent }) => {
            return <TouchableOpacity
                style={{
                    flexDirection: "row", justifyContent: "center",
                    width: "100%",
                    backgroundColor: _groupScopeStyle.optionBackgroundColor,
                    borderRadius: _groupScopeStyle.optionBorderRadius,
                    ..._groupScopeStyle.optionBorder
                }}
                activeOpacity={1}
                onPress={onOptionSelection.bind(this, title)}>
                <Text style={[
                    Style.optionTextStyle,
                    {
                        ...isCurrent && _groupScopeStyle.selectedOptionTextFont || _groupScopeStyle.optionTextFont,
                        color: isCurrent && _groupScopeStyle.selectedOptionTextColor || _groupScopeStyle.optionTextColor,
                        backgroundColor: isCurrent && _groupScopeStyle.selectedOptionBackgroundColor || _groupScopeStyle.backgroundColor || "transparent",
                        borderRadius: isCurrent && _groupScopeStyle.selectedOptionBorderRadius || _groupScopeStyle.optionBorderRadius,
                    }
                ]}>{title}</Text>
            </TouchableOpacity>
        }

        let changeScopeOptions = validateGroupMemberOptions(group['scope'], member['scope'], GroupMemberOptionConstants.changeScope);

        const ChangeScopeDialog = () => {
            return <Modal transparent>
                <TouchableOpacity
                    activeOpacity={1}
                    style={[Style.changeDialogContainer, { backgroundColor: theme.palette.getAccent200() }]}
                    onPress={() => setShowChangeScope(false)}
                >
                    <View style={[
                        Style.changeDialogView,
                        { backgroundColor: _groupScopeStyle.backgroundColor }
                    ]}>
                        <Text style={[Style.changeDialogTitle, { color: _groupScopeStyle.optionTextColor }]}>{localize("CHANGE_SCOPE")}</Text>
                        <View style={{
                            width: _groupScopeStyle.width,
                            backgroundColor: _groupScopeStyle.backgroundColor,
                            borderRadius: _groupMemberStyle.borderRadius,
                            ..._groupScopeStyle.border,
                        }}>
                            {
                                changeScopeOptions.map(option => {
                                    return <OptionButton key={option} title={option} isCurrent={member['scope'] == option} />
                                })
                            }
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        }

        if (member['scope'] == group['scope'] && group['owner'] == member['uid']) {
            return <Text style={{ ...titleTextFont, color: _groupScopeStyle.optionTextColor }}>{localize("OWNER")}</Text>;
        }

        return <View
            style={{
                height,
                width,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: backgroundColor,
                ...border,
                borderRadius: borderRadius
            }}
        >

            {
                showChangeScope ?
                    <ChangeScopeDialog /> : null
            }
            <TouchableOpacity
                ref={itemRef}
                activeOpacity={1}
                onPress={() => setShowChangeScope(changeScopeOptions?.length > 0 ? !showChangeScope : false)}
            >
                <View style={{ flexDirection: "row" }}>
                    <Text style={{ ...titleTextFont, color: _groupScopeStyle.optionTextColor }}>{group['owner'] == member.uid ? "owner" : member.scope}</Text>
                    {
                        changeScopeOptions?.length > 0 ?
                            <Image style={{ height: 16, width: 16, tintColor: _groupScopeStyle.arrowIconTint }} source={downArrowIcon} /> :
                            null
                    }
                </View>
            </TouchableOpacity>
        </View>
    }

    const onSelectionClicked = () => {
        onSelection && onSelection(selectedMembers);
        setSelectedMembers([]);
        setSelecting(false);
    }

    /**
     *
     * Listener callback when a member is kicked from / has left the group
     */
    const handleGroupMemberRemoval = (...options) => {
        const groupMember = options[1];
        groupRef.current.removeItemFromList(groupMember.uid);
    };

    /**
     *
     * Listener callback when a member is banned from the group
     */
    const handleGroupMemberBan = (...options) => {
        const groupMember = options[1];
        groupRef.current.removeItemFromList(groupMember.uid);
    };

    /**
     *
     * Listener callback when a user joins/added to the group
     */
    const handleGroupMemberAddition = (...options) => {
        const groupMember = options[1];
        let newGroupMember = { ...groupMember, scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT }
        groupRef.current.addItemToList(newGroupMember);
    };

    /**
     *
     * Listener callback when a group member scope is updated
     */
    const handleGroupMemberScopeChange = (...options) => {
        const groupMember = options[1];
        let newScope = { ...groupMember, scope: options[2] };
        groupRef.current.updateList(newScope);
    };

    React.useEffect(() => {
        CometChat.getLoggedinUser()
            .then(u => loggedInUser.current = u)
            .catch(e => console.log(e));
        CometChat.addUserListener(
            groupMemberListenerId,
            new CometChat.UserListener({
                onUserOnline: (onlineUser: any) => {
                    /* when someuser/friend comes online, user will be received here */
                    groupRef.current.updateUser(onlineUser);
                },
                onUserOffline: (offlineUser: any) => {
                    /* when someuser/friend went offline, user will be received here */
                    groupRef.current.updateUser(offlineUser);
                },
            })
        );
        CometChat.addGroupListener(
            groupListenerId,
            new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                    handleGroupMemberScopeChange(
                        message,
                        changedUser,
                        newScope,
                        oldScope,
                        changedGroup
                    );
                },
                onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                    handleGroupMemberRemoval(
                        message,
                        kickedUser,
                        kickedBy,
                        kickedFrom
                    );
                },
                onGroupMemberLeft: (message, leavingUser, group) => {
                    handleGroupMemberRemoval(message, leavingUser, null, group);
                },
                onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                    handleGroupMemberBan(
                        message,
                        bannedUser,
                        bannedBy,
                        bannedFrom
                    );
                },
                onMemberAddedToGroup: (
                    message,
                    userAdded,
                    userAddedBy,
                    userAddedIn
                ) => {
                    handleGroupMemberAddition(
                        message,
                        userAdded,
                        userAddedBy,
                        userAddedIn
                    );
                },
                onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                    handleGroupMemberAddition(
                        message,
                        joinedUser,
                        null,
                        joinedGroup
                    );
                },
            })
        );
        return () => {
            CometChat.removeGroupListener(groupListenerId);
            CometChat.removeUserListener(groupMemberListenerId);
        }
    }, []);

    return <CometChatList
        ref={groupRef}
        listItemKey={"uid"}
        SubtitleView={SubtitleView}
        AppBarOptions={AppBarOptions}
        hideSeparator={hideSeparator || true}
        searchPlaceholderText={searchPlaceholderText}
        backButtonIcon={backButtonIcon}
        showBackButton={showBackButton || true}
        ListItemView={ItemView}
        selectionMode={selecting ? selectionMode : "none"}
        onSelection={onSelectionClicked}
        searchBoxIcon={searchBoxIcon}
        hideSearch={hideSearch}
        title={title || localize("MEMBERS")}
        EmptyStateView={EmptyStateView}
        emptyStateText={emptyStateText}
        ErrorStateView={ErrorStateView}
        errorStateText={errorStateText}
        LoadingStateView={LoadingStateView}
        searchRequestBuilder={searchRequestBuilder}
        requestBuilder={groupMemberRequestBuilder || new CometChat.GroupMembersRequestBuilder(group['guid']).setLimit(30)}
        hideError={hideError}
        onItemPress={onItemPress}
        onItemLongPress={onItemLongPress}
        onError={onError}
        onBack={onBack}
        listStyle={{ ..._groupMemberStyle, background: _groupMemberStyle.backgroundColor }}
        listItemStyle={listItemStyle}
        avatarStyle={avatarStyle}
        statusIndicatorStyle={statusIndicatorStyle}
        selectionIcon={selectionIcon}
    />
}
