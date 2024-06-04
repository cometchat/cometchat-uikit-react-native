import { CometChat } from '@cometchat/chat-sdk-react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { StyleProp, ViewStyle } from "react-native/types";
import { AvatarStyleInterface, CometChatContext, CometChatDate, CometChatListItem, CometChatOptions, DatePattern, ImageType, ListItemStyleInterface, localize } from '../../shared'
import { CallLogsStyle, CallLogsStyleInterface } from './CallLogsStyle'
import { CometChatUIEventHandler } from '../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler'
import { LoadingIcon, DetailIcon, BackIcon, IncomingCallIcon, IncomingVideoIcon, MissedCallIcon, MissedVideoIcon, OutgoingCallIcon, OutgoingVideoIcon } from "./resources";
import { CallTypeConstants } from '../../shared/constants/UIKitConstants'
import { Style } from './style'
import { CallingPackage } from '../CallingPackage'
import { CallUtils } from '../CallUtils'
import { CallUIEvents } from '../CallEvents'
import { CometChatOutgoingCall, CometChatOutgoingCallInterface } from '../CometChatOutgoingCall'

const listenerId = "callEventListener_" + new Date().getTime();
const CometChatCalls = CallingPackage.CometChatCalls;

export interface CometChatCallLogsConfigurationInterface {
  title?: string,
  SubtitleView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
  ListItemView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
  TailView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
  AppBarOptions?: () => JSX.Element,
  options?: (param: { message: CometChat.BaseMessage }) => CometChatOptions[],
  callRequestBuilder?: any,
  datePattern: DatePattern,
  dateSeparatorPattern: DatePattern,
  hideSeperator?: boolean,
  BackButton?: JSX.Element,
  showBackButton?: boolean,
  EmptyStateView?: () => JSX.Element,
  emptyStateText?: string,
  ErrorStateView?: () => JSX.Element,
  errorStateText?: string,
  loadingIcon?: ImageType,
  LoadingStateView?: () => JSX.Element,
  hideError?: boolean,
  onItemPress?: (item: CometChat.BaseMessage) => void,
  onError?: (e: CometChat.CometChatException) => void,
  onBack?: () => void,
  onInfoIconPress?: (prop: { call: CometChat.BaseMessage }) => void,
  infoIcon?: ImageType,
  avatarStyle?: AvatarStyleInterface,
  listItemStyle?: ListItemStyleInterface,
  callLogsStyle?: CallLogsStyleInterface,
  headViewContainerStyle?: StyleProp<ViewStyle>,
  bodyViewContainerStyle?: StyleProp<ViewStyle>,
  tailViewContainerStyle?: StyleProp<ViewStyle>,
  missedAudioCallIconUrl?: string,
  missedVideoCallIconUrl?: string,
  incomingAudioCallIconUrl?: string,
  incomingVideoCallIconUrl?: string,
  outgoingAudioCallIconUrl?: string,
  outgoingVideoCallIconUrl?: string,
  outgoingCallConfiguration?: CometChatOutgoingCallInterface,
}

export const CometChatCallLogs = (props: CometChatCallLogsConfigurationInterface) => {

  const {
    title = localize("CALL_LOGS"),
    SubtitleView,
    ListItemView,
    TailView,
    AppBarOptions,
    options,
    callRequestBuilder,
    datePattern,
    dateSeparatorPattern,
    hideSeperator,
    BackButton,
    showBackButton,
    EmptyStateView,
    emptyStateText,
    ErrorStateView,
    errorStateText,
    loadingIcon,
    LoadingStateView,
    hideError,
    onItemPress,
    onInfoIconPress,
    infoIcon,
    onError,
    onBack,
    avatarStyle,
    listItemStyle,
    callLogsStyle,
    headViewContainerStyle,
    bodyViewContainerStyle,
    tailViewContainerStyle,
    missedAudioCallIconUrl,
    missedVideoCallIconUrl,
    incomingAudioCallIconUrl,
    incomingVideoCallIconUrl,
    outgoingAudioCallIconUrl,
    outgoingVideoCallIconUrl,
    outgoingCallConfiguration,
  } = props;

  const { theme } = useContext(CometChatContext);

  const _style = new CallLogsStyle({
    titleFont: theme.typography.heading,
    titleColor: theme.palette.getAccent(),
    backgroundColor: theme.palette.getBackgroundColor(),
    emptyTextColor: theme?.palette?.getAccent400(),
    emptyTextFont: theme?.typography?.subtitle1,
    errorTextColor: theme?.palette?.getError(),
    errorTextFont: theme?.typography?.subtitle1,
    loadingTint: theme?.palette.getAccent700(),
    infoIconTint: theme.palette.getPrimary(),
    subtitleTextColor: theme.palette.getAccent(),
    subtitleTextFont: theme.typography.text2,
    dateSeparatorTextColor: theme.palette.getAccent600(),
    dateSeparatorTextFont: theme.typography.text2,
    dateTextColor: theme.palette.getAccent(),
    dateTextFont: theme.typography.text2,
    ...callLogsStyle
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
    dateSeparatorTextColor,
    dateSeparatorTextFont,
    dateTextColor,
    dateTextFont,
    emptyTextColor,
    emptyTextFont,
    errorTextColor,
    errorTextFont,
    incomingCallIconTint,
    infoIconTint,
    missedCallIconTint,
    outgoingCallIconTint,
    separatorColor,
    subtitleTextColor,
    subtitleTextFont
  } = _style;

  const [list, setList] = useState([]);
  const [listState, setListState] = useState<"loading" | "error" | "done">("loading");
  const [showOutgoingCallScreen, setShowOutgoingCallScreen] = useState(false);

  const loggedInUser = useRef(null);
  const callRequestBuilderRef = useRef(null);
  const outGoingCall = useRef<CometChat.Call | CometChat.CustomMessage>(null);

  function setRequestBuilder() {
    callRequestBuilderRef.current = (callRequestBuilder && callRequestBuilder.build()) ??
      new CometChatCalls.CallLogRequestBuilder()
        .setLimit(30)
        .setAuthToken(loggedInUser.current.getAuthToken() || "")
        .setCallCategory("call")
        .build()
  }

  const fetchCallLogs = () => {
    setListState("loading");
    callRequestBuilderRef.current.fetchNext()
      .then(callLogs => {
        console.log(callLogs.length);
        if (callLogs.length > 0) {
          setList([...list, ...callLogs]);
        }
        setListState("done");
      })
      .catch(err => {
        onError && onError(err);
        setListState("error");
      });
  }

  useEffect(() => {
    CometChat.getLoggedinUser()
      .then(u => {
        loggedInUser.current = u;
        setRequestBuilder();
        fetchCallLogs();
      })
      .catch(e => {
        onError && onError(e);
      });
    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onOutgoingCallRejected: (call) => {
          setShowOutgoingCallScreen(false);
          outGoingCall.current = null;
        },
      })
    )

    CometChatUIEventHandler.addCallListener(
      listenerId,
      {
        ccCallRejected: (call) => {
          outGoingCall.current = null;
          setShowOutgoingCallScreen(false);
        },
        ccCallEnded: () => {
          outGoingCall.current = null;
          setShowOutgoingCallScreen(false);
        },
      }
    );

  }, []);

  const DefaultSubtitleView = ({ call }) => {
    function getCallDirectionIcon(call) {
      const missedCall = CallUtils.isMissedCall(call, loggedInUser.current);
      const callType = call.getType();
      let icon, tintColor;
      if (missedCall) {
        tintColor = missedCallIconTint || theme.palette.getAccent700();
        if (callType === CometChat.CALL_TYPE.AUDIO) {
          icon = missedAudioCallIconUrl || MissedCallIcon;
        } else {
          icon = missedVideoCallIconUrl || MissedVideoIcon;
        }
      } else if (call.getInitiator().getUid() === loggedInUser.current?.getUid()) {
        tintColor = outgoingCallIconTint || theme.palette.getAccent700();
        if (callType === CometChat.CALL_TYPE.AUDIO) {
          icon = outgoingAudioCallIconUrl || OutgoingCallIcon;
        } else {
          icon = outgoingVideoCallIconUrl || OutgoingVideoIcon;
        }
      } else {
        tintColor = incomingCallIconTint || theme.palette.getAccent700();
        if (callType === CometChat.CALL_TYPE.AUDIO) {
          icon = incomingAudioCallIconUrl || IncomingCallIcon;
        } else {
          icon = incomingVideoCallIconUrl || IncomingVideoIcon;
        }
      }
      return { icon, tintColor };
    }

    if (SubtitleView)
      return SubtitleView(call);
    return (
      <View style={[Style.row]}>
        <Image source={getCallDirectionIcon(call).icon} style={{ height: 20, width: 20, alignSelf: "center", tintColor: getCallDirectionIcon(call).tintColor }} />
        <Text style={[{ color: subtitleTextColor, marginStart: 2 }, subtitleTextFont]}>
          {
            CallUtils.getCallStatus(call as CometChat.Call, loggedInUser.current)
          }
        </Text>
      </View>
    );
  }

  const DeafultTailView = ({ call }) => {
    return (
      <View style={[Style.row, { alignItems: "center" }]}>
        <CometChatDate timeStamp={call['initiatedAt'] * 1000} pattern={datePattern || 'timeFormat'} style={{ textColor: dateTextColor, textFont: dateTextFont }} />
        {onInfoIconPress && <TouchableOpacity onPress={() => onInfoIconPress && onInfoIconPress({ call })} style={{ marginStart: 8 }}>
          <Image source={infoIcon || DetailIcon} style={{ height: 24, width: 24, tintColor: infoIconTint }} />
        </TouchableOpacity>}
      </View>
    )
  }

  const makeCall = (call, type) => {
    if (type == CallTypeConstants.audio || type == CallTypeConstants.video) {
      let user = call?.getReceiverType() == "user" ? loggedInUser.current?.getUid() === call?.getInitiator()?.getUid() ? call.getReceiver() : call?.getInitiator() : undefined
      let group = call?.getReceiverType() == "group" ? loggedInUser.current?.getUid() === call?.getInitiator()?.getUid() ? call.getReceiver() : call?.getInitiator() : undefined

      var receiverID = user ? user.getUid() : group ? group.getGuid() : undefined;
      var callType = type;
      console.log({ receiverID, callType })
      var receiverType = user ? CometChat.RECEIVER_TYPE.USER : group ? CometChat.RECEIVER_TYPE.GROUP : undefined
      console.log({ receiverType })
      if (!receiverID || !receiverType)
        return;

      var call = new CometChat.Call(receiverID, callType, receiverType, CometChat.CATEGORY_CALL);

      CometChat.initiateCall(call).then(
        initiatedCall => {
          outGoingCall.current = initiatedCall;
          setShowOutgoingCallScreen(true);
          CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccOutgoingCall, { call: outGoingCall.current });
        },
        error => {
          console.log("Call initialization failed with exception:", error);
          CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallFailled, { call });
          onError && onError(error);
        }
      );
    } else {
      console.log("Invalid call type.", type, CallTypeConstants.audio, type != CallTypeConstants.audio || type != CallTypeConstants.video);
      return;
    }
  }

  const onPress = (item) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      if (item?.getReceiverType() == "user") {
        console.log("MAKE A CALL");
        makeCall(item, item.getType());
      }
    }
  }

  const getCallDetails = (call) => {
    const { mode, initiator, receiver, receiverType } = call;

    if (mode == "meet") {
      return {
        title: receiver['name'],
        avatarUrl: receiver['icon']
      }
    } else if (mode == "call") {
      
      return {
        title: receiverType === 'group' ? receiver['name'] : loggedInUser.current['uid'] == initiator?.getUid() ? receiver['name'] : initiator['name'],
        avatarUrl: receiverType === 'group' ? receiver['avatar'] : loggedInUser.current['uid'] == initiator?.getUid() ? receiver['avatar'] : initiator['avatar'],
      }
    }
    return { title: "", avatarUrl: undefined }
  }

  const getInitiatedAtTimestamp = (item) => {
    return item['initiatedAt'] * 1000;
  }

  const _render = ({ item, index }) => {

    if (ListItemView)
      return <ListItemView call={item} />

    const { title, avatarUrl } = getCallDetails(item);

    let seperatorView = null;
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
        avatarName={title}
        title={title}
        listItemStyle={listItemStyle ? listItemStyle : { height: 70, titleColor: CallUtils.isMissedCall(item, loggedInUser.current) ? theme.palette.getError() : undefined }}
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
          SubtitleView ? <SubtitleView {...item} /> : <DefaultSubtitleView call={item} />
        }
        TailView={TailView ? () => <TailView call={item} /> : () => <DeafultTailView call={item} />}
        avatarStyle={avatarStyle}
        options={() => options && options(item)}
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
        <Text style={[{ color: emptyTextColor }, emptyTextFont]}>{emptyStateText || localize("NO_CALL_HISTORY")}</Text>
      </View>
    )
  }

  const ErrorView = () => {
    if (hideError) return null;
    if (ErrorStateView)
      return <ErrorStateView />
    return <View style={[Style.container]}>
      <Text style={[{ color: errorTextColor }, errorTextFont]}>{errorStateText || localize("SOMETHING_WRONG")}</Text>
    </View>
  }

  const LoadingView = () => {
    if (LoadingStateView)
      return <LoadingStateView />
    return <View style={[Style.container]}>
      <Image source={loadingIcon || LoadingIcon} style={[Style.imageStyle, { tintColor: loadingTint }]} />
    </View>
  }

  return (
    <View style={{ backgroundColor, height, width, borderRadius, ...border }}>
      <>
        <View style={[Style.row, Style.headerStyle, { height: 60 }]}>
          <View style={Style.row}>
            {
              showBackButton ?
                BackButton ??
                <TouchableOpacity style={Style.imageStyle} onPress={onBack}>
                  <Image
                    source={BackIcon}
                    style={[Style.imageStyle, { tintColor: theme.palette.getPrimary() }]}
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
                  onEndReached={fetchCallLogs}
                />
        }
      </>
      {
        showOutgoingCallScreen && <CometChatOutgoingCall
          call={outGoingCall.current}
          onDeclineButtonPressed={(call) => {
            CometChat.rejectCall(call['sessionId'], CometChat.CALL_STATUS.CANCELLED).then(
              rejectedCall => {
                CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallRejected, { call: rejectedCall });
              },
              err => {
                onError && onError(err);
              }
            );
          }}
          {...outgoingCallConfiguration}
        />
      }
    </View>
  )
}
