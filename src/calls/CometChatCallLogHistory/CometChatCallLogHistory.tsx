//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Image, StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native'
import { DatePattern, ImageType } from '../../shared/base/Types'
import { CometChatContext, CometChatDate, CometChatListItem, CometChatOptions, ListItemStyleInterface, localize } from '../../shared'
import { CallLogHistoryStyle, CallLogHistoryStyleInterface } from './CallLogHistoryStyle'
import { BackIcon } from "./resources";
import { Style } from './style'
import { CallingPackage } from '../CallingPackage'
import { CallUtils } from '../CallUtils'

const CometChatCalls = CallingPackage.CometChatCalls;

export interface CometChatCallLogHistoryInterface {
  title?: string,
  SubtitleView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
  TailView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
  ListItemView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
  AppBarOptions?: () => JSX.Element,
  options?: (param: { message: CometChat.BaseMessage }) => CometChatOptions[],
  callLogHistoryRequestBuilder?: any,
  user?: any,
  group?: any,
  hideSeperator?: boolean,
  datePattern?: DatePattern,
  dateSeparatorPattern?: DatePattern,
  BackButton?: JSX.Element,
  showBackButton?: boolean,
  EmptyStateView?: () => JSX.Element,
  emptyStateText?: string,
  ErrorStateView?: () => JSX.Element,
  errorStateText?: string,
  /**
   * @deprecated
   */
  loadingIcon?: ImageType,
  LoadingStateView?: () => JSX.Element,
  hideError?: boolean,
  onItemPress?: (item: CometChat.BaseMessage) => void,
  onError?: (e: CometChat.CometChatException) => void,
  onBack?: () => void,
  listItemStyle?: ListItemStyleInterface,
  callLogHistoryStyle?: CallLogHistoryStyleInterface,
  bodyViewContainerStyle?: StyleProp<ViewStyle>,
  tailViewContainerStyle?: StyleProp<ViewStyle>,
}

export const CometChatCallLogHistory = (props: CometChatCallLogHistoryInterface) => {

  const {
    title = localize("CALL_HISTORY"),
    SubtitleView,
    TailView,
    ListItemView,
    AppBarOptions,
    options,
    callLogHistoryRequestBuilder,
    user,
    group,
    hideSeperator,
    datePattern,
    dateSeparatorPattern,
    BackButton,
    showBackButton,
    EmptyStateView,
    emptyStateText,
    ErrorStateView,
    errorStateText,
    LoadingStateView,
    hideError,
    onItemPress,
    onError,
    onBack,
    listItemStyle,
    callLogHistoryStyle,
    bodyViewContainerStyle,
    tailViewContainerStyle,
  } = props;

  const { theme } = useContext(CometChatContext);

  const _style = new CallLogHistoryStyle({
    titleFont: theme.typography.heading,
    titleColor: theme.palette.getAccent(),
    backgroundColor: theme.palette.getBackgroundColor(),
    emptyTextColor: theme?.palette?.getAccent400(),
    emptyTextFont: theme?.typography?.subtitle1,
    errorTextColor: theme?.palette?.getError(),
    errorTextFont: theme?.typography?.subtitle1,
    backIconTint: theme.palette.getPrimary(),
    callDurationTextColor: theme.palette.getAccent(),
    callDurationTextFont: theme.typography.text1,
    dateTextColor: theme.palette.getAccent(),
    dateTextFont: theme.typography.subtitle1,
    loadingTint: theme.palette.getPrimary(),
    dateSeparatorTextColor: theme.palette.getAccent600(),
    dateSeparatorTextFont: theme.typography.text2,
    callStatusTextColor: theme.palette.getAccent(),
    callStatusTextFont: theme.typography.text1,
    ...callLogHistoryStyle
  });

  const {
    backgroundColor,
    height,
    width,
    border,
    borderRadius,
    titleColor,
    titleFont,
    loadingTint,
    backIconTint,
    callDurationTextColor,
    callDurationTextFont,
    callStatusTextColor,
    callStatusTextFont,
    dateSeparatorTextColor,
    dateSeparatorTextFont,
    dateTextColor,
    dateTextFont,
    emptyTextColor,
    emptyTextFont,
    errorTextColor,
    errorTextFont,
    separatorColor
  } = _style;

  const [list, setList] = useState<any[]>([]);
  const [listState, setListState] = useState<"loading" | "error" | "done">("loading");

  const activeSwipeRows = React.useRef<any>({});
  const loggedInUser = useRef<CometChat.User | any>(null);
  const callRequestBuilderRef = useRef<any>(null);

  function setRequestBuilder() {
    callRequestBuilderRef.current
    let builder = callLogHistoryRequestBuilder ?? new CometChatCalls.CallLogRequestBuilder()
      .setLimit(30)
      // .setUid("superhero2")
      .setAuthToken(loggedInUser.current?.getAuthToken() || "")
      // .setHasRecording(true)
      .setCallCategory("call")
      // .setCallDirection("outgoing")
      // .setCallStatus("rejected")
      // .setCallType("video")
      // .setGuid("group_123456")
      ;
    if (user) {
      builder = builder.setUid(user?.getUid());
    } else if (group) {
      builder = builder.setGuid(group?.getGuid());
    }
    callRequestBuilderRef.current = builder.build();
  }

  const fetchCallLogHistory = () => {
    setListState("loading");
    callRequestBuilderRef.current.fetchNext()
      .then((CallLogHistory: any) => {
        console.log(CallLogHistory.length);
        if (CallLogHistory.length > 0) {
          setList([...list, ...CallLogHistory]);
        }
        setListState("done");
      })
      .catch((err: any) => {
        onError && onError(err);
        setListState("error");
      });
  }

  useEffect(() => {
    CometChat.getLoggedinUser()
      .then((u: any) => {
        loggedInUser.current = u;
        setRequestBuilder();
        fetchCallLogHistory();
      })
      .catch((e: any) => {
        onError && onError(e);
      });
  }, []);

  const DefaultSubtitleView = ({ call }: any) => {

    if (SubtitleView)
      return SubtitleView(call);
    return (
      <View style={[Style.row]}>
        <View style={{ width: 70 }}>
          <CometChatDate timeStamp={call['initiatedAt'] * 1000} pattern={datePattern || 'timeFormat'} style={{ textColor: dateTextColor, textFont: dateTextFont }} />
        </View>
        <Text style={[{ color: callStatusTextColor, marginStart: 2 }, callStatusTextFont] as TextStyle}>
          {
            CallUtils.getCallStatus(call as CometChat.Call, loggedInUser.current)
          }
        </Text>
      </View>
    );
  }

  const DefaultTailView = ({ call }: any) => {
    return (
      <View style={[Style.row, { alignItems: "center" }]}>
        <Text style={[{ color: callDurationTextColor, marginStart: 2 }, callDurationTextFont] as TextStyle}>
          {
            CallUtils.convertMinutesToHoursMinutesSeconds(call['totalDurationInMinutes'])
          }
        </Text>
      </View>
    )
  }

  const onPress = (item: any) => {
    onItemPress && onItemPress(item);
    return;
  }

  const getInitiatedAtTimestamp = (item: { [x: string]: number }) => {
    return item['initiatedAt'] * 1000;
  }

  const _render = ({ item, index }: any) => {

    if (ListItemView)
      return <ListItemView call={item} />

    let seperatorView: JSX.Element | null = null;
    const previousMessageDate = list[index - 1] ? new Date(getInitiatedAtTimestamp(list[index - 1])) : null;
    const currentMessageDate = new Date(getInitiatedAtTimestamp(item));

    const currentDate = isNaN(currentMessageDate.getDate()) ? undefined : `${currentMessageDate.getDate()}-${currentMessageDate.getMonth()}-${currentMessageDate.getFullYear()}`;

    const previousDate = `${previousMessageDate?.getDate()}-${previousMessageDate?.getMonth()}-${previousMessageDate?.getFullYear()}`;

    if (currentDate != undefined && previousDate !== currentDate) {
      seperatorView = (
        <View style={{ marginHorizontal: 10, marginVertical: 5 }}>
          <CometChatDate
            timeStamp={getInitiatedAtTimestamp(item)}
            pattern={dateSeparatorPattern || "dayDateFormat"}
            style={{ textColor: dateSeparatorTextColor, textFont: dateSeparatorTextFont }}
          />
        </View>
      )
    }

    return <React.Fragment key={index}>
      {seperatorView}
      <CometChatListItem
        id={item.sessionId}
        listItemStyle={listItemStyle ? listItemStyle : { height: 50 }}
        bodyViewContainerStyle={
          bodyViewContainerStyle ? bodyViewContainerStyle : {
            marginHorizontal: 10,
          }
        }
        tailViewContainerStyle={
          tailViewContainerStyle ? tailViewContainerStyle : {
            marginHorizontal: 10,
          }
        }
        SubtitleView={() =>
          SubtitleView ? <SubtitleView {...item} /> : <DefaultSubtitleView call={item} />
        }
        TailView={TailView ? () => <TailView call={item} /> : () => <DefaultTailView call={item} />}
        options={() => options && options(item) || []}
        activeSwipeRows={activeSwipeRows.current}
        rowOpens={(id) => {
            Object.keys(activeSwipeRows.current).forEach(key => {
                if(id !== key && activeSwipeRows.current[key]) {
                    activeSwipeRows.current[key]?.current?.closeRow?.()
                    delete activeSwipeRows.current[key]
                }
            })
        }}
        onPress={() => onPress(item)}
        hideSeparator={hideSeperator}
        separatorColor={separatorColor}
      />
    </React.Fragment>
  }

  const EmptyView = () => {
    if (EmptyStateView)
      return <EmptyStateView />
    return (
      <View style={[Style.container]}>
        <Text style={[{ color: emptyTextColor, ...emptyTextFont }] as TextStyle}>{emptyStateText || localize("NO_CALL_HISTORY")}</Text>
      </View>
    )
  }

  const ErrorView = () => {
    if (hideError) return null;
    if (ErrorStateView)
      return <ErrorStateView />
    return <View style={[Style.container]}>
      <Text style={[{ color: errorTextColor, ...errorTextFont }] as TextStyle}>{errorStateText || localize("SOMETHING_WRONG")}</Text>
    </View>
  }

  const LoadingView = () => {
    if (LoadingStateView)
      return <LoadingStateView />
    return <View style={[Style.container]}>
      <ActivityIndicator size={"large"} color={loadingTint} />
    </View>
  }

  return (
    <View style={{ backgroundColor, height, width, borderRadius, ...border } as ViewStyle}>
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
          <Text style={[{ color: titleColor, ...titleFont }] as TextStyle}>{title}</Text>
        </View>
        <View style={Style.row}>
          {
            AppBarOptions && <AppBarOptions />
          }
        </View>
      </View>
      {
        listState == "loading" && list.length == 0 ?
          <LoadingView /> :
          listState == "error" && list.length == 0 ?
            <ErrorView /> :
            list.length == 0 ?
              <EmptyView /> :
              <FlatList
                data={list}
                keyExtractor={(item) => item.sessionId}
                renderItem={_render}
                onEndReached={fetchCallLogHistory}
              />
      }
    </View>
  )
}
