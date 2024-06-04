import { CometChat } from '@cometchat/chat-sdk-react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { FlatList, Image, ImageStyle, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import { ImageType, SelectionMode } from '../../shared/base/Types'
import { AvatarStyleInterface, CometChatContext, CometChatDate, CometChatList, CometChatListItem, CometChatOptions, ListItemStyleInterface, localize } from '../../shared'
import { StatusIndicatorStyleInterface } from '../../shared/views/CometChatStatusIndicator/StatusIndicatorStyle'
import { CallHistoryStyle, CallHistoryStyleInterface } from './CallHistoryStyle'
import { CometChatUIEventHandler } from '../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler'
import { AudioCallIcon, VideoCallIcon, LoadingIcon, DetailIcon, BackIcon, CheckIcon, SelectionIcon } from "./resources";
import { CallContstatnts } from '../../shared/constants/UIKitConstants'
import { Style } from './style'
import { messageStatus } from '../../shared/utils/CometChatMessageHelper'
import { MessageCategoryConstants } from '../../shared/constants/UIKitConstants'
import { MessageTypeConstants } from '../../shared/constants/UIKitConstants'

const callListenerId = "uiEvents_" + new Date().getTime();

interface CometChatCallHistoryInterface {
  title?: string,
  SubtitleView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
  ListItemView?: (param: { call?: CometChat.BaseMessage }) => JSX.Element,
  AppBarOptions?: () => JSX.Element,
  options?: (param: { message: CometChat.BaseMessage }) => CometChatOptions[],
  messageRequestBuilder?: CometChat.MessagesRequestBuilder,
  hideSeperator?: boolean,
  BackButton?: JSX.Element,
  showBackButton?: boolean,
  selectionMode?: SelectionMode,
  onSelection?: (items: Array<CometChat.BaseMessage>) => void,
  EmptyStateView?: () => JSX.Element,
  emptyStateText?: string,
  ErrorStateView?: () => JSX.Element,
  errorStateText?: string,
  loadingIcon?: ImageType,
  LoadingStateView?: () => JSX.Element,
  hideError?: boolean,
  onItemPress?: (item: CometChat.BaseMessage) => void,
  onItemLongPress?: (item: CometChat.BaseMessage) => void,
  onError?: (e: CometChat.CometChatException) => void,
  onBack?: () => void,
  onInfoIconPress?: (prop: { call: CometChat.BaseMessage }) => void,
  infoIcon?: ImageStyle,
  avatarStyle?: AvatarStyleInterface,
  statusIndicatorStyle?: StatusIndicatorStyleInterface,
  listItemStyle?: ListItemStyleInterface,
  callHistoryStyle?: CallHistoryStyleInterface,
  headViewContainerStyle?: StyleProp<ViewStyle>,
  bodyViewContainerStyle?: StyleProp<ViewStyle>,
  tailViewContainerStyle?: StyleProp<ViewStyle>,
}

const CometChatCallHistory = (props: CometChatCallHistoryInterface) => {

  const {
    title = localize("CALL_HISTORY"),
    SubtitleView,
    ListItemView,
    AppBarOptions,
    options,
    messageRequestBuilder,
    hideSeperator = false,
    BackButton,
    showBackButton = true,
    selectionMode = "multiple",
    onSelection,
    EmptyStateView,
    emptyStateText,
    ErrorStateView,
    errorStateText,
    loadingIcon,
    LoadingStateView,
    hideError,
    onItemPress,
    onItemLongPress,
    onInfoIconPress,
    infoIcon,
    onError,
    onBack,
    avatarStyle,
    statusIndicatorStyle,
    listItemStyle,
    callHistoryStyle,
    headViewContainerStyle,
    bodyViewContainerStyle,
    tailViewContainerStyle,
  } = props;

  const { theme } = useContext(CometChatContext);

  const _style = new CallHistoryStyle({
    titleFont: theme.typography.heading,
    titleColor: theme.palette.getAccent(),
    backgroundColor: theme.palette.getBackgroundColor(),
    ...callHistoryStyle
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
  } = _style;

  const [list, setList] = useState([]);
  const [listState, setListState] = useState<"loading" | "error" | "done">("loading");
  const [selecting, setSelecting] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  const loggedInUser = useRef(null);
  const callRequestBuilderRef = useRef((messageRequestBuilder && messageRequestBuilder.build()) ?? new CometChat.MessagesRequestBuilder()
    .setCategories([MessageCategoryConstants.call, MessageCategoryConstants.custom])
    .setTypes([MessageTypeConstants.audio, MessageTypeConstants.video, MessageTypeConstants.meeting])
    .setLimit(30)
    .build());

  const fetchCallHistory = () => {
    setListState("loading");
    callRequestBuilderRef.current.fetchPrevious()
      .then(callLogs => {
        console.log(callLogs.length);
        setList([...list, ...callLogs.reverse()]);
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
        fetchCallHistory();
      })
      .catch(e => {
        onError(e);
      });
    CometChat.addCallListener(
      callListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          addNewCall(call);
        },
        onOutgoingCallAccepted: (call) => {
          addNewCall(call);
        },
        onOutgoingCallRejected: (call) => {
          addNewCall(call);
        },
        onIncomingCallCancelled: (call) => {
          addNewCall(call);
        }
      })
    );

    CometChatUIEventHandler.addMessageListener(
      callListenerId,
      {
        ccMessageSent: ({ message, status }) => {
          status == messageStatus.success && addNewCall(message)
        }
      }
    )

    CometChatUIEventHandler.addCallListener(
      callListenerId,
      {
        ccOutgoingCall: ({ call }) => { addNewCall(call) },
        ccCallAccepted: ({ call }) => { addNewCall(call) },
        ccCallRejected: ({ call }) => { addNewCall(call) },
        ccCallEnded: ({ call }) => { addNewCall(call) }
      }
    )

    return () => {
      CometChat.removeCallListener(callListenerId);
      CometChatUIEventHandler.removeMessageListener(callListenerId);
    }
  }, []);

  const addNewCall = (call) => {
    setList([call, ...list]);
  }

  const DefaultSubtitleView = ({ call }) => {
    if (SubtitleView)
      return SubtitleView(call);
    return (
      <View style={[Style.row]}>
        <Image source={call['type'] == CallContstatnts.audioCall ? AudioCallIcon : VideoCallIcon} style={{ height: 16, width: 16, alignSelf: "center", tintColor: theme.palette.getAccent700() }} />
        <Text style={{ color: theme.palette.getAccent(), marginStart: 8 }}>
          {
            call['type'] == "meeting" ?
              "conference call" :
              call['status']
          }
        </Text>
      </View>
    );
  }

  const TailView = ({ call }) => {
    return (
      <View style={[Style.row, { alignItems: "center" }]}>
        <CometChatDate timeStamp={call['updatedAt'] * 1000} pattern={'dayDateFormat'} style={{ textColor: theme.palette.getAccent() }} />
        <TouchableOpacity onPress={() => onInfoIconPress && onInfoIconPress({ call })} style={{ marginStart: 8 }}>
          <Image source={infoIcon || DetailIcon} style={{ height: 24, width: 24, tintColor: theme.palette.getPrimary() }} />
        </TouchableOpacity>
      </View>
    )
  }

  //returns index from selected items
  const isSelected = (item) => {
    return Object.keys(selectedItems).includes(item.id);
  }

  const longPress = (item) => {
    if (onItemLongPress) {
      onItemLongPress(item);
      return;
    }

    setSelecting(true);
    if (selectionMode == "none") return;

    if (selectionMode == "single")
      setSelectedItems({ [item['id']]: item });
    else {
      // let index = isSelected(item);
      if (isSelected(item)) {
        let tmp = { ...selectedItems };
        delete tmp[item.id];
        setSelectedItems({ [tmp['id']]: tmp });
      } else {
        setSelectedItems({
          ...selectedItems,
          [item['id']]: item
        });
      }
    }
  }

  const onPress = (item) => {
    if (!selecting) {
      onItemPress && onItemPress(item);
      return;
    }
    //add to selected
    switch (selectionMode) {
      case "single":
        setSelectedItems({ [item['id']]: item });
        break;
      case "multiple":
        if (isSelected(item)) {
          let tmp = { ...selectedItems };
          delete tmp[item.id];
          setSelectedItems(tmp);
        } else {
          setSelectedItems({
            ...selectedItems,
            [item['id']]: item
          });
        }
        break;
    }
  }

  const getCallDetails = (call) => {
    const { category, type, callInitiator, callReceiver, receiverId, receiver } = call;

    if (category == "custom" && type == "meeting") {
      return {
        title: receiver['name'],
        avatarUrl: receiver['icon']
      }
    } else if (category == "call") {
      return {
        title: loggedInUser.current['uid'] == receiverId ? callInitiator['name'] : callReceiver['name'],
        avatarUrl: loggedInUser.current['uid'] == receiverId ? callInitiator['avatar'] : callReceiver['avatar'],
      }
    }
    return { title: "", avatarUrl: undefined }
  }

  const _render = ({ item, index }) => {

    if (ListItemView)
      return <ListItemView call={item} />

    const { title, avatarUrl } = getCallDetails(item);

    return <CometChatListItem
      id={item.id}
      avatarName={title}
      title={title}
      listItemStyle={listItemStyle ? listItemStyle : { height: 70 }}
      headViewContainerStyle={
        headViewContainerStyle
          ? headViewContainerStyle
          : { marginHorizontal: 9 }
      }
      bodyViewContainerStyle={
        bodyViewContainerStyle ? bodyViewContainerStyle : {}
      }
      tailViewContainerStyle={
        tailViewContainerStyle ? tailViewContainerStyle : {}
      }
      avatarURL={avatarUrl}
      statusIndicatorIcon={
        selectedItems[item.id] && CheckIcon
      }
      SubtitleView={() =>
        SubtitleView ? <SubtitleView {...item} /> : <DefaultSubtitleView call={item} />
      }
      TailView={TailView ? () => <TailView call={item} /> : null}
      statusIndicatorStyle={
        selectedItems[item.id]
          ? {
            ...(statusIndicatorStyle as object),
            borderRadius: 10,
            height: 20,
            width: 20,
          }
          : statusIndicatorStyle
      }
      avatarStyle={avatarStyle}
      options={() => options && options(item)}
      onPress={() => onPress(item)}
      onLongPress={() => longPress(item)}
      hideSeparator={hideSeperator}
    />
  }

  const EmptyView = () => {
    if (EmptyStateView)
      return <EmptyStateView />
    return (
      <View style={[Style.container]}>
        <Text>{emptyStateText || localize("NO_CALL_HISTORY")}</Text>
      </View>
    )
  }

  const ErrorView = () => {
    if (hideError) return null;
    if (ErrorStateView)
      return <ErrorStateView />
    return <View style={[Style.container]}>
      <Text>{errorStateText || localize("SOMETHING_WRONG")}</Text>
    </View>
  }

  const LoadingView = () => {
    if (LoadingStateView)
      return <LoadingStateView />
    return <View style={[Style.container]}>
      <Image source={loadingIcon || LoadingIcon} style={[Style.imageStyle, { tintColor: "black" || loadingTint }]} />
    </View>
  }

  const selection = () => {
    if (onSelection)
      onSelection(Object.values(selectedItems));
    setSelecting(false);
    setSelectedItems({});
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
          {
            selecting ?
              <TouchableOpacity onPress={selection}>
                <Image
                  source={SelectionIcon}
                  resizeMode='contain'
                  style={[Style.imageStyle, { tintColor: theme.palette.getPrimary() }]}
                />
              </TouchableOpacity> : null
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
                keyExtractor={(item) => item.id}
                renderItem={_render}
                onEndReached={fetchCallHistory}
              />
      }
    </View>
  )
}
