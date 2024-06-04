import { CometChat } from '@cometchat/chat-sdk-react-native'
import React, { useContext, useEffect, useRef } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { StyleProp, ViewStyle } from "react-native/types";
import { AvatarStyleInterface, CometChatContext, CometChatDate, CometChatListItem, DatePattern, ListItemStyleInterface, localize } from '../../shared'
import { CallParticipantsStyle, CallParticipantsStyleInterface } from './CallLogParticipantsStyle'
import { BackIcon } from "./resources";
import { Style } from './style'
import { CallUtils } from '../CallUtils'

export interface CometChatCallLogParticipantsConfigurationInterface {
    title?: string,
    SubtitleView?: (param: { participant?: CometChat.BaseMessage }) => JSX.Element,
    TailView?: (param: { participant?: CometChat.BaseMessage }) => JSX.Element,
    ListItemView?: (param: { participant?: CometChat.BaseMessage }) => JSX.Element,
    AppBarOptions?: () => JSX.Element,
    /**
     * Participant list
     */
    data: any[],
    datePattern?: DatePattern,
    call: any,
    hideSeperator?: boolean,
    BackButton?: JSX.Element,
    showBackButton?: boolean,
    EmptyStateView?: () => JSX.Element,
    emptyStateText?: string,
    onItemPress?: (item: CometChat.BaseMessage) => void,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    avatarStyle?: AvatarStyleInterface,
    listItemStyle?: ListItemStyleInterface,
    callLogParticipantsStyle?: CallParticipantsStyleInterface,
    headViewContainerStyle?: StyleProp<ViewStyle>,
    bodyViewContainerStyle?: StyleProp<ViewStyle>,
    tailViewContainerStyle?: StyleProp<ViewStyle>,
}
export const CometChatParticipants = (props: CometChatCallLogParticipantsConfigurationInterface) => {

    const {
        title = localize("PARTICIPANTS"),
        SubtitleView,
        TailView,
        ListItemView,
        AppBarOptions,
        call,
        datePattern,
        data,
        hideSeperator,
        BackButton,
        showBackButton,
        EmptyStateView,
        emptyStateText,
        onItemPress,
        onError,
        onBack,
        avatarStyle,
        listItemStyle,
        callLogParticipantsStyle,
        headViewContainerStyle,
        bodyViewContainerStyle,
        tailViewContainerStyle,
    } = props;

    const { theme } = useContext(CometChatContext);

    const _style = new CallParticipantsStyle({
        titleFont: theme.typography.heading,
        titleColor: theme.palette.getAccent(),
        backgroundColor: theme.palette.getBackgroundColor(),
        emptyTextColor: theme?.palette?.getAccent400(),
        emptyTextFont: theme?.typography?.subtitle1,
        dateTextColor: theme.palette.getAccent(),
        dateTextFont: theme.typography.subtitle2,
        backIconTint: theme.palette.getPrimary(),
        durationTextColor: theme.palette.getAccent(),
        durationTextFont: theme.typography.subtitle1,
        ...callLogParticipantsStyle
    });

    const {
        backgroundColor,
        height,
        width,
        border,
        borderRadius,
        titleColor,
        titleFont,
        emptyTextColor,
        emptyTextFont,
        dateTextColor,
        dateTextFont,
        backIconTint,
        durationTextColor,
        durationTextFont
    } = _style;

    const loggedInUser = useRef(null);

    useEffect(() => {
        CometChat.getLoggedinUser()
            .then(u => {
                loggedInUser.current = u;
            })
            .catch(e => {
                onError && onError(e);
            });
    }, []);

    const DefaultSubtitleView = ({ participant }) => {
        if (SubtitleView)
            return SubtitleView(participant);
        return (
            <View style={[Style.row]}>
                <Text style={[{ color: durationTextColor }, durationTextFont]}>{CallUtils.convertMinutesToHoursMinutesSeconds(participant['totalDurationInMinutes'])}</Text>
            </View>
        );
    }

    const DefaultTailView = () => {
        return (
            <View style={[Style.row, { alignItems: "center" }]}>
                {call?.getInitiatedAt() && <CometChatDate timeStamp={call?.getInitiatedAt() * 1000} pattern={datePattern || 'timeFormat'} style={{ textColor: dateTextColor, textFont: dateTextFont }} />}
            </View>
        )
    }

    const onPress = (item) => {
        onItemPress && onItemPress(item);
        return;
    }

    const getCallDetails = (item) => {
        return {
            title: item['name'],
            avatarUrl: item['avatar']
        }
    }

    const _render = ({ item, index }) => {

        if (ListItemView)
            return <ListItemView participant={item} />

        const { title, avatarUrl } = getCallDetails(item);

        return <React.Fragment key={index}>
            <CometChatListItem
                id={item.sessionId}
                avatarName={title}
                title={title}
                listItemStyle={listItemStyle ? listItemStyle : { height: 70 }}
                headViewContainerStyle={
                    headViewContainerStyle
                        ? headViewContainerStyle
                        : { marginHorizontal: 10 }
                }
                bodyViewContainerStyle={
                    bodyViewContainerStyle ? bodyViewContainerStyle : {}
                }
                tailViewContainerStyle={
                    tailViewContainerStyle ? tailViewContainerStyle : {
                        marginHorizontal: 10,
                    }
                }
                avatarURL={avatarUrl}
                SubtitleView={() =>
                    SubtitleView ? <SubtitleView participant={item} /> : <DefaultSubtitleView participant={item} />
                }
                TailView={TailView ? () => <TailView participant={item} /> : () => <DefaultTailView />}
                avatarStyle={avatarStyle}
                onPress={() => onPress(item)}
                hideSeparator={hideSeperator}
            />
        </React.Fragment>
    }

    const EmptyView = () => {
        if (EmptyStateView)
            return <EmptyStateView />
        return (
            <View style={[Style.container]}>
                <Text style={[{ color: emptyTextColor, ...emptyTextFont }]}>{emptyStateText || localize("NO_PARTICIPANTS")}</Text>
            </View>
        )
    }

    return (
        <View style={{ backgroundColor, height, width, borderRadius, ...border }}>
            <View style={[Style.row, Style.headerStyle, { height: 60 }]}>
                <View style={Style.row}>
                    {
                        showBackButton ?
                            BackButton ??
                            <TouchableOpacity style={Style.imageStyle} onPress={onBack}>
                                <Image
                                    source={BackIcon}
                                    style={[Style.imageStyle, { tintColor: backIconTint }]}
                                />
                            </TouchableOpacity> : null
                    }
                    <Text style={[{ color: titleColor, ...titleFont }]}>{title}</Text>
                </View>
                <View style={Style.row}>
                    {
                        AppBarOptions && <AppBarOptions />
                    }
                </View>
            </View>
            {data.length == 0 ?
                <EmptyView /> :
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.sessionId}
                    renderItem={_render}
                />
            }
        </View>
    )
}
