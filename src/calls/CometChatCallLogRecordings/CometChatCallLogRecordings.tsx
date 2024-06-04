import { CometChat } from '@cometchat/chat-sdk-react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View, NativeModules, Platform, ActivityIndicator } from 'react-native'
import { StyleProp, ViewStyle } from "react-native/types";
import { CometChatContext, CometChatDate, CometChatListItem, DatePattern, ImageType, ListItemStyleInterface, localize } from '../../shared'
import { CallRecordingsStyle, CallRecordingsStyleInterface } from './CallLogRecordingsStyle'
import { BackIcon, Download } from "./resources";
import { Style } from './style'
import { CallUtils } from '../CallUtils'

const { FileManager } = NativeModules;
export interface CometChatCallLogRecordingsConfigurationInterface {
    title?: string,
    SubtitleView?: (param: { recording?: CometChat.BaseMessage }) => JSX.Element,
    TailView?: (param: { recording?: CometChat.BaseMessage }) => JSX.Element,
    ListItemView?: (param: { recording?: CometChat.BaseMessage }) => JSX.Element,
    AppBarOptions?: () => JSX.Element,
    /**
     * Recording list
     */
    data: any[],
    datePattern?: DatePattern,
    hideSeperator?: boolean,
    BackButton?: JSX.Element,
    showBackButton?: boolean,
    EmptyStateView?: () => JSX.Element,
    emptyStateText?: string,
    onItemPress?: (item: CometChat.BaseMessage) => void,
    onError?: (e: CometChat.CometChatException) => void,
    onBack?: () => void,
    hideDownloadButton?: boolean,
    onDownloadIconPress?: (prop: { recording: CometChat.BaseMessage }) => void,
    downloadIcon?: ImageType,
    listItemStyle?: ListItemStyleInterface,
    callLogRecordingsStyle?: CallRecordingsStyleInterface,
    bodyViewContainerStyle?: StyleProp<ViewStyle>,
    tailViewContainerStyle?: StyleProp<ViewStyle>,
}

export const CometChatRecordings = (props: CometChatCallLogRecordingsConfigurationInterface) => {

    const {
        title = localize("RECORDINGS"),
        SubtitleView,
        TailView,
        ListItemView,
        AppBarOptions,
        data,
        hideSeperator,
        BackButton,
        showBackButton,
        EmptyStateView,
        emptyStateText,
        onItemPress,
        onError,
        onBack,
        onDownloadIconPress,
        downloadIcon,
        listItemStyle,
        callLogRecordingsStyle,
        bodyViewContainerStyle,
        tailViewContainerStyle,
        datePattern,
        hideDownloadButton
    } = props;

    const { theme } = useContext(CometChatContext);
    const [processing, setProcessing] = useState(false);

    const _style = new CallRecordingsStyle({
        titleFont: theme.typography.heading,
        titleColor: theme.palette.getAccent(),
        backgroundColor: theme.palette.getBackgroundColor(),
        emptyTextColor: theme?.palette?.getAccent400(),
        emptyTextFont: theme?.typography?.subtitle1,
        backIconTint: theme.palette.getPrimary(),
        durationTextColor: theme.palette.getAccent(),
        durationTextFont: theme.typography.subtitle2,
        dateTextColor: theme.palette.getAccent(),
        dateTextFont: theme.typography.subtitle1,
        loadingIconTint: theme.palette.getPrimary(),
        ...callLogRecordingsStyle
    });

    const {
        backgroundColor,
        height,
        width,
        border,
        borderRadius,
        titleColor,
        titleFont,
        backIconTint,
        dateTextColor,
        dateTextFont,
        durationTextColor,
        durationTextFont,
        emptyTextColor,
        emptyTextFont,
        loadingIconTint,
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

    const DefaultSubtitleView = ({ recording }) => {
        if (SubtitleView)
            return SubtitleView(recording);
        return (
            <View style={[Style.row, { marginTop: 2 }]}>
                <Text style={{ color: durationTextColor, ...durationTextFont }}>
                    {
                        CallUtils.convertSecondsToHoursMinutesSeconds(recording['duration'])
                    }
                </Text>
            </View>
        );
    }

    const DefaultTailView = ({ recording }) => {
        const getFileName = (fileUrl) => {
            return (fileUrl.substring(fileUrl.lastIndexOf("/") + 1, fileUrl.length)).replace(" ", "_");
        }
        const _onDownloadIconPress = async () => {
            if (onDownloadIconPress) {
                onDownloadIconPress({ recording });
            } else {
                if (processing) return;

                setProcessing(true);
                console.log("DOWNLOAD by Default")
                try {
                    if (Platform.OS === "android") {
                        await FileManager.checkAndDownload(recording?.recording_url, getFileName(recording?.recording_url), async (isOpened: string) => {
                            console.log("android", isOpened);
                        });
                        setProcessing(false);
                    }
                    else {
                        FileManager.openFile(recording?.recording_url, getFileName(recording?.recording_url), async (isOpened: string) => {
                            console.log("ios", isOpened);
                            setProcessing(false);
                        });
                    }
                }
                catch (e) {
                    console.log(e);
                    setProcessing(false);
                }
            }
        }
        return (
            <View style={[Style.row, { alignItems: "center" }]}>
                <CometChatDate timeStamp={recording['startTime'] * 1000} pattern={datePattern || 'dayDateFormat'} style={{ textColor: dateTextColor, textFont: dateTextFont }} />
                {!hideDownloadButton && <View style={{ marginLeft: 5 }}>
                    {!processing ? <TouchableOpacity onPress={_onDownloadIconPress}>
                        <Image source={downloadIcon || Download} style={{ height: 20, width: 20, tintColor: loadingIconTint }} />
                    </TouchableOpacity> :
                        <ActivityIndicator size={"small"} color={loadingIconTint} />}
                </View>}
            </View>
        )
    }

    const onPress = (item) => {
        onItemPress && onItemPress(item);
        return;
    }

    const _render = ({ item, index }) => {

        if (ListItemView)
            return <ListItemView recording={item} />

        const title = item['rid'];

        return <React.Fragment key={index}>
            <CometChatListItem
                id={item.sessionId}
                title={title}
                listItemStyle={listItemStyle ? listItemStyle : { height: 70 }}
                bodyViewContainerStyle={
                    bodyViewContainerStyle ? bodyViewContainerStyle : {
                        marginHorizontal: 10
                    }
                }
                tailViewContainerStyle={
                    tailViewContainerStyle ? tailViewContainerStyle : {
                        marginHorizontal: 10
                    }
                }
                SubtitleView={() =>
                    SubtitleView ? <SubtitleView recording={item} /> : <DefaultSubtitleView recording={item} />
                }
                TailView={TailView ? () => <TailView recording={item} /> : () => <DefaultTailView recording={item} />}
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
                <Text style={[{ color: emptyTextColor, ...emptyTextFont }]}>{emptyStateText || localize("NO_RECORDINGS")}</Text>
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
