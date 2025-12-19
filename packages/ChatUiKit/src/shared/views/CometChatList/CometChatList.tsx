import React, { JSX, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  ActivityIndicator,
  ColorValue,
  FlatList,
  GestureResponderEvent,
  ImageSourcePropType,
  ImageStyle,
  Platform,
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

export interface CometChatListActionsInterface {
  updateList: (prop: any) => void;
  updateAndMoveToFirst: (item: any) => void;
  addItemToList: (item: any, position?: number) => void;
  removeItemFromList: (itemId: string | number) => void;
  getListItem: (itemId: string | number) => any;
  getSelectedItems: () => Array<any>;
  getAllListItems: () => Array<any>;
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
  emptyStateText?: string;
  errorStateText?: string;
  ErrorView?: React.FC;
  LoadingView?: React.FC;
  requestBuilder?: any;
  searchRequestBuilder?: any;
  hideError?: boolean;
  onItemPress?: (user: any) => void;
  onItemLongPress?: (user: any, e: GestureResponderEvent) => void;
  onError?: (error: CometChat.CometChatException) => void;
  onBack?: (() => void) | undefined;
  listItemKey: "uid" | "guid" | "conversationId";
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
    const connectionListenerId = "connectionListener_" + new Date().getTime();
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
      emptyStateText = t("NO_USERS_FOUND"),
      errorStateText = t("SOMETHING_WRONG"),
      ErrorView,
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
    const [dataLoadingStatus, setDataLoadingStatus] = useState<string>(LOADING);

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

    useEffect(() => {
      CometChat.addConnectionListener(
        connectionListenerId,
        new CometChat.ConnectionListener({
          onConnected: () => {
            if (requestBuilder) {
              if (searchInputRef.current)
                listHandlerRef.current = requestBuilder
                  .setSearchKeyword(searchInputRef.current)
                  .build();
              else listHandlerRef.current = requestBuilder.build();
            }
            getList(listHandlerRef.current)
              .then((newlist: any[]) => {
                setDataLoadingStatus(NO_DATA_FOUND);
                setList(newlist);
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
      let newList = [...list];
      let itemKey = newList.findIndex((u) => u[listItemKey] === item[listItemKey]);
      if (itemKey > -1) {
        newList.splice(itemKey, 1, item);
        if (newList.length === 0) setDataLoadingStatus(NO_DATA_FOUND);
        setList(newList);
      }
    };

    /**
     * This will move item to first location if item doesn't exist then add it to first location.
     * @param item
     */
    const updateAndMoveToFirst = (item: any) => {
      let newList = [...list];
      let itemKey = newList.findIndex((u) => u[listItemKey] === item[listItemKey]);
      if (itemKey > -1) {
        newList.splice(itemKey, 1);
      }
      setList([item, ...newList]);
    };

    const addItemToList = (item: any, position?: number) => {
      setList((prev: any[]) => {
        if (position !== undefined) {
          if (position === 0) return [item, ...prev];
          if (position >= prev.length) return [...prev, item];
          else return [...prev.slice(0, position - 1), item, ...prev.slice(position)];
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
      return list.find((item: any) => item[listItemKey] === itemId);
    };

    /**
     * Get all list items
     */
    const getAllListItems = (): any[] => {
      return list;
    };

    /**
     * Handle list fetching with pagination
     * @param {boolean} throughKeyword - Pass true if wants to set only new users.
     */
    const handleList = (throughKeyword?: boolean) => {
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
            // Append to existing list
            finalList = [...list, ...newlist];
            setList(finalList);

            // When the backend returns nothing more, mark the end of data
            if (newlist.length === 0) setHasMoreData(false);
          }

          // If we *did* get results but less than a full “page”, also stop further loads
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
            statusIndicatorType={statusIndicatorType ? statusIndicatorType(item.value) : null}
            id={item.value[listItemKey]}
            avatarName={item.value.name}
            selected={!!selectedItems[item.value[listItemKey]]}
            shouldSelect={shouldSelect}
            LeadingView={LeadingView && LeadingView(item.value)}
            TitleView={TitleView && TitleView(item.value)}
            title={
              item.value.uid &&
              item.value.uid === CometChatUIKit.loggedInUser!.getUid() &&
              item.value.name === CometChatUIKit.loggedInUser!.getName()
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
            // onLongPress={() => {
            //   onListItemLongPress(item);
            // }}
            onLongPress={(id: any, e: any) => {
              // const listItem = getListItem(id);
              onListItemLongPress(item, e);
            }}
          />
        );
      },
      [
        listItemKey,
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
      if (list.length === 0 && dataLoadingStatus.toLowerCase() === NO_DATA_FOUND) {
        messageContainer = EmptyView ? (
          <EmptyView />
        ) : (
          <View style={[styles.msgContainerStyle, listStyle?.emptyStateStyle?.containerStyle]}>
            <Text style={[styles.msgTxtStyle, listStyle?.emptyStateStyle?.titleStyle]}>
              {emptyStateText}
            </Text>
          </View>
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
                ListFooterComponent={renderFooter}
                keyboardShouldPersistTaps='always'
                keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'none'}
              />
            </View>
          );
        }
      }

      return messageContainer;
    }, [list, selectedItems, theme, dataLoadingStatus, isLoadingMore, hasMoreData, shouldSelect]);

    /**
     * Handle the rendering based on loading status
     */
    // if (list.length === 0 && dataLoadingStatus.toLowerCase() === LOADING) {
    // if (LoadingView) return <LoadingView />;
    // } else {
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
