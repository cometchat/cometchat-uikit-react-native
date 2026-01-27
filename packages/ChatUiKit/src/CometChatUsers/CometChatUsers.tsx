import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX, useCallback, useEffect, useRef, useState } from "react";
import { ColorValue, KeyboardAvoidingView, Platform, View } from "react-native";
import {
  CometChatList,
  CometChatListActionsInterface,
  CometChatListProps,
  CometChatRetryButton,
} from "../shared";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { Icon } from "../shared/icons/Icon";
import { CometChatStatusIndicatorInterface } from "../shared/views/CometChatStatusIndicator";
import { ErrorEmptyView } from "../shared/views/ErrorEmptyView/ErrorEmptyView";
import { useTheme } from "../theme";
import { Skeleton } from "./Skeleton";
import { UserStyle } from "./style";
import { CommonUtils } from "../shared/utils/CommonUtils";
import { CometChatTooltipMenu } from "../shared/views/CometChatTooltipMenu";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";

/**
 * Interface for the menu items (tooltip actions).
 */
export interface MenuItemInterface {
  text: string;
  onPress: () => void;
  textColor?: ColorValue;
  iconColor?: ColorValue;
  disabled?: boolean;
}

/**
 * Interface for the props accepted by the CometChatUsers component.
 * @interface CometChatUsersInterface
 */

export interface CometChatUsersInterface
  extends Omit<
    CometChatListProps,
    | "title"
    | "requestBuilder"
    | "listStyle"
    | "TitleView"
    | "SubtitleView"
    | "statusIndicatorStyle"
    | "avatarStyle"
    | "hideBackButton"
    | "onListFetched"
    | "listItemStyle"
    | "ListItemView"
    | "TailView"
    | "disableUsersPresence"
    | "ItemView"
    | "onItemPress"
    | "onItemLongPress"
    | "listItemKey"
    | "onSelection"
    | "statusIndicatorType"
    | "emptyStateText"
    | "errorStateText"
    | "hideStickyHeader"
  > {
  /**
   * Callback function when a list item (user) is pressed.
   *
   * @param {CometChat.User} user - The user object that was pressed.
   */
  onItemPress?: (user: CometChat.User) => void;
  /**
   * Callback function when a list item (user) is long pressed.
   *
   * @param {CometChat.User} user - The user object that was long pressed.
   */
  onItemLongPress?: (user: CometChat.User) => void;
  /**
   * Callback function providing the selected users list.
   *
   * @param {CometChat.User[]} list - The array of selected user objects.
   */
  onSelection?: (list: CometChat.User[]) => void;
  /**
   * Callback when submit selection button is pressed.
   */
  onSubmit?: (list: Array<CometChat.User>) => void;
  /**
   * Users request builder instance to customize the user request.
   *
   * @type {CometChat.UsersRequestBuilder}
   */
  usersRequestBuilder?: CometChat.UsersRequestBuilder;
  /**
   * Custom styling for the users list.
   *
   * @type {DeepPartial<UserStyle>}
   */
  style?: DeepPartial<UserStyle>;
  /**
   * Custom title view component.
   *
   * @param {CometChat.User} conversation - The user conversation object.
   * @returns {JSX.Element}
   */
  TitleView?: (conversation: CometChat.User) => JSX.Element;
  /**
   * Function that returns a custom subtitle view for a user.
   *
   * @param {CometChat.User} item - The user object.
   * @returns {JSX.Element}
   */
  SubtitleView?: (item: CometChat.User) => JSX.Element;
  /**
   * Function that returns a custom trailing view for a user.
   *
   * @param {CometChat.User} item - The user object.
   * @returns {JSX.Element}
   */
  TrailingView?: (item: CometChat.User) => JSX.Element;
  /**
   * Function that returns a custom list item view.
   *
   * @param {CometChat.User} item - The user object.
   * @returns {JSX.Element}
   */
  ItemView?: (item: CometChat.User) => JSX.Element;
  /**
   * Custom component to display for the empty state.
   *
   * @returns {JSX.Element}
   */
  EmptyView?: () => JSX.Element;
  /**
   * Custom component to display for the error state.
   *
   * @returns {JSX.Element}
   */
  ErrorView?: () => JSX.Element;
  /**
   * Custom component to display for the loading state.
   *
   * @returns {JSX.Element}
   */
  LoadingView?: () => JSX.Element;
  /**
   * Custom leading view component.
   *
   * @param {CometChat.User} item - The user object.
   * @returns {JSX.Element}
   */
  LeadingView?: (item: CometChat.User) => JSX.Element;
  /**
   * Hide the header view.
   *
   * @type {boolean}
   */
  hideHeader?: boolean;
  /**
   * Placeholder text for the search input.
   *
   * @type {string}
   */
  searchPlaceholderText?: string;
  /**
   * Hide the users Status.
   */
  usersStatusVisibility?: boolean;
  /**
   * Search Keyword.
   */
  searchKeyword?: string;
  /**
   * Callback when an error occurs.
   */
  onError?: (e: CometChat.CometChatException) => void;
  /**
   * Callback triggered when the fetched list is empty.
   */
  onEmpty?: () => void;
  /**
   * Callback triggered once the users have loaded and are not empty.
   */
  onLoad?: (list: CometChat.User[]) => void;
  /**
   * Hide the loading skeleton.
   */
  hideLoadingState?: boolean;
  /**
   * Title for the header.
   */
  title?: string;
  /**
   * A function to **append** more menu items on top of the default menu items for a users.
   */
  addOptions?: (user: CometChat.User) => MenuItemInterface[];
  /**
   * A function to **replace** the default menu items entirely for a users.
   */
  options?: (user: CometChat.User) => MenuItemInterface[];
  /**
   * Toggle error view visibility.
   */
  hideError?: boolean;
  /**
   * Toggle back button visibility.
   */
  showBackButton?: boolean;
  /**
   * Toggle Sticky Header visibility.
   */
  stickyHeaderVisibility?: boolean;
}

/**
 * Interface for actions exposed by the CometChatUsers component.
 *
 * @interface CometChatUsersActionsInterface
 * @extends {CometChatListActionsInterface}
 */
export interface CometChatUsersActionsInterface extends CometChatListActionsInterface {}

/**
 * CometChatUsers component renders a list of users with support for search,
 * selection, and custom empty/error/loading states.
 */
export const CometChatUsers = React.forwardRef<
  CometChatUsersActionsInterface,
  CometChatUsersInterface
>((props, ref) => {
  const userListenerId = "userStatus_" + new Date().getTime();
  const theme = useTheme();
  const {t}= useCometChatTranslation()
  const [hideSearchError, setHideSearchError] = useState(false);

  const {
    usersRequestBuilder,
    LoadingView,
    ErrorView,
    EmptyView,
    selectionMode = "none",
    title,
    addOptions,
    options,
    TrailingView,
    LeadingView,
    AppBarOptions,
    hideSearch = false,
    stickyHeaderVisibility = true,
    style = {},
    onError,
    onLoad,
    onEmpty,
    hideError,
    hideLoadingState,
    usersStatusVisibility = true,
    showBackButton = false,
    searchKeyword = "",
    searchRequestBuilder,
    hideHeader,
    onSelection,
    onSubmit,
    searchPlaceholderText = t("SEARCH"),
    ...newProps
  } = props;
  const userRef = useRef<CometChatUsersActionsInterface>(null);
  const mergedStyle = deepMerge(theme.userStyles, style);

  // ----- Tooltip functionality for users -----
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CometChat.User | null>(null);
  const tooltipPosition = useRef({ pageX: 0, pageY: 0 });

  const buildMenuItems = (user: CometChat.User): MenuItemInterface[] => {
    if (options) return options(user);
    if (addOptions) return addOptions(user);
    return [];
  };

  const handleItemLongPress = (user: CometChat.User, e?: any) => {
    if (props.onItemLongPress) {
      props.onItemLongPress(user);
      return;
    }
    const items = buildMenuItems(user);
    if (items.length === 0) return;
    if (e && e.nativeEvent) {
      tooltipPosition.current = {
        pageX: e.nativeEvent.pageX,
        pageY: e.nativeEvent.pageY,
      };
    } else {
      tooltipPosition.current = { pageX: 200, pageY: 100 };
    }
    setSelectedUser(user);
    setTooltipVisible(true);
  };

  useEffect(() => {
    // Listen for changes in user online/offline status.
    CometChat.addUserListener(
      userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          if (!onlineUser.getBlockedByMe()) {
            userRef.current!.updateList(onlineUser);
          }
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          if (!offlineUser.getBlockedByMe()) {
            userRef.current!.updateList(offlineUser);
          }
        },
      })
    );
    return () => CometChat.removeUserListener(userListenerId);
  }, []);

  /**
   * Handler for when a user is blocked.
   *
   * @param {{ user: CometChat.User }} param0 - The user object that is blocked.
   */
  const handleccUserBlocked = ({ user }: any) => {
    const clonedUser = CommonUtils.clone(user);
    clonedUser.blockedByMe = true;
    clonedUser.hasBlockedMe = true;
    userRef.current!.updateList(clonedUser);
  };

  /**
   * Handler for when a user is unblocked.
   *
   * @param {{ user: CometChat.User }} param0 - The user object that is unblocked.
   */
  const handleccUserUnBlocked = ({ user }: any) => {
    const clonedUser = CommonUtils.clone(user);
    clonedUser.blockedByMe = false;
    clonedUser.hasBlockedMe = false;
    userRef.current!.updateList(clonedUser);

    CometChat.getUser(clonedUser.getUid()).then((updatedUser) => {
      userRef.current!.updateList(updatedUser);
    });
  };

  useEffect(() => {
    CometChatUIEventHandler.addUserListener(userListenerId, {
      ccUserBlocked: (item: any) => handleccUserBlocked(item),
      ccUserUnBlocked: (item: any) => handleccUserUnBlocked(item),
    });
    return () => {
      CometChatUIEventHandler.removeUserListener(userListenerId);
    };
  }, []);

  /**
   * Renders the empty state view when there are no users.
   *
   * @returns {JSX.Element} The empty state view.
   */
  const EmptyStateView = useCallback(() => {
    useEffect(() => {
      onEmpty?.();
    }, []);
    return (
      <KeyboardAvoidingView
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        style={{ flex: 1 }}
      >
        <ErrorEmptyView
          title={t("NO_USERS_AVAILABLE")}
          subTitle={t("ADD_CONTACTS")}
          Icon={
            <Icon
              name='user-empty-icon'
              icon={mergedStyle.emptyStateStyle.icon}
              color={theme.color.neutral300}
              size={theme.spacing.spacing.s15 << 1}
              containerStyle={{
                marginBottom: theme.spacing.spacing.s5,
              }}
            />
          }
          containerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: "10%",
          }}
          titleStyle={mergedStyle.emptyStateStyle.titleStyle}
          subTitleStyle={mergedStyle.emptyStateStyle.subTitleStyle}
        />
      </KeyboardAvoidingView>
    );
  }, [theme, mergedStyle]);

  /**
   * Renders the error state view when there is an error fetching users.
   *
   * @returns {JSX.Element} The error state view.
   */
  const ErrorStateView = useCallback(() => {
    useEffect(() => {
      // Hide search when error view is active.
      setHideSearchError(true);
    }, []);
    if (hideError) return null;
    return (
      <View style={{ flex: 1 }}>
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
              icon={mergedStyle.errorStateStyle.icon}
            />
          }
          containerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: "10%",
          }}
          titleStyle={mergedStyle.errorStateStyle.titleStyle}
          subTitleStyle={mergedStyle.errorStateStyle.subTitleStyle}
          RetryView={<CometChatRetryButton onPress={() => userRef.current?.reload()} />}
        />
      </View>
    );
  }, [theme, mergedStyle, hideError]);

  return (
    <View style={theme.userStyles.containerStyle}>
      <CometChatList
        hideHeader={hideHeader ?? hideHeader}
        searchPlaceholderText={searchPlaceholderText}
        searchRequestBuilder={searchRequestBuilder}
        hideBackButton={!showBackButton}
        hideError={hideError}
        hideSubmitButton={props.hideSubmitButton}
        AppBarOptions={AppBarOptions}
        title={title ? title : t("USERS")}
        onError={onError}
        TrailingView={TrailingView}
        selectionMode={selectionMode}
        LeadingView={LeadingView}
        onSelection={onSelection}
        onSubmit={onSubmit}
        // Pass our custom long press handler which shows tooltip if options exist.
        onItemLongPress={(user: CometChat.User, e: any) => handleItemLongPress(user, e)}
        ItemView={props.ItemView}
        onListFetched={(users: CometChat.User[]) => {
          if (users.length === 0) {
            onEmpty?.();
          } else {
            onLoad?.(users);
          }
        }}
        ref={userRef}
        hideSearch={hideSearch ? hideSearch : hideSearchError}
        requestBuilder={
          (usersRequestBuilder && usersRequestBuilder.setSearchKeyword(searchKeyword)) ||
          new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .hideBlockedUsers(false)
            .setRoles([])
            .friendsOnly(false)
            .setStatus("")
            .setTags([])
            .setUIDs([])
            .setSearchKeyword(searchKeyword)
        }
        listStyle={mergedStyle}
        hideStickyHeader={!stickyHeaderVisibility}
        listItemKey='uid'
        LoadingView={
          hideLoadingState
            ? () => <></> // will not render anything if true
            : LoadingView
              ? LoadingView
              : () => <Skeleton style={mergedStyle.skeletonStyle} />
        }
        EmptyView={EmptyView ? EmptyView : () => <EmptyStateView />}
        ErrorView={ErrorView ? ErrorView : () => <ErrorStateView />}
        statusIndicatorType={(user: CometChat.User) =>
          usersStatusVisibility
            ? user?.getBlockedByMe()
              ? "offline"
              : (user?.getStatus() as CometChatStatusIndicatorInterface["type"])
            : null
        }
        {...newProps}
      />

      {/* Tooltip Menu: shows on long press if options exist and selectionMode is "none" */}
      {selectedUser && selectionMode === "none" && tooltipVisible && (
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
            menuItems={buildMenuItems(selectedUser).map((menuItem) => ({
              text: menuItem.text,
              onPress: () => {
                menuItem.onPress();
                setTooltipVisible(false);
              },
              textColor: menuItem.textColor,
              iconColor: menuItem.iconColor,
              disabled: menuItem.disabled,
            }))}
          />
        </View>
      )}
    </View>
  );
});
