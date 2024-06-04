import { View } from 'react-native'
import React, { useContext } from 'react'
import { AppStyle } from '../../AppStyle';
import { AddUser, BanUser, Component1, Component2, Component3, Details, JoinGroup, Members, Transfer,  } from '../../resources';
import ModuleFeatures from '../common/ModuleFeatures';
import { AppTopBar } from '../common/AppTopBar';
import { CometChatContext } from "@cometchat/chat-uikit-react-native";

const GroupModules = [
    {
        id: "GroupsWithMessages",
        name: "Groups With Messages",
        info: "CometChatGroupsWithMessages is an independent component used to set up a screen that shows the list of groups available in your app and gives you the ability to search for a specific group and to start a conversation.",
        image: Component1,
    },
    {
        id: "Groups",
        name: "Groups",
        info: "CometChatGroups is an independent component used to set up a screen that displays the list of groups available in your app and gives you the ability to search for a specific group.",
        image: Component2,
    },
    {
        id: "CreateGroup",
        name: "Create Group",
        info: "The component is used to create a new group. Groups can be of three types public, private or 'password protected'. To learn more about this component tap here.",
        image: Component3
    },
    {
        id: "JoinGroup",
        name: "Join Protected Group",
        info: "This component is used to join a password protected group. To learn more about this component tap here.",
        image: JoinGroup
    },
    {
        id: "GroupMember",
        name: "Group Members",
        info: "This component is used to view members in a group. To learn more about this component tap here.",
        image: Members
    },
    {
        id: "AddMember",
        name: "Add Members",
        info: "This component is used to view members in a group. To learn more about this component tap here.",
        image: AddUser
    },
    {
        id: "TransferOwnership",
        name: "Transfer Ownership",
        info: "This component is used to transfer ownership of a group from one user to another. To learn more about this component tap here.",
        image: Transfer
    },
    {
        id: "BannedMembers",
        name: "Banned Members",
        info: "This component is used to display banned members of a group. To learn more about this component tap here.",
        image: BanUser
    },
    {
        id: "GroupDetails",
        name: "Details",
        info: "This component is used to display banned members of a group. To learn more about this component tap here.",
        image: Details
    }
];

export const GroupModuleList = ({ navigation }) => {

    const{theme} = useContext(CometChatContext);

    return (
        <View style={[AppStyle.container, {backgroundColor: theme.palette.getBackgroundColor()}]}>
            <AppTopBar navigation={navigation} title={"Groups"} />
            <ModuleFeatures navigation={navigation} features={GroupModules} />
        </View>
    )
}
