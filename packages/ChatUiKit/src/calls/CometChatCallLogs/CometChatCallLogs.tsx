import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  GestureResponderEvent,
  ActivityIndicator,
} from "react-native";
import { CometChatAvatar, CometChatRetryButton } from "../../shared";
import { CallTypeConstants } from "../../shared/constants/UIKitConstants";
import { CometChatUIEventHandler } from "../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { CallUIEvents } from "../CallEvents";
import { CallingPackage } from "../CallingPackage";
import { CallUtils } from "../CallUtils";
import { CometChatOutgoingCall, CometChatOutgoingCallInterface } from "../CometChatOutgoingCall";
import { BackIcon } from "./resources";
import { Style } from "./style";
import { Icon } from "../../shared/icons/Icon";
import { useTheme } from "../../theme";
import { DateHelper, dateHelperInstance } from "../../shared/helper/dateHelper";
import { ErrorEmptyView } from "../../shared/views/ErrorEmptyView/ErrorEmptyView";
import { Skeleton } from "./Skeleton";
import { CometChatTheme } from "../../theme/type";
import { deepMerge } from "../../shared/helper/helperFunctions";
import { DeepPartial, ValueOf } from "../../shared/helper/types";
import { CometChatTooltipMenu, MenuItemInterface } from "../../shared/views/CometChatTooltipMenu";
import { JSX } from "react";
import { useCometChatTranslation, useLocalizedDate, LocalizedDateHelper } from "../../shared";

const listenerId = "callEventListener_" + new Date().getTime();
const CometChatCalls = CallingPackage.CometChatCalls;

/**
 * Props for configuring the CometChatCallLogs component.
 *
 * @interface CometChatCallLogsConfigurationInterface
 */
export interface CometChatCallLogsConfigurationInterface {
  /** Custom component to render as the leading view for each call log item */
  LeadingView?: (call?: any) => JSX.Element;
  /** Custom component to render as the title view for each call log item */
  TitleView?: (call?: any) => JSX.Element;
  /** Custom component to render as the subtitle view for each call log item */
  SubtitleView?: (call?: any) => JSX.Element;
  /** Custom component to render as the entire item view for each call log */
  ItemView?: (call?: any) => JSX.Element;
  /** Custom component to render as the trailing view for each call log item */
  TrailingView?: (call?: any, defaultOnPress?: (call: any) => void) => JSX.Element;
  /** Custom options to render in the AppBar */
  AppBarOptions?: () => JSX.Element;
  /** Builder for custom call log requests */
  callLogRequestBuilder?: any;
  /** Date format pattern for call logs */
  datePattern?: ValueOf<typeof DateHelper.patterns>;
  /** Flag to hide the back button in the header */
  showBackButton?: boolean;
  /** Custom component to render when the call log list is empty */
  EmptyView?: () => JSX.Element;
  /** Custom component to render in case of an error */
  ErrorView?: (e: CometChat.CometChatException) => JSX.Element;
  /** Custom component to render while loading call logs */
  LoadingView?: () => JSX.Element;
  /** Flag to hide the error view */
  hideError?: boolean;
  /** Callback when the call icon is pressed */
  onCallIconPress?: (item: any) => void;
  /** Callback for handling errors */
  onError?: (e: CometChat.CometChatException) => void;
  /** Callback for when the back button is pressed */
  onBack?: () => void;
  /**
   * Callback for when a call log item is pressed.
   * Receives the raw call log object.
   */
  onItemPress?: (call: any) => void;
  /** Custom style overrides for the call logs */
  style?: DeepPartial<CometChatTheme["callLogsStyles"]>;
  /** Configuration for outgoing calls */
  outgoingCallConfiguration?: CometChatOutgoingCallInterface;
  /** Callback when the list is fetched and loaded */
  onLoad?: (list: any[]) => void;
  /** Callback when the list is empty (no items) */
  onEmpty?: () => void;
  /** Called on a long press of the default list item view */
  onItemLongPress?: (prop: { call: any }) => void;
  /** Hide the toolbar header */
  hideHeader?: boolean;
  /** Hide the loading state */
  hideLoadingState?: boolean;
  /**
   * A function to **append** more menu items on top of the default menu items for a call log.
   */
  addOptions?: (call: any) => MenuItemInterface[];
  /**
   * A function to **replace** the default menu items entirely for a call log.
   */
  options?: (call: any) => MenuItemInterface[];
}

/**
 * CometChatCallLogs component.
 *
 * This component displays a list of call logs with support for custom item views,
 * pull-to-refresh, error and empty states, as well as outgoing call initiation.
 *
 * @param {CometChatCallLogsConfigurationInterface} props - Component configuration props.
 * @returns {JSX.Element} The rendered call logs component.
 */
export const CometChatCallLogs = (props: CometChatCallLogsConfigurationInterface): JSX.Element => {
  const {
    LeadingView,
    TitleView,
    SubtitleView,
    ItemView,
    TrailingView,
    AppBarOptions,
    callLogRequestBuilder,
    showBackButton = false,
    EmptyView,
    ErrorView,
    LoadingView,
    hideError,
    onCallIconPress,
    onItemPress,
    onError,
    onBack,
    style,
    outgoingCallConfiguration,
    datePattern,
    onLoad,
    onEmpty,
    onItemLongPress,
    hideHeader,
    hideLoadingState,
    addOptions,
    options,
  } = props;

  const [list, setList] = useState<any[]>([]);
  const [listState, setListState] = useState<"loading" | "error" | "done">("loading");
  const [showOutgoingCallScreen, setShowOutgoingCallScreen] = useState(false);

  const theme = useTheme();
  const {t} = useCometChatTranslation()
  const { formatDate } = useLocalizedDate();
  const mergedCallLogsStyle = useMemo(() => {
    return deepMerge(theme.callLogsStyles, style ?? {});
  }, [theme, style]);

  const loggedInUser = useRef<CometChat.User>(undefined);
  const callLogRequestBuilderRef = useRef<any>(undefined);
  const outGoingCall = useRef<CometChat.Call | CometChat.CustomMessage>(undefined);

  // State for tooltip functionality
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const tooltipPosition = useRef<{ pageX: number; pageY: number }>({
    pageX: 0,
    pageY: 0,
  });
  const [hasMoreData, setHasMoreData] = useState(true);

  /**
   * Function to build the list of menu items for the tooltip:
   * - `options(call)` completely replaces defaults
   * - `addOptions(call)` appends to the default
   * - No default menu items in this snippet; so defaults is an empty array
   */
  const buildMenuItems = (call: any): MenuItemInterface[] => {
    if (options) {
      return options(call);
    }
    let defaultMenuItems: MenuItemInterface[] = []; // no default items here
    if (addOptions) {
      return [...defaultMenuItems, ...addOptions(call)];
    }
    return defaultMenuItems;
  };

  /**
   * Show tooltip if user hasn't provided a custom onItemLongPress.
   */
  const handleItemLongPress = (call: any, e?: GestureResponderEvent) => {
    if (onItemLongPress) {
      // If the developer has provided a custom long-press handler, call that and return.
      onItemLongPress({ call });
      return;
    }
    // Otherwise, show the tooltip if there are menu items
    const items = buildMenuItems(call);
    if (items.length === 0) return;

    if (e && e.nativeEvent) {
      tooltipPosition.current = {
        pageX: e.nativeEvent.pageX,
        pageY: e.nativeEvent.pageY,
      };
    } else {
      tooltipPosition.current = { pageX: 200, pageY: 100 };
    }
    setSelectedCall(call);
    setTooltipVisible(true);
  };

  /**
   * Initializes the call log request builder.
   */
  function setRequestBuilder() {
    const reqBuilder = callLogRequestBuilder
      ? callLogRequestBuilder.setAuthToken(loggedInUser.current!.getAuthToken())
      : new CometChatCalls.CallLogRequestBuilder()
        .setLimit(30)
        .setAuthToken(loggedInUser.current!.getAuthToken() || "")
        .setCallCategory("call");
    callLogRequestBuilderRef.current = reqBuilder.build();
  }

  /**
   * Fetches the call logs using the configured request builder.
   * @param isAppending - If true, appends to existing list (for pagination). If false, replaces the list (for initial load/reload).
   */
  const fetchCallLogs = (isAppending: boolean = true) => {
    setListState("loading");
    callLogRequestBuilderRef
      .current!.fetchNext()
      .then((callLogs: any) => {
        if (callLogRequestBuilderRef.current!.limit > callLogs.length) {
          setHasMoreData(false);
        }
        if (callLogs.length > 0) {
          const updatedList = isAppending ? [...list, ...callLogs] : callLogs;
          setList(updatedList);
          onLoad && onLoad(updatedList);
        } else {
          // If no new logs are returned and the current list is empty, trigger onEmpty
          if (list.length === 0 || !isAppending) {
            onEmpty && onEmpty();
          }
        }
        setListState("done");
      })
      .catch((err: CometChat.CometChatException) => {
        onError && onError(err);
        setListState("error");
      });
  };

  /**
   * Reloads the call logs by resetting the request builder and fetching fresh data.
   * This matches the behavior of other tabs (Chats, Groups, Users).
   */
  const reloadCallLogs = () => {
    setList([]);
    setHasMoreData(true);
    setRequestBuilder();
    fetchCallLogs(false);
  };

  // Setup logged-in user and call listeners on mount.
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then((u: CometChat.User | null) => {
        loggedInUser.current = u!;
        setRequestBuilder();
        fetchCallLogs();
      })
      .catch((e) => {
        onError && onError(e);
      });

    // Listener for outgoing call rejection
    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onOutgoingCallRejected: (call: CometChat.Call) => {
          setShowOutgoingCallScreen(false);
          outGoingCall.current = undefined;
        },
      })
    );

    // UI event listener for call rejection and call end
    CometChatUIEventHandler.addCallListener(listenerId, {
      ccCallRejected: (call: CometChat.Call) => {
        outGoingCall.current = undefined;
        setShowOutgoingCallScreen(false);
      },
      ccCallEnded: () => {
        outGoingCall.current = undefined;
        setShowOutgoingCallScreen(false);
      },
    });

    return () => {
      // Cleanup call listeners when component unmounts
      CometChat.removeCallListener(listenerId);
      CometChatUIEventHandler.removeCallListener(listenerId);
    };
  }, []);

  /**
   * Initiates a call based on the provided call log and type.
   *
   * @param {any} call - The call log item.
   * @param {any} type - The type of call (audio or video).
   */
  const makeCall = (call: any, type: any) => {
    if (type == CallTypeConstants.audio || type == CallTypeConstants.video) {
      let user =
        call?.getReceiverType() == "user"
          ? loggedInUser.current?.getUid() === call?.getInitiator()?.getUid()
            ? call.getReceiver()
            : call?.getInitiator()
          : undefined;
      let group =
        call?.getReceiverType() == "group"
          ? loggedInUser.current?.getUid() === call?.getInitiator()?.getUid()
            ? call.getReceiver()
            : call?.getInitiator()
          : undefined;

      var receiverID = user ? user.getUid() : group ? group.getGuid() : undefined;
      var callType = type;
      var receiverType = user
        ? CometChat.RECEIVER_TYPE.USER
        : group
          ? CometChat.RECEIVER_TYPE.GROUP
          : undefined;
      if (!receiverID || !receiverType) return;

      var callObject = new CometChat.Call(
        receiverID,
        callType,
        receiverType,
        CometChat.CATEGORY_CALL
      );

      CometChat.initiateCall(callObject).then(
        (initiatedCall) => {
          outGoingCall.current = initiatedCall;
          setShowOutgoingCallScreen(true);
          CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccOutgoingCall, {
            call: outGoingCall.current,
          });
        },
        (error) => {
          console.log("Call initialization failed with exception:", error);
          CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallFailed, { call });
          onError && onError(error);
        }
      );
    } else {
      console.log("Invalid call type.", type);
      return;
    }
  };

  /**
   * Handles the press event on the call icon.
   */
  const onPress = (item: any) => {
    if (onCallIconPress) {
      onCallIconPress(item);
    } else {
      if (item?.getReceiverType() == "user") {
        makeCall(item, item.getType());
      }
    }
  };

  /**
   * Extracts and returns call details for display.
   */
  const getCallDetails = (call: any) => {
    const { mode, initiator, receiver, receiverType } = call;

    if (mode == "meet") {
      return {
        title: receiver["name"],
        avatarUrl: receiver["icon"],
      };
    } else if (mode == "call") {
      return {
        title:
          receiverType === "group"
            ? receiver["name"]
            : loggedInUser.current?.getUid() == initiator?.getUid()
              ? receiver["name"]
              : initiator["name"],
        avatarUrl:
          receiverType === "group"
            ? receiver["avatar"]
            : loggedInUser.current?.getUid() == initiator?.getUid()
              ? receiver["avatar"]
              : initiator["avatar"],
      };
    }
    return { title: "", avatarUrl: undefined };
  };

  /**
   * Renders each call log item.
   */
  const _render = ({ item, index }: any) => {
    // If user provides a custom item view, use that
    if (ItemView) return ItemView(item);

    const { title, avatarUrl } = getCallDetails(item);
    const callStatus = CallUtils.getCallStatusForCallLogs(item, loggedInUser.current!);

    return (
      <TouchableOpacity
        onPress={() => onItemPress?.(item)}
        onLongPress={(e) => handleItemLongPress(item, e)}
      >
        <View style={mergedCallLogsStyle.itemStyle.containerStyle}>
          {LeadingView ? (
            LeadingView(item)
          ) : (
            <CometChatAvatar
              name={title}
              image={{ uri: avatarUrl }}
              style={{
                ...mergedCallLogsStyle.itemStyle.avatarStyle,
              }}
            />
          )}
          <View>
            {TitleView ? (
              TitleView(item)
            ) : (
              <Text
                style={[
                  mergedCallLogsStyle.itemStyle.titleTextStyle,
                  callStatus === "missed"
                    ? mergedCallLogsStyle.itemStyle.missedCallTitleTextStyle
                    : {},
                ]}
              >
                {title}
              </Text>
            )}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon
                name={
                  callStatus === "missed"
                    ? "call-missed-outgoing"
                    : callStatus === "incoming"
                      ? "call-received"
                      : "call-made"
                }
                size={16}
                color={
                  callStatus === "missed"
                    ? mergedCallLogsStyle.itemStyle.missedCallStatusIconStyle.tintColor
                    : callStatus === "incoming"
                      ? mergedCallLogsStyle.itemStyle.incomingCallStatusIconStyle.tintColor
                      : mergedCallLogsStyle.itemStyle.outgoingCallStatusIconStyle.tintColor
                }
                containerStyle={{ marginTop: 2 }}
              />
              {SubtitleView ? (
                SubtitleView(item)
              ) : (
                <Text style={mergedCallLogsStyle.itemStyle.subTitleTextStyle}>
                  {formatDate(
                    item["initiatedAt"] * 1000,
                    datePattern ?? LocalizedDateHelper.patterns.callLogs
                  )}
                </Text>
              )}
            </View>
          </View>
          {TrailingView ? (
            TrailingView(item,onPress)
          ) : (
            <TouchableOpacity
              onPress={() => onPress(item)}
              style={{
                marginLeft: "auto",
              }}
            >
              <Icon
                name={item.type === "audio" ? "call" : "videocam"}
                size={24}
                color={mergedCallLogsStyle.itemStyle.callIconStyle.tintColor}
                imageStyle={mergedCallLogsStyle.itemStyle.callIconStyle}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Renders the error view for the call logs.
   */
  const ErrorStateView = useCallback(() => {
    if (hideError) return null;
    return (
      <ErrorEmptyView
        title={t("OOPS")}
        subTitle={t("SOMETHING_WENT_WRONG")}
        tertiaryTitle={t("WRONG_TEXT_TRY_AGAIN")}
        Icon={
          <Icon
            name='error-state'
            size={theme.spacing.margin.m15 << 1}
            containerStyle={{
              marginBottom: theme.spacing.margin.m5,
            }}
          />
        }
        containerStyle={Style.errorEmptyContainer}
        titleStyle={mergedCallLogsStyle.errorStateStyle?.titleStyle}
        subTitleStyle={mergedCallLogsStyle.errorStateStyle?.subTitleStyle}
        RetryView={<CometChatRetryButton onPress={reloadCallLogs} />}
      />
    );
  }, [theme]);

  /**
   * Renders the empty state view for call logs.
   */
  const EmptyStateView = useCallback(() => {
    if (EmptyView) return <EmptyView />;
    return (
      <ErrorEmptyView
        title={t("NO_CALL_LOGS")}
        subTitle={t("CALL_LOGS_EMPTY_MESSAGE")}
        Icon={
          <Icon
            name='call-fill'
            size={theme.spacing.spacing.s15 << 1}
            color={theme.color.neutral300}
            containerStyle={{
              marginBottom: theme.spacing.spacing.s5,
            }}
          />
        }
        containerStyle={Style.errorEmptyContainer}
        titleStyle={mergedCallLogsStyle.emptyStateStyle?.titleStyle}
        subTitleStyle={mergedCallLogsStyle.emptyStateStyle?.subTitleStyle}
      />
    );
  }, [theme]);

  const renderFooter = useCallback(() => {
    if (listState !== "loading" || !hasMoreData) return null;
    return (
      <View
        style={{
          paddingVertical: 20,
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size='small' color={theme.color.primary} />
      </View>
    );
  }, [theme, listState]);

  return (
    <View
      style={{
        backgroundColor: theme.color.background1,
        height: "100%",
        width: "100%",
      }}
    >
      <>
        {/* Header with optional back button and app bar options */}
        {!hideHeader && (
          <View
            style={[
              Style.row,
              Style.headerStyle,
              {
                padding: theme.spacing.spacing.s4,
                borderBottomWidth: 1,
                borderBottomColor: theme.color.borderLight,
                ...mergedCallLogsStyle.titleSeparatorStyle,
              },
            ]}
          >
            <View style={Style.row}>
              {showBackButton ? (
                <TouchableOpacity style={Style.imageStyle} onPress={onBack}>
                  <Image
                    source={BackIcon}
                    style={[Style.imageStyle, { tintColor: theme.color.iconPrimary }]}
                  />
                </TouchableOpacity>
              ) : null}
              <Text style={mergedCallLogsStyle.titleTextStyle}>{t("CALLS")}</Text>
            </View>
            <View style={Style.row}>{AppBarOptions && <AppBarOptions />}</View>
          </View>
        )}

        {/* Render call logs based on state */}
        {listState === "loading" && list.length === 0 ? (
          !hideLoadingState ? (
            LoadingView ? (
              <LoadingView />
            ) : (
              <Skeleton style={mergedCallLogsStyle.skeletonStyle} />
            )
          ) : (
            <View />
          )
        ) : listState === "error" && list.length === 0 ? (
          <ErrorStateView />
        ) : list.length === 0 ? (
          <EmptyStateView />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item, index) => item.sessionId + "_" + index}
            extraData={{ list, listState }}
            renderItem={_render}
            onEndReached={() => fetchCallLogs(true)}
            ListFooterComponent={renderFooter}
          />
        )}
      </>
      {/* Outgoing call screen */}
      {showOutgoingCallScreen && (
        <CometChatOutgoingCall
          call={outGoingCall.current}
          onEndCallButtonPressed={(call) => {
            CometChat.rejectCall(call?.getSessionId(), CometChat.CALL_STATUS.CANCELLED).then(
              (rejectedCall) => {
                CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccCallRejected, {
                  call: rejectedCall,
                });
              },
              (err) => {
                onError && onError(err);
              }
            );
          }}
          {...outgoingCallConfiguration}
        />
      )}

      {/* Tooltip menu for calls (on default long-press) */}
      {selectedCall && tooltipVisible && (
        <View
          style={{
            position: "absolute",
            top: tooltipPosition.current.pageY,
            left: tooltipPosition.current.pageX,
            zIndex: 9999,
          }}
        >
          <CometChatTooltipMenu
            visible={tooltipVisible}
            onClose={() => setTooltipVisible(false)}
            onDismiss={() => setTooltipVisible(false)}
            event={{
              nativeEvent: tooltipPosition.current,
            }}
            menuItems={buildMenuItems(selectedCall).map((menuItem) => ({
              text: menuItem.text,
              onPress: () => {
                menuItem.onPress();
                setTooltipVisible(false);
              },
              textColor: menuItem.textStyle?.color,
              iconColor: menuItem.iconStyle?.tintColor,
              disabled: menuItem.disabled,
            }))}
          />
        </View>
      )}
      {/* End tooltip menu */}
    </View>
  );
};
