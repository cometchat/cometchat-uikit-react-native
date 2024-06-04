import React, { useState, useRef, useEffect, useContext } from "react";
import { View } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatUsers, UsersConfiguration } from "../CometChatUsers";
import { MessagesConfiguration, MessagesConfigurationInterface } from "../CometChatMessages/MessagesConfiguration";
import { CometChatMessages } from "../CometChatMessages";
import { Style } from "./styles";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { CometChatContext, localize, messageStatus } from "../shared";
import { UsersConfigurationInterface } from "../CometChatUsers/UsersConfiguration";
import { Toast } from "../shared/helper/Toast";

const uiEventListener = "uiEvents_" + new Date().getTime();

const ComponentNames = {
    UserList: "users",
    Messages: "messages"
}

export interface CometChatUsersWithMessagesInterface {
    user?: CometChat.User,
    usersConfiguration?: UsersConfigurationInterface,
    messagesConfigurations?: MessagesConfigurationInterface,
    onError?: (e: CometChat.CometChatException) => void
}

export const CometChatUsersWithMessages = (props: CometChatUsersWithMessagesInterface) => {
    const {
        user,
        usersConfiguration,
        messagesConfigurations,
        onError
    } = props;

    const [showComponent, setShowComponent] = useState(ComponentNames.UserList);
    const [selectedUser, setSelectedUser] = useState(undefined);
    // const [showForwarding, setShowForwarding] = useState(false);

    const loggedInUser = useRef(null);

    const { theme } = useContext(CometChatContext);

    const openMessagesFor = (item: CometChat.User) => {
        setSelectedUser(item);
        setShowComponent(ComponentNames.Messages);
    }

    const _usersConfig = new UsersConfiguration({
        onItemPress: openMessagesFor,
        onError: onError,
        ...usersConfiguration,
    });

    const _messagesConfig = new MessagesConfiguration({
        messageHeaderConfiguration: {
            onBack: () => setShowComponent(ComponentNames.UserList),
        },
        ...messagesConfigurations
    });

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
        //                         setShowComponent(ComponentNames.UserList);
        //                         selectedUser.current = groups[0];
        //                         setShowComponent(ComponentNames.Messages);
        //                     }
        //                 }
        //                 setShowForwarding(false);
        //             }
        //         }
        //     });
        CometChat.getLoggedinUser()
            .then((user) => {
                loggedInUser.current = user;
            })
            .catch(err => { });

        CometChatUIEventHandler.addUserListener(
            uiEventListener,
            {
                ccUserBlocked: ({ user }: { user: CometChat.User }) => {
                    user.setBlockedByMe(true);
                    setSelectedUser(user);
                },
                ccUserUnBlocked: ({ user }: { user: CometChat.User }) => {
                    user.setBlockedByMe(false);
                    setSelectedUser(user);
                }
            }
        )
        return () => {
            CometChatUIEventHandler.removeUserListener(uiEventListener);
        }
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <CometChatUsers
                {..._usersConfig}
            />
            {/* {
                showForwarding && <Toast message={localize("FORWARDING")} />
            } */}
            {
                showComponent == ComponentNames.Messages &&
                <View style={[Style.stackScreen, { backgroundColor: theme.palette.getBackgroundColor() }]}>
                    <CometChatMessages
                        user={selectedUser}
                        {..._messagesConfig}
                    />
                </View>
            }
        </View>

    )
}