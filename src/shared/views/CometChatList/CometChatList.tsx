import React, {
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  FlatList,
  Image,
  StyleProp,
  ViewStyle,
  ListRenderItem,
  ViewProps,
  TextStyle,
  ActivityIndicator,
  //@ts-ignore
} from 'react-native';
import { CometChatContext } from '../../CometChatContext';
import { localize } from '../../resources/CometChatLocalize';
import {
  LOADING,
  NO_DATA_FOUND,
  SOMETHING_WRONG,
} from '../../constants/UIKitConstants';

import { ICONS } from './resources';
import styles from './styles';
import { CometChatOptions } from '../../modals';
import { CometChatListItem } from '../../views/CometChatListItem';
import Header from './Header';
import { ImageType } from '../../base';
import { BorderStyleInterface, FontStyleInterface } from '../../base';
import { ListItemStyleInterface } from '../CometChatListItem/ListItemStyle';
import { AvatarStyleInterface } from '../CometChatAvatar/AvatarStyle';
import { CometChatContextType } from '../../base/Types';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { StatusIndicatorStyleInterface } from '../CometChatStatusIndicator';
import { anyObject } from '../../utils';

export interface CometChatListActionsInterface {
  updateList: (prop: any) => void;
  updateAndMoveToFirst: (item: any) => void;
  addItemToList: (item: any, position?: number) => void;
  removeItemFromList: (itemId: string | number) => void;
  getListItem: (itemId: string | number) => void;
  getSelectedItems: () => Array<any>;
  getAllListItems: () => Array<any>;
  clearSelection: () => void;
}

export interface CometChatListStylesInterface {
  width?: number | string;
  height?: number | string;
  background?: string;
  border?: BorderStyleInterface;
  borderRadius?: number;
  titleFont?: FontStyleInterface;
  titleColor?: string;
  backIconTint?: string;
  searchBorder?: BorderStyleInterface;
  searchBorderRadius?: number;
  searchBackground?: string;
  searchTextFont?: FontStyleInterface;
  searchTextColor?: string;
  searchIconTint?: string;
  onlineStatusColor?: string;
  separatorColor?: string;
  loadingIconTint?: string;
  emptyTextColor?: string;
  emptyTextFont?: FontStyleInterface;
  errorTextColor?: string;
  errorTextFont?: FontStyleInterface;
  sectionHeaderTextFont?: FontStyleInterface;
  sectionHeaderTextColor?: string;
}
export interface CometChatListProps {
  SubtitleView?: (item: object | any) => JSX.Element;
  TailView?: (item: object | any) => JSX.Element;
  disableUsersPresence?: boolean;
  ListItemView?: (item: any) => JSX.Element | null;
  AppBarOptions?: React.FC;
  options?: (item: object | any) => Array<CometChatOptions>;
  hideSeparator?: boolean;
  searchPlaceholderText?: string;
  backButtonIcon?: ImageType;
  showBackButton?: boolean;
  selectionMode?: 'none' | 'single' | 'multiple';
  onSelection?: (list: any) => void;
  searchBoxIcon?: ImageType;
  hideSearch?: boolean;
  title?: string;
  EmptyStateView?: React.FC;
  emptyStateText?: string;
  errorStateText?: string;
  ErrorStateView?: React.FC;
  LoadingStateView?: React.FC;
  requestBuilder?: any;
  searchRequestBuilder?: any;
  hideError?: boolean;
  onItemPress?: (user: any) => void;
  onItemLongPress?: (user: any) => void;
  onError?: (error: CometChat.CometChatException) => void;
  onBack?: Function;
  selectionIcon?: ImageType;
  listItemKey: 'uid' | 'guid' | 'conversationId';
  statusIndicatorStyle?: StatusIndicatorStyleInterface;
  avatarStyle?: AvatarStyleInterface;
  listItemStyle?: ListItemStyleInterface;
  headViewContainerStyle?: StyleProp<ViewStyle>;
  bodyViewContainerStyle?: StyleProp<ViewStyle>;
  tailViewContainerStyle?: StyleProp<ViewStyle>;
  listStyle?: CometChatListStylesInterface;
  hideSubmitIcon?: boolean;
}

/**
 * @class Users is a component useful for displaying the header and users in a list
 * @description This component displays a header and list of users with subtitle,avatar,status
 * @Version 1.0.0
 * @author CometChat
 *
 */

export const CometChatList = React.forwardRef<
  CometChatListActionsInterface,
  CometChatListProps
>((props, ref) => {
  const connectionListenerId = 'connectionListener_' + new Date().getTime();
  const { theme } = useContext<CometChatContextType>(CometChatContext);
  const lastCall = useRef(null);
  const lastReject = useRef(null);

  const {
    SubtitleView,
    TailView,
    disableUsersPresence,
    ListItemView,
    AppBarOptions,
    options,
    hideSeparator,
    searchPlaceholderText,
    backButtonIcon,
    showBackButton,
    searchBoxIcon,
    EmptyStateView,
    ErrorStateView,
    LoadingStateView,
    onError,
    onBack,
    selectionIcon,
    statusIndicatorStyle,
    avatarStyle,
    listItemStyle,
    headViewContainerStyle,
    bodyViewContainerStyle,
    tailViewContainerStyle,
    hideSubmitIcon,
    title = '',
    hideSearch = false,
    requestBuilder = undefined,
    searchRequestBuilder = undefined,
    emptyStateText = '',
    errorStateText = localize('SOMETHING_WRONG'),
    hideError = false,
    onItemPress = () => {},
    onItemLongPress = () => {},
    onSelection = () => {},
    selectionMode = 'none',
    listItemKey = 'uid',
    listStyle = {},
  } = props;

  // functions which can be access by parents
  useImperativeHandle(ref, () => {
    return {
      updateList,
      addItemToList,
      removeItemFromList,
      getListItem,
      updateAndMoveToFirst,
      getSelectedItems,
      getAllListItems,
      clearSelection,
    };
  });

  const [searchInput, setSearchInput] = React.useState(
    requestBuilder && searchRequestBuilder
      ? searchRequestBuilder.searchKeyword
        ? searchRequestBuilder.searchKeyword
        : ''
      : requestBuilder
      ? requestBuilder.searchKeyword
        ? requestBuilder.searchKeyword
        : ''
      : searchRequestBuilder
      ? searchRequestBuilder.searchKeyword
        ? searchRequestBuilder.searchKeyword
        : ''
      : ''
  );
  const searchInputRef = useRef(
    requestBuilder && searchRequestBuilder
      ? searchRequestBuilder.searchKeyword
        ? searchRequestBuilder.searchKeyword
        : ''
      : requestBuilder
      ? requestBuilder.searchKeyword
        ? requestBuilder.searchKeyword
        : ''
      : searchRequestBuilder
      ? searchRequestBuilder.searchKeyword
        ? searchRequestBuilder.searchKeyword
        : ''
      : ''
  );

  const [shouldSelect, setShouldSelect] = React.useState(
    selectionMode !== 'none' ? true : false
  );
  const [selectedItems, setSelectedItems] = useState<anyObject>({});
  const listHandlerRef = React.useRef(null);
  const initialRunRef = React.useRef(true);

  const activeSwipeRows = React.useRef<anyObject>({});

  const [list, setList] = React.useState<any>([]);
  const [decoratorMessage, setDecoratorMessage] = React.useState(LOADING);

  const searchHandler = (searchText: string) => {
    setSearchInput(searchText);
    let _searchRequestBuilder = searchRequestBuilder || requestBuilder;
    if (searchRequestBuilder && searchText) {
      _searchRequestBuilder = searchRequestBuilder
        .setSearchKeyword(searchText ? searchText : '')
        .build();
    } else if (requestBuilder) {
      _searchRequestBuilder = requestBuilder
        .setSearchKeyword(searchText ? searchText : '')
        .build();
    }
    getSearch(_searchRequestBuilder);
  };

  const getSearch = (builder: any) => {
    getList(builder)
      .then((newlist: any) => {
        setDecoratorMessage(NO_DATA_FOUND);
        setList(newlist);
      })
      .catch((error) => {
        if (error && error['message'] == 'Promise cancelled') {
        } else {
          setDecoratorMessage(SOMETHING_WRONG);
          errorHandler(error);
        }
      });
  };

  const getSelectedItems = () => {
    let markedItems: any[] = [];
    Object.keys(selectedItems).forEach((item) => {
      return markedItems.push(getListItem(item));
    });
    return markedItems;
  };

  useEffect(() => {
    CometChat.addConnectionListener(
      connectionListenerId,
      new CometChat.ConnectionListener({
        onConnected: () => {
          console.log('ConnectionListener => On Connected');
          if (requestBuilder) {
            if (searchInputRef.current)
              listHandlerRef.current = requestBuilder
                .setSearchKeyword(searchInputRef.current)
                .build();
            else listHandlerRef.current = requestBuilder.build();
          }
          getList(listHandlerRef.current)
            .then((newlist: any) => {
              setDecoratorMessage(NO_DATA_FOUND);
              setList(newlist);
            })
            .catch((error) => {
              if (error && error['message'] == 'Promise cancelled') {
              } else {
                setDecoratorMessage(SOMETHING_WRONG);
                errorHandler(error);
              }
            });
        },
        inConnecting: () => {
          console.log('ConnectionListener => In connecting');
        },
        onDisconnected: () => {
          console.log('ConnectionListener => On Disconnected');
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
          listHandlerRef.current = requestBuilder
            .setSearchKeyword(searchInput)
            .build();
        else listHandlerRef.current = requestBuilder.build();
      }
      initialRunRef.current = false;
      handleList(false);
    }
  }, []);

  useEffect(() => {
    setShouldSelect(selectionMode !== 'none' ? true : false);
  }, [selectionMode]);

  useEffect(() => {
    searchInputRef.current = searchInput;
  }, [searchInput]);

  /**
   * Updates the list of users to be displayed
   * @param
   */
  const updateList = (item: any) => {
    let newList = [...list];
    let itemKey = newList.findIndex(
      (u) => u[listItemKey] === item[listItemKey]
    );
    if (itemKey > -1) {
      newList.splice(itemKey, 1, item);
      if (newList?.length === 0) setDecoratorMessage(NO_DATA_FOUND);
      setList(newList);
    }
  };

  /**
   * This will move item to first location if item doesn't exits then add it to first location.
   * @param item
   */
  const updateAndMoveToFirst = (item: any) => {
    let newList = [...list];
    let itemKey = newList.findIndex(
      (u) => u[listItemKey] === item[listItemKey]
    );
    if (itemKey > -1) {
      newList.splice(itemKey, 1);
    }
    setList([item, ...newList]);
  };

  const addItemToList = (item: any, position?: number) => {
    setList((prev: [any]) => {
      if (position != undefined) {
        if (position == 0) return [item, ...prev];
        if (position >= prev.length) return [...prev, item];
        else
          return [...prev.slice(0, position - 1), item, prev.slice(position)];
      }
      return [...prev, item];
    });
  };

  const removeItemFromList = (uid: string | number) => {
    setList((prev: any) => {
      let newList = prev.filter((item: any) => item[listItemKey] !== uid);
      if (newList?.length === 0) setDecoratorMessage(NO_DATA_FOUND);
      return newList;
    });
    if (ListItemView == undefined && shouldSelect) {
      let newSelectedItems = { ...selectedItems };
      if (Object.keys(selectedItems).includes(uid.toString())) {
        delete newSelectedItems[uid];
        setSelectedItems(newSelectedItems);
      }
    }
  };

  const getListItem = (itemId: string | number): any => {
    return list.find((item: any) => item[listItemKey] == itemId);
  };

  /**
   * get all list items
   */
  const getAllListItems = (): any => {
    return list;
  };

  /**
   * update list
   * @param {boolean} thrughKeyword - pass true if wants to set only new users.
   */
  const handleList = (thrughKeyword?: any) => {
    getList(listHandlerRef.current)
      .then((newlist: any) => {
        if ((thrughKeyword || list.length === 0) && newlist.length === 0) {
          setDecoratorMessage(NO_DATA_FOUND);
        } else {
          setDecoratorMessage('');
        }
        if (thrughKeyword && thrughKeyword === true) {
          setList(newlist);
        } else {
          setList([].concat(list, newlist));
        }
      })
      .catch((error) => {
        if (error && error['message'] == 'Promise cancelled') {
        } else {
          setDecoratorMessage(SOMETHING_WRONG);
          errorHandler(error);
        }
      });
  };

  /**
   * Handle on end reached of the list
   */
  const endReached = (prop: any) => {
    handleList(false);
  };

  const errorHandler = (errorCode: any) => {
    onError && onError(errorCode);
    // CometChatUserEvents.emit(CometChatUserEvents.onUserError, errorCode);
  };

  const handleSelection = (listItem: any) => {
    if (!shouldSelect || selectionMode === 'none') return;
    setShouldSelect(true);
    if (selectionMode === 'multiple')
      setSelectedItems((prev: any) => {
        let newState = { ...prev };
        if (Object.keys(prev).includes(listItem.value[listItemKey])) {
          delete newState[listItem.value[listItemKey]];
          return newState;
        } else {
          newState[listItem.value[listItemKey]] = listItem.value;
          return newState;
        }
      });
    else if (selectionMode === 'single')
      setSelectedItems({ [listItem.value[listItemKey]]: listItem.value });
  };

  const onSelectionHandler = () => {
    if (onSelection) {
      onSelection(Object.values(selectedItems));
      return;
    }
    setShouldSelect(false);
    setSelectedItems({});
  };

  const clearSelection = () => {
    setShouldSelect(false);
    setSelectedItems({});
  };

  const onListItemPress = (item: any) => {
    if (shouldSelect) {
      if (selectionMode === 'multiple')
        setSelectedItems((prev: any) => {
          let newState = { ...prev };
          if (Object.keys(prev).includes(item.value[listItemKey])) {
            delete newState[item.value[listItemKey]];
            return newState;
          } else {
            newState[item.value[listItemKey]] = item.value;
            return newState;
          }
        });
      else if (selectionMode === 'single')
        setSelectedItems({ [item.value[listItemKey]]: item.value });
    }
    onItemPress && onItemPress(item.value);
    // CometChatUserEvents.emit(CometChatUserEvents.onUserItemClick, item);
  };

  const onListItemLongPress = (item: any) => {
    handleSelection(item);
    onItemLongPress && onItemLongPress(item.value);
    // CometChatUserEvents.emit(CometChatUserEvents.onUserItemClick, item);
  };

  const renderListItemView = ({ item, index }: any) => {
    if (item.header) {
      const headerLetter = item.value;
      return (
        <View key={index}>
          <View
            style={[
              styles.dividerStyle,
              {
                backgroundColor:
                  listStyle?.separatorColor ?? theme.palette.getAccent100(),
              },
            ]}
          ></View>
          <Text
            style={
              [
                styles.headerLetterStyle,
                {
                  color:
                    listStyle?.sectionHeaderTextColor ??
                    theme.palette.getAccent500(),
                },
                listStyle?.sectionHeaderTextFont ?? theme.typography.text2,
              ] as TextStyle[]
            }
          >
            {headerLetter}
          </Text>
        </View>
      );
    }
    return (
      <CometChatListItem
        id={item.value[listItemKey]}
        avatarName={item.value.name}
        title={item.value.name}
        listItemStyle={listItemStyle ? listItemStyle : { height: 55 }}
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
        avatarURL={item.value.avatar || undefined}
        statusIndicatorColor={
          Object.keys(selectedItems).includes(item.value[listItemKey])
            ? theme.palette.getBackgroundColor()
            : !disableUsersPresence && item.value.status === 'online'
            ? listStyle?.onlineStatusColor
              ? listStyle?.onlineStatusColor
              : theme.palette.getSuccess()
            : ''
        }
        statusIndicatorIcon={
          Object.keys(selectedItems).includes(item.value[listItemKey]) &&
          ICONS.CHECK
        }
        {...(SubtitleView
          ? { SubtitleView: () => SubtitleView(item.value) }
          : {})}
        {...(TailView ? { TailView: () => TailView(item.value) } : {})}
        statusIndicatorStyle={
          selectedItems[item.value[listItemKey]] === true
            ? {
                ...(statusIndicatorStyle as object),
                borderRadius: 10,
                height: 20,
                width: 20,
              }
            : (statusIndicatorStyle as ViewProps)
        }
        avatarStyle={avatarStyle}
        options={() => (options ? options(item.value) : [])}
        activeSwipeRows={activeSwipeRows.current}
        rowOpens={(id) => {
          Object.keys(activeSwipeRows.current).forEach((key) => {
            if (id !== key && activeSwipeRows.current[key]) {
              activeSwipeRows.current[key]?.current?.closeRow?.();
              delete activeSwipeRows.current[key];
            }
          });
        }}
        onPress={() => {
          onListItemPress(item);
        }}
        onLongPress={() => {
          onListItemLongPress(item);
        }}
      />
    );
  };

  /**
   * Gets the list of users
   */
  const getList = (props: any) => {
    const promise = new Promise((resolve, reject) => {
      const cancel = () => {
        clearTimeout(lastCall.current);
        lastReject.current(new Error('Promise cancelled'));
      };
      if (lastCall.current) {
        cancel();
      }

      lastCall.current = setTimeout(() => {
        props
          ?.fetchNext()
          .then((listItems: any) => {
            resolve(listItems);
          })
          .catch((error: any) => {
            reject(error);
          });
      }, 500);
      lastReject.current = reject;
    });
    return promise;
  };

  /**
   * Returns a container of users if exists else returns the corresponding decorator message
   */
  const getMessageContainer = () => {
    let messageContainer: any = null;
    decoratorMessage === LOADING;
    if (list.length === 0 && decoratorMessage.toLowerCase() === LOADING) {
      if (LoadingStateView) return <LoadingStateView />;
      messageContainer = (
        <View style={styles.msgContainerStyle}>
          <ActivityIndicator
            size={'large'}
            color={listStyle?.loadingIconTint || theme.palette.getPrimary()}
          />
        </View>
      );
    } else if (
      list.length === 0 &&
      decoratorMessage.toLowerCase() === NO_DATA_FOUND
    ) {
      messageContainer = EmptyStateView ? (
        <EmptyStateView />
      ) : (
        <View style={styles.msgContainerStyle}>
          <Text
            style={
              [
                styles.msgTxtStyle,
                listStyle?.emptyTextFont ?? theme.typography.body,
                {
                  color:
                    listStyle?.emptyTextColor ?? theme.palette.getAccent400(),
                },
              ] as TextStyle[]
            }
          >
            {emptyStateText}
          </Text>
        </View>
      );
    } else if (
      !hideError &&
      decoratorMessage.toLowerCase() === SOMETHING_WRONG
    ) {
      messageContainer = ErrorStateView ? (
        <ErrorStateView />
      ) : (
        <View style={styles.msgContainerStyle}>
          <Text
            style={
              [
                styles.msgTxtStyle,
                listStyle?.errorTextFont ?? theme.typography.body,
                {
                  color:
                    listStyle?.errorTextColor ?? theme.palette.getAccent400(),
                },
              ] as TextStyle[]
            }
          >
            {errorStateText}
          </Text>
        </View>
      );
    } else {
      let currentLetter = '';
      const listWithHeaders: any[] = [];
      if (list.length) {
        list.forEach((listItem: any) => {
          const chr = listItem?.name && listItem.name[0].toUpperCase();
          if (chr !== currentLetter && !hideSeparator && !ListItemView) {
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
              extraData={listWithHeaders}
              renderItem={
                ListItemView
                  ? ({ item, index, separators }) => (
                      <ListItemView
                        index={index}
                        separators={separators}
                        item={item.value}
                      />
                    )
                  : renderListItemView
              }
              keyExtractor={(item, index) =>
                (item[listItemKey]
                  ? item[listItemKey] + '_' + index
                  : index) as string
              }
              onEndReached={endReached}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
            />
          </View>
        );
      }
    }

    return messageContainer;
  };

  return (
    <View
      style={
        [
          styles.containerStyle,
          {
            height: listStyle?.height ?? '100%',
            width: listStyle?.width ?? '100%',
            backgroundColor:
              listStyle?.background ?? theme.palette.getBackgroundColor(),
            borderRadius: listStyle?.borderRadius ?? 0,
          },
          listStyle?.border ?? {},
        ] as ViewProps
      }
    >
      <Header
        backButtonIcon={backButtonIcon}
        showBackButton={showBackButton}
        onBack={onBack}
        title={title}
        AppBarOptions={AppBarOptions}
        shouldSelect={shouldSelect}
        hideSubmitIcon={hideSubmitIcon}
        onSelectionHandler={onSelectionHandler}
        hideSearch={hideSearch}
        searchBoxIcon={searchBoxIcon}
        searchPlaceholderText={searchPlaceholderText}
        searchHandler={searchHandler}
        searchInput={searchInput}
        onSubmitEditing={() => searchHandler(searchInput)}
        selectionIcon={selectionIcon}
        titleFontStyle={listStyle?.titleFont ?? theme.typography.heading}
        titleColor={listStyle?.titleColor ?? theme.palette.getAccent()}
        backIconTint={listStyle?.backIconTint ?? theme.palette.getPrimary()}
        selectionIconTint={theme.palette.getPrimary()}
        searchBorderStyle={listStyle?.searchBorder}
        searchBorderRadius={listStyle?.searchBorderRadius}
        searchTextFontStyle={listStyle?.searchTextFont ?? theme.typography.body}
        searchTextColor={
          listStyle?.searchTextColor ?? theme.palette.getAccent()
        }
        searchPlaceholderTextColor={theme.palette.getAccent600()}
        searchIconTint={
          listStyle?.searchIconTint ?? theme.palette.getAccent400()
        }
        searchBackground={
          listStyle?.searchBackground ?? theme.palette.getAccent50()
        }
      />
      <View style={styles.container}>{getMessageContainer()}</View>
    </View>
  );
});
