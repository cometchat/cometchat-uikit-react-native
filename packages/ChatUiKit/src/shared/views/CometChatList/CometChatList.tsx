let __listenerIdCounter = 0;
import React, { JSX, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  ActivityIndicator,
  ColorValue,
  FlatList,
  GestureResponderEvent,
  ImageSourcePropType,
  ImageStyle,
  Platform,
  RefreshControl,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { LOADING, NO_DATA_FOUND, SOMETHING_WRONG } from "../../constants/UIKitConstants";

import { CometChat } from "@cometchat/chat-sdk-react-native";
import { useTheme } from "../../../theme";
import { CometChatTheme } from "../../../theme/type";
import { CometChatUIKit } from "../../CometChatUiKit";
import { DeepPartial } from "../../helper/types";
import { Icon } from "../../icons/Icon";
import { CometChatListItem } from "../CometChatListItem";
import {
  CometChatStatusIndicatorInterface,
  StatusIndicatorStyles,
} from "../CometChatStatusIndicator";
import Header from "./Header";
import styles from "./styles";
import { useCometChatTranslation } from "../../resources/CometChatLocalizeNew";
import { isOfflineOn, offlineSdk, sdkConnected } from "../../offline/gate";
import { OfflineHub } from "../../offline/OfflineHub";
import { appendUnique, fetchTwoPhase, mergeSnapshotPage } from "../../offline/twoPhase";
import {
  applyFirstServerPage,
  mergeCachedFirstPage,
  mergeFirstServerPage,
  isFilteredConversationRequest,
  keepUnsentPreviews,
  reconcileSyncPage,
} from "../../offline/conversations";
import { ConnectStateView, ConnectToLoadMore } from "../../offline/OfflineViews";
import { OFFLINE_STRING_KEYS } from "../../offline/notices";
import { CONTRACT_IDS } from "../../offline/stateContract";
import { probeFrame } from "../../offline/frameProbe";

export interface CometChatListActionsInterface {
  updateList: (prop: any) => void;
  updateAndMoveToFirst: (item: any) => void;
  addItemToList: (item: any, position?: number) => void;
  removeItemFromList: (itemId: string | number) => void;
  getListItem: (itemId: string | number) => any;
  getSelectedItems: () => Array<any>;
  getAllListItems: () => Array<any>;
  reload: () => void;
}

export interface CometChatListStylesInterface {
  containerStyle: ViewStyle;
  onlineStatusColor?: ColorValue;
  separatorColor?: string;
  loadingIconTint?: ColorValue;
  sectionHeaderTextStyle?: TextStyle;
  confirmSelectionStyle: {
    icon?: ImageSourcePropType | JSX.Element;
    iconStyle?: ImageStyle;
    iconContainerStyle?: ImageStyle;
  };
  selectionCancelStyle: {
    icon?: ImageSourcePropType | JSX.Element;
    iconStyle?: ImageStyle;
    iconContainerStyle?: ImageStyle;
  };
  titleSeparatorStyle: ViewStyle;
  searchStyle?: {
    textStyle: TextStyle;
    placehodlerTextStyle?: TextStyle;
    containerStyle: ViewStyle;
    icon?: ImageSourcePropType | JSX.Element;
    iconStyle: ImageStyle;
  };
  titleStyle: TextStyle;
  titleViewStyle?: ViewStyle;
  backButtonIcon?: ImageSourcePropType | JSX.Element;
  backButtonIconStyle: ImageStyle;
  itemStyle: {
    avatarStyle: CometChatTheme["avatarStyle"];
    containerStyle: ViewStyle;
    titleStyle: TextStyle;
    subtitleStyle: TextStyle;
    statusIndicatorStyle?: Partial<StatusIndicatorStyles>;
    headViewContainerStyle?: StyleProp<ViewStyle>;
    titleSubtitleContainerStyle?: StyleProp<ViewStyle>;
    trailingViewContainerStyle?: StyleProp<ViewStyle>;
  };
  emptyStateStyle: Partial<{
    titleStyle: TextStyle;
    subTitleStyle: TextStyle;
    containerStyle: ViewStyle;
    icon: ImageSourcePropType | JSX.Element;
    iconStyle?: ImageStyle;
    iconContainerStyle?: ViewStyle;
  }>;
  errorStateStyle: Partial<{
    titleStyle: TextStyle;
    subTitleStyle: TextStyle;
    containerStyle: ViewStyle;
    icon: ImageSourcePropType | JSX.Element;
    iconStyle?: ImageStyle;
    iconContainerStyle?: ViewStyle;
  }>;
  headerContainerStyle?: ViewStyle;
  backButtonIconContainerStyle: ViewStyle;
}

export interface CometChatListProps {
  ItemView?: (item: any) => JSX.Element;
  LeadingView?: (item: any) => JSX.Element;
  TitleView?: (item: any) => JSX.Element;
  SubtitleView?: (item: any) => JSX.Element;
  TrailingView?: (item: any) => JSX.Element;
  disableUsersPresence?: boolean;
  AppBarOptions?: React.FC;
  searchPlaceholderText?: string;
  hideBackButton?: boolean;
  selectionMode?: "none" | "single" | "multiple";
  onSelection?: (list: any) => void;
  onSubmit?: (list: any) => void;
  hideSearch?: boolean;
  hideHeader?: boolean;
  title?: string;
  EmptyView?: React.FC;
  /**
   * Offline ON only: whether `EmptyView` is the integrator's own. A list wrapper that always
   * passes a default empty view sets this so the kit's "Connect to search" state is not hidden by
   * the wrapper's default but is by the integrator's. Defaults to `!!EmptyView`.
   */
  customEmptyView?: boolean;
  emptyStateText?: string;
  errorStateText?: string;
  ErrorView?: React.FC;
  /**
   * Offline ON only: whether `ErrorView` is the integrator's own, which then shows instead of the
   * kit's "Connect to load ..." state (D84 rule 3). Defaults to `!!ErrorView`.
   */
  customErrorView?: boolean;
  /** Offline ON only: localization key of the "Connect to load ..." text (default from `listItemKey`). */
  connectToLoadKey?: string;
  LoadingView?: React.FC;
  requestBuilder?: any;
  searchRequestBuilder?: any;
  hideError?: boolean;
  onItemPress?: (user: any) => void;
  onItemLongPress?: (user: any, e: GestureResponderEvent) => void;
  onError?: (error: CometChat.CometChatException) => void;
  onBack?: (() => void) | undefined;
  listItemKey: "uid" | "guid" | "conversationId";
  /** Automation identifier for each row (`testID`), e.g. the state contract's conversation row. */
  itemTestID?: (item: any) => string | undefined;
  listStyle?: DeepPartial<CometChatListStylesInterface>;
  hideSubmitButton?: boolean;
  statusIndicatorType?: (item: any) => CometChatStatusIndicatorInterface["type"] | null;
  hideStickyHeader?: boolean;
  /**
   * Called once the list has been fetched or updated.
   * Returns the final array of items currently in the list.
   */
  onListFetched?: (fetchedList: any[]) => void;
  /**
   * Custom search view component to display instead of the default search input.
   */
  SearchView?: () => JSX.Element;
  /**
   * Callback triggered when the search bar is clicked or focused.
   */
  onSearchBarClicked?: () => void;
}

/** The "Connect to load ..." text of a list that could not load offline with nothing on screen. */
function connectToLoadKeyFor(listItemKey: "uid" | "guid" | "conversationId"): string {
  if (listItemKey === "conversationId") return OFFLINE_STRING_KEYS.connectToLoadChats;
  if (listItemKey === "guid") return OFFLINE_STRING_KEYS.connectToLoadGroups;
  return OFFLINE_STRING_KEYS.connectToLoadUsers;
}

let lastCall: any;
let lastReject: Function;

/**
 * @class Users is a component useful for displaying the header and users in a list
 * @description This component displays a header and list of users with subtitle,avatar,status
 * @Version 1.0.0
 * @author CometChat
 *
 */

export const CometChatList = React.forwardRef<CometChatListActionsInterface, CometChatListProps>(
  (props, ref) => {
    const connectionListenerId = "connectionListener_" + Date.now() + "_" + (++__listenerIdCounter);
    const theme = useTheme();
    const { t } = useCometChatTranslation();
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);

    const {
      LeadingView,
      TitleView,
      SubtitleView,
      TrailingView,
      disableUsersPresence = false,
      ItemView,
      AppBarOptions,
      searchPlaceholderText,
      hideBackButton,
      selectionMode = "none",
      onSelection = () => {},
      onSubmit,
      hideSearch = false,
      title = "Title",
      EmptyView,
      customEmptyView,
      emptyStateText = t("NO_USERS_FOUND"),
      errorStateText = t("SOMETHING_WRONG"),
      ErrorView,
      customErrorView,
      connectToLoadKey,
      LoadingView,
      requestBuilder,
      hideHeader,
      searchRequestBuilder = undefined,
      hideError = false,
      onItemPress = () => {},
      onItemLongPress = () => {},
      onError,
      onBack,
      listItemKey = "uid",
      itemTestID,
      listStyle,
      hideSubmitButton,
      statusIndicatorType,
      hideStickyHeader = false,
      SearchView,
      onSearchBarClicked,
    } = props;

    // functions which can be accessed by parents
    useImperativeHandle(ref, () => {
      return {
        updateList,
        addItemToList,
        removeItemFromList,
        getListItem,
        updateAndMoveToFirst,
        getSelectedItems,
        getAllListItems,
        reload,
      };
    });

    const [searchInput, setSearchInput] = useState(
      requestBuilder
        ? requestBuilder.searchKeyword
          ? requestBuilder.searchKeyword
          : ""
        : searchRequestBuilder
          ? searchRequestBuilder.searchKeyword
            ? searchRequestBuilder.searchKeyword
            : ""
          : ""
    );

    const searchInputRef = useRef(
      requestBuilder
        ? requestBuilder.searchKeyword
          ? requestBuilder.searchKeyword
          : ""
        : searchRequestBuilder
          ? searchRequestBuilder.searchKeyword
            ? searchRequestBuilder.searchKeyword
            : ""
          : ""
    );

    const [selectedItems, setSelectedItems] = useState<{ [key: string]: any }>({});
    const [shouldSelect, setShouldSelect] = useState(
      props.selectionMode === "single" || props.selectionMode === "multiple"
    );

    const listHandlerRef = useRef<any>(null);
    const initialRunRef = useRef(true);
    const selectionEffectDidMountRef = useRef(false);

    const [list, setList] = useState<any[]>([]);
    // Dev and sample builds only: the row list of every committed frame (TEST-PLAN §3.3).
    useEffect(() => {
      probeFrame(`list:${listItemKey}`, () =>
        list.map((item: any) => ({ key: String(item?.[listItemKey] ?? ""), id: 0, state: "", item }))
      );
    }, [list, listItemKey]);
    const listRef = useRef<any[]>([]);
    // Offline (ON path) state; untouched while offline is off.
    const offlinePathUsedRef = useRef(false);
    const offlineListRef = useRef<any[]>([]);
    const offlineOpGenRef = useRef(0);
    const offlineSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // A read past the cache failed offline and closed paging (conversations): the reconnect
    // reopens it and loads that page once. Count of offline reads (and read-on loops) in flight.
    const pagingClosedOfflineRef = useRef(false);
    const offlineReadsInFlightRef = useRef(0);
    /** A filtered chat list's re-read after a sync page is in flight: later sync pages start no second one. */
    const syncRereadRef = useRef(false);
    // D84 (offline ON): the error view, or the offline state, is up because a load failed with
    // nothing on screen. "offline" = the device was not connected: a reconnect loads it again,
    // once. "other" = any other error: never loaded again by itself. null = neither is up.
    const errorViewRef = useRef<"offline" | "other" | null>(null);
    // Which offline state shows over an empty list (D84 rule 3 and 7), if any: "load" = "Connect to
    // load ..." (a plain list, error view slot), "search" = "Connect to search" (a keyword, empty
    // view slot). Never set with offline off.
    const [offlineState, setOfflineState] = useState<"none" | "load" | "search">("none");
    // A reload the kit starts by itself (cache reset) goes through `reload()`: this makes it quiet
    // while rows are shown, as the other kit-started re-reads are. Read once, synchronously.
    const automaticReloadRef = useRef(false);
    // A load-more asked for while an offline read was in flight: run once when the reads settle,
    // so paging never waits for a second scroll (UIK-READ-03). Offline ON only; OFF keeps today's drop.
    const deferredLoadMoreRef = useRef(false);
    const [deferredLoadMoreTick, setDeferredLoadMoreTick] = useState(0);
    const [offlineFooter, setOfflineFooter] = useState<"none" | "connect">("none");
    const [refreshing, setRefreshing] = useState(false);
    const [dataLoadingStatus, setDataLoadingStatus] = useState<string>(LOADING);

    // Keep listRef in sync with list state for use in imperative methods
    useEffect(() => {
      listRef.current = list;
    }, [list]);

    useEffect(() => {
      // Skip calling onSelection on initial mount; only trigger after a user-driven change
      if (!selectionEffectDidMountRef.current) {
        selectionEffectDidMountRef.current = true;
        return;
      }
      if (props.onSelection) {
        const selectedArray = Object.values(selectedItems);
        props.onSelection(selectedArray);
      }
    }, [selectedItems]);

    // Debounced search handler
    const searchHandler = (searchText: string) => {
      setSearchInput(searchText);
      setHasMoreData(true);

      // Decide which builder to use (searchRequestBuilder preferred)
      let builder = searchRequestBuilder || requestBuilder;

      if (!builder) {
        // no builder available, nothing to do
        return;
      }

      // If a separate searchRequestBuilder exists and searchText present,
      // set the search keyword on it; otherwise use the main requestBuilder.
      let builtRequest;
      if (searchRequestBuilder && searchText) {
        builtRequest = searchRequestBuilder.setSearchKeyword(searchText).build();
      } else if (requestBuilder) {
        builtRequest = requestBuilder.setSearchKeyword(searchText).build();
      } else {
        // fallback: if there's no search keyword, build base builder
        builtRequest = builder.build();
      }

      // important: store the built request so fetchNext uses the same instance
      listHandlerRef.current = builtRequest;

      // Then call getList with the built request
      getSearch(builtRequest);
    };

    const getSearch = (builtReq: any) => {
      if (isOfflineOn()) {
        // A keyword has no cache (BEH-SNAP-04): server only; offline with nothing saved is the error view (D83).
        if (offlineSearchTimer.current) clearTimeout(offlineSearchTimer.current);
        offlineSearchTimer.current = setTimeout(() => {
          offlineSearchTimer.current = null;
          void fetchListOffline(builtReq, true);
        }, 500);
        return;
      }
      getList(builtReq)
        .then((newlist: any) => {
          setDataLoadingStatus(NO_DATA_FOUND);
          setList(newlist);
        })
        .catch((error) => {
          if (error && error["message"] == "Promise cancelled") {
            // Handle promise cancellation if necessary
          } else {
            setDataLoadingStatus(SOMETHING_WRONG);
            errorHandler(error);
          }
        });
    };

    const getSelectedItems = () => {
      let markedItems: any[] = [];
      Object.keys(selectedItems).forEach((item) => {
        const listItem = getListItem(item);
        if (listItem) markedItems.push(listItem);
      });
      return markedItems;
    };

    // D5: the connection listener below is registered once, so it reads the integrator's
    // CURRENT request builder (and onListFetched) through refs instead of the first render's.
    const requestBuilderRef = useRef(requestBuilder);
    requestBuilderRef.current = requestBuilder;
    const onListFetchedRef = useRef(props.onListFetched);
    onListFetchedRef.current = props.onListFetched;

    useEffect(() => {
      CometChat.addConnectionListener(
        connectionListenerId,
        new CometChat.ConnectionListener({
          onConnected: () => {
            const offlineOn = isOfflineOn(); // gate read once for this reconnect
            // Offline ON: conversations wait for the SDK's sync page (no fetch, UIK-SYNC-01).
            if (offlineOn && listItemKey === "conversationId") {
              // Paging a read past the cache closed offline opens again, and the load the user
              // asked for runs now, once: its scroll trigger is spent (R5).
              // D83 rule 4: so does an error view shown because the device was offline (not any other error).
              if (pagingClosedOfflineRef.current || errorViewRef.current === "offline") {
                const errorViewUp = errorViewRef.current === "offline" && listRef.current.length === 0;
                pagingClosedOfflineRef.current = false;
                errorViewRef.current = null;
                setOfflineState("none");
                setOfflineFooter("none");
                setHasMoreData(true);
                if (offlineReadsInFlightRef.current === 0) {
                  if (errorViewUp) setDataLoadingStatus(LOADING);
                  void readNextOfflineRef.current(listHandlerRef.current, listRef.current.length === 0);
                }
              }
              return;
            }
            // D83 rule 4: an error view shown for any other error is not loaded again by itself.
            if (offlineOn && errorViewRef.current === "other") return;
            const currentBuilder = requestBuilderRef.current;
            if (currentBuilder) {
              if (searchInputRef.current)
                listHandlerRef.current = currentBuilder
                  .setSearchKeyword(searchInputRef.current)
                  .build();
              else listHandlerRef.current = currentBuilder.build();
            }
            if (offlineOn) {
              // Today's trigger, two-phase so the list never blanks. Over an error view it is the
              // one reload of rule 4: it shows loading, and fails loudly again if it must.
              if (errorViewRef.current === "offline" && listRef.current.length === 0) {
                errorViewRef.current = null;
                setOfflineState("none");
                setDataLoadingStatus(LOADING);
              }
              void fetchListOffline(listHandlerRef.current, true, true);
              return;
            }
            getList(listHandlerRef.current)
              .then((newlist: any[]) => {
                setDataLoadingStatus(NO_DATA_FOUND);
                setList(newlist);
                setHasMoreData(true); // Reset pagination since we rebuilt the request
                onListFetchedRef.current?.(newlist);
              })
              .catch((error) => {
                if (error && error["message"] === "Promise cancelled") {
                  // Handle promise cancellation if necessary
                } else {
                  setDataLoadingStatus(SOMETHING_WRONG);
                  errorHandler(error);
                }
              });
          },
          inConnecting: () => {
            console.log("ConnectionListener => In connecting");
          },
          onDisconnected: () => {
            console.log("ConnectionListener => On Disconnected");
          },
        })
      );
      return () => {
        CometChat.removeConnectionListener(connectionListenerId);
      };
    }, []);

    useEffect(() => {
      if (initialRunRef.current === true) {
        if (requestBuilder) {
          if (searchInput)
            listHandlerRef.current = requestBuilder.setSearchKeyword(searchInput).build();
          else listHandlerRef.current = requestBuilder.build();
        }
        initialRunRef.current = false;
        handleList(false);
      }
    }, []);

    useEffect(() => {
      searchInputRef.current = searchInput;
    }, [searchInput]);

    /**
     * Updates the list of users to be displayed
     * @param
     */
    const updateList = (item: any) => {
      setList((prevList) => {
        let newList = [...prevList];
        let itemKey = newList.findIndex((u) => u[listItemKey] === item[listItemKey]);
        if (itemKey > -1) {
          newList.splice(itemKey, 1, item);
          if (newList.length === 0) setDataLoadingStatus(NO_DATA_FOUND);
          return newList;
        }
        return prevList;
      });
    };

    /**
     * This will move item to first location if item doesn't exist then add it to first location.
     * @param item
     */
    const updateAndMoveToFirst = (item: any) => {
      setList((prevList) => {
        let newList = [...prevList];
        let itemKey = newList.findIndex((u) => u[listItemKey] === item[listItemKey]);
        if (itemKey > -1) {
          newList.splice(itemKey, 1);
        }
        return [item, ...newList];
      });
    };

    const addItemToList = (item: any, position?: number) => {
      setList((prev: any[]) => {
        if (position !== undefined) {
          if (position === 0) return [item, ...prev];
          if (position >= prev.length) return [...prev, item];
          // slice(0, position), NOT position - 1. The old form dropped the element
          // immediately before the insert point: inserting at 2 in a 5-item list
          // produced [0, item, 2, 3, 4] — index 1 silently deleted. Every other
          // caller passes 0, which takes the branch above, so this went unnoticed
          // until the conversation-pin reordering became the first middle insert.
          return [...prev.slice(0, position), item, ...prev.slice(position)];
        }
        return [...prev, item];
      });
    };

    const removeItemFromList = (uid: string | number) => {
      setList((prev: any[]) => {
        let newList = prev.filter((item: any) => item[listItemKey] !== uid);
        if (newList.length === 0) setDataLoadingStatus(NO_DATA_FOUND);
        return newList;
      });
      if (ItemView === undefined && shouldSelect) {
        let newSelectedItems = { ...selectedItems };
        if (Object.keys(selectedItems).includes(uid.toString())) {
          delete newSelectedItems[uid];
          setSelectedItems(newSelectedItems);
        }
      }
    };

    const getListItem = (itemId: string | number): any => {
      return listRef.current.find((item: any) => item[listItemKey] === itemId);
    };

    /**
     * Get all list items
     */
    const getAllListItems = (): any[] => {
      return listRef.current;
    };

    /**
     * Handle list fetching with pagination
     * @param {boolean} throughKeyword - Pass true if wants to set only new users.
     */
    const handleList = (throughKeyword?: boolean) => {
      // Offline ON: a load-more asked for during an offline read waits for it, then runs (not dropped).
      if (!throughKeyword && offlineReadsInFlightRef.current > 0 && isOfflineOn()) {
        if (hasMoreData) deferredLoadMoreRef.current = true;
        return;
      }
      // Prevent multiple fetches
      if (isLoadingMore || (!throughKeyword && !hasMoreData)) return;
      setIsLoadingMore(true);

      // If we're resetting due to a new keyword, create a fresh builder instance
      if (throughKeyword) {
        // prefer searchRequestBuilder if provided
        const baseBuilder = searchRequestBuilder || requestBuilder;
        if (baseBuilder) {
          const keyword = searchInputRef.current ?? "";
          if (searchRequestBuilder && keyword) {
            listHandlerRef.current = searchRequestBuilder.setSearchKeyword(keyword).build();
          } else if (requestBuilder) {
            listHandlerRef.current = requestBuilder.setSearchKeyword(keyword).build();
          } else {
            listHandlerRef.current = baseBuilder.build();
          }
        }
        // reset pagination flags
        setHasMoreData(true);
      }

      if (isOfflineOn()) {
        const firstPage = !!throughKeyword || list.length === 0;
        if (listItemKey === "conversationId" && !firstPage) void readNextOffline(listHandlerRef.current, false);
        else void fetchListOffline(listHandlerRef.current, firstPage, automaticReloadRef.current);
        return;
      }

      getList(listHandlerRef.current)
        .then((newlist: any[] = []) => {
          let finalList: any[] = [];

          if (throughKeyword || list.length === 0) {
            // If we're resetting the list or there is no existing list
            if (throughKeyword) setHasMoreData(true);
            else if (newlist.length === 0) setHasMoreData(false);

            finalList = newlist;
            if (finalList.length === 0) {
              setDataLoadingStatus(NO_DATA_FOUND);
            } else {
              setDataLoadingStatus("");
            }
            setList(finalList);
          } else {
            // Append to existing list, deduplicating by listItemKey
            const existingKeys = new Set(list.map((item: any) => item[listItemKey]));
            const uniqueNewItems = newlist.filter((item: any) => !existingKeys.has(item[listItemKey]));
            finalList = [...list, ...uniqueNewItems];
            setList(finalList);

            // When the backend returns nothing more, mark the end of data
            if (newlist.length === 0) setHasMoreData(false);
          }

          // If we *did* get results but less than a full "page", also stop further loads
          if (newlist.length === 0) setHasMoreData(false);

          props.onListFetched?.(finalList);
          setIsLoadingMore(false);
        })
        .catch((error) => {
          if (error && error["message"] === "Promise cancelled") {
            // Handle promise cancellation if necessary
          } else {
            setDataLoadingStatus(SOMETHING_WRONG);
            errorHandler(error);
          }
          setIsLoadingMore(false);
        });
    };

    const offlineKeyOf = (item: any) => String(item?.[listItemKey] ?? "");

    /**
     * One page, two-phase (README §3.3, offline ON only): the cached page paints first, the
     * server page replaces the same slice; an offline read past the cache keeps what is shown
     * ("Connect to load more"). Only an empty online server page ends pagination.
     *
     * A failure (D84):
     *  - rows on screen, not connected: the rows stay, no error view, no `onError` (rule 2); a
     *    load-more page shows its "Connect to load more" footer;
     *  - rows on screen, a real error: the rows stay and `onError` fires once (rule 5), unless the
     *    kit started the read itself (`automatic`: reconnect, sync page, cache reset);
     *  - nothing on screen, not connected: "Connect to search" for a keyword (rule 7, no `onError`),
     *    otherwise the kit's "Connect to load ..." state in the error view's place (rule 3, `onError`
     *    once; the app's own error view shows instead if it passed one);
     *  - nothing on screen, a real error: the error view and `onError` (rule 4).
     *
     * `merge` (a conversations first page the kit re-reads itself after a sync page): the pages
     * merge into the rows shown instead of replacing them, so rows paged in below page 1 stay.
     */
    const fetchListOffline = (
      request: any,
      firstPage: boolean,
      automatic = false,
      merge = false
    ): Promise<any[] | undefined> => {
      offlinePathUsedRef.current = true;
      // A re-read the kit starts by itself (reconnect, sync page) that fails while rows are on
      // screen stays quiet: rows stay, no footer, no error view, no onError. The next one retries.
      const quietOnFailure = automatic && listRef.current.length > 0;
      const opGen = ++offlineOpGenRef.current;
      if (firstPage) deferredLoadMoreRef.current = false; // a fresh first page supersedes a waiting load-more
      const hubGen = OfflineHub.getInstance().gen;
      const stale = () => opGen !== offlineOpGenRef.current || hubGen !== OfflineHub.getInstance().gen;
      const isConversations = listItemKey === "conversationId";
      const keyword = searchInputRef.current;
      let current = firstPage && !merge ? [] : listRef.current;
      let cachedKeys = new Set<string>();
      let shownCached = false;
      let serverPage: any[] | undefined;
      offlineReadsInFlightRef.current++;
      setIsLoadingMore(true);
      const publish = (next: any[]) => {
        current = next;
        offlineListRef.current = next;
        listRef.current = next; // a read on right after this one starts from these rows
        setList(next);
      };
      return fetchTwoPhase<any>(
        request,
        "next",
        {
          onCached: (page) => {
            cachedKeys = new Set(page.map(offlineKeyOf));
            if (page.length === 0) return;
            shownCached = true;
            publish(merge ? mergeCachedFirstPage(current, page) : firstPage ? page : appendUnique(current, page, offlineKeyOf));
            setDataLoadingStatus("");
          },
          onServer: (page) => {
            serverPage = page;
            pagingClosedOfflineRef.current = false;
            errorViewRef.current = null;
            setOfflineState("none");
            const base = firstPage && !shownCached && !merge ? [] : current;
            const merged = mergeSnapshotPage(base, cachedKeys, page, offlineKeyOf);
            const next = merge
              ? mergeFirstServerPage(base, cachedKeys, page)
              : firstPage && isConversations
                ? applyFirstServerPage(base, page)
                : isConversations
                  ? keepUnsentPreviews(base, merged)
                  : merged;
            publish(next);
            setOfflineFooter("none");
            // A merge over rows shown resets paging; an empty answer proves nothing (D17).
            if (!merge || page.length > 0 || base.length === 0) setHasMoreData(page.length > 0);
            setDataLoadingStatus(next.length === 0 ? NO_DATA_FOUND : "");
            onListFetchedRef.current?.(next);
          },
          onError: (error, failedOffline) => {
            if (quietOnFailure) return;
            // Not connected: the SDK said so, or it reports no connection.
            const notConnected = failedOffline || sdkConnected() === false;
            if (notConnected && keyword && firstPage) {
              // A keyword has no cache: the rows of the last search are not its answer (AC-10.2).
              publish([]);
              setHasMoreData(false);
            }
            if (listRef.current.length > 0) {
              // Rows on screen stay (BEH-READ-06), no error view over them.
              if (notConnected) {
                // D84 rule 2: not connected over rows is not an error: no onError. A load-more page
                // offers "Connect to load more" at its edge.
                if (!keyword) {
                  setOfflineFooter("connect");
                  if (isConversations) pagingClosedOfflineRef.current = true;
                }
                return;
              }
              // D84 rule 5: a real error over rows, in a load the user or app started: onError once.
              errorHandler(error);
              return;
            }
            errorViewRef.current = notConnected ? "offline" : "other"; // only a not-connected one reloads on reconnect
            if (notConnected && keyword) {
              // D84 rule 7: an offline keyword search with nothing saved is an offline state, not an
              // error: "Connect to search", no onError. It runs again once on reconnect.
              setOfflineState("search");
              setDataLoadingStatus(NO_DATA_FOUND);
              return;
            }
            // D84 rule 3 and 4: nothing on screen. Offline: the kit's "Connect to load ..." state (the
            // app's error view shows instead if it passed one); a real error: the error view. onError once.
            setOfflineState(notConnected ? "load" : "none");
            setDataLoadingStatus(SOMETHING_WRONG);
            errorHandler(error);
          },
        },
        stale
      )
        .finally(() => {
          offlineReadsInFlightRef.current--;
          setIsLoadingMore(false);
          releaseDeferredLoadMore();
        })
        .then(() => serverPage);
    };

    /** The offline reads have settled: run the load-more that waited for them, once, from a fresh render. */
    const releaseDeferredLoadMore = () => {
      if (offlineReadsInFlightRef.current === 0 && deferredLoadMoreRef.current) setDeferredLoadMoreTick((t) => t + 1);
    };
    useEffect(() => {
      if (deferredLoadMoreTick === 0 || !deferredLoadMoreRef.current) return;
      deferredLoadMoreRef.current = false;
      if (isOfflineOn()) handleList();
    }, [deferredLoadMoreTick]);

    /** Most pages one offline conversations read goes on while its pages list no new chat. */
    const MAX_OFFLINE_READ_ON = 10;

    /**
     * Offline path of a conversations load-more. A server page that lists no new chat (the SDK's
     * reconnect sync page already listed them) is not the end: the read goes on, up to
     * MAX_OFFLINE_READ_ON pages, until a page brings a new chat. A stale read (list re-fetched,
     * search changed, unmounted) or an empty / failed page stops it.
     */
    const readNextOffline = async (request: any, firstPage: boolean): Promise<void> => {
      const keyword = searchInputRef.current;
      const listed = new Set(listRef.current.map(offlineKeyOf));
      offlineReadsInFlightRef.current++; // held across the pages: no other read starts between them
      try {
        for (let reads = 0; reads < MAX_OFFLINE_READ_ON; reads++) {
          const read = fetchListOffline(request, firstPage && reads === 0);
          const gen = offlineOpGenRef.current;
          const page = await read;
          if (gen !== offlineOpGenRef.current || searchInputRef.current !== keyword) return;
          if (!page?.length) return;
          if (page.some((item: any) => !listed.has(offlineKeyOf(item)))) return;
        }
      } finally {
        offlineReadsInFlightRef.current--;
        releaseDeferredLoadMore();
      }
    };
    const readNextOfflineRef = useRef(readNextOffline);
    readNextOfflineRef.current = readNextOffline;

    /** "Connect to load more" tapped: try the next page again. */
    const retryOfflinePage = () => {
      pagingClosedOfflineRef.current = false;
      setOfflineFooter("none");
      setHasMoreData(true);
      void fetchListOffline(listHandlerRef.current, list.length === 0);
    };

    /** Pull-to-refresh, offline ON only (UIK-SYNC-05): ask the SDK for a catch-up sweep. */
    const onPullToRefresh = () => {
      setRefreshing(true);
      const done = () => setRefreshing(false);
      try {
        const result: any = offlineSdk().forceSyncNow?.({
          onSuccess: done,
          onError: (error: any) => {
            done();
            // Sweep in progress or cooling down: end silently (AC-8.6). Offline off: today's refresh.
            if (error?.code === "ERROR_OFFLINE_DISABLED") reload();
          },
        });
        if (result && typeof result.then === "function") result.then(undefined, () => {});
        else if (!result) done();
      } catch {
        done();
      }
    };

    const offlineHandlers = {
      onConversationSync: (conversations: any[], gen: number) => {
        if (listItemKey !== "conversationId" || gen !== OfflineHub.getInstance().gen) return;
        if (!offlinePathUsedRef.current && !isOfflineOn()) return;
        const builder = requestBuilderRef.current;
        if (searchInputRef.current || isFilteredConversationRequest(builder)) {
          // A filtered list does not reconcile the plain sync page: it re-reads its own request
          // once, merged into the rows shown, one at a time however many sync pages arrive.
          if (syncRereadRef.current) return;
          syncRereadRef.current = true;
          if (builder) listHandlerRef.current = builder.build();
          void fetchListOffline(listHandlerRef.current, true, true, true).finally(() => {
            syncRereadRef.current = false;
          });
          return;
        }
        // The plain list reconciles the slice the page covers; the request cursor is untouched.
        const next = reconcileSyncPage(listRef.current, conversations);
        offlineListRef.current = next;
        setList(next);
        if (next.length > 0) setDataLoadingStatus("");
        // The sync page is the server's answer: it replaces an error view (an empty page: the empty view).
        else if (errorViewRef.current !== null) setDataLoadingStatus(NO_DATA_FOUND);
        errorViewRef.current = null;
        setOfflineState("none");
        onListFetchedRef.current?.(next);
      },
      onSessionEnded: () => {
        if (!offlinePathUsedRef.current) return;
        offlineOpGenRef.current++;
        deferredLoadMoreRef.current = false;
        pagingClosedOfflineRef.current = false;
        offlineListRef.current = [];
        errorViewRef.current = null;
        setOfflineState("none");
        setList([]);
        setOfflineFooter("none");
      },
      onCacheReset: () => {
        if (!offlinePathUsedRef.current && !isOfflineOn()) return;
        // The kit reloads by itself: quiet while rows are shown (D83 rule 3).
        automaticReloadRef.current = true;
        try {
          reload();
        } finally {
          automaticReloadRef.current = false;
        }
      },
    };
    const offlineHandlersRef = useRef(offlineHandlers);
    offlineHandlersRef.current = offlineHandlers;

    const stopOfflineReads = () => {
      offlineOpGenRef.current++;
    };
    useEffect(() => {
      // Private hub channel; inert while offline is off.
      const hub = OfflineHub.getInstance();
      const subscriptions = [
        hub.conversationSync$.subscribe((e) => offlineHandlersRef.current.onConversationSync(e.conversations, e.gen)),
        hub.session$.subscribe(() => offlineHandlersRef.current.onSessionEnded()),
        hub.cacheReset$.subscribe(() => offlineHandlersRef.current.onCacheReset()),
      ];
      return () => {
        subscriptions.forEach((s) => s.unsubscribe());
        stopOfflineReads(); // an offline read-on loop in flight stops at unmount
        if (offlineSearchTimer.current) clearTimeout(offlineSearchTimer.current);
      };
    }, []);

    /**
     * Reloads the list by fetching fresh data (matches Calls tab behavior)
     */
    const reload = () => {
      // Prevent multiple reloads if a load operation is already in progress
      if (isLoadingMore) return;

      setDataLoadingStatus(LOADING);
      errorViewRef.current = null;
      setOfflineState("none");
      setHasMoreData(true);
      if (requestBuilder) {
        if (searchInputRef.current)
          listHandlerRef.current = requestBuilder.setSearchKeyword(searchInputRef.current).build();
        else listHandlerRef.current = requestBuilder.build();
      }
      handleList(true);
    };

    const renderFooter = useCallback(() => {
      if (!isLoadingMore || !hasMoreData) return null;
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size='small' color={theme.color.primary} />
        </View>
      );
    }, [isLoadingMore, hasMoreData]);

    /**
     * Handle errors
     */
    const errorHandler = (errorCode: any) => {
      onError && onError(errorCode);
      // CometChatUserEvents.emit(CometChatUserEvents.onUserError, errorCode);
    };

    /**
     * Handle item selection based on selection mode
     */
    const handleSelection = useCallback(
      (listItem: any) => {
        if (selectionMode === "none") return;

        const itemKey = listItem.value[listItemKey];

        setSelectedItems((prev: any) => {
          let newState = { ...prev };
          if (selectionMode === "multiple") {
            if (newState[itemKey]) {
              delete newState[itemKey];
            } else {
              newState[itemKey] = listItem.value;
            }
          } else if (selectionMode === "single") {
            if (newState[itemKey]) {
              delete newState[itemKey];
            } else {
              newState = { [itemKey]: listItem.value };
            }
          }
          // Notify parent about selection change

          return newState;
        });
      },
      [selectionMode, onSelection, listItemKey]
    );

    /**
     * Handle Cancel action
     */
    const handleCancelSelection = () => {
      setSelectedItems({});
    };

    /**
     * Handle Confirm action
     */
    const handleConfirmSelection = () => {
      onSubmit && onSubmit(Object.values(selectedItems));
      // Optionally, you might want to clear the selection after confirmation
      setSelectedItems({});
    };

    const onListItemPress = (item: any) => {
      if (shouldSelect) {
        handleSelection(item);
      } else {
        onItemPress(item.value);
      }
    };

    const onListItemLongPress = (item: any, e: GestureResponderEvent) => {
      handleSelection(item);
      onItemLongPress(item.value, e);
    };

    const selectedCount = Object.keys(selectedItems).length;

    const renderItemView = useCallback(
      ({ item, index }: any) => {
        if (item.header) {
          if (hideStickyHeader) return null;
          const headerLetter = item.value;

          return (
            <View key={`header_${headerLetter}_${index}`}>
              <Text style={[styles.headerLetterStyle, listStyle?.sectionHeaderTextStyle]}>
                {headerLetter}
              </Text>
            </View>
          );
        }
        return (
          <CometChatListItem
            testID={itemTestID?.(item.value)}
            statusIndicatorType={statusIndicatorType ? statusIndicatorType(item.value) : null}
            id={item.value[listItemKey]}
            avatarName={item.value.name}
            selected={!!selectedItems[item.value[listItemKey]]}
            shouldSelect={shouldSelect}
            LeadingView={LeadingView && LeadingView(item.value)}
            TitleView={TitleView && TitleView(item.value)}
            title={
              item.value.uid &&
              item.value.uid === CometChatUIKit.loggedInUser?.getUid() &&
              item.value.name === CometChatUIKit.loggedInUser?.getName()
                ? t("YOU")
                : item.value.name
            }
            containerStyle={[listStyle?.itemStyle?.containerStyle]}
            titleStyle={listStyle?.itemStyle?.titleStyle}
            headViewContainerStyle={
              (listStyle?.itemStyle?.headViewContainerStyle as StyleProp<ViewStyle>) ??
              ({ marginHorizontal: 9 } as StyleProp<ViewStyle>)
            }
            titleSubtitleContainerStyle={
              (listStyle?.itemStyle?.titleSubtitleContainerStyle as StyleProp<ViewStyle>) ??
              ({} as StyleProp<ViewStyle>)
            }
            trailingViewContainerStyle={
              (listStyle?.itemStyle?.trailingViewContainerStyle as StyleProp<ViewStyle>) ??
              ({} as StyleProp<ViewStyle>)
            }
            avatarURL={item.value.avatar || undefined}
            avatarStyle={listStyle?.itemStyle?.avatarStyle}
            SubtitleView={SubtitleView ? SubtitleView(item.value) : undefined}
            TrailingView={TrailingView ? TrailingView(item.value) : undefined}
            onPress={() => {
              onListItemPress(item);
            }}
            onLongPress={(id: any, e: any) => {
              onListItemLongPress(item, e);
            }}
          />
        );
      },
      [
        listItemKey,
        itemTestID,
        selectedItems,
        shouldSelect,
        listStyle,
        SubtitleView,
        TitleView,
        TrailingView,
        disableUsersPresence,
        theme,
        onListItemPress,
        onListItemLongPress,
        hideStickyHeader,
        LeadingView,
      ]
    );

    /**
     * Gets the list of users
     */
    const getList = (reqBuilder: any): Promise<any[]> => {
      const promise = new Promise<any[]>((resolve, reject) => {
        const cancel = () => {
          clearTimeout(lastCall);
          lastReject(new Error("Promise cancelled"));
        };
        if (lastCall) {
          cancel();
        }

        lastCall = setTimeout(() => {
          reqBuilder
            ?.fetchNext()
            .then((listItems: any) => {
              resolve(listItems);
            })
            .catch((error: CometChat.CometChatException) => {
              reject(error);
            });
        }, 500);
        lastReject = reject;
      });
      return promise;
    };

    /**
     * Returns a container of users if exists else returns the corresponding decorator message
     */
    const getMessageContainer = useCallback(() => {
      let messageContainer: JSX.Element = <></>;
      // D84: the kit's offline states sit in the error / empty view's place, in the host list's error-state style.
      const connectState = (title: string, testID: string, subtitle?: string) => (
        <ConnectStateView
          testID={testID}
          title={title}
          subtitle={subtitle}
          containerStyle={listStyle?.errorStateStyle?.containerStyle}
          titleStyle={listStyle?.errorStateStyle?.titleStyle}
          subtitleStyle={listStyle?.errorStateStyle?.subTitleStyle}
        />
      );
      if (
        list.length === 0 &&
        dataLoadingStatus.toLowerCase() === NO_DATA_FOUND &&
        offlineState === "search" &&
        !(customEmptyView ?? !!EmptyView)
      ) {
        // D84 rule 7 + addition A: an offline keyword search with nothing saved.
        messageContainer = connectState(
          t(OFFLINE_STRING_KEYS.connectToSearch),
          CONTRACT_IDS.emptyConnectToSearch,
          t(OFFLINE_STRING_KEYS.connectToSearchSubtitle)
        );
      } else if (list.length === 0 && dataLoadingStatus.toLowerCase() === NO_DATA_FOUND) {
        messageContainer = EmptyView ? (
          <EmptyView />
        ) : (
          <View style={[styles.msgContainerStyle, listStyle?.emptyStateStyle?.containerStyle]}>
            <Text style={[styles.msgTxtStyle, listStyle?.emptyStateStyle?.titleStyle]}>
              {emptyStateText}
            </Text>
          </View>
        );
      } else if (
        !hideError &&
        dataLoadingStatus.toLowerCase() === SOMETHING_WRONG &&
        offlineState === "load" &&
        !(customErrorView ?? !!ErrorView)
      ) {
        // D84 rule 3: offline with nothing on screen: "Connect to load ...", no Retry.
        messageContainer = connectState(
          t(connectToLoadKey ?? connectToLoadKeyFor(listItemKey)),
          CONTRACT_IDS.emptyConnectToLoad
        );
      } else if (!hideError && dataLoadingStatus.toLowerCase() === SOMETHING_WRONG) {
        messageContainer = ErrorView ? (
          <ErrorView />
        ) : (
          <View style={[styles.msgContainerStyle, listStyle?.errorStateStyle?.containerStyle]}>
            {listStyle?.errorStateStyle?.icon && (
              <Icon name='error' size={24} color={theme.color.error} />
            )}
            <Text style={[styles.msgTxtStyle, listStyle?.errorStateStyle?.titleStyle]}>
              {errorStateText}
            </Text>
          </View>
        );
      } else {
        let currentLetter = "";
        const listWithHeaders: any[] = [];
        if (list.length) {
          list.forEach((listItem: any) => {
            const chr = listItem?.name && listItem.name[0].toUpperCase();
            if (!hideStickyHeader && chr !== currentLetter && !ItemView) {
              currentLetter = chr;
              listWithHeaders.push({
                value: currentLetter,
                header: true,
              });
            }
            listWithHeaders.push({ value: listItem, header: false });
          });

          messageContainer = (
            <View style={styles.listContainerStyle}>
              <FlatList
                data={listWithHeaders}
                extraData={{ selectedItems, theme, list, selectionMode }}
                renderItem={
                  ItemView
                    ? ({ item, index, separators }) => {
                        return ItemView(item?.value);
                      }
                    : renderItemView
                }
                keyExtractor={(item, index) => {
                  const itemValue = { ...item.value };
                  let key = itemValue[listItemKey] ? `${itemValue[listItemKey]}` : undefined;
                  if (!key) {
                    //section header is also an item in the list
                    if (itemValue[0] && itemValue[0].length === 1) {
                      key = itemValue[0] + "_" + index;
                    }
                  }
                  return key ?? index + "";
                }}
                onMomentumScrollEnd={(event) => {
                  const contentOffsetY = event.nativeEvent.contentOffset.y;
                  const contentHeight = event.nativeEvent.contentSize.height;
                  const layoutHeight = event.nativeEvent.layoutMeasurement.height;

                  if (contentOffsetY + layoutHeight >= contentHeight - 10) {
                    handleList();
                  }
                }}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  offlineFooter === "connect"
                    ? () => (
                        <ConnectToLoadMore
                          t={t}
                          onRetry={retryOfflinePage}
                          textColor={theme.color.textSecondary as string}
                          containerStyle={theme.messageListStyles?.offlineStyles?.footerStyle?.containerStyle}
                          textStyle={theme.messageListStyles?.offlineStyles?.footerStyle?.textStyle}
                        />
                      )
                    : renderFooter
                }
                refreshControl={
                  // Offline ON only: pull-to-refresh asks the SDK for a sweep (conversations).
                  listItemKey === "conversationId" && isOfflineOn() ? (
                    <RefreshControl refreshing={refreshing} onRefresh={onPullToRefresh} />
                  ) : undefined
                }
                keyboardShouldPersistTaps='always'
                keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'none'}
              />
            </View>
          );
        }
      }

      return messageContainer;
    }, [list, selectedItems, theme, dataLoadingStatus, isLoadingMore, hasMoreData, shouldSelect, offlineFooter, offlineState, refreshing]);


    return (
      <View style={{ flex: 1 }}>
        <Header
          hideHeader={hideHeader ?? hideHeader}
          backButtonIconContainerStyle={listStyle?.backButtonIconContainerStyle}
          backButtonIcon={listStyle?.backButtonIcon}
          backButtonIconStyle={listStyle?.backButtonIconStyle}
          hideBackButton={hideBackButton}
          containerStyle={listStyle?.headerContainerStyle}
          titleSeparatorStyle={listStyle?.titleSeparatorStyle}
          titleViewStyle={listStyle?.titleViewStyle}
          onBack={onBack}
          title={title}
          titleStyle={listStyle?.titleStyle}
          AppBarOptions={AppBarOptions}
          shouldSelect={shouldSelect}
          hideSubmitButton={hideSubmitButton}
          onCancel={handleCancelSelection}
          onConfirm={handleConfirmSelection}
          hideSearch={hideSearch}
          searchPlaceholderText={searchPlaceholderText}
          searchHandler={searchHandler}
          searchInput={searchInput}
          onSubmitEditing={() => searchHandler(searchInput)}
          selectionCancelStyle={listStyle?.selectionCancelStyle}
          confirmSelectionStyle={listStyle?.confirmSelectionStyle}
          searchStyle={listStyle?.searchStyle}
          selectedCount={selectedCount}
          SearchView={SearchView}
          onSearchBarClicked={onSearchBarClicked}
        />
        <View style={styles.container}>{getMessageContainer()}</View>
        {list.length === 0 && dataLoadingStatus.toLowerCase() === LOADING ? (
          LoadingView ? (
            <LoadingView />
          ) : (
            <View style={styles.msgContainerStyle}>
              <ActivityIndicator
                size={theme.spacing.spacing.s10}
                color={listStyle?.loadingIconTint || theme.color.iconSecondary}
              />
            </View>
          )
        ) : null}
        {/* Add a fallback like `null` if nothing needs to be rendered */}
      </View>
    );
  }
  // }
);
