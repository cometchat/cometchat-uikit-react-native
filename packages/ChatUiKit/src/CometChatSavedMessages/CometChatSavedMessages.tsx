/**
 * CometChatSavedMessages — the USER-LEVEL saved messages surface (§6.4).
 *
 * Cross-conversation and private: this is the "star / bookmark" inbox, reached from
 * app chrome (main nav, profile, settings), NOT from a conversation header. On RN it
 * is a full-screen route, not a drawer (§6.9).
 *
 * Renders as a CONVERSATION-STYLE LIST — avatar, source name, preview subtitle,
 * trailing date — not as full message bubbles. That is a deliberate divergence from
 * CometChatPinnedMessages, which does show bubbles: a pinned list is scoped to one
 * conversation where a bubble reads naturally, whereas this list spans every
 * conversation and the question a reader asks first is "where is this from?".
 *
 * Read-only with respect to unread state (§7.7): nothing here calls markAsRead,
 * emits receipts, or touches an unread count.
 *
 * @module CometChatSavedMessages
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { useCompTheme, useTheme } from "../theme/hook";
import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { SavedMessagesStyle } from "./style";
import { CometChatTheme } from "../theme/type";
import { Icon } from "../shared/icons/Icon";
import { IconName } from "../shared/icons/Icon";
import { CometChatDate } from "../shared/views/CometChatDate";
import { Skeleton } from "../CometChatConversations/Skeleton";
import { CometChatListItem } from "../shared/views/CometChatListItem";
import { CometChatTooltipMenu, MenuItemInterface } from "../shared/views/CometChatTooltipMenu";
import { ErrorEmptyView } from "../shared/views/ErrorEmptyView/ErrorEmptyView";
import { CometChatConfirmDialog } from "../shared/views/CometChatConfirmDialog";
import { CometChatRetryButton } from "../shared/views/CometChatRetryButton/CometChatRetryButton";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";
import { useToast } from "../shared/helper/useToast";
import {
  buildSavedMessagesRequest,
  previewFor,
  sourceLabelFor,
  subtitlePrefixNameFor,
  SavedMessageSource,
} from "../shared/utils/SavedMessagesHelper";
import {
  carryPinSaveAttrs,
  isMessageGoneError,
  unsaveMessage,
  sameMessageId,
} from "../shared/utils/PinSaveHelper";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { MessageEvents } from "../shared/events/messages";

export interface CometChatSavedMessagesInterface {
  /** Page size. Defaults to 30; the server caps the whole set at 100. */
  limit?: number;
  /** Closes the surface — rendered as the ✕ in the header. */
  onBack?: () => void;
  /**
   * Tapping a row. Receives the message and its resolved source so the host can
   * open that conversation and jump to the message.
   */
  onItemPress?: (message: CometChat.BaseMessage, source: SavedMessageSource | null) => void;
  /**
   * Hide the unsave option in the long-press menu. Named per design doc §6.7,
   * which lists the same four flags for the action sheet — the panel mirrors that
   * vocabulary rather than inventing a shorter one.
   */
  hideUnsaveMessageOption?: boolean;
  /** Replace the whole row body. */
  ItemView?: (message: CometChat.BaseMessage) => JSX.Element;
  title?: string;
  /** Per-instance style overrides, merged over the theme's savedMessagesStyles. */
  style?: DeepPartial<SavedMessagesStyle>;
}

type ListState = "loading" | "loaded" | "error" | "empty";

export const CometChatSavedMessages = (props: CometChatSavedMessagesInterface) => {
  const { limit, onBack, onItemPress, hideUnsaveMessageOption = false, ItemView, title, style } = props;

  const theme = useTheme() as CometChatTheme;
  const compTheme = useCompTheme();
  const { t } = useCometChatTranslation();

  /** theme → component-level override → per-instance prop, the kit's usual order. */
  const styles = useMemo(
    () => deepMerge(theme.savedMessagesStyles, compTheme.savedMessagesStyles ?? {}, style ?? {}),
    [theme.savedMessagesStyles, compTheme.savedMessagesStyles, style]
  );
  const { showToast, ToastElement } = useToast();

  const [messages, setMessagesRaw] = useState<CometChat.BaseMessage[]>([]);
  const [state, setStateRaw] = useState<ListState>("loading");
  const loggedInUser = useRef<CometChat.User | null>(null);

  /**
   * These panels are full-screen routes, so popping one while a fetch or a post-confirm
   * write is still in flight lands a setState on an unmounted component — the React Native
   * warning, plus work nobody will see. Guarding at the SETTER rather than at each of the
   * async resolvers keeps every existing call site unchanged and cannot be forgotten at a
   * new one.
   */
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const setMessages: typeof setMessagesRaw = useCallback(
    value => { if (mounted.current) setMessagesRaw(value); },
    []
  );
  const setState: typeof setStateRaw = useCallback(
    value => { if (mounted.current) setStateRaw(value); },
    []
  );

  /**
   * Long-press menu state. Anchored at the touch point via CometChatTooltipMenu —
   * the SAME affordance the conversation list uses for its Pin/Delete menu, because
   * these rows are conversation rows and should answer a long-press the same way.
   */
  const [menuVisible, setMenuVisible] = useState(false);
  /** The row awaiting unsave confirmation, or null. */
  const [confirmUnsave, setConfirmUnsave] = useState<CometChat.BaseMessage | null>(null);
  const menuAnchor = useRef({ pageX: 0, pageY: 0 });
  const menuTarget = useRef<CometChat.BaseMessage | null>(null);

  /**
   * The request is single-use and accumulates its own paging state, so it lives in
   * a ref for the lifetime of the screen. Refreshing means building a NEW one.
   */
  const request = useRef(buildSavedMessagesRequest(limit));
  const fetching = useRef(false);
  /**
   * The end of a cursor-paged list is an empty page — there is nothing to ask the request
   * for beforehand. Latch it here, or every further scroll-to-end fires a round trip that
   * can only come back empty again.
   */
  const exhausted = useRef(false);

  const loadNext = useCallback(async () => {
    if (fetching.current || exhausted.current) return;
    fetching.current = true;
    try {
      // fetchPrevious(), not fetchNext() — "previous" is older, which is the direction
      // this list scrolls. Same call CometChatMessageList makes to load history.
      const rows = await request.current.fetchPrevious();
      if (rows.length > 0) {
        // Dedupe on append (ENG-38891). A realtime pin/save PREPENDS its row the moment the
        // event lands; the same message then comes back inside a later fetched page, and a
        // plain concat lists it twice — which is how a five-pin cap rendered six rows.
        setMessages(prev => {
          const seen = new Set(prev.map(m => String(m.getId())));
          return [...prev, ...rows.filter(r => !seen.has(String(r.getId())))];
        });
        setState("loaded");
      } else {
        exhausted.current = true;
        setState(prev => (prev === "loading" ? "empty" : prev));
      }
    } catch (e) {
      // Log it. A bare `catch {}` here cost hours once: the list showed a generic error
      // screen with an empty network log, and the actual cause (SET_LIMIT_IS_COMPULSORY,
      // rejected client-side before any request) was unreachable from outside a debugger.
      console.error("CometChatSavedMessages: failed to fetch saved messages", e);
      // An empty first page is "empty", not "error" — only a real rejection is.
      setState(prev => (prev === "loading" ? "error" : prev));
    } finally {
      fetching.current = false;
    }
  }, []);

  /**
   * Keep loading while the rows do not fill the viewport.
   *
   * onEndReached is the only paging trigger, and it needs a scroll to fire. When the first page
   * is shorter than the screen there is nothing to scroll, so the list stops at page one and the
   * rest is unreachable — verified with limit=2 against 4 pinned messages: `loadNext` ran once,
   * returned 2 rows, and was never called again while the panel sat half empty.
   *
   * The default page size fills a phone screen, which is why this hid; `limit` is a public prop,
   * so any integrator who lowers it hits a permanently incomplete list. loadNext already guards
   * on `fetching`/`exhausted`, so this tops up at most one request at a time and stops on its own.
   */
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const fillViewport = useCallback(() => {
    if (exhausted.current || fetching.current) return;
    if (viewportHeight.current <= 0 || contentHeight.current <= 0) return;
    if (contentHeight.current < viewportHeight.current) loadNext();
  }, [loadNext]);

  /**
   * Retry after an error. The request is single-use and has already consumed whatever
   * paging state it got to, so this builds a fresh one rather than re-calling the old —
   * a retried request must start from the top of the list, not from a half-walked cursor.
   */
  const reload = useCallback(() => {
    request.current = buildSavedMessagesRequest(limit);
    exhausted.current = false;
    fetching.current = false;
    setMessages([]);
    setState("loading");
    loadNext();
  }, [limit, loadNext]);

  useEffect(() => {
    CometChat.getLoggedinUser()
      .then(user => {
        loggedInUser.current = user ?? null;
      })
      .catch(() => {
        // A missing logged-in user only costs 1-1 label precision, so carry on.
        loggedInUser.current = null;
      })
      .finally(() => {
        loadNext();
      });
  }, [loadNext]);

  /**
   * Keep the panel in step with saves made anywhere else — the message list next to it,
   * or this user's other device. Without it the list is a snapshot taken on mount.
   *
   * No conversation filter here, unlike the pinned panel: saved is per-viewer and spans
   * every conversation, so any save of this user's belongs on this screen.
   *
   * Both event families: cc* from the device that performed the action, on* from the
   * socket echo to this user's other devices. Save/unsave is private, which is why the
   * SDK exempts it from the self-session guard. Payload shapes differ, hence the unwrap.
   *
   * Keys written out literally — emitMessageEvent matches on each callback's inferred
   * function name, which an anonymous arrow takes from its property key.
   */
  useEffect(() => {
    const id = "saved-messages-panel";

    const unwrap = (payload: any): CometChat.BaseMessage | null =>
      payload?.message ?? payload ?? null;

    const added = (payload: any) => {
      const message = unwrap(payload);
      if (!message) return;
      setMessages(prev => {
        if (prev.some(m => sameMessageId(m.getId(), message.getId()))) return prev;
        return [message, ...prev];
      });
      setState("loaded");
    };

    const removed = (payload: any) => {
      const message = unwrap(payload);
      if (!message) return;
      setMessages(prev => {
        const next = prev.filter(m => !sameMessageId(m.getId(), message.getId()));
        if (next.length === prev.length) return prev;
        // Only claim empty once the first page has been read, or an event arriving
        // mid-load would replace the spinner with "no saved messages".
        if (next.length === 0 && exhausted.current) setState("empty");
        return next;
      });
    };

    /**
     * ENG-38177/38181 were filed against the pinned panel; this list has the same shape and
     * therefore the same two defects. An edited saved message must show its new text, and a
     * deleted one must leave — otherwise the row survives its own message.
     *
     * carryPinSaveAttrs is what keeps `savedAt` alive across the edit: the edit response is
     * minimal and omits it (verified on staging 2026-08-14), so a straight replace would
     * strip the attribute this whole list is filtered on.
     */
    const edited = (payload: any) => {
      const message = unwrap(payload);
      if (!message) return;
      setMessages(prev => {
        const index = prev.findIndex(m => sameMessageId(m.getId(), message.getId()));
        if (index === -1) return prev;
        const next = [...prev];
        next[index] = carryPinSaveAttrs(message, prev[index]);
        return next;
      });
    };

    const deleted = (payload: any) => removed(payload);

    CometChatUIEventHandler.addMessageListener(id, {
      ccMessageSaved: (payload: any) => added(payload),
      onMessageSaved: (payload: any) => added(payload),
      ccMessageUnsaved: (payload: any) => removed(payload),
      onMessageUnsaved: (payload: any) => removed(payload),
      ccMessageEdited: (payload: any) => edited(payload),
      onMessageEdited: (payload: any) => edited(payload),
      ccMessageDeleted: (payload: any) => deleted(payload),
      onMessageDeleted: (payload: any) => deleted(payload),
    });

    return () => CometChatUIEventHandler.removeMessageListener(id);
  }, []);

  /**
   * Row chrome from the CONVERSATION list's own tokens, not this screen's.
   *
   * This surface is a conversation list in every visual respect — avatar, name,
   * preview, date — so it must not grow a parallel set of row styles that drift.
   * `containerStyle` in particular carries the `flexDirection: "row"` that makes a
   * row a row; without it CometChatListItem stacks avatar, title and date
   * vertically.
   */
  const itemStyle = theme.conversationStyles?.itemStyle;

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    menuTarget.current = null;
  }, []);

  const removeRow = (messageId: number) => {
    setMessages(prev => {
      const next = prev.filter(m => !sameMessageId(m.getId(), messageId));
      if (next.length === 0) setState("empty");
      return next;
    });
  };

  /**
   * Unsave ASKS first (Jitvar, 2026-08-04): the removing half of each pair confirms,
   * everywhere it appears. This panel used to act immediately — the message list already
   * confirmed, so the same action asked or didn't depending on which screen you were on.
   */
  const onUnsave = (message: CometChat.BaseMessage) => {
    setConfirmUnsave(message);
  };

  const runUnsave = (message: CometChat.BaseMessage) => {
    const id = message.getId();
    // Optimistic once confirmed: re-adding on failure is trivially correct because the
    // row object is still in hand — EXCEPT when the message is gone, see below.
    removeRow(id);
    unsaveMessage(id)
      .then((updated) => {
        // Same omission as the pinned panel (ENG-38884): this list writes to the server and
        // drops its own row, but the message's bubble in its conversation holds a separate
        // copy and kept showing the bookmark. The bus is the only channel between them.
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageUnsaved, {
          message: updated ?? message,
        });
        showToast(t("MESSAGE_UNSAVED") ?? "Message unsaved");
      })
      .catch((error: any) => {
        // A message that no longer exists must STAY removed, or the user taps Unsave
        // forever on something the server will never accept. This panel is especially
        // exposed: it spans every conversation, so clearing ANY chat can strand rows here.
        if (isMessageGoneError(error)) {
          showToast(t("MESSAGE_NO_LONGER_AVAILABLE") ?? "This message is no longer available.");
          return;
        }
        setMessages(prev => [message, ...prev]);
        setState("loaded");
        showToast(t("PIN_SAVE_GENERIC_ERROR") ?? "Something went wrong. Please try again.");
      });
  };

  /**
   * The long-press menu: Unsave, and nothing else.
   *
   * A saved row is a pointer to a message, not the message itself, so the only
   * action that belongs on it is the one that removes it from THIS list. Copy,
   * share, info and unpin all act on the message and belong where the message
   * actually is — its conversation, or the pinned panel.
   */
  const menuItemsFor = (message: CometChat.BaseMessage): MenuItemInterface[] => {
    if (hideUnsaveMessageOption) return [];
    return [
      {
        text: t("UNSAVE_MESSAGE") ?? "Unsave message",
        onPress: () => {
          closeMenu();
          onUnsave(message);
        },
        icon: (
          // Same unsave glyph as the message action sheet — one action, one icon everywhere.
          <Icon
            name='unsave'
            color={styles.menuIconStyle?.tintColor}
            height={styles.menuIconStyle?.height}
            width={styles.menuIconStyle?.width}
          />
        ),
      },
    ];
  };

  const onLongPressRow = (message: CometChat.BaseMessage, e?: GestureResponderEvent) => {
    if (!e || !("nativeEvent" in e)) return;
    menuTarget.current = message;
    menuAnchor.current = { pageX: e.nativeEvent.pageX, pageY: e.nativeEvent.pageY };
    setMenuVisible(true);
  };

  /**
   * Subtitle: an optional author prefix, then the preview. Mirrors the conversation
   * list's vocabulary so a saved row reads the same as the chat it came from.
   *
   * The prefix rule lives in the helper — it is the only thing distinguishing an
   * outgoing 1-1 row from an incoming one, since this list shows no receipts and both
   * directions resolve to the same avatar and title.
   */
  const renderSubtitle = (message: CometChat.BaseMessage) => {
    const preview = previewFor(message);
    const prefixName = subtitlePrefixNameFor(
      message,
      loggedInUser.current?.getUid() ?? null,
      t("YOU") ?? "You"
    );
    const prefix = prefixName ? `${prefixName}: ` : "";

    const label = preview.text ?? (preview.labelKey ? (t(preview.labelKey) ?? "") : "");

    return (
      <View style={localStyles.subtitleRow}>
        {prefix ? (
          <Text
            numberOfLines={1}
            style={itemStyle?.subtitleStyle}
          >
            {prefix}
          </Text>
        ) : null}
        {preview.icon ? (
          <Icon
            name={preview.icon as IconName}
            color={styles.previewIconStyle?.tintColor}
            height={styles.previewIconStyle?.height}
            width={styles.previewIconStyle?.width}
            containerStyle={styles.previewIconContainerStyle}
          />
        ) : null}
        <Text
          numberOfLines={1}
          ellipsizeMode='tail'
          style={[itemStyle?.subtitleStyle, localStyles.subtitleText]}
        >
          {label}
        </Text>
      </View>
    );
  };

  const renderRow = ({ item, index }: { item: CometChat.BaseMessage; index: number }) => {
    if (ItemView) return ItemView(item);

    const source = sourceLabelFor(item, loggedInUser.current?.getUid() ?? null);
    const name = source?.name ?? item.getSender()?.getName() ?? "";
    const avatar = source?.avatar ?? item.getSender()?.getAvatar();

    return (
      <CometChatListItem
        testID={`SavedMessages.row-${index}`}
        id={item.getId()}
        // A row whose source cannot be derived still renders (design doc §6.4 rule
        // one) — it just falls back to the sender for identity.
        avatarURL={avatar ? { uri: avatar } : undefined}
        avatarName={name}
        title={name}
        // Row chrome comes from conversationStyles, the SAME source the conversation
        // list uses, so a saved row is visually identical to the chat it came from.
        // Without these the item has no flexDirection and the avatar, title and date
        // stack vertically instead of forming a row.
        containerStyle={itemStyle?.containerStyle}
        titleStyle={itemStyle?.titleStyle}
        avatarStyle={itemStyle?.avatarStyle}
        headViewContainerStyle={localStyles.headViewContainer}
        SubtitleView={renderSubtitle(item)}
        // Date only. NO pin indicator: pinned is a property of a message within its
        // conversation, and this list is not a conversation — surfacing it here just
        // adds a signal the reader cannot act on and did not ask for. The pinned
        // panel is where pin state belongs.
        TrailingView={
          <CometChatDate
            timeStamp={item.getSentAt() * 1000}
            pattern='conversationDate'
            style={itemStyle?.dateStyle}
          />
        }
        onPress={() => onItemPress?.(item, source)}
        onLongPress={(_id: string | number, e: GestureResponderEvent) => onLongPressRow(item, e)}
      />
    );
  };

  return (
    <View style={styles.containerStyle}>
      {/* Back arrow LEADING the title, matching Group Info / User Info. This is a pushed
          full-screen route, not a modal, so a leading back is the right affordance — a
          trailing ✕ read as "dismiss a sheet". */}
      <View style={styles.headerContainerStyle}>
        {onBack ? (
          <Pressable
            testID='SavedMessages.back'
            onPress={onBack}
            accessibilityRole='button'
            accessibilityLabel={t("BACK") ?? "Back"}
            hitSlop={8}
          >
            <Icon
              name='arrow-back'
              icon={styles.closeButtonIcon}
              color={styles.closeButtonIconStyle?.tintColor}
              height={styles.closeButtonIconStyle?.height}
              width={styles.closeButtonIconStyle?.width}
            />
          </Pressable>
        ) : null}
        <Text style={styles.titleStyle}>
          {title ?? (t("SAVED_MESSAGES") ?? "Saved Messages")}
        </Text>
      </View>

      {state === "loading" ? (
        // The CONVERSATION skeleton, not a bespoke one: these rows are conversation
        // rows, so the placeholder that matches them already exists and stays in step
        // with them for free.
        <Skeleton />
      ) : state === "empty" ? (
        <ErrorEmptyView
          testID='SavedMessages.empty'
          // ErrorEmptyView is an unstyled shell — it renders a bare View with whatever
          // containerStyle it is handed. Without these three the block sat top-left in the
          // default text style instead of centred in the space the list would have filled.
          containerStyle={styles.emptyStateStyle?.containerStyle}
          title={t("NO_SAVED_MESSAGES") ?? "No saved messages yet"}
          titleStyle={styles.emptyStateStyle?.titleStyle}
          subTitle={
            t("NO_SAVED_MESSAGES_SUBTITLE") ??
            "Save messages to keep them handy whenever you need them."
          }
          subTitleStyle={styles.emptyStateStyle?.subTitleStyle}
          Icon={
            <Icon
              name='bookmark-fill'
              color={styles.emptyStateStyle?.iconStyle?.tintColor}
              height={styles.emptyStateStyle?.iconStyle?.height}
              width={styles.emptyStateStyle?.iconStyle?.width}
            />
          }
        />
      ) : state === "error" ? (
        // The house error state, same as the conversation list: error-state illustration,
        // Oops! / went wrong / try again, and a Retry button. A bare sentence in the
        // default text style was the only thing here before, which read as a broken
        // screen rather than a recoverable one.
        <ErrorEmptyView
          testID='SavedMessages.error'
          containerStyle={styles.errorStateStyle?.containerStyle}
          title={t("OOPS") ?? "Oops!"}
          titleStyle={styles.errorStateStyle?.titleStyle}
          subTitle={t("SOMETHING_WENT_WRONG") ?? "Looks like something went wrong."}
          tertiaryTitle={t("WRONG_TEXT_TRY_AGAIN") ?? "Please try again."}
          subTitleStyle={styles.errorStateStyle?.subTitleStyle}
          Icon={
            <Icon
              name='error-state'
              height={styles.errorStateStyle?.iconStyle?.height}
              width={styles.errorStateStyle?.iconStyle?.width}
              containerStyle={{ marginBottom: styles.errorStateStyle?.iconStyle?.marginBottom }}
            />
          }
          RetryView={<CometChatRetryButton onPress={reload} />}
        />
      ) : (
        <FlatList
          testID='SavedMessages.list'
          data={messages}
          keyExtractor={item => String(item.getId())}
          renderItem={renderRow}
          onEndReachedThreshold={0.5}
          onEndReached={loadNext}
          onLayout={event => {
            viewportHeight.current = event.nativeEvent.layout.height;
            fillViewport();
          }}
          onContentSizeChange={(_width, height) => {
            contentHeight.current = height;
            fillViewport();
          }}
        />
      )}

      <CometChatConfirmDialog
        titleText={t("UNSAVE_MESSAGE_TITLE") ?? "Unsave Message"}
        icon={<Icon name='unsave' size={theme.spacing.spacing.s12} color={theme.color.error} />}
        cancelButtonText={t("CANCEL") ?? "Cancel"}
        confirmButtonText={t("UNSAVE") ?? "Unsave"}
        messageText={
          t("UNSAVE_MESSAGE_CONFIRM") ??
          "Do you want to remove this message from your saved messages?"
        }
        isOpen={confirmUnsave != null}
        onCancel={() => setConfirmUnsave(null)}
        onConfirm={() => {
          if (confirmUnsave) runUnsave(confirmUnsave);
          setConfirmUnsave(null);
        }}
      />

      {/* The conversation list's own long-press affordance, anchored at the touch
          point — the same component and the same shape as its Pin/Delete menu. */}
      <CometChatTooltipMenu
        visible={menuVisible}
        onClose={closeMenu}
        event={{ nativeEvent: menuAnchor.current }}
        menuItems={menuTarget.current ? menuItemsFor(menuTarget.current) : []}
      />

      {ToastElement}
    </View>
  );
};

/**
 * Static layout only — nothing here depends on the theme. Anything theme-derived
 * lives in ./style.ts (or conversationStyles, for the row chrome) and is merged in.
 */
const localStyles = StyleSheet.create({
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  subtitleText: {
    flexShrink: 1,
  },
  headViewContainer: {
    marginHorizontal: 9,
  },
});
