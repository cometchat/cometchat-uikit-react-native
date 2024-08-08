import React, { useRef, useState, useEffect, useContext } from "react";
import { View, TouchableOpacity, Image, BackHandler, ViewProps } from "react-native";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageStyle, MessageStyleInterface } from "./MessageStyle";
import { CometChatMessageList } from "../CometChatMessageList"
import { CometChatMessageComposer, MessageComposerConfiguration, MessageComposerConfigurationInterface } from "../CometChatMessageComposer"
import { CometChatMessageHeader, MessageHeaderConfiguration } from "../CometChatMessageHeader"
import { MessageListConfiguration, MessageListConfigurationInterface } from "../CometChatMessageList/MessageListConfiguration";
import { ChatConfigurator, CometChatContext, CometChatLiveReactions, localize } from "../shared";
import { MetadataConstants, ReceiverTypeConstants } from "../shared/constants/UIKitConstants";
import { ThreadedMessagesConfiguration, ThreadedMessagesConfigurationInterface } from "../CometChatThreadedMessages/ThreadedMessagesConfiguration";
import { CometChatDetails, DetailsConfiguration, DetailsConfigurationInterface } from "../CometChatDetails";
import { CometChatThreadedMessages } from "../CometChatThreadedMessages";
import { infoIcon } from "./resources";
import { Style } from "./style";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";

const currentTime = new Date().getTime();
const msgListenerId = "messages_" + currentTime;
const uiEventListener = "uiEvent_" + new Date().getTime();
const connectionListenerId = "connectionListener_" + new Date().getTime();

const ComponentNames = {
    Default: "default",
    Details: "details",
    Thread: "thread"
}

export interface CometChatMessagesInterface {
    user?: CometChat.User,
    group?: CometChat.Group,
    disableTyping?: boolean,
    hideMessageComposer?: boolean,
    messageHeaderConfiguration?: MessageHeaderConfiguration,
    messageListConfiguration?: MessageListConfigurationInterface,
    messageComposerConfiguration?: MessageComposerConfigurationInterface,
    threadedMessagesConfiguration?: ThreadedMessagesConfigurationInterface,
    detailsConfiguration?: DetailsConfigurationInterface,
    MessageHeaderView?: ({ user, group }: { user?: CometChat.User, group?: CometChat.Group }) => JSX.Element,
    MessageComposerView?: ({ user, group }: { user?: CometChat.User, group?: CometChat.Group }) => JSX.Element,
    MessageListView?: ({ user, group }: { user?: CometChat.User, group?: CometChat.Group }) => JSX.Element,
    hideMessageHeader?: boolean,
    hideDetails?: boolean,
    disableSoundForMessages?: boolean,
    customSoundForIncomingMessages?: string,
    customSoundForOutgoingMessages?: string,
    messagesStyle?: MessageStyleInterface,
    AuxilaryAppBarOptions?: ({ user, group }: { user?: CometChat.User, group?: CometChat.Group }) => JSX.Element,
}

export const CometChatMessages = (props: CometChatMessagesInterface) => {
    const {
        user,
        group,
        AuxilaryAppBarOptions,
        customSoundForIncomingMessages,
        customSoundForOutgoingMessages,
        detailsConfiguration,
        disableSoundForMessages,
        disableTyping,
        hideMessageComposer,
        hideMessageHeader,
        MessageComposerView,
        MessageHeaderView,
        messageComposerConfiguration,
        messageHeaderConfiguration,
        messageListConfiguration,
        messagesStyle,
        threadedMessagesConfiguration,
        MessageListView,
        hideDetails
    } = props;

    const { theme } = useContext(CometChatContext);

    //calcualted styles and configurations
    const _messagesStyles = new MessageStyle({
        backgroundColor: theme.palette.getBackgroundColor(),
        ...messagesStyle
    });
    const _composerConfiguration = new MessageComposerConfiguration({ ...messageComposerConfiguration });
    const _headerConfiguration = new MessageHeaderConfiguration({ ...messageHeaderConfiguration });
    const _listConfiguration = new MessageListConfiguration({ ...messageListConfiguration });
    const _threadedConfiguration = new ThreadedMessagesConfiguration({ ...threadedMessagesConfiguration });
    const _detailsConfiguration = new DetailsConfiguration({ ...detailsConfiguration });

    // states
    const [showLiveReaction, setShowLiveReaction] = useState(false);
    const [showComponent, setShowComponent] = useState(ComponentNames.Default);
    const [userObject, setUserObject] = useState(user);
    const [groupObject, setGroupObject] = useState(group);

    // refs
    const composerRef = useRef(null);
    const threadedMessageInfo = useRef<{ message: CometChat.BaseMessage | null, view: () => JSX.Element | null }>({ message: null, view: () => null });
    const detailsData = useRef<{ user: CometChat.User | null, group: CometChat.Group | null }>({ user: null, group: null });
    const loggedInUser = useRef(null);


    const handleBack = () => {
        if (showComponent == ComponentNames.Details)
            setShowComponent(ComponentNames.Default);
        else if (showComponent == ComponentNames.Thread)
            setShowComponent(ComponentNames.Default);
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
        CometChatUIEventHandler.addMessageListener(
            msgListenerId,
            {
                onTransientMessageReceived: (transientMessage: any) => {
                    const { reaction, type } = transientMessage['data'];
                    if (!isLiveReactionOfThisList(transientMessage)) return;
                    if (type == MetadataConstants.liveReaction) {
                        setShowLiveReaction(true);
                        setTimeout(() => {
                            setShowLiveReaction(false);
                        }, 1500);
                    }
                },
            }
        );

        CometChat.getLoggedinUser().then((user: any) => {
            loggedInUser.current = user;
        })
            .catch((e: any) => {
                console.log("unable to get logged in user");
            });

        CometChatUIEventHandler.addGroupListener(
            uiEventListener,
            {
                ccGroupDeleted: () => {
                    _headerConfiguration.onBack && _headerConfiguration.onBack();      //hides the details screen
                },
                ccGroupLeft: ({ action, leftUser, leftGroup }: any) => {
                    _headerConfiguration.onBack && _headerConfiguration.onBack();
                    setShowComponent(ComponentNames.Default);
                },
                ccOwnershipChanged: ({ group }: any) => {
                    setGroupObject(group);
                }
            }
        )
        CometChatUIEventHandler.addUserListener(
            uiEventListener,
            {
                ccUserBlocked: ({ user }: { user: CometChat.User }) => {
                    user.setBlockedByMe(true);
                    setUserObject(user);
                },
                ccUserUnBlocked: ({ user }: { user: CometChat.User }) => {
                    user.setBlockedByMe(false);
                    setUserObject(user);
                }
            }
        )
        CometChat.addConnectionListener(
            connectionListenerId,
            new CometChat.ConnectionListener({
                onConnected: () => {
                    console.log("ConnectionListener => On Connected", user, group);
                    if (user) {
                        CometChat.getUser(user?.getUid())
                            .then((user: any) => {
                                setUserObject(user);
                            })
                            .catch((e: any) => {
                                console.log("ERROR")
                            })
                    } else if(group) {
                        CometChat.getGroup(group?.getGuid())
                            .then((group: any) => {
                                setGroupObject(group);
                                console.log("onConnected getGroup", { group });
                            })
                            .catch((e: any) => {
                                console.log("ERROR")
                            })
                    }
                },
                inConnecting: () => {
                    console.log("ConnectionListener => In connecting");
                },
                onDisconnected: () => {
                    console.log("ConnectionListener => On Disconnected");
                }
            })
        );
        return () => {
            CometChatUIEventHandler.removeGroupListener(uiEventListener);
            CometChatUIEventHandler.removeUserListener(uiEventListener);
            CometChatUIEventHandler.removeMessageListener(msgListenerId);
            CometChat.removeConnectionListener(connectionListenerId);
        }
    }, []);

    function isLiveReactionOfThisList(transientMessage: any) {
        const receiverType = transientMessage?.receiverType;
        const senderId = transientMessage?.sender?.uid;
        const receiverId = transientMessage?.receiverId;
        if (userObject && receiverType === ReceiverTypeConstants.user && (senderId === userObject?.getUid())) {
            return true
        } else if (groupObject && receiverType === ReceiverTypeConstants.group && (receiverId === groupObject.getGuid())) {
            return true
        }
        return false
    }

    const DetailViewIcon = (params: { user?: CometChat.User, group?: CometChat.Group }) => {
        return (
            <View style={Style.appBarStyle}>
                {
                    AuxilaryAppBarOptions ? <AuxilaryAppBarOptions group={groupObject} user={userObject} />
                        : ChatConfigurator.dataSource.getAuxiliaryHeaderAppbarOptions(user, group, theme)
                }
                {
                    !hideDetails && (
                        <TouchableOpacity onPress={() => {
                            detailsData.current = { user: params.user || null, group: params.group || null }
                            setShowComponent(ComponentNames.Details);
                        }}>
                            <Image source={infoIcon} style={[Style.infoIconStyle, {tintColor: theme.palette.getPrimary()}]} />
                        </TouchableOpacity>
                    )
                }
            </View>
        )
    }

    const {
        backgroundColor,
        height,
        width,
        border,
        borderRadius
    } = _messagesStyles;

    return <View style={[
        Style.container,
        { backgroundColor, height, width, ...border, borderRadius }
    ] as ViewProps
    }>
        {
            showComponent == ComponentNames.Details &&
            <View style={[Style.stackMe, { backgroundColor, borderRadius }]}>
                {/* showComponent == ComponentNames.Details &&
             <View style={{flex: 1}}> */}
                <CometChatDetails
                    {...(detailsData.current.user
                        ? {user: detailsData.current.user}
                        : detailsData.current.group
                        ? {group:detailsData.current.group}
                        : {})
                    }
                    {..._detailsConfiguration}
                    onBack={_detailsConfiguration.onBack || setShowComponent.bind(this, ComponentNames.Default)}
                />
            </View>
        }
        {
            showComponent == ComponentNames.Thread &&
            <View style={[Style.stackMe, { backgroundColor, borderRadius }]}>
                <CometChatThreadedMessages
                    BubbleView={(msg) => typeof threadedMessageInfo.current?.view === 'function' ? threadedMessageInfo.current.view() : null}
                    parentMessage={threadedMessageInfo.current.message || undefined}
                    onClose={() => setShowComponent(ComponentNames.Default)}
                    threadedMessagesStyle={{ titleStyle: { fontSize: 18 } }}
                    {..._threadedConfiguration}
                />
            </View>
        }
        <View style={{ flex: 1 }}>
            {
                hideMessageHeader ?
                    null :
                    MessageHeaderView ?
                        <MessageHeaderView user={userObject} group={groupObject} /> :
                        <CometChatMessageHeader
                            user={userObject}
                            group={groupObject}
                            AppBarOptions={({ user, group }) => <DetailViewIcon user={user} group={group} />}
                            disableTyping={disableTyping}
                            onBack={() => setShowComponent(ComponentNames.Default)}
                            {..._headerConfiguration}
                        />
            }
            <View style={{ flex: 1 }}>
                {
                    MessageListView ?
                        <MessageListView user={userObject} group={groupObject} /> :
                        <CometChatMessageList
                            user={userObject}
                            group={groupObject}
                            emptyStateText={localize("NO_MESSAGES_FOUND")}
                            errorStateText={localize("SOMETHING_WRONG")}
                            disableSoundForMessages={disableSoundForMessages}
                            onThreadRepliesPress={(msg, view) => {
                                threadedMessageInfo.current = { message: msg, view }
                                setShowComponent(ComponentNames.Thread);
                            }}
                            customSoundForMessages={customSoundForIncomingMessages}
                            hideActionSheetHeader={true}
                            {..._listConfiguration}
                        />
                }
            </View>
            {
                showLiveReaction ?
                    <View style={{ alignItems: "flex-end" }}>
                        <CometChatLiveReactions />
                    </View> :
                    null
            }
            {
                hideMessageComposer ?
                    null :
                    MessageComposerView ?
                        <MessageComposerView group={group} user={user} /> :
                        <CometChatMessageComposer
                            ref={composerRef}
                            user={userObject}
                            group={groupObject}
                            disableSoundForMessages={disableSoundForMessages}
                            customSoundForMessage={customSoundForOutgoingMessages}
                            disableTypingEvents={disableTyping}
                            {..._composerConfiguration}
                        />
            }
        </View>
    </View >
}