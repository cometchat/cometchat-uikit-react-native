import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ColorValue,
  ImageSourcePropType,
  Modal,
  Platform,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  CometChatBottomSheet,
  CometChatGroupsEvents,
  CometChatUIEventHandler,
  CometChatUIKit,
} from "../shared";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatList, CometChatListProps } from "../shared";
import { MessageTypeConstants } from "../shared/constants/UIKitConstants";
import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { Icon } from "../shared/icons/Icon";
import {
  getUnixTimestamp,
  getUnixTimestampInMilliseconds,
} from "../shared/utils/CometChatMessageHelper";
import { CometChatStatusIndicatorInterface } from "../shared/views/CometChatStatusIndicator";
import { CometChatTooltipMenu } from "../shared/views/CometChatTooltipMenu";
import { ErrorEmptyView } from "../shared/views/ErrorEmptyView/ErrorEmptyView";
import { useTheme } from "../theme";
import { Skeleton } from "./Skeleton";
import { GroupMemberStyle } from "./style";
import { MenuItemInterface } from "../shared/views/CometChatTooltipMenu/CometChatTooltipMenu";
import ChangeCircle from "../shared/icons/components/change-circle";
import Block from "../shared/icons/components/block";
import Cancel from "../shared/icons/components/cancel";
import { JSX } from "react";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";

/**
 * Props for the CometChatGroupMembers component.
 */
export interface CometChatGroupMembersInterface
  extends Omit<
    CometChatListProps,
    | "requestBuilder"
    | "listItemKey"
    | "title"
    | "statusIndicatorStyle"
    | "avatarStyle"
    | "listItemStyle"
    | "listStyle"
    | "ListItemView"
    | "searchRequestBuilder"
    | "onSelection"
    | "disableUsersPresence"
    | "errorStateText"
    | "emptyStateText"
    | "onListFetched"
    | "hideBackButton"
    | "statusIndicatorType"
    | "hideStickyHeader"
  > {
  /**
   * Custom view for subtitle.
   * @param item - Object of CometChat.GroupMember.
   * @returns JSX.Element.
   */
  SubtitleView?: (item: CometChat.GroupMember) => JSX.Element;

  TitleView?: (item: CometChat.GroupMember) => JSX.Element;
  /**
   * Custom tail view.
   * @param item - Object of CometChat.GroupMember.
   * @returns JSX.Element.
   */
  TrailingView?: (item: CometChat.GroupMember) => JSX.Element;
  /**
   * Custom view for empty state.
   * @returns JSX.Element.
   */
  EmptyView?: () => JSX.Element;
  /**
   * Custom view for error state.
   * @returns JSX.Element.
   */
  ErrorView?: () => JSX.Element;
  /**
   * Custom view for loading state.
   * @returns JSX.Element.
   */
  LoadingView?: () => JSX.Element;
  /**
   * Callback for press on ListItem.
   * @param groupMember - Object of CometChat.GroupMember.
   * @returns void.
   */
  onItemPress?: (groupMember: CometChat.GroupMember) => void;
  /**
   * Callback for long press on ListItem.
   * @param groupMember - Object of CometChat.GroupMember.
   * @returns void.
   */
  onItemLongPress?: (groupMember: CometChat.GroupMember) => void;
  /**
   * Callback for on selection of group members.
   * @param list - Array of selected GroupMembers.
   * @returns void.
   */
  onSelection?: (list: CometChat.GroupMember[]) => void;
  /**
   * Callback when submit selection button is pressed.
   */
  onSubmit?: (list: Array<CometChat.Conversation>) => void;
  /**
   * Pass search request builder object.
   */
  searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  /**
   * Pass group member request builder object.
   */
  groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  /**
   * Pass CometChat SDK's group object.
   */
  group: CometChat.Group;
  /**
   * Style for group member.
   */
  style?: DeepPartial<GroupMemberStyle>;
  /**
   * Custom Item view.
   */
  ItemView?: (item: CometChat.GroupMember) => JSX.Element;
  /**
   * Custom ListItem view.
   */
  LeadingView?: (item: CometChat.GroupMember) => JSX.Element;
  /**
   * Callback triggered when the group members list is empty.
   */
  onEmpty?: () => void;
  /**
   * Callback triggered once the group members have loaded (i.e., the fetched list is not empty).
   * Receives the array of group members.
   */
  onLoad?: (list: CometChat.GroupMember[]) => void;
  /**
   * A function to **replace** the default menu items entirely for a group member.d
   * @param member    - The group member object
   * @param group     - The group object
   * @returns An array of menu items (with text, onPress, etc.)
   */
  options?: (member: CometChat.GroupMember, group: CometChat.Group) => MenuItemInterface[];
  /**
   * A function to **append** more menu items on top of the default menu items for a group member.
   * @param member    - The group member object
   * @param group     - The group object
   * @returns An array of menu items that will be appended to the default list
   */
  addOptions?: (member: CometChat.GroupMember, group: CometChat.Group) => MenuItemInterface[];
  /**
   * Hide the "Remove" (Kick) option from the default menu.
   */
  hideKickMemberOption?: boolean;
  /**
   * Hide the "Ban" option from the default menu.
   */
  hideBanMemberOption?: boolean;
  /**
   * Hide the "Change Scope" option from the default menu.
   */
  hideScopeChangeOption?: boolean;
  /**
   * Hide the loading skeleton.
   */
  hideLoadingState?: boolean;
  /**
   * Hide the users Status.
   */
  usersStatusVisibility?: boolean;
  /**
   * Hide the Header.
   */
  hideHeader?: boolean;
  /**
   * Hide the Submit Button.
   */
  onError?: () => void;
  /**
   * search Keyword
   */
  searchKeyword?: string;
  /**
   * visibilty of back button
   */
  showBackButton?: boolean;
  /**
   * exclude owner from the list.
   */
  excludeOwner?: boolean;
}

/**
 * Component to render and manage the list of group members.
 *
 * This component renders a list of group members using CometChatList and provides functionality
 * to manage member roles (change scope), ban, or remove members through menus and modals.
 *
 * @param props - Props of type CometChatGroupMembersInterface.
 * @returns JSX.Element.
 */
export const CometChatGroupMembers = (props: CometChatGroupMembersInterface) => {
  const {t}= useCometChatTranslation()
  const {
    SubtitleView,
    ItemView,
    AppBarOptions,
    searchPlaceholderText = t("SEARCH"),
    showBackButton = false,
    onSelection,
    onSubmit,
    hideSearch,
    EmptyView,
    ErrorView,
    LoadingView,
    groupMemberRequestBuilder,
    searchRequestBuilder,
    group,
    hideError,
    onBack,
    selectionMode = "none",
    style = {},
    TrailingView,
    LeadingView,
    onEmpty,
    onLoad,
    options,
    addOptions,
    onError,
    searchKeyword = "",
    hideKickMemberOption,
    hideBanMemberOption,
    hideScopeChangeOption,
    hideLoadingState,
    usersStatusVisibility = true,
    hideHeader = false,
    excludeOwner,
    hideSubmitButton = false,
    ...newProps
  } = props;

  // Get theme information and merge with provided style overrides.
  const theme = useTheme();
  const mergedStyle = deepMerge(theme.groupMemberStyle, style);

  // State management for UI elements
  const [hideSearchError, setHideSearchError] = useState(false);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CometChat.GroupMember | null>(null);
  const tooltipPositon = React.useRef({ pageX: 0, pageY: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [modalType, setModalType] = useState<"ban" | "kick" | "">("");
  const modalVisible = modalType !== "";
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const listRef = useRef<any>(null);
  const [isToolTipDismissed, setIsToolTipDismissed] = useState(false);
  const loggedInUser = React.useRef(CometChatUIKit.loggedInUser!);

  // Derived: whether selected scope equals current user scope
  const isScopeUnchanged = React.useMemo(() => {
    if (!selectedItem) return true;
    return selectedRole === selectedItem.getScope();
  }, [selectedItem, selectedRole]);


  // Define role permissions for current user actions
  const RolePermissions: { [key: string]: string[] } = {
    OWNER: ["CHANGE_SCOPE", "BAN", "KICK"],
    ADMIN: ["CHANGE_SCOPE", "BAN", "KICK"],
    MODERATOR: ["CHANGE_SCOPE", "BAN", "KICK"],
    PARTICIPANT: [],
  };

  // Determine available roles based on current user's role
  const roles = React.useMemo(() => {
    if (currentUserRole === "moderator") {
      return [
        { display: t("MODERATOR"), value: "moderator" },
        { display: t("PARTICIPANT"), value: "participant" }
      ];
    }
    return [
      { display: t("ADMIN"), value: "admin" },
      { display: t("MODERATOR"), value: "moderator" },
      { display: t("PARTICIPANT"), value: "participant" }
    ];
  }, [currentUserRole, t]);

  // Set current user role based on whether the logged in user is the owner or not.
  useEffect(() => {
    if (CometChatUIKit.loggedInUser!.getUid() === group.getOwner()) {
      setCurrentUserRole("owner");
    } else {
      setCurrentUserRole(group.getScope());
    }
  }, [group]);

  /**
   * Renders an empty state view when no users are available.
   * Also calls `onEmpty` if provided, so the parent can react to an empty list.
   */
  const EmptyStateView = useCallback(() => {
    // Let parent know it's empty if user provided a callback
    useEffect(() => {
      onEmpty?.();
    }, []);

    return (
      <View style={{ flex: 1 }}>
        <ErrorEmptyView
          title={t("NO_USERS_AVAILABLE")}
          subTitle={t("ADD_CONTACTS")}
          Icon={
            <Icon
              name='user-empty-icon'
              icon={mergedStyle?.emptyStateStyle?.icon as ImageSourcePropType | JSX.Element}
              color={mergedStyle?.emptyStateStyle?.iconStyle?.tintColor}
              height={mergedStyle?.emptyStateStyle?.iconStyle?.height}
              width={mergedStyle?.emptyStateStyle?.iconStyle?.width}
              containerStyle={mergedStyle?.emptyStateStyle?.iconContainerStyle}
            />
          }
          containerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: "10%",
          }}
          titleStyle={mergedStyle?.emptyStateStyle?.titleStyle as TextStyle}
          subTitleStyle={mergedStyle?.emptyStateStyle?.subTitleStyle as TextStyle}
        />
      </View>
    );
  }, [theme]);

  /**
   * Renders an error state view when something goes wrong.
   * Also hides the search bar when the error view is active.
   */
  const ErrorStateView = useCallback(() => {
    useEffect(() => {
      setHideSearchError(true); // Hide search when error view is active
    }, []);
    return (
      <View style={{ flex: 1 }}>
        <ErrorEmptyView
          title={t("OOPS")}
          subTitle={t("SOMETHING_WENT_WRONG")}
          tertiaryTitle={t("WRONG_TEXT_TRY_AGAIN")}
          Icon={
            <Icon
              icon={mergedStyle?.errorStateStyle?.icon as ImageSourcePropType | JSX.Element}
              color={mergedStyle?.errorStateStyle?.iconStyle?.tintColor}
              height={mergedStyle?.errorStateStyle?.iconStyle?.height}
              width={mergedStyle?.errorStateStyle?.iconStyle?.width}
              containerStyle={mergedStyle?.errorStateStyle?.iconContainerStyle}
            />
          }
          containerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: "10%",
          }}
          titleStyle={mergedStyle?.errorStateStyle?.titleStyle as TextStyle}
          subTitleStyle={mergedStyle?.errorStateStyle?.subTitleStyle as TextStyle}
        />
      </View>
    );
  }, [theme]);

  /**
   * Returns an action badge (OWNER, ADMIN, MODERATOR) or no badge for participant.
   */
  const TailViewContent = (user: CometChat.GroupMember): JSX.Element => {
    const userRole = user?.getScope();
    if (userRole === "participant") {
      return <></>;
    }
    if (user.getUid() === group.getOwner()) {
      return (
        <View style={{ ...mergedStyle.ownerBadgeStyle?.containerStyle }}>
          <Text style={{ ...mergedStyle.ownerBadgeStyle?.textStyle }}>{t("OWNER")}</Text>
        </View>
      );
    }
    if (userRole === "moderator") {
      return (
        <View style={{ ...mergedStyle.moderatorBadgeStyle?.containerStyle }}>
          <Text style={{ ...mergedStyle.moderatorBadgeStyle?.textStyle }}>
            {t("MODERATOR")}
          </Text>
        </View>
      );
    }
    if (userRole === "admin") {
      return (
        <View style={{ ...mergedStyle.adminBadgeStyle?.containerStyle }}>
          <Text style={{ ...mergedStyle.adminBadgeStyle?.textStyle }}>{t("ADMIN")}</Text>
        </View>
      );
    }
    return <></>;
  };

  /**
   * Removes (kicks) a user from the group.
   */
  const removeGroupMember = async (groupId: string, user: CometChat.GroupMember) => {
    try {
      const removedMember = await CometChat.kickGroupMember(groupId, user.getUid());
      console.log("Group member removed successfully:", removedMember);

      // Remove the user from the list view.
      listRef.current && listRef.current.removeItemFromList(user.getUid());

      // Update group's member count if possible.
      if (group.setMembersCount && typeof group.setMembersCount === "function") {
        group.setMembersCount(group.getMembersCount() - 1);
      }

      // Clear the modal and selected item state.
      setModalType("");
      setSelectedItem(null);

      // Create an action object to notify about the removal.
      let action: CometChat.Action = new CometChat.Action(
        group.getGuid(),
        MessageTypeConstants.groupMember,
        CometChat.RECEIVER_TYPE.GROUP,
        CometChat.CATEGORY_ACTION as CometChat.MessageCategory
      );

      action.setActionBy(loggedInUser.current);
      action.setActionOn(user);
      action.setActionFor(group);
      action.setMessage(`${loggedInUser.current.getName()} kicked ${user.getName()}`);
      action.setSentAt(getUnixTimestamp());
      action.setMuid(String(getUnixTimestampInMilliseconds()));
      action.setSender(loggedInUser.current);
      action.setReceiver(group);
      action.setConversationId("group_" + group.getGuid());

      // Emit the group event for a kicked member.
      CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupMemberKicked, {
        message: action,
        kickedUser: user,
        kickedBy: loggedInUser.current,
        kickedFrom: group,
      });
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  /**
   * Bans a user from the group.
   */
  const banGroupMember = async (user: CometChat.GroupMember) => {
    try {
      await CometChat.banGroupMember(group.getGuid(), user.getUid());

      // Remove the user from the list view.
      listRef.current && listRef.current.removeItemFromList(user.getUid());

      // Clear the modal and selected item state.
      setModalType("");
      setSelectedItem(null);

      // Create an action object to notify about the ban.
      let action: CometChat.Action = new CometChat.Action(
        group.getGuid(),
        MessageTypeConstants.groupMember,
        CometChat.RECEIVER_TYPE.GROUP,
        CometChat.CATEGORY_ACTION as CometChat.MessageCategory
      );
      action.setActionBy(loggedInUser.current);
      action.setActionOn(user);
      action.setActionFor(group);
      action.setMessage(`${loggedInUser.current.getName()} banned ${user.getName()}`);
      action.setSentAt(getUnixTimestamp());
      action.setMuid(String(getUnixTimestampInMilliseconds()));
      action.setSender(loggedInUser.current);
      action.setReceiver(group);
      group.setMembersCount(group.getMembersCount() - 1);

      // Emit the group event for a banned member.
      CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupMemberBanned, {
        message: action,
        kickedUser: user,
        kickedBy: loggedInUser.current,
        kickedFrom: group,
      });
    } catch (error) {
      console.error("Error banning user:", error);
    }
  };

  /**
   * Generate default menu items (Change Scope, Ban, Remove).
   * Then filter them out based on hide props (hideBanMemberOption, etc.),
   * or based on current user role (RolePermissions).
   */
  const getDefaultMenuItems = (item: CometChat.GroupMember): MenuItemInterface[] => {
    const defaultItems: MenuItemInterface[] = [
      {
        text: t("CHANGE_SCOPE"),
        translationKey: "CHANGE_SCOPE", // Added this for filtering
        onPress: () => {
          const currentScope = item.getScope();
          setTooltipVisible(false);
          setIsBottomSheetVisible(true);
          // Preselect to current scope (lowercase) for accurate comparison
          setSelectedRole(currentScope);
        },
        icon: (
          <ChangeCircle
            color={theme.color.textPrimary}
            height={theme.spacing.spacing.s6}
            width={theme.spacing.spacing.s6}
          />
        ),
        textStyle: { color: theme.color.textPrimary },
        disabled: false,
      },
      {
        text: t("BAN"),
        translationKey: "BAN", // Added this for filtering
        onPress: () => {
          setTooltipVisible(false);
          setModalType("ban");
        },
        icon: (
          <Block
            color={theme.color.textPrimary}
            height={theme.spacing.spacing.s6}
            width={theme.spacing.spacing.s6}
          />
        ),
        textStyle: { color: theme.color.textPrimary },
        disabled: false,
      },
      {
        text: t("KICK"),
        translationKey: "KICK", // Added this for filtering
        onPress: () => {
          setTooltipVisible(false);
          setModalType("kick");
        },
        icon: (
          <Cancel
            color={theme.color.textPrimary}
            height={theme.spacing.spacing.s6}
            width={theme.spacing.spacing.s6}
          />
        ),
        textStyle: { color: theme.color.textPrimary },
        disabled: false,
      },
    ];

    let filteredItems = defaultItems;

    // Hide Kick?
    if (hideKickMemberOption) {
      filteredItems = filteredItems.filter((i) => i.translationKey !== "KICK");
    }
    // Hide Ban?
    if (hideBanMemberOption) {
      filteredItems = filteredItems.filter((i) => i.translationKey !== "BAN");
    }
    // Hide Scope?
    if (hideScopeChangeOption) {
      filteredItems = filteredItems.filter((i) => i.translationKey !== "CHANGE_SCOPE");
    }

    // Now filter by user role permissions using the translationKey instead of text
    filteredItems = filteredItems.filter((itemMenu) =>
      RolePermissions[currentUserRole?.toUpperCase()!].includes(itemMenu.translationKey || "")
    );

    return filteredItems;
  };

  /**
   * Merges default menu items with user-defined ones or replaces them entirely.
   *  - If options is defined, we use that array as the entire set of menu items.
   *  - If addOptions is defined, we append them to the default set.
   */
  const buildMenuItems = (item: CometChat.GroupMember): MenuItemInterface[] => {
    // If options is provided, it completely replaces default items
    if (options) {
      const replaced = options(item, group);
      return replaced;
    }

    // Else we get the default
    let defaultItems = getDefaultMenuItems(item);

    // If addOptions is provided, we append them
    if (addOptions) {
      const appended = addOptions(item, group);
      defaultItems = [...defaultItems, ...appended];
    }
    return defaultItems;
  };

  return (
    <View style={mergedStyle.containerStyle as ViewStyle}>
      <CometChatList
        ref={listRef}
        hideHeader={hideHeader}
        onError={onError}
        selectionMode={selectionMode}
        hideStickyHeader={true}
        hideSubmitButton={hideSubmitButton}
        onSelection={onSelection}
        onSubmit={onSubmit}
        hideBackButton={!showBackButton}
        SubtitleView={SubtitleView ?? SubtitleView}
        searchPlaceholderText={searchPlaceholderText}
        TrailingView={TrailingView ?? TailViewContent}
        hideSearch={hideSearch ? hideSearch : hideSearchError}
        title={t("MEMBERS")}
        searchRequestBuilder={searchRequestBuilder}
        requestBuilder={
          groupMemberRequestBuilder ||
          new CometChat.GroupMembersRequestBuilder(group["guid"])
            .setLimit(30)
            .setSearchKeyword(searchKeyword)
        }
        hideError={hideError}
        onBack={onBack}
        ItemView={ItemView}
        listStyle={mergedStyle}
        LoadingView={
          hideLoadingState
            ? () => <></> // will not render anything if true
            : LoadingView
              ? LoadingView
              : () => <Skeleton />
        }
        EmptyView={EmptyView ? EmptyView : () => <EmptyStateView />}
        ErrorView={ErrorView ? ErrorView : () => <ErrorStateView />}
        statusIndicatorType={(user: CometChat.User) =>
          usersStatusVisibility
            ? (user?.getStatus() as CometChatStatusIndicatorInterface["type"])
            : null
        }
        LeadingView={LeadingView}
        AppBarOptions={AppBarOptions}
        listItemKey={"uid"}
        {...newProps}
        onItemLongPress={(member, e) => {
          // 1) If user explicitly provided a callback, call it and return
          if (props.onItemLongPress) {
            props.onItemLongPress(member);
            return;
          }

          // 2) Otherwise, use the default scope-based code
          const targetIsOwner = member.uid === group.getOwner();
          const targetScope = member.scope;

          // Role-based restrictions
          if (currentUserRole === "owner") {
            // Owner can perform any action.
          } else if (currentUserRole === "admin") {
            // Admin cannot manage owner or other admins.
            if (targetIsOwner || targetScope === "admin") {
              return;
            }
          } else if (currentUserRole === "moderator") {
            // Moderator cannot manage owner, admin or other moderators.
            if (targetIsOwner || targetScope === "admin" || targetScope === "moderator") {
              return;
            }
          } else if (currentUserRole === "participant") {
            return;
          }

          // Only open if user is not self
          if (member.uid === CometChatUIKit.loggedInUser!.getUid()) {
            return;
          }

          if (["owner", "admin", "moderator"].includes(currentUserRole!)) {
            if (e && e.nativeEvent) {
              tooltipPositon.current = {
                pageX: e.nativeEvent.pageX,
                pageY: e.nativeEvent.pageY,
              };
            } else {
              tooltipPositon.current = { pageX: 200, pageY: 100 };
            }
            setSelectedItem(member);
            setTooltipVisible(true);
            setIsToolTipDismissed(false);
          }
        }}
        onItemPress={(member) => {
          if (props.onItemPress) {
            props.onItemPress(member);
          }
        }}
        onListFetched={(fetchedList: CometChat.GroupMember[]) => {
          const selfUid = loggedInUser.current.getUid();
          let finalList = fetchedList;
          if (excludeOwner) {
            finalList = fetchedList.filter((m) => m.getUid() !== selfUid);
            // Remove from rendered list as well (safe call)
            listRef.current?.removeItemFromList(selfUid);
          }

          if (finalList.length === 0) {
            onEmpty?.();
          } else {
            onLoad?.(finalList);
          }
        }}
      />

      {/* Render tooltip menu if an item is selected and selectionMode is "none" */}
      {selectedItem && selectionMode === "none" && (
        <View
          style={{
            position: "absolute",
            top: tooltipPositon.current.pageY,
            left: tooltipPositon.current.pageX,
            zIndex: 9999,
          }}
        >
          <CometChatTooltipMenu
            visible={tooltipVisible}
            onClose={() => {
              setTooltipVisible(false);
              Platform.OS === "android" && setIsToolTipDismissed(true);
            }}
            onDismiss={() => {
              setIsToolTipDismissed(true);
            }}
            event={{
              nativeEvent: tooltipPositon.current,
            }}
            // Build the final menu items
            menuItems={buildMenuItems(selectedItem).map((mi) => ({
              text: mi.text,
              onPress: mi.onPress,
              icon: mi.icon,
              textStyle: mi.textStyle,
              iconStyle: mi.iconStyle,
              iconContainerStyle: mi.iconContainerStyle,
              disabled: mi.disabled,
            }))}
          />
        </View>
      )}

      {/* Bottom sheet for changing member's role (scope) */}
      <CometChatBottomSheet
        isOpen={isBottomSheetVisible}
        doNotOccupyEntireHeight
        onClose={() => {
          setIsBottomSheetVisible(false);
          setSelectedItem(null);
          setSelectedRole("");
        }}
        onDismiss={() => {
          setSelectedItem(null);
          setSelectedRole("");
        }}
      >
        {selectedItem ? (
          <View style={mergedStyle?.changeScope?.container}>
            <View style={mergedStyle.changeScope?.iconContainerStyle}>
              <Icon
                name='change-circle'
                icon={mergedStyle?.changeScope?.icon}
                color={mergedStyle?.changeScope?.iconStyle?.tintColor}
                height={mergedStyle?.changeScope?.iconStyle?.height}
                width={mergedStyle?.changeScope?.iconStyle?.width}
                containerStyle={mergedStyle?.changeScope?.iconStyle}
              />
            </View>

            <Text style={mergedStyle?.changeScope?.titleStyle}>{t("CHANGE_SCOPE")}</Text>

            <Text style={mergedStyle?.changeScope?.subTitleStyle}>
              {t("SCOPE_CHANGE_INFO")}
            </Text>

            <View style={mergedStyle?.changeScope?.actionBox}>
              {roles
                .filter((role) => {
                  if (currentUserRole === "moderator") {
                    const targetScope = selectedItem.getScope();
                    if (targetScope === "moderator" && role.value === "participant") {
                      return false;
                    }
                  }
                  return true;
                })
                .map((role) => {
                  const isDisabled = currentUserRole === "moderator" && role.value === "admin";
                  return (
                    <TouchableOpacity
                      key={role.value}
                      activeOpacity={isDisabled ? 1 : 0.7}
                      onPress={() => {
                        if (!isDisabled) {
                          setSelectedRole(role.value);
                        }
                      }}
                      style={[
                        { opacity: isDisabled ? 0.5 : 1 },
                        mergedStyle?.changeScope?.actionListStyle,
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.heading4.medium,
                          { color: theme.color.textPrimary },
                        ]}
                      >
                        {role.display}
                      </Text>
                      <View
                        style={{
                          height: 24,
                          width: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: theme.color.primary,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {selectedRole === role.value && (
                          <View
                            style={{
                              height: 12,
                              width: 12,
                              borderRadius: 6,
                              backgroundColor: theme.color.primary,
                            }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>

            <View style={mergedStyle.changeScope?.buttonContainer}>
              <TouchableOpacity
                style={mergedStyle?.changeScope?.cancelStyle?.containerStyle}
                onPress={() => {
                  setIsBottomSheetVisible(false);
                  setSelectedItem(null);
                  setSelectedRole("");
                }}
              >
                <Text style={mergedStyle?.changeScope?.cancelStyle?.textStyle}>
                  {t("CANCEL")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  mergedStyle?.changeScope?.confirmStyle?.containerStyle,
                  isScopeUnchanged ? {opacity: 0.5} : {}
                ]}
                disabled={isScopeUnchanged}
                onPress={async () => {
                  if (isScopeUnchanged) return;
                  if (selectedItem && selectedRole) {
                    const currentScope = selectedItem.getScope();
                    const scopeToSet = selectedRole;

                    // If no change is needed, just close the bottom sheet.
                    if (scopeToSet === currentScope) {
                      setIsBottomSheetVisible(false);
                      setSelectedItem(null);
                      setSelectedRole("");
                      return;
                    }

                    try {
                      await CometChat.updateGroupMemberScope(
                        group.getGuid(),
                        selectedItem.getUid(),
                        scopeToSet as CometChat.GroupMemberScope
                      );

                      // Update the scope of the selected item and refresh the list.
                      selectedItem.setScope(scopeToSet as CometChat.GroupMemberScope);
                      listRef.current?.updateList(selectedItem);

                      setIsBottomSheetVisible(false);

                      // Create an action object to notify about the scope change.
                      let action: CometChat.Action = new CometChat.Action(
                        group["guid"],
                        "groupMember",
                        CometChat.RECEIVER_TYPE.GROUP,
                        CometChat.CATEGORY_ACTION as CometChat.MessageCategory
                      );
                      action.setActionBy(loggedInUser.current);
                      action.setActionOn(selectedItem);
                      action.setActionFor(group);
                      action.setMessage(
                        `${loggedInUser.current.getName()} made ${selectedItem.getName()} ${scopeToSet} `
                      );
                      action.setSentAt(getUnixTimestamp());
                      action.setMuid(String(getUnixTimestampInMilliseconds()));
                      action.setSender(loggedInUser.current);
                      action.setReceiver(group);

                      // Emit the group event for a scope change.
                      CometChatUIEventHandler.emitGroupEvent(
                        CometChatGroupsEvents.ccGroupMemberScopeChanged,
                        {
                          action,
                          updatedUser: selectedItem,
                          scopeChangedTo: scopeToSet,
                          scopeChangedFrom: selectedItem.getScope(),
                          group,
                        }
                      );
                      setSelectedItem(null);
                      setSelectedRole("");
                    } catch (error) {
                      console.error("Error updating user scope:", error);
                    }
                  }
                }}
              >
                <Text style={mergedStyle.changeScope?.confirmStyle?.textStyle}>
                  {t("SAVE")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </CometChatBottomSheet>

      {/* Render modal for ban or remove actions if an item is selected */}
      <Modal
        animationType='fade'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalType("")}
        onDismiss={() => {
          setSelectedItem(null); 
        }}
      >
        {modalVisible && selectedItem ? (
          <>
            <TouchableOpacity onPress={() => setModalType("")} style={{ flex: 1 }}>
              <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }} />
            </TouchableOpacity>

            {modalType && (
              <View
                style={{
                  ...(modalType === "ban"
                    ? mergedStyle.banModalStyle?.containerStyle
                    : mergedStyle.removeModalStyle?.containerStyle),
                }}
              >
                <View
                  style={{
                    ...(modalType === "ban"
                      ? mergedStyle.banModalStyle?.iconContainerStyle
                      : mergedStyle.removeModalStyle?.iconContainerStyle),
                  }}
                >
                  <Icon
                    name='delete'
                    icon={
                      modalType === "ban"
                        ? mergedStyle.banModalStyle?.icon
                        : mergedStyle.removeModalStyle?.icon
                    }
                    color={
                      modalType === "ban"
                        ? mergedStyle?.banModalStyle?.iconStyle?.tintColor
                        : mergedStyle?.removeModalStyle?.iconStyle?.tintColor
                    }
                    height={
                      modalType === "ban"
                        ? mergedStyle?.banModalStyle?.iconStyle?.height
                        : mergedStyle?.removeModalStyle?.iconStyle?.height
                    }
                    width={
                      modalType === "ban"
                        ? mergedStyle?.banModalStyle?.iconStyle?.width
                        : mergedStyle?.removeModalStyle?.iconStyle?.width
                    }
                    imageStyle={
                      modalType === "ban"
                        ? mergedStyle?.banModalStyle?.iconStyle
                        : mergedStyle?.removeModalStyle?.iconStyle
                    }
                  />
                </View>
                <View>
                  <Text
                    style={
                      modalType === "ban"
                        ? mergedStyle.banModalStyle?.titleTextStyle
                        : mergedStyle.removeModalStyle?.titleTextStyle
                    }
                  >
                    {modalType === "ban"
                      ? `${t("BAN")} ${selectedItem.getName()} ?`
                      : `${t("KICK")} ${selectedItem.getName()} ?`}
                  </Text>

                  <Text
                    style={
                      modalType === "ban"
                        ? mergedStyle.banModalStyle?.subTitleTextStyle
                        : mergedStyle.removeModalStyle?.subTitleTextStyle
                    }
                  >
                    {modalType === "ban"
                      ? `${t("BAN_MEMBER_CONFIRM")}${selectedItem.getName()}?`
                      : `${t("REMOVE_MEMBER_CONFIRM")}${selectedItem.getName()}?`}
                  </Text>

                  <View
                    style={{
                      ...(modalType === "ban"
                        ? mergedStyle.banModalStyle?.alertContainer
                        : mergedStyle.removeModalStyle?.alertContainer),
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        ...(modalType === "ban"
                          ? mergedStyle.banModalStyle?.cancelStyle?.containerStyle
                          : mergedStyle.removeModalStyle?.cancelStyle?.containerStyle),
                      }}
                      onPress={() => setModalType("")}
                    >
                      <Text
                        style={{
                          ...(modalType === "ban"
                            ? mergedStyle.banModalStyle?.cancelStyle?.textStyle
                            : mergedStyle.removeModalStyle?.cancelStyle?.textStyle),
                        }}
                      >
                        {t("NO")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        ...(modalType === "ban"
                          ? mergedStyle.banModalStyle?.confirmStyle?.containerStyle
                          : mergedStyle.removeModalStyle?.confirmStyle?.containerStyle),
                      }}
                      onPress={async () => {
                        if (selectedItem) {
                          if (modalType === "ban") {
                            await banGroupMember(selectedItem);
                          } else {
                            await removeGroupMember(group.getGuid(), selectedItem);
                          }
                        }
                      }}
                    >
                      <Text
                        style={{
                          ...(modalType === "ban"
                            ? mergedStyle.banModalStyle?.confirmStyle?.textStyle
                            : mergedStyle.removeModalStyle?.confirmStyle?.textStyle),
                        }}
                      >
                        {t("YES")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : null}
      </Modal>

    </View>
  );
};
