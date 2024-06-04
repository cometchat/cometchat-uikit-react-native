import { View, Text, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native'
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react'
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AvatarStyleInterface } from '../CometChatAvatar';
import { CometChatListItem, ListItemStyleInterface } from '../CometChatListItem';
import { CometChatContext } from '../../CometChatContext';
import { CometChatUIEventHandler, MessageEvents } from '../../events';
import { messageStatus } from '../../utils/CometChatMessageHelper';
import { ReactionListStyle, ReactionListStyleInterface } from './ReactionListStyle';
import { localize } from '../../resources';
import { ImageType } from '../../base';
import { LoadingIcon } from './resources';
import { CommonUtils } from '../../utils/CommonUtils';

export interface CometChatReactionListInterface {
    messageObject: CometChat.BaseMessage;
    onPress?: (messageReaction: CometChat.Reaction, messageObject: CometChat.BaseMessage) => void;
    reactionRequestBuilder?: CometChat.ReactionsRequestBuilder;
    reactionListStyle?: ReactionListStyleInterface;
    avatarStyle?: AvatarStyleInterface;
    listItemStyle?: ListItemStyleInterface;
    selectedReaction?: string;
    ErrorStateView?: () => JSX.Element;
    errorStateText?: string;
    loadingIconURL?: ImageType;
    LoadingStateView?: () => JSX.Element;
}

export const CometChatReactionList = (props: CometChatReactionListInterface) => {

    const {
        messageObject, onPress, reactionRequestBuilder, avatarStyle,
        listItemStyle, selectedReaction, reactionListStyle,
        ErrorStateView,
        errorStateText,
        loadingIconURL,
        LoadingStateView,
    } = props;
    const { theme } = useContext(CometChatContext);

    const [messageReactions, setMessageReactions] = useState(messageObject?.getReactions() || []);
    const [currentSelectedReaction, setCurrentSelectedReaction] = useState(selectedReaction || "All");
    const [reactionList, setReactionList] = useState([]);
    const [state, setState] = useState<"loading" | "error" | "done">("loading");
    const loggedInUser = useRef<CometChat.User>();
    const newMessageObj = useRef<CometChat.BaseMessage>(CommonUtils.clone(messageObject));


    let requestBuilderMap: Record<string, CometChat.ReactionsRequest> = useRef({});
    let reactionListMap: Record<string, CometChat.Reaction[]> = useRef({});

    const _style = new ReactionListStyle({
        subtitleColor: reactionListStyle?.subtitleColor || theme.palette.getAccent600(),
        subtitleFont: reactionListStyle?.subtitleFont || theme.typography.subtitle2,
        activeEmojiBackgroundColor: reactionListStyle?.activeEmojiBackgroundColor || theme.palette.getAccent100(),
        sliderEmojiCountColor: reactionListStyle?.sliderEmojiCountColor || theme.palette.getAccent700(),
        tailViewFont: reactionListStyle?.tailViewFont || theme.typography.title1,
        sliderEmojiCountFont: reactionListStyle?.sliderEmojiCountFont || theme.typography.subtitle1,
        sliderEmojiFont: reactionListStyle?.sliderEmojiFont || theme.typography.subtitle1,
        errorTextColor: reactionListStyle?.errorTextColor || theme?.palette?.getError(),
        errorTextFont: reactionListStyle?.errorTextFont || theme?.typography?.subtitle1,
        loadingTint: reactionListStyle?.loadingTint || theme?.palette.getAccent700(),
        separatorColor: reactionListStyle?.separatorColor || theme.palette.getAccent100(),
        ...reactionListStyle,
    });

    const {
        subtitleColor,
        subtitleFont,
        activeEmojiBackgroundColor,
        sliderEmojiCountColor,
        tailViewFont,
        sliderEmojiCountFont,
        sliderEmojiFont,
        errorTextColor,
        errorTextFont,
        loadingTint,
        separatorColor,
    } = _style;


    useEffect(() => {
        CometChat.getLoggedinUser()
            .then(user => loggedInUser.current = user)
            .catch(rej => {
                loggedInUser.current = null;
                // onError && onError(rej);
            })
        showReactions(true);
        let newMessageReactions = messageObject?.getReactions() || [];
        _setAllReactions(newMessageReactions);
    }, []);

    useEffect(() => {
        showReactions();
    }, [currentSelectedReaction])

    const _setAllReactions = (_messageReactions) => {
        let totalCount = _messageReactions.reduce((acc, curr) => acc + curr.count, 0);
        setMessageReactions([{ reaction: "All", count: totalCount }, ..._messageReactions]);
    }


    const showReactions = async (firstFetch?: boolean) => {
        const requestBuilder = getRequestBuilder(currentSelectedReaction);
        const list = await getReactionList(requestBuilder, currentSelectedReaction);
        if (firstFetch && currentSelectedReaction !== "All") {
            await getReactionList(getRequestBuilder("All"), "All");
        }
        setReactionList(list);
    };

    const getRequestBuilder = (reaction: string): CometChat.ReactionsRequest => {
        let requestBuilder: CometChat.ReactionsRequestBuilder;
        if (requestBuilderMap.current[reaction]) {
            return requestBuilderMap.current[reaction];
        }

        requestBuilder = reactionRequestBuilder || new CometChat.ReactionsRequestBuilder();
        requestBuilder.setLimit(10).setMessageId(messageObject?.getId());

        if (reaction !== "All") {
            requestBuilder.setReaction(reaction);
        }

        const request = requestBuilder.build();
        requestBuilderMap.current[reaction] = request;
        return request;
    };

    const getReactionList = async (requestBuilder: CometChat.ReactionsRequest, reaction: string) => {
        setState("loading");

        if (reactionListMap.current[reaction]) {
            setState("done");
            let list = reactionListMap.current[reaction];
            return list;
        }

        try {
            const list = await requestBuilder.fetchNext();
            reactionListMap.current[reaction] = list;
            setState("done");
            return list;
        } catch (error) {
            console.log("error while fetching reactions", error)
            if (error?.code === "REQUEST_IN_PROGRESS") return;
            setState("error");
            return [];
        }
    };

    const fetchNext = async () => {
        try {
            const requestBuilder = getRequestBuilder(currentSelectedReaction);
            if (reactionListMap.current[currentSelectedReaction]?.length === 0) {
                return;
            } else {
                const newList = await requestBuilder.fetchNext();
                reactionListMap.current[currentSelectedReaction] = [
                    ...(reactionListMap.current?.[currentSelectedReaction] || []),
                    ...newList,
                ];
                setReactionList(reactionListMap.current[currentSelectedReaction]);
            }
            setState("done");
        } catch (error) {
            console.log("error while fetching next reactions", error);
            if (error?.code === "REQUEST_IN_PROGRESS") return;
            setState("error");
        }
    };

    const removeReaction = (reactionObj: CometChat.Reaction) => {
        let reactedByMe = loggedInUser.current.uid === reactionObj?.getReactedBy()?.getUid();
        if (reactedByMe) {
            if (onPress) {
                onPress(reactionObj, newMessageObj.current);
            }
            // const messageId = messageObject?.getId();
            // const emoji = reactionObj?.reaction;
            // CometChat.removeReaction(messageId, emoji)
            //     .then((message) => {
            //         CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, { message: message, status: messageStatus.success });

            let newReactionList = [...reactionList]?.filter(reaction => reaction?.id !== reactionObj?.id);
            setReactionList(newReactionList);

            if (currentSelectedReaction === "All") {
                reactionListMap.current[currentSelectedReaction] = [...newReactionList];
                reactionListMap.current[reactionObj?.reaction] = reactionListMap.current[reactionObj?.reaction]?.filter((reaction: CometChat.Reaction) => reaction?.id !== reactionObj?.id);
            } else {
                reactionListMap.current[currentSelectedReaction] = [...newReactionList];
                reactionListMap.current['All'] = reactionListMap.current['All']?.filter((reaction: CometChat.Reaction) => reaction?.id !== reactionObj?.id);
            }

            let newMessageReactions = [...messageReactions];

            let messageReactionIndex = newMessageReactions.findIndex(reaction => reaction?.reaction === reactionObj?.reaction);
            if (messageReactionIndex > -1) {
                if (newMessageReactions[messageReactionIndex]?.getCount() > 1) {
                    newMessageReactions[messageReactionIndex].setCount(newMessageReactions[messageReactionIndex].getCount() - 1);
                    newMessageReactions[messageReactionIndex].setReactedByMe(false);
                    newMessageReactions.shift();
                    _setAllReactions(newMessageReactions);
                } else {
                    newMessageReactions.splice(messageReactionIndex, 1);
                    newMessageReactions.shift();
                    _setAllReactions(newMessageReactions);
                    setCurrentSelectedReaction("All");
                }
            }

            newMessageObj.current.setReactions(newMessageReactions);

            //     })
            //     .catch(err => console.log("Some error occured in removing reaction", err));
        }
    };

    const subtitleView = useCallback((item) => {
        let reactedByMe = loggedInUser.current.uid === item?.reactedBy?.uid;
        return (reactedByMe ?
            <Text style={[{ color: subtitleColor }, subtitleFont]}>
                {localize("TAP_TO_REMOVE")}
            </Text>
            : null
        )
    }, []);

    const _render = ({ item, index }) => {

        function getName() {
            let reactedByMe = loggedInUser.current.uid === item?.reactedBy?.uid;
            return reactedByMe ? localize("YOU") : item?.reactedBy?.name;
        }

        return (
            <>
                <CometChatListItem
                    id={item?.id || index}
                    title={getName()}
                    avatarStyle={avatarStyle}
                    avatarName={item?.reactedBy?.name}
                    avatarURL={item?.reactedBy?.avatar ? { uri: item?.reactedBy?.avatar } : undefined}
                    SubtitleView={() => subtitleView(item)}
                    TailView={() => <Text style={[tailViewFont, { color: theme?.palette?.getPrimary() }]}>{item?.reaction}</Text>}
                    listItemStyle={{ height: 60, ...listItemStyle }}
                    onPress={(id) => removeReaction(item)}
                />
                <View
                    style={{
                        height: 1,
                        backgroundColor: separatorColor
                    }}
                />
            </>
        )
    };


    const ErrorView = () => {
        if (ErrorStateView)
            return <ErrorStateView />
        return <View style={{
            marginTop: 100,
            justifyContent: "center",
            alignItems: "center",
        }}>
            <Text style={[{ color: errorTextColor, ...errorTextFont }]}>{errorStateText || localize("SOMETHING_WRONG")}</Text>
        </View>
    }

    const LoadingView = () => {
        if (LoadingStateView)
            return <LoadingStateView />
        return <View style={{
            marginTop: 100,
            justifyContent: "center",
            alignItems: "center",
        }}>
            <Image source={loadingIconURL || LoadingIcon} style={[{
                height: 24, width: 24, alignSelf: "center", tintColor: loadingTint
            }]} />
        </View>
    }

    return (
        <View>

            {/* Slider for reactions */}
            <ScrollView style={{ paddingBottom: 5 }}
                contentContainerStyle={{
                    paddingLeft: 5,
                }}
                showsHorizontalScrollIndicator={false} horizontal={true}>
                {messageReactions?.length > 0 && messageReactions.map((reactionObject, index) => (
                    <TouchableOpacity style={[{
                        paddingHorizontal: 10,
                        flexDirection: "row", marginRight: 5,
                        backgroundColor: currentSelectedReaction === reactionObject?.reaction ? activeEmojiBackgroundColor : undefined,
                        borderRadius: 20,
                        alignItems: "center", justifyContent: "center"
                    }]} key={index} onPress={() => setCurrentSelectedReaction(reactionObject?.reaction)}>
                        <Text style={[{
                            borderWidth: .5,
                            borderColor: "transparent",
                            paddingVertical: 5,
                            marginRight: 4, color: reactionObject?.reaction === "All" ? sliderEmojiCountColor : theme?.palette?.getPrimary()
                        }, sliderEmojiFont]}>{reactionObject?.reaction === "All" ? localize("ALL") : reactionObject?.reaction}</Text>
                        <Text style={[{ color: sliderEmojiCountColor }, sliderEmojiCountFont]}>{reactionObject?.count}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {state === "error" ? <ErrorView /> : state === "loading" ? <LoadingView /> :
                <FlatList
                    data={reactionList}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={_render}
                    onEndReached={({ distanceFromEnd }) => {
                        if (distanceFromEnd < 0) return;
                        fetchNext();
                    }}
                    onEndReachedThreshold={0.1}
                    contentContainerStyle={{
                        paddingBottom: 25,
                        paddingHorizontal: 5,
                    }}
                />}

        </View>
    );
};

