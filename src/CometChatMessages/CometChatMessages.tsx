import React, { useRef, useState, useEffect, useContext } from "react";
import { View, TouchableOpacity, Image, BackHandler } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { MessageStyle, MessageStyleInterface } from "./MessageStyle";
import { CometChatMessageList } from "../CometChatMessageList"
import { CometChatMessageComposer, MessageComposerConfiguration, MessageComposerConfigurationInterface } from "../CometChatMessageComposer"
import { CometChatMessageHeader, MessageHeaderConfiguration } from "../CometChatMessageHeader"
import { MessageListConfiguration, MessageListConfigurationInterface } from "../CometChatMessageList/MessageListConfiguration";
import { ChatConfigurator, CometChatContext, CometChatLiveReactions, localize } from "../shared";
import { MetadataConstants } from "../shared/constants/UIKitConstants";
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
    const threadedMessageInfo = useRef<{ message: CometChat.BaseMessage, view: () => JSX.Element }>({ message: null, view: () => null });
    const detailsData = useRef<{ user: CometChat.User, group: CometChat.Group }>({ user: null, group: null });
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
                onTransientMessageReceived: (transientMessage) => {
                    const { reaction, type } = transientMessage['data'];
                    if (type == MetadataConstants.liveReaction) {
                        setShowLiveReaction(!showLiveReaction);
                    }
                },
            }
        );

        CometChat.getLoggedinUser().then(user => {
            loggedInUser.current = user;
        })
            .catch(e => {
                console.log("unable to get logged in user");
            });

        CometChatUIEventHandler.addGroupListener(
            uiEventListener,
            {
                ccGroupDeleted: () => {
                    _headerConfiguration.onBack && _headerConfiguration.onBack();      //hides the details screen
                },
                ccGroupLeft: ({ action, leftUser, leftGroup }) => {
                    _headerConfiguration.onBack && _headerConfiguration.onBack();
                    setShowComponent(ComponentNames.Default);
                },
                ccOwnershipChanged: ({ group }) => {
                    setGroupObject(group);
                }
            }
        )
        CometChatUIEventHandler.addUserListener(
            uiEventListener,
            {
                ccUserBlocked: ({ user }: { user: CometChat.User }) => {
                    _headerConfiguration.onBack && _headerConfiguration.onBack();
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
                    if(user?.uid){
                    CometChat.getUser(user?.uid)
                        .then(user => {
                            setUserObject(user);
                            console.log("onConnected getUser", { user });
                        })
                        .catch(e => {
                            console.log("ERROR")
                        })
                    } else {
                        CometChat.getGroup(group?.guid)
                        .then(group => {
                            setGroupObject(group);
                            console.log("onConnected getGroup", { group });
                        })
                        .catch(e => {
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
            CometChat.removeConnectionListener(connectionListenerId);
        }
    }, []);

    const DetailViewIcon = (params: { user: CometChat.User, group: CometChat.Group }) => {
        return (
            <View style={Style.appBarStyle}>
                {
                    AuxilaryAppBarOptions ? <AuxilaryAppBarOptions group={groupObject} user={userObject} />
                        : ChatConfigurator.dataSource.getAuxiliaryHeaderAppbarOptions(user, group, theme)
                }
                {
                    !hideDetails && (
                        <TouchableOpacity onPress={() => {
                            detailsData.current = { user: params.user, group: params.group }
                            setShowComponent(ComponentNames.Details);
                        }}>
                            <Image source={infoIcon} style={Style.infoIconStyle} />
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
    ]
    }>
        {
            showComponent == ComponentNames.Details &&
            <View style={[Style.stackMe, { backgroundColor, borderRadius }]}>
                {/* showComponent == ComponentNames.Details &&
             <View style={{flex: 1}}> */}
                <CometChatDetails
                    user={detailsData.current.user}
                    group={detailsData.current.group}
                    {..._detailsConfiguration}
                    onBack={_detailsConfiguration.onBack || setShowComponent.bind(this, ComponentNames.Default)}
                />
            </View>
        }
        {
            showComponent == ComponentNames.Thread &&
            <View style={[Style.stackMe, { backgroundColor, borderRadius }]}>
                <CometChatThreadedMessages
                    BubbleView={(msg) => typeof threadedMessageInfo.current?.view === 'function' && threadedMessageInfo.current.view()}
                    parentMessage={threadedMessageInfo.current.message}
                    onClose={() => setShowComponent(ComponentNames.Default)}
                    threadedMessagesStyle={{ closeIconTint: "black", titleStyle: { fontSize: 18 } }}
                    // threadedMessagesStyle={new ThreadedMessagesStyle({})}
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
                            dateSeperatorPattern={_listConfiguration.dateSeperatorPattern}
                            disableSoundForMessages={disableSoundForMessages}
                            onThreadRepliesPress={(msg, view) => {
                                threadedMessageInfo.current = { message: msg, view }
                                setShowComponent(ComponentNames.Thread);
                            }}
                            customSoundForMessages={customSoundForIncomingMessages}
                            {..._listConfiguration}
                        />
                }
            </View>
            {
                showLiveReaction ?
                    <CometChatLiveReactions /> :
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