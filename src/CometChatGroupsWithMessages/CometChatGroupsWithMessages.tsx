import React, { useState, useRef, useEffect, useContext } from "react";
import { View, Image, TouchableOpacity, BackHandler } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatGroups, GroupsConfiguration, GroupsConfigurationInterface } from "../CometChatGroups";
import { MessagesConfiguration, MessagesConfigurationInterface } from "../CometChatMessages/MessagesConfiguration";
import { CometChatMessages } from "../CometChatMessages";
import { Style } from "./styles";
import { createIcon } from "./resources";
import { CometChatCreateGroup, CreateGroupConfiguration, CreateGroupConfigurationInterface } from "../CometChatCreateGroup";
import { CometChatContext, localize, messageStatus } from "../shared";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { CometChatGroupsEvents } from "../shared/events";
import { CometChatJoinProtectedGroup } from "../CometChatJoinProtectedGroup";
import { Toast } from "../shared/helper/Toast";

const uiEventListener = "uiEvents_" + new Date().getTime();
const uiOpenChatListener = "uiOpenChat_" + new Date().getTime();

const ComponentNames = {
    GroupsList: "groups",
    Messages: "messages",
    CreateGroup: "createNewGroup",
}

export interface CometChatGroupsWithMessagesInterface {
    group?: CometChat.Group,
    groupsConfiguration?: GroupsConfigurationInterface,
    messagesConfigurations?: MessagesConfigurationInterface,
    createGroupConfiguration?: CreateGroupConfigurationInterface,
    onError?: (e: CometChat.CometChatException) => void
}

export const CometChatGroupsWithMessages = (props: CometChatGroupsWithMessagesInterface) => {
    const {
        group,
        groupsConfiguration,
        messagesConfigurations,
        createGroupConfiguration,
        onError,
    } = props;

    const {theme} = useContext(CometChatContext);

    const [showComponent, setShowComponent] = useState(ComponentNames.GroupsList);
    const [joinProtectedGroup, setJoinProtectedGroup] = useState(false);
    // const [showForwarding, setShowForwarding] = useState(false);

    const selectedGroup= useRef(group);
    const selectedUser = useRef();

    const _createGroupConfig = new CreateGroupConfiguration({...createGroupConfiguration});

    const openMessagesFor = (item: CometChat.Group) => {
        clearSelected();
        selectedGroup.current = item;
        if (item['hasJoined']) {
            setShowComponent(ComponentNames.Messages);
        } else {
        if (item['type'] == "public") {
            CometChat.joinGroup(item, item['type']).then((result) => {
                item['hasJoined'] = true;
                item['membersCount'] = item['membersCount'] + 1;
                item['scope'] = "participant";
                CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupMemberJoined, {joinedGroup: item});
                setShowComponent(ComponentNames.Messages)
            })
        }
        if (item['type'] == "password") {
            setJoinProtectedGroup(true);
        }
        }
    }

    const CreateGroupView = () => {
        return (
            <TouchableOpacity onPress={() => setShowComponent(ComponentNames.CreateGroup)}>
                <Image source={createIcon} style={{height: 24, width: 24, tintColor: theme?.palette.getPrimary()}}/>
            </TouchableOpacity>
        )
    }

    const _groupsConfig = new GroupsConfiguration({
        onItemPress: openMessagesFor,
        onError: onError,
        AppBarOption: CreateGroupView,
        ...groupsConfiguration,
    });

    const _messagesConfig = new MessagesConfiguration({
        messageHeaderConfiguration: {
            onBack: () => setShowComponent(ComponentNames.GroupsList),
        },
        ...messagesConfigurations
    });

    const clearSelected = () => {
        selectedGroup.current = null;
        selectedUser.current = null;
    }

    const handleBack = () => {
        if (showComponent == ComponentNames.Messages){
            setShowComponent(ComponentNames.GroupsList);
            clearSelected();
        }
        else 
            return false;
        return true;
    }

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', handleBack);
        return () => {
          BackHandler.removeEventListener(
            'hardwareBackPress',
            handleBack
          );
        };
    }, [showComponent]);


    useEffect(() => {
        // CometChatUIEventHandler.addMessageListener(
        //     uiEventListener,
        //     {
        //         ccMessageForwarded: ({users, groups, status}) =>{
        //             if (status == messageStatus.inprogress) {
        //                 setShowForwarding(true);
        //                 return;
        //             }
        //             if (status == messageStatus.success) {
        //                 let totalCount = ((users && users.length) || 0) + ((groups && groups.length) || 0)
        //                 if (totalCount == 1) {
        //                     if (groups && groups.length > 0) {
        //                         setShowComponent(ComponentNames.GroupsList);
        //                         selectedGroup.current = groups[0];
        //                         setShowComponent(ComponentNames.Messages);
        //                     }
        //                 }
        //                 setShowForwarding(false);
        //             }
        //         }
        //     });
      CometChatUIEventHandler.addGroupListener(
        uiEventListener,
        {
            ccGroupCreated: ({group}) => {
                selectedGroup.current = group;
                setTimeout(() => {
                    setShowComponent(ComponentNames.Messages);
                }, 200);
            },
            ccGroupMemberJoined: ({joinedGroup}) => {
                console.log("joined", joinedGroup);
                joinedGroup['hasJoined'] = true;
                joinedGroup['scope'] = "participant";
                selectedGroup.current = joinedGroup;
                setTimeout(() => {
                    setShowComponent(ComponentNames.Messages);
                }, 200);
            },
            ccGroupDeleted: ({group}) => {
                selectedGroup.current = null;
                setShowComponent(ComponentNames.GroupsList);
            },
            ccGroupLeft: ({group}) => {
                selectedGroup.current = null;
                setShowComponent(ComponentNames.GroupsList);
            }
        }
      )
      CometChatUIEventHandler.addUIListener(uiEventListener, {
        openChat: ({user, group}) => {
            setShowComponent(ComponentNames.GroupsList);
            // clearSelected();
            if (user != undefined) {
                selectedUser.current = user;
                setShowComponent(ComponentNames.Messages);
            }
            if(group != undefined) {
                selectedGroup.current = group;
                setShowComponent(ComponentNames.Messages);
            }
        }
    });
      return () => {
        CometChatUIEventHandler.removeGroupListener(uiEventListener);
        CometChatUIEventHandler.removeUIListener(uiOpenChatListener);
      }
    }, []);

    return (
        <View style={{ flex: 1 }}>
            {
                joinProtectedGroup && joinProtectedGroup == true &&
                <View style={[Style.stackScreen, {backgroundColor: theme.palette.getBackgroundColor()}]}>
                        <CometChatJoinProtectedGroup
                            group={selectedGroup.current}
                            onBack={() => setJoinProtectedGroup(false)}
                        />
                </View>
            }
            {
                selectedGroup.current && showComponent == ComponentNames.Messages &&
                <View style={[Style.stackScreen, {backgroundColor: theme.palette.getBackgroundColor()}]}>
                    <CometChatMessages
                        user={selectedUser.current ||undefined}
                        group={selectedUser.current ? undefined : (selectedGroup.current || undefined)}
                        {..._messagesConfig}
                    />
                </View>
            }
            {
                showComponent == ComponentNames.CreateGroup &&
                <View style={[Style.stackScreen, {backgroundColor: theme.palette.getBackgroundColor()}]}>
                    <CometChatCreateGroup
                        onBack={() => setShowComponent(ComponentNames.GroupsList)}
                        {..._createGroupConfig}
                    />
                </View>
            }
            {/* {
                showForwarding && <Toast message={localize("FORWARDING")} />
            } */}
            <CometChatGroups
                {..._groupsConfig}
            />
        </View>

    )
}