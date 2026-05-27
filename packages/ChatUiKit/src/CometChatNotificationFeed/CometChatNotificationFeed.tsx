// @ts-nocheck
/**
 * CometChatNotificationFeed.tsx
 * ---------------------------------------------------------------------------
 * Full-screen notification feed component displaying campaign/promotional
 * notifications with category filtering, timestamp grouping, rich card
 * rendering, real-time updates, and engagement reporting.
 *
 * Follows UIKit v5 component-centric architecture:
 * - Arrow function component with co-located state and logic
 * - useTheme() for style consumption
 * - Event listener setup/cleanup in useEffect
 * - No ViewModel class
 * ---------------------------------------------------------------------------
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  Text,
  View,
} from "react-native";
import { CometChatCardView } from "@cometchat/cards-react-native";
import type { CometChatCardThemeOverride } from "@cometchat/cards-react-native";

import { useTheme } from "../theme";
import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { useLocalizedDate } from "../shared/helper/useLocalizedDateHook";
import { getCometChatTranslation } from "../shared/resources/CometChatLocalizeNew/LocalizationManager";
import { NotificationFeedStyle } from "./style";
import { groupFeedItemsByTimestamp } from "./utils";
import { Skeleton } from "./Skeleton";
import Header from "../shared/views/CometChatList/Header";
import { ErrorEmptyView } from "../shared/views/ErrorEmptyView/ErrorEmptyView";
import NotificationEmptyIcon from "../shared/icons/components/notification-empty";

// ───────────────────────────────────────────────────────────────
// Module-level constants (hoisted — no GC churn)
// ───────────────────────────────────────────────────────────────
const LISTENER_ID_PREFIX = "notification_feed_";
const UNREAD_POLL_INTERVAL_MS = 30_000;
const ALL_CATEGORY_ID = "__all__";
const t = getCometChatTranslation();

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

/** SDK types — these come from @cometchat/chat-sdk-react-native */
type NotificationFeedItem = any;
type NotificationCategory = any;
type NotificationFeedRequestBuilder = any;
type NotificationCategoriesRequestBuilder = any;

type ScreenState = "loading" | "loaded" | "empty" | "error";

interface CardAction {
  type: string;
  params: Record<string, any>;
  elementId: string;
}

/**
 * Props interface for CometChatNotificationFeed.
 */
export interface CometChatNotificationFeedInterface {
  // ─── Content Configuration ───────────────────────────────────
  /** Feed title. Default: "Notifications" */
  title?: string;
  /** Show/hide the header. Default: true */
  showHeader?: boolean;
  /** Show/hide back button. Default: false */
  showBackButton?: boolean;
  /** Show/hide filter chips row. Default: true */
  showFilterChips?: boolean;
  /** Replace entire header with custom view */
  HeaderView?: () => JSX.Element;
  /** Deep link: scroll to a specific item by ID */
  scrollToItemId?: string;

  // ─── Data Configuration ──────────────────────────────────────
  /** Custom request builder for feed items */
  notificationFeedRequestBuilder?: NotificationFeedRequestBuilder;
  /** Custom request builder for categories */
  notificationCategoriesRequestBuilder?: NotificationCategoriesRequestBuilder;

  // ─── Callbacks ───────────────────────────────────────────────
  /** Called when a feed item card is tapped */
  onItemClick?: (feedItem: NotificationFeedItem) => void;
  /** Called when an action button inside a card is tapped */
  onActionClick?: (feedItem: NotificationFeedItem, action: CardAction) => void;
  /** Called on error */
  onError?: (error: CometChat.CometChatException) => void;
  /** Called when back button is pressed */
  onBackPress?: () => void;

  // ─── Custom State Views ──────────────────────────────────────
  EmptyView?: () => JSX.Element;
  ErrorView?: () => JSX.Element;
  LoadingView?: () => JSX.Element;

  // ─── Style ───────────────────────────────────────────────────
  style?: DeepPartial<NotificationFeedStyle>;

  // ─── CometChatCardsRenderer configuration ────────────────────
  cardThemeMode?: "auto" | "light" | "dark";
  cardThemeOverride?: CometChatCardThemeOverride;
}

// ───────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────
export const CometChatNotificationFeed = (props: CometChatNotificationFeedInterface) => {
  const {
    title,
    showHeader = true,
    showBackButton = false,
    showFilterChips = true,
    HeaderView,
    scrollToItemId,
    notificationFeedRequestBuilder,
    notificationCategoriesRequestBuilder,
    onItemClick,
    onActionClick,
    onError,
    onBackPress,
    EmptyView,
    ErrorView,
    LoadingView,
    style,
    cardThemeMode = "auto",
    cardThemeOverride,
  } = props;

  // ─── Theme & Styles ──────────────────────────────────────────
  const theme = useTheme();
  const { formatDate } = useLocalizedDate();
  const mergedStyles = useMemo(
    () => deepMerge(theme.notificationFeedStyles, style ?? {}) as NotificationFeedStyle,
    [theme, style]
  );

  // ─── State ───────────────────────────────────────────────────
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [feedItems, setFeedItems] = useState<NotificationFeedItem[]>([]);
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  /** Per-category unread counts — persists across category switches (Property 4) */
  const [categoryUnreadCounts, setCategoryUnreadCounts] = useState<Map<string, number>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [loadMoreError, setLoadMoreError] = useState(false);

  // ─── Refs ────────────────────────────────────────────────────
  const feedRequestRef = useRef<any>(null);
  const categoriesRequestRef = useRef<any>(null);
  const listenerIdRef = useRef(LISTENER_ID_PREFIX + Date.now());
  const unreadPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibilityTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const deliveredItemsRef = useRef<Set<string>>(new Set());
  const readItemsRef = useRef<Set<string>>(new Set());
  const sectionListRef = useRef<SectionList>(null);

  // ─── Computed ────────────────────────────────────────────────
  const sections = useMemo(() => groupFeedItemsByTimestamp(feedItems),
    [feedItems]
  );

  // ─── Request Builder Factory ─────────────────────────────────
  const createFeedRequestBuilder = useCallback(
    (category: string | null) => {
      if (notificationFeedRequestBuilder) {
        return notificationFeedRequestBuilder;
      }
      let builder = new CometChat.NotificationFeedRequestBuilder()
        .setLimit(20);
      if (category) {
        
        builder = builder.setCategory(category);
      }
      return builder.build();
    },
    [notificationFeedRequestBuilder]
  );

  // ─── Mark as Delivered (batch) ───────────────────────────────
  const markItemsAsDelivered = useCallback((items: NotificationFeedItem[]) => {
    // Seed read/delivered refs for items already marked by server
    items.forEach((item: any) => {
      if (item.deliveredAt != null) {
        deliveredItemsRef.current.add(item.id);
      }
      if (item.readAt != null) {
        readItemsRef.current.add(item.id);
      }
    });
    // Only call API for items not yet delivered
    const undelivered = items.filter(
      (item: any) => !deliveredItemsRef.current.has(item.id) && item.deliveredAt == null
    );
    if (undelivered.length === 0) return;
    undelivered.forEach((item: any) => deliveredItemsRef.current.add(item.id));
    CometChat.markFeedItemsAsDelivered(undelivered).catch((e) => { console.warn('[CometChatNotificationFeed]', e?.message || e); });
  }, []);

  // ─── Fetch Categories ────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const builder =
        notificationCategoriesRequestBuilder ??
        new CometChat.NotificationCategoriesRequestBuilder().setLimit(50).build();
      categoriesRequestRef.current = builder;
      const cats = await builder.fetchNext();
      setCategories(cats ?? []);
    } catch (err: any) {
      setCategories([]);
    }
  }, [notificationCategoriesRequestBuilder]);

  // ─── Fetch Feed Items ────────────────────────────────────────
  const isInitialLoadRef = useRef(true);

  const fetchInitialItems = useCallback(async () => {
    // Only show full loading state on first load, not on category switch
    if (isInitialLoadRef.current) {
      setScreenState("loading");
    } else {
      setIsFetchingItems(true);
    }
    setFeedItems([]);
    setHasMorePages(true);
    hasMorePagesRef.current = true;

    const builder = createFeedRequestBuilder(activeCategory);
    feedRequestRef.current = builder;

    try {
      const items = await builder.fetchNext();
      
      if (!items || items.length === 0) {
        setScreenState("empty");
        setFeedItems([]);
        setHasMorePages(false);
      } else {
        setFeedItems(items);
        setScreenState("loaded");
        markItemsAsDelivered(items);
        isInitialLoadRef.current = false;
        // Initialize per-category unread counts from "All" fetch (Property 4)
        // Only seed counts on the initial "All" load (no category filter)
        if (activeCategory === null) {
          const counts = new Map<string, number>();
          let total = 0;
          for (const item of items) {
            if (item.readAt == null) {
              total++;
              const cat = item.category;
              if (cat) {
                counts.set(cat, (counts.get(cat) ?? 0) + 1);
              }
            }
          }
          setCategoryUnreadCounts(counts);
          setTotalUnreadCount(total);
        }
      }
    } catch (err: any) {
      setScreenState("error");
      onError?.(err);
    } finally {
      setIsFetchingItems(false);
    }
  }, [activeCategory, createFeedRequestBuilder, markItemsAsDelivered, onError]);

  // ─── Fetch Next Page ─────────────────────────────────────────
  const isLoadingMoreRef = useRef(false);
  const hasMorePagesRef = useRef(true);

  const fetchNextPage = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMorePagesRef.current || !feedRequestRef.current) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(false);
    try {
      const items = await feedRequestRef.current.fetchNext();
      
      if (!items || items.length === 0) {
        setHasMorePages(false);
        hasMorePagesRef.current = false;
      } else {
        setFeedItems((prev) => [...prev, ...items]);
        markItemsAsDelivered(items);
      }
    } catch (err: any) {
      setLoadMoreError(true);
      onError?.(err);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [markItemsAsDelivered, onError]);

  // ─── Pull to Refresh ─────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const builder = createFeedRequestBuilder(activeCategory);
    feedRequestRef.current = builder;
    try {
      const items = await builder.fetchNext();
      if (!items || items.length === 0) {
        setFeedItems([]);
        setScreenState("empty");
        setHasMorePages(false);
      } else {
        setFeedItems(items);
        setScreenState("loaded");
        setHasMorePages(true);
        hasMorePagesRef.current = true;
        markItemsAsDelivered(items);
      }
    } catch (err: any) {
      onError?.(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeCategory, createFeedRequestBuilder, markItemsAsDelivered, onError]);

  // ─── Unread Count ────────────────────────────────────────────
  /** Fetches total unread count from API and per-category counts */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await CometChat.getNotificationFeedUnreadCount();
      const total = result?.count ?? 0;
      setTotalUnreadCount(total);
    } catch (err: any) {
      // Silently fail — unread count is non-critical
    }
  }, []);

  // ─── Category Switch ─────────────────────────────────────────
  const handleCategorySwitch = useCallback(
    (categoryId: string | null) => {
      if (categoryId === activeCategory) return;
      setActiveCategory(categoryId);
      // Reset visibility tracking
      visibilityTimersRef.current.forEach((timer) => clearTimeout(timer));
      visibilityTimersRef.current.clear();
    },
    [activeCategory]
  );

  // ─── Engagement: Viewed ──────────────────────────────────────
  const reportViewed = useCallback((item: NotificationFeedItem) => {
    CometChat
      .reportFeedEngagement(item, "viewed")
      .catch((e) => { console.warn('[CometChatNotificationFeed]', e?.message || e); });
  }, []);

  // ─── Engagement: Mark as Read (immediately on viewport entry) ──────────
  const markAsRead = useCallback(
    (item: NotificationFeedItem) => {
      const id = item.id;
      if (!id) return;
      if (item.readAt != null) return; // Already read (server state)
      if (readItemsRef.current.has(id)) return; // Already marked read this session

      readItemsRef.current.add(id);
      CometChat.markFeedItemAsRead(item).then(() => {
        setFeedItems((prev) =>
          prev.map((fi: any) => {
            if (fi.id === id) {
              fi.readAt = Date.now() / 1000;
            }
            return fi;
          })
        );
        setTotalUnreadCount((prev) => Math.max(0, prev - 1));
        const itemCategory = item.category;
        if (itemCategory) {
          setCategoryUnreadCounts((prev) => {
            const next = new Map(prev);
            const current = next.get(itemCategory) ?? 0;
            if (current > 0) {
              next.set(itemCategory, current - 1);
            }
            return next;
          });
        }
      }).catch((e) => {
        console.warn('[CometChatNotificationFeed] markFeedItemAsRead failed:', e?.message || e);
        readItemsRef.current.delete(id);
      });
    },
    []
  );

  // ─── Engagement: Clicked ─────────────────────────────────────
  const handleItemClick = useCallback(
    (item: NotificationFeedItem) => {
      CometChat.reportFeedEngagement(item, "clicked").catch((e) => { console.warn('[CometChatNotificationFeed]', e?.message || e); });
      onItemClick?.(item);
    },
    [onItemClick]
  );

  // ─── Engagement: Interacted (button press) ─────────────────
  const handleActionClick = useCallback(
    (item: NotificationFeedItem, action: CardAction) => {
      CometChat.reportFeedEngagement(item, "clicked").catch((e) => { console.warn('[CometChatNotificationFeed]', e?.message || e); });
      onActionClick?.(item, action);
    },
    [onActionClick]
  );

  // ─── Viewability Config (for visibility tracking) ────────────
  const previouslyVisibleRef = useRef<Set<string>>(new Set());

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      const currentlyVisible = new Set<string>();

      for (const viewable of viewableItems) {
        
        if (viewable.item) {
          const id = viewable.item.id;
          
          currentlyVisible.add(id);
          reportViewed(viewable.item);
          markAsRead(viewable.item);
        }
      }

      previouslyVisibleRef.current = currentlyVisible;
    },
    [reportViewed, markAsRead]
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // ─── Lifecycle: Init ─────────────────────────────────────────
  useEffect(() => {
    fetchCategories();
    fetchUnreadCount();

    // Start unread count polling
    unreadPollTimerRef.current = setInterval(fetchUnreadCount, UNREAD_POLL_INTERVAL_MS);

    return () => {
      // Cleanup polling
      if (unreadPollTimerRef.current) {
        clearInterval(unreadPollTimerRef.current);
      }
      // Cleanup visibility timers
      visibilityTimersRef.current.forEach((timer) => clearTimeout(timer));
      visibilityTimersRef.current.clear();
    };
  }, []);

  // ─── Lifecycle: Fetch on category change (also handles initial fetch) ──
  useEffect(() => {
    fetchInitialItems();
  }, [activeCategory]);

  // ─── Lifecycle: WebSocket Listener ───────────────────────────
  useEffect(() => {
    const listenerId = listenerIdRef.current;

    CometChat.addNotificationFeedListener(listenerId, {
      onFeedItemReceived: (feedItem: NotificationFeedItem) => {
        // Ensure sentAt is set (WebSocket items may not have it populated)
        if (!feedItem.sentAt) {
          feedItem.sentAt = Math.floor(Date.now() / 1000);
        }
        // Insert at top
        setFeedItems((prev) => [feedItem, ...prev]);
        // Mark delivered
        if (!deliveredItemsRef.current.has(feedItem.id)) {
          deliveredItemsRef.current.add(feedItem.id);
          CometChat.markFeedItemAsDelivered(feedItem).catch((e) => { console.warn('[CometChatNotificationFeed]', e?.message || e); });
        }
        // Increment total unread count
        setTotalUnreadCount((prev) => prev + 1);
        // Increment per-category unread count (Property 4)
        const itemCategory = feedItem.category;
        if (itemCategory) {
          setCategoryUnreadCounts((prev) => {
            const next = new Map(prev);
            next.set(itemCategory, (next.get(itemCategory) ?? 0) + 1);
            return next;
          });
        }
        // Ensure we're in loaded state
        setScreenState("loaded");
      },
    });

    return () => {
      CometChat.removeNotificationFeedListener(listenerId);
    };
  }, []);

  // ─── Deep Link: scrollToItemId ───────────────────────────────
  useEffect(() => {
    if (!scrollToItemId) return;
    const existingIndex = feedItems.findIndex(
      (item: any) => item.id === scrollToItemId
    );
    if (existingIndex >= 0) {
      // Item already in list — scroll to it
      return;
    }
    // Fetch single item for deep linking
    CometChat
      .getNotificationFeedItem(scrollToItemId)
      .then((item: NotificationFeedItem) => {
        if (item) {
          setFeedItems((prev) => [item, ...prev]);
          setScreenState("loaded");
        }
      })
      .catch((e) => { console.warn('[CometChatNotificationFeed]', e?.message || e); });
  }, [scrollToItemId]);

  // ─── Render: Header ──────────────────────────────────────────
  const renderHeader = () => {
    if (!showHeader) return null;
    if (HeaderView) return <HeaderView />;

    return (
      <Header
        title={title ?? t("NOTIFICATIONS")}
        hideBackButton={!showBackButton}
        onBack={onBackPress}
        containerStyle={mergedStyles.headerContainerStyle}
        titleStyle={mergedStyles.titleStyle}
        backButtonIconStyle={mergedStyles.backButtonIconStyle}
        backButtonIconContainerStyle={{ paddingRight: theme.spacing.spacing.s2 }}
        hideSearch={true}
      />
    );
  };

  // ─── Render: Filter Chips ────────────────────────────────────
  const renderFilterChips = () => {
    if (!showFilterChips) return null;

    const allChips = [
      { id: ALL_CATEGORY_ID, label: "All", filterKey: null as string | null },
      ...categories.map((cat: any, index: number) => ({
        id: `chip_${index}_${cat.label ?? cat.id}`,
        label: cat?.label || "",
        filterKey: cat?.label || cat?.id,
      })),
    ];
    return (
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: "center",
            paddingHorizontal: theme.spacing.padding.p4,
            paddingVertical: theme.spacing.padding.p2,
            gap: theme.spacing.spacing.s2,
          }}
        >
        {allChips.map((chip) => {
          const isActive =
            (chip.filterKey === null && activeCategory === null) ||
            chip.filterKey === activeCategory;
          const chipStyle = isActive
            ? mergedStyles.chipActiveStyle
            : mergedStyles.chipInactiveStyle;
          // Property 4: "All" uses totalUnreadCount (from API), categories use persistent Map
          const unreadCount =
            chip.filterKey === null
              ? totalUnreadCount
              : (categoryUnreadCounts.get(chip.filterKey) ?? 0);

          return (
            <Pressable
              key={chip.id}
              onPress={() => handleCategorySwitch(chip.filterKey)}
              style={chipStyle?.containerStyle}
            >
              <Text style={chipStyle?.textStyle}>{chip.label}</Text>
              {!isActive && unreadCount > 0 && (
                <View style={mergedStyles.chipInactiveBadgeStyle?.containerStyle}>
                  <Text style={mergedStyles.chipInactiveBadgeStyle?.textStyle}>
                    {unreadCount > 999 ? "999+" : unreadCount}
                  </Text>
                </View>
              )}
              {isActive && unreadCount > 0 && (
                <View style={mergedStyles.chipBadgeStyle?.containerStyle}>
                  <Text style={mergedStyles.chipBadgeStyle?.textStyle}>
                    {unreadCount > 999 ? "999+" : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      </View>
    );
  };

  // ─── Render: Feed Item ───────────────────────────────────────
  const renderFeedItem = useCallback(
    ({ item }: { item: NotificationFeedItem }) => {
      const isUnread = item.readAt == null;
      const cardJson = JSON.stringify(item.content);
      const categoryLabel = item.category ?? "";
      const sentAtSeconds = item.sentAt;
      const relativeTime = sentAtSeconds
        ? formatDate(sentAtSeconds * 1000, "conversationDate")
        : "";

      return (
        <View>
          {/* Per-item header: Category + Timestamp */}
          <View style={mergedStyles.itemHeaderStyle?.containerStyle}>
            <Text style={mergedStyles.itemHeaderStyle?.categoryTextStyle}>{categoryLabel}</Text>
            <Text style={mergedStyles.itemHeaderStyle?.timestampTextStyle}>{relativeTime}</Text>
          </View>
          <Pressable onPress={() => handleItemClick(item)}>
            <View
              style={[
                mergedStyles.cardContainerStyle,
                {
                  borderColor: mergedStyles.cardBorderColor,
                  borderWidth: mergedStyles.cardBorderWidth,
                },
              ]}
            >
            {isUnread && (
              <View
                style={[
                  mergedStyles.unreadIndicatorStyle,
                  { backgroundColor: mergedStyles.unreadIndicatorColor },
                ]}
              />
            )}
            <CometChatCardView
              cardJson={cardJson}
              themeMode={cardThemeMode}
              themeOverride={cardThemeOverride}
              onAction={(actionEvent: any) => {
                handleActionClick(item, {
                  type: actionEvent?.type ?? actionEvent?.action ?? "unknown",
                  params: actionEvent?.params ?? actionEvent?.data ?? {},
                  elementId: actionEvent?.elementId ?? actionEvent?.id ?? "",
                });
              }}
            />
          </View>
        </Pressable>
        </View>
      );
    },
    [
      mergedStyles,
      cardThemeMode,
      cardThemeOverride,
      handleItemClick,
      handleActionClick,
    ]
  );

  // ─── Render: Footer (loading more) ──────────────────────────

  const renderFooter = () => {
    if (loadMoreError) {
      return (
        <View style={{ paddingVertical: theme.spacing.padding.p4, alignItems: "center" }}>
          <ActivityIndicator size="small" color={theme.color.error} />
          <Text style={{ color: theme.color.textSecondary, ...theme.typography.body.regular, marginTop: theme.spacing.margin.m2 }}>
            {t("NOTIFICATION_FEED_LOAD_MORE_ERROR")}
          </Text>
          <Pressable onPress={() => { setLoadMoreError(false); fetchNextPage(); }}>
            <Text style={{ color: theme.color.primary, ...theme.typography.body.medium, marginTop: theme.spacing.margin.m1 }}>
              {t("NOTIFICATION_FEED_TAP_TO_RETRY")}
            </Text>
          </Pressable>
        </View>
      );
    }
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: theme.spacing.padding.p4, alignItems: "center" }}>
        <ActivityIndicator size="small" color={theme.color.primary} />
        <Text style={{ color: theme.color.textSecondary, ...theme.typography.body.regular, marginTop: theme.spacing.margin.m2 }}>
          {t("NOTIFICATION_FEED_LOADING_MORE")}
        </Text>
      </View>
    );
  };

  // ─── Render: State Views ─────────────────────────────────────
  if (screenState === "loading") {
    if (LoadingView) return <LoadingView />;
    return (
      <View style={mergedStyles.containerStyle}>
        {renderHeader()}
        <Skeleton />
      </View>
    );
  }

  if (screenState === "empty") {
    if (EmptyView) {
      return (
        <View style={mergedStyles.containerStyle}>
          {renderHeader()}
          {renderFilterChips()}
          <EmptyView />
        </View>
      );
    }
    return (
      <View style={mergedStyles.containerStyle}>
        {renderHeader()}
        {renderFilterChips()}
        <ErrorEmptyView
          Icon={<NotificationEmptyIcon width={100} height={97} color={theme.color.iconSecondary} />}
          title={t("NOTIFICATION_FEED_EMPTY_TITLE")}
          subTitle={t("NOTIFICATION_FEED_EMPTY_SUBTITLE")}
          containerStyle={mergedStyles.emptyStateStyle?.containerStyle}
          titleStyle={mergedStyles.emptyStateStyle?.titleStyle}
          subTitleStyle={mergedStyles.emptyStateStyle?.subTitleStyle}
        />
      </View>
    );
  }

  if (screenState === "error") {
    if (ErrorView) {
      return (
        <View style={mergedStyles.containerStyle}>
          {renderHeader()}
          <ErrorView />
        </View>
      );
    }
    return (
      <View style={mergedStyles.containerStyle}>
        {renderHeader()}
        <ErrorEmptyView
          title={t("NOTIFICATION_FEED_ERROR_TITLE")}
          subTitle={t("NOTIFICATION_FEED_ERROR_SUBTITLE")}
          containerStyle={mergedStyles.errorStateStyle?.containerStyle}
          titleStyle={mergedStyles.errorStateStyle?.titleStyle}
          subTitleStyle={mergedStyles.errorStateStyle?.subTitleStyle}
          RetryView={
            <Pressable onPress={fetchInitialItems} style={{ marginTop: theme.spacing.margin.m4 }}>
              <Text style={{ color: theme.color.primary, ...theme.typography.button.medium }}>
                {t("RETRY")}
              </Text>
            </Pressable>
          }
        />
      </View>
    );
  }

  // ─── Render: Loaded State ────────────────────────────────────
  return (
    <View style={mergedStyles.containerStyle}>
      {renderHeader()}
      {renderFilterChips()}
      {isFetchingItems ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.color.primary} />
        </View>
      ) : (
      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item: any) => item.id}
        renderItem={renderFeedItem}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 50;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
          if (isCloseToBottom && contentOffset.y > 0) {
            fetchNextPage();
          }
        }}
        scrollEventThrottle={400}
        ListFooterComponent={renderFooter}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      )}
    </View>
  );
};
