import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ImageSourcePropType, Text, View } from "react-native";
import { CometChatList, CometChatListActionsInterface, CometChatRetryButton } from "../shared";
import { SelectionMode } from "../shared/base/Types";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { Icon, IconName } from "../shared/icons/Icon";
import { CometChatTooltipMenu, MenuItemInterface } from "../shared/views/CometChatTooltipMenu";
import { CometChatStatusIndicatorInterface } from "../shared/views/CometChatStatusIndicator";
import { ErrorEmptyView } from "../shared/views/ErrorEmptyView/ErrorEmptyView";
import { useTheme } from "../theme";
import dark from "../theme/default/resources/icons/dark_error_icon.png";
import light from "../theme/default/resources/icons/light_error_icon.png";
import { useThemeInternal } from "../theme/hook";
import { GroupStyle } from "./GroupsStyle";
import { Skeleton } from "./Skeleton";
import { Style } from "./style";
import { JSX } from "react";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";

// Unique listener IDs for group events and UI events.
const groupListenerId = "grouplist_" + new Date().getTime();
const uiEventListener = "uiEvents_" + new Date().getTime();

/**
 * Props for the CometChatGroups component.
 */
export interface CometChatGroupsInterface {
  /**
   * Custom title view for a group item.
   * @param group - The group object.
   * @returns JSX.Element to render as title.
   */
  TitleView?: (group: CometChat.Group) => JSX.Element;
  /**
   * Custom subtitle view for a group item.
   */
  SubtitleView?: (group: CometChat.Group) => JSX.Element;
  /**
   * Custom trailing view for a group item.
   */
  TrailingView?: (group: CometChat.Group) => JSX.Element;
  /**
   * Custom list item view for a group.
   */
  ItemView?: (group: CometChat.Group) => JSX.Element;
  /**
   * Custom component for the AppBar options.
   */
  AppBarOptions?: () => JSX.Element;
  /**
   * Hide the "submit" (selection) button.
   */
  hideSubmitButton?: boolean;
  /**
   * Custom style for groups.
   */
  style?: DeepPartial<GroupStyle>;
  /**
   * Placeholder text for the search input.
   */
  searchPlaceholderText?: string;
  /**
   * Toggle back button visibility.
   */
  showBackButton?: boolean;
  /**
   * Selection mode: "none" | "single" | "multiple".
   */
  selectionMode?: SelectionMode;
  /**
   * Callback when group selection is completed.
   */
  onSelection?: (list: Array<CometChat.Group>) => void;
  /**
   * Callback when submit selection button is pressed.
   */
  onSubmit?: (list: Array<CometChat.Conversation>) => void;
  /**
   * Hide the search box.
   */
  hideSearch?: boolean;
  /**
   * Custom view for the empty state.
   */
  EmptyView?: () => JSX.Element;
  /**
   * Custom view for the error state.
   */
  ErrorView?: () => JSX.Element;
  /**
   * Custom view for the loading state.
   */
  LoadingView?: () => JSX.Element;
  /**
   * Request builder to fetch groups.
   */
  groupsRequestBuilder?: CometChat.GroupsRequestBuilder;
  /**
   * Request builder for search functionality.
   */
  searchRequestBuilder?: CometChat.GroupsRequestBuilder;
  /**
   * Icon to be used for private groups.
   */
  privateGroupIcon?: ImageSourcePropType;
  /**
   * Icon to be used for password-protected groups.
   */
  passwordGroupIcon?: ImageSourcePropType;
  /**
   * Toggle error view visibility.
   */
  hideError?: boolean;
  /**
   * Callback when a group item is pressed.
   */
  onItemPress?: (item: CometChat.Group) => void;
  /**
   * Callback when a group item is long pressed.
   */
  onItemLongPress?: (item: CometChat.Group) => void;
  /**
   * Callback when an error occurs.
   */
  onError?: (e: CometChat.CometChatException) => void;
  /**
   * Callback when the back button is pressed.
   */
  onBack?: () => void;
  /**
   * Hide the header of the group list.
   */
  hideHeader?: boolean;
  /**
   * Custom leading view for a group item.
   */
  LeadingView?: (group: CometChat.Group) => JSX.Element;
  /**
   * Search Keyword.
   */
  searchKeyword?: string;
  /**
   * Callback triggered when the fetched list is empty.
   */
  onEmpty?: () => void;
  /**
   * Callback triggered once the groups have loaded and are not empty.
   */
  onLoad?: (list: CometChat.GroupMember[]) => void;
  /**
   * Hide the loading skeleton.
   */
  hideLoadingState?: boolean;
  /**
   * Hide the Group type (public/private/password).
   */
  groupTypeVisibility?: boolean;
  /**
   * A function to **append** more menu items on top of the default menu items for a group.
   * @param group - The group object.
   * @returns An array of menu items that will be appended to the default list
   *          (note: if you have no defaults, these become the entire set).
   */
  addOptions?: (group: CometChat.Group) => MenuItemInterface[];
  /**
   * A function to **replace** the default menu items entirely for a group.
   * @param group - The group object.
   * @returns An array of menu items (with text, onPress, etc.).
   */
  options?: (group: CometChat.Group) => MenuItemInterface[];
}

/**
 * CometChatGroups renders a list of groups with search, selection mode,
 * error/empty/loading views, and a long-press tooltip menu (if you provide menu items).
 */
export const CometChatGroups = React.forwardRef((props: CometChatGroupsInterface, ref: any) => {
  const { t } = useCometChatTranslation();

  const {
    AppBarOptions,
    style = {},
    searchPlaceholderText = t("SEARCH"),
    showBackButton = false,
    selectionMode = "none",
    onSelection = () => {},
    onSubmit,
    hideSearch = false,
    EmptyView,
    ErrorView,
    LoadingView,
    groupsRequestBuilder,
    searchRequestBuilder,
    onError,
    onBack,
    onItemPress,
    onItemLongPress,
    SubtitleView,
    ItemView,
    hideError = false,
    searchKeyword = "",
    hideLoadingState,
    groupTypeVisibility = true,
    addOptions,
    options,
    onEmpty,
    onLoad,
    hideHeader,
    ...newProps
  } = props;

  // Theme references.
  const theme = useTheme();
  const { mode } = useThemeInternal();
  
  // Internal ref to CometChatList methods.
  const groupListRef = useRef<CometChatListActionsInterface>(null);

  // States
  const [hideSearchError, setHideSearchError] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<CometChat.Group[]>([]);

  // Tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CometChat.Group | null>(null);
  const tooltipPosition = useRef({ pageX: 0, pageY: 0 });

  // Merge theme styles with any overrides.
  const mergedStyle = deepMerge(theme.groupStyles, style);

  /**
   * Expose imperative methods via ref.
   */
  useImperativeHandle(ref, () => ({
    addGroup,
    updateGroup,
    removeGroup,
    getSelectedItems,
  }));

  /**
   * Returns the currently selected group items.
   */
  const getSelectedItems = () => {
    return selectedGroups;
  };

  /**
   * Renders an empty state view when no groups are available.
   * Also triggers `onEmpty` if provided.
   */
  const EmptyStateView = useCallback(() => {
    useEffect(() => {
      onEmpty?.();
    }, []);
    return (
      <View style={{ flex: 1 }}>
        <ErrorEmptyView
          title={t("NO_GROUPS_AVAILABLE")}
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
      </View>
    );
  }, [mergedStyle, theme]);

  /**
   * Renders the error state view.
   * Also hides the search box while this is active.
   */
  const ErrorStateView = useCallback(() => {
    useEffect(() => {
      setHideSearchError(true); // Hide search while showing error
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
          RetryView={<CometChatRetryButton onPress={() => groupListRef.current?.reload()} />}
        />
      </View>
    );
  }, [mergedStyle, mode, theme, hideError]);

  /**
   * Build final list of menu items for a given group:
   *  - If `options` is provided, it overrides everything.
   *  - Otherwise, if `addOptions` is provided, it returns those items only as no default as of now
   */
  const buildMenuItems = (group: CometChat.Group): MenuItemInterface[] => {
    if (options) {
      return options(group);
    }
    if (addOptions) {
      return addOptions(group);
    }
    // No default menu items, so return empty if no user-defined items.
    return [];
  };

  /**
   * Invoked when a group item is long pressed.
   * If the developer passed `onItemLongPress`, call that and stop.
   * Otherwise, show the tooltip if there are any menu items for that group.
   */
  const handleItemLongPress = (group: CometChat.Group, e?: any) => {
    // Call developer callback if provided
    if (onItemLongPress) {
      onItemLongPress(group);
      return;
    }

    // If user has no options / addOptions, no tooltip to show
    const items = buildMenuItems(group);
    if (items.length === 0) return;

    // Save position for the tooltip
    if (e && e.nativeEvent) {
      tooltipPosition.current = {
        pageX: e.nativeEvent.pageX,
        pageY: e.nativeEvent.pageY,
      };
    } else {
      // fallback if event coords are missing
      tooltipPosition.current = { pageX: 200, pageY: 100 };
    }

    // Show tooltip
    setSelectedGroup(group);
    setTooltipVisible(true);
  };

  /**
   * Methods below let you update/manipulate groups in the list.
   */
  const addGroup = (group: CometChat.Group) => {
    groupListRef.current!.addItemToList(
      (grp: CometChat.Group) => grp.getGuid() === group.getGuid(),
      0
    );
  };

  const updateGroup = (group: CometChat.Group) => {
    groupListRef.current!.updateList((grp: CometChat.Group) => grp.getGuid() === group.getGuid());
  };

  const removeGroup = (group: CometChat.Group) => {
    groupListRef.current?.removeItemFromList(group.getGuid());
  };

  /**
   * Group listener callbacks below, to keep the UI synced with group changes.
   */
  const handleGroupMemberRemoval = (...options: any) => {
    const group = options[3];
    groupListRef.current!.updateList(group);
  };

  const handleGroupMemberBan = (...options: any) => {
    const group = options[3];
    groupListRef.current!.updateList(group);
  };

  const handleGroupMemberAddition = (...options: any) => {
    const group = options[3];
    groupListRef.current!.updateList(group);
  };

  const handleGroupMemberScopeChange = (...options: any) => {
    const group = options[4];
    groupListRef.current!.updateList(group);
  };

  /**
   * Set up group listeners when the component mounts.
   */
  useEffect(() => {
    CometChat.addGroupListener(
      groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberScopeChanged: (
          message: CometChat.Action,
          changedUser: CometChat.User,
          newScope: CometChat.GroupMemberScope,
          oldScope: CometChat.GroupMemberScope,
          changedGroup: CometChat.Group
        ) => {
          handleGroupMemberScopeChange(message, changedUser, newScope, oldScope, changedGroup);
        },
        onGroupMemberKicked: (
          message: CometChat.Action,
          kickedUser: CometChat.User,
          kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          handleGroupMemberRemoval(message, kickedUser, kickedBy, kickedFrom);
        },
        onGroupMemberLeft: (
          message: CometChat.Action,
          leavingUser: CometChat.User,
          group: CometChat.Group
        ) => {
          handleGroupMemberRemoval(message, leavingUser, null, group);
        },
        onGroupMemberBanned: (
          message: CometChat.Action,
          bannedUser: CometChat.User,
          bannedBy: CometChat.User,
          bannedFrom: CometChat.Group
        ) => {
          handleGroupMemberBan(message, bannedUser, bannedBy, bannedFrom);
        },
        onMemberAddedToGroup: (
          message: CometChat.Action,
          userAdded: CometChat.User,
          userAddedBy: CometChat.User,
          userAddedIn: CometChat.Group
        ) => {
          handleGroupMemberAddition(message, userAdded, userAddedBy, userAddedIn);
        },
        onGroupMemberJoined: (
          message: CometChat.Action,
          joinedUser: CometChat.User,
          joinedGroup: CometChat.Group
        ) => {
          handleGroupMemberAddition(message, joinedUser, null, joinedGroup);
        },
      })
    );

    CometChatUIEventHandler.addGroupListener(uiEventListener, {
      ccGroupCreated: ({ group }: { group: CometChat.Group }) => {
        groupListRef.current?.addItemToList(group, 0);
      },
      ccGroupDeleted: ({ group }: { group: CometChat.Group }) => {
        groupListRef.current?.removeItemFromList(group.getGuid());
      },
      ccGroupLeft: ({ leftGroup }: { leftGroup: CometChat.Group }) => {
        leftGroup.setHasJoined(false);
        leftGroup.setMembersCount(leftGroup.getMembersCount() - 1);
        if (leftGroup.getType() === CometChat.GROUP_TYPE.PRIVATE) {
          groupListRef.current?.removeItemFromList(leftGroup.getGuid());
        } else {
          groupListRef.current?.updateList(leftGroup);
        }
      },
      ccGroupMemberKicked: ({ kickedFrom }: { kickedFrom: CometChat.Group }) => {
        if (kickedFrom?.getType() === CometChat.GROUP_TYPE.PRIVATE) {
          groupListRef.current?.removeItemFromList(kickedFrom.getGuid());
        } else {
          kickedFrom?.setHasJoined(false);
          groupListRef.current?.updateList(kickedFrom);
        }
      },
      ccOwnershipChanged: ({ group }: { group: CometChat.Group }) => {
        groupListRef.current?.updateList(group);
      },
      ccGroupMemberAdded: ({ userAddedIn }: { userAddedIn: CometChat.Group }) => {
        groupListRef.current?.updateList(userAddedIn);
      },
      ccGroupMemberJoined: ({ joinedGroup }: { joinedGroup: CometChat.Group }) => {
        joinedGroup.setScope("participant");
        joinedGroup.setHasJoined(true);
        groupListRef.current?.updateList(joinedGroup);
      },
    });

    return () => {
      CometChat.removeGroupListener(groupListenerId);
      CometChatUIEventHandler.removeGroupListener(uiEventListener);
    };
  }, []);

  return (
    <View style={[Style.container, theme.groupStyles.containerStyle]}>
      <CometChatList
        hideHeader={hideHeader ?? hideHeader}
        onItemPress={onItemPress}
        onItemLongPress={handleItemLongPress}
        SubtitleView={
          SubtitleView
            ? SubtitleView
            : (group: CometChat.Group) => (
                <Text
                  style={[
                    style.itemStyle?.subtitleStyle,
                    theme.groupStyles.itemStyle?.subtitleStyle,
                  ]}
                >
                  {group.getMembersCount() +
                    " " +
                    t(group.getMembersCount() === 1 ? "MEMBER" : "MEMBERS")}
                </Text>
              )
        }
        statusIndicatorType={(group: CometChat.Group) =>
          !groupTypeVisibility
            ? null
            : (group.getType() as CometChatStatusIndicatorInterface["type"])
        }
        title={t("GROUPS")}
        hideSearch={hideSearch ? hideSearch : hideSearchError}
        listStyle={mergedStyle}
        LoadingView={
          hideLoadingState
            ? () => <></> // will not render anything if true
            : LoadingView
              ? LoadingView
              : () => <Skeleton style={mergedStyle.skeletonStyle} />
        }
        EmptyView={EmptyView ? EmptyView : () => <EmptyStateView />}
        ErrorView={ErrorView ? ErrorView : () => <ErrorStateView />}
        searchPlaceholderText={searchPlaceholderText}
        ref={groupListRef}
        listItemKey='guid'
        requestBuilder={
          (groupsRequestBuilder && groupsRequestBuilder.setSearchKeyword(searchKeyword)) ||
          new CometChat.GroupsRequestBuilder().setLimit(30).setSearchKeyword(searchKeyword)
        }
        searchRequestBuilder={searchRequestBuilder}
        AppBarOptions={AppBarOptions}
        hideBackButton={!showBackButton}
        selectionMode={selectionMode}
        onSelection={onSelection}
        onSubmit={onSubmit}
        ItemView={ItemView}
        onError={onError}
        hideError={hideError}
        onListFetched={(fetchedList: CometChat.GroupMember[]) => {
          if (fetchedList.length === 0) {
            onEmpty?.();
          } else {
            onLoad?.(fetchedList);
          }
        }}
        onBack={onBack}
        {...newProps}
      />

      {/* Tooltip Menu: only shows if selectionMode is "none" and items exist */}
      {selectedGroup && selectionMode === "none" && tooltipVisible && (
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
            menuItems={buildMenuItems(selectedGroup).map((menuItem) => ({
              text: menuItem.text,
              onPress: () => {
                // Perform the user-defined action,
                // then close the tooltip.
                menuItem.onPress();
                setTooltipVisible(false);
              },
              icon: menuItem?.icon,
              textStyle: menuItem?.textStyle,
              iconStyle: menuItem?.iconStyle,
              iconContainerStyle: menuItem?.iconContainerStyle,
              disabled: menuItem.disabled,
            }))}
          />
        </View>
      )}
    </View>
  );
});
