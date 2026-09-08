/**
 * CometChatPinnedMessages — the per-conversation pinned list (§6.3).
 *
 * Opened from the chat-header ⋮. Conversation-scoped and PUBLIC: every member sees
 * the same list regardless of who pinned what, and role-gating applies to unpinning,
 * not to reading. Ordered `pinnedAt DESC`. Full-screen route on RN (§6.9).
 *
 * Deliberately shaped like CometChatSavedMessages without sharing an abstraction:
 * the data source, the row action, the title and the empty copy all differ, and a
 * config-driven single component would be fought by both callers. The design doc
 * also specifies two public components, which the other four platforms mirror.
 *
 * Read-only w.r.t. unread state (§7.7): no markAsRead, no receipts, no counts.
 *
 * Two interactions per row:
 *   tap        → `onItemPress`, which the host turns into a jump-to-message
 *   long-press → MessageOptionsSheet — the SAME sheet the message list opens, over
 *                an allow-list of options (see PANEL_OPTIONS)
 *
 * @module CometChatPinnedMessages
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, NativeModules, Pressable, Text, View } from "react-native";
import { ChatConfigurator } from "../shared";
import { MessageOptionsSheet } from "../CometChatMessageList/components/MessageOptionsSheet";
import { MessageOptionConstants } from "../shared/constants/UIKitConstants";
import { CometChatMessageOption } from "../shared/modals/CometChatMessageOption";
import { CometChatMessageTemplate } from "../shared/modals/CometChatMessageTemplate";
import { MessageUtils } from "../shared/utils/MessageUtils";
import { useCompTheme, useTheme } from "../theme/hook";
import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { PinnedMessagesStyle } from "./style";
import { CometChatTheme } from "../theme/type";
import { Icon } from "../shared/icons/Icon";
import { CometChatAvatar } from "../shared/views/CometChatAvatar";
import { CometChatDate } from "../shared/views/CometChatDate";
import { ErrorEmptyView } from "../shared/views/ErrorEmptyView/ErrorEmptyView";
import { CometChatConfirmDialog } from "../shared/views/CometChatConfirmDialog";
import { CometChatRetryButton } from "../shared/views/CometChatRetryButton/CometChatRetryButton";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";
import { useToast } from "../shared/helper/useToast";
import {
  applyPinSaveAnswer,
  canPin,
  carryPinSaveAttrs,
  isMessageGoneError,
  isSaved,
  isSystemPin,
  saveMessage,
  unpinMessage,
  unsaveMessage,
  sameMessageId,
} from "../shared/utils/PinSaveHelper";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { MessageEvents } from "../shared/events/messages";

/**
 * The options this panel is willing to show, as an ALLOW-LIST.
 *
 * A deny-list would be the obvious choice and is the wrong one. Options arrive from
 * the DataSource as pure descriptors — `{id, title, icon}` with NO `onPress`; the
 * message list binds every handler itself. So an option this panel does not
 * explicitly wire renders as a dead menu row. A deny-list silently acquires those
 * every time someone adds an option upstream; an allow-list fails closed.
 *
 * Excluded on purpose:
 *  - delete / edit / reply / replyInThread — product decision, this is a reference
 *    surface, not a place to author from.
 *  - replyPrivately / sendPrivately — same class as reply; they need a composer,
 *    which does not exist here.
 *  - markAsUnread — §7.7 makes this panel read-only w.r.t. unread state.
 *  - reactToMessage — needs the reaction sheet plus live row rebinding.
 *  - translateMessage — per-row in-place render state.
 *  - reportMessage — needs the report dialog; add it when it is asked for.
 *  - threadSubscription — NOT a product decision, a correctness one. `threadSubscribed`
 *    is only populated on responses to requests that asked for it, and a pinned thread
 *    message can be appended to this list in realtime off a websocket frame, which
 *    carries no flag. The option would render "Subscribe" on a thread the user already
 *    follows, and tapping it would unfollow them. Absent is the honest state here.
 */
const PANEL_OPTIONS: string[] = [
  MessageOptionConstants.messageInformation,
  MessageOptionConstants.copyMessage,
  MessageOptionConstants.shareMessage,
  MessageOptionConstants.unpinMessage,
  MessageOptionConstants.saveMessage,
  MessageOptionConstants.unsaveMessage,
];

const templateKey = (category: string, type: string) => `${category}_${type}`;

/** Plain text for copy/share. Empty for anything without a text body. */
const textOf = (message: CometChat.BaseMessage): string => {
  if (message instanceof CometChat.TextMessage) return message.getText() ?? "";
  if (message instanceof CometChat.MediaMessage) return message.getCaption() ?? "";
  return "";
};

export interface CometChatPinnedMessagesInterface {
  /** 1-1 conversation. Mutually exclusive with `group`. */
  user?: CometChat.User;
  /** Group conversation. Mutually exclusive with `user`. */
  group?: CometChat.Group;
  /** Page size. Defaults to 30; the server caps a conversation at 100. */
  limit?: number;
  /** Closes the panel — rendered as the ✕ in the header. */
  onBack?: () => void;
  /** Tapping a row — the host jumps its message list to this message. */
  onItemPress?: (message: CometChat.BaseMessage) => void;
  /**
   * Hide the unpin option in the long-press sheet. Named per design doc §6.7,
   * which lists the same four flags for the action sheet — the panel mirrors that
   * vocabulary rather than inventing a shorter one.
   */
  hideUnpinMessageOption?: boolean;
  /** Hide Save in the long-press sheet (§6.7). */
  hideSaveMessageOption?: boolean;
  /** Hide Copy. Named to match CometChatMessageList's flag of the same purpose. */
  hideCopyMessageOption?: boolean;
  /** Hide Share. Named to match CometChatMessageList's flag of the same purpose. */
  hideShareMessageOption?: boolean;
  /** Hide Info. Named to match CometChatMessageList's flag of the same purpose. */
  hideMessageInfoOption?: boolean;
  /** Hide Unsave in the long-press sheet (§6.7). */
  hideUnsaveMessageOption?: boolean;
  ItemView?: (message: CometChat.BaseMessage) => JSX.Element;
  title?: string;
  /** Per-instance style overrides, merged over the theme's pinnedMessagesStyles. */
  style?: DeepPartial<PinnedMessagesStyle>;
}

type ListState = "loading" | "loaded" | "error" | "empty";

export const CometChatPinnedMessages = (props: CometChatPinnedMessagesInterface) => {
  const {
    user,
    group,
    limit,
    onBack,
    onItemPress,
    hideUnpinMessageOption = false,
    hideSaveMessageOption = false,
    hideUnsaveMessageOption = false,
    hideCopyMessageOption = false,
    hideShareMessageOption = false,
    hideMessageInfoOption = false,
    ItemView,
    title,
    style,
  } = props;

  const theme = useTheme() as CometChatTheme;
  const compTheme = useCompTheme();
  const { t } = useCometChatTranslation();

  /** theme → component-level override → per-instance prop, the kit's usual order. */
  const styles = useMemo(
    () => deepMerge(theme.pinnedMessagesStyles, compTheme.pinnedMessagesStyles ?? {}, style ?? {}),
    [theme.pinnedMessagesStyles, compTheme.pinnedMessagesStyles, style]
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

  /** Long-press sheet state, mirroring what CometChatMessageList keeps. */
  const [sheetOptions, setSheetOptions] = useState<CometChatMessageOption[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<CometChat.BaseMessage | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  /** The row awaiting unpin/unsave confirmation, or null. */
  const [confirm, setConfirm] = useState<{
    message: CometChat.BaseMessage;
    action: "unpin" | "unsave";
  } | null>(null);
  const infoObject = useRef<CometChat.BaseMessage | null | undefined>(null);
  const sheetRef = useRef<{ togglePanel: () => void } | null>(null);

  /**
   * MessageOptionsSheet takes these because the message list drives delete and
   * report through them. This panel offers neither, so they stay inert — they exist
   * to satisfy the contract, not to be read.
   */
  const deleteItem = useRef<CometChat.BaseMessage | undefined>(undefined);
  const pendingReportRef = useRef(false);

  /** Single-use and accumulates its own paging state, so it lives for the screen. */
  const request = useRef<CometChat.MessagesRequest | null>(null);
  const fetching = useRef(false);
  /**
   * The end of a cursor-paged list is an empty page — there is nothing to ask the request
   * for beforehand. Latch it here, or every further scroll-to-end fires a round trip that
   * can only come back empty again.
   */
  const exhausted = useRef(false);

  /**
   * The ordinary messages request, filtered to pinned rows. Paging is the ordinary
   * cursor walk — setPinnedOnly() only changes the field the cursor rides on, from
   * sentAt to pinnedAt, because that is the order the server returns pins in.
   *
   * A factory rather than an inline build: a request is single-use, so retrying after
   * an error needs a fresh one.
   */
  const buildRequest = useCallback(() => {
    const builder = new CometChat.MessagesRequestBuilder().setPinnedOnly(true);
    // ALWAYS set. The SDK has no default: a request that never called setLimit() is
    // rejected with SET_LIMIT_IS_COMPULSORY before any network call. 30 matches the
    // SDK's own DEFAULT_VALUES.MSGS_LIMIT.
    builder.setLimit(limit ?? 30);
    // Exactly one of these; the SDK rejects neither-set.
    if (group) builder.setGUID(group.getGuid());
    else if (user) builder.setUID(user.getUid());
    return builder.build();
  }, [limit, group, user]);

  if (request.current === null) request.current = buildRequest();

  const loadNext = useCallback(async () => {
    if (fetching.current || exhausted.current || !request.current) return;
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
      // Log it — a bare `catch {}` hides client-side rejections that never reach the
      // network, leaving a generic error screen and an empty network log to debug from.
      console.error("CometChatPinnedMessages: failed to fetch pinned messages", e);
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
    request.current = buildRequest();
    exhausted.current = false;
    fetching.current = false;
    setMessages([]);
    setState("loading");
    loadNext();
  }, [buildRequest, loadNext]);

  useEffect(() => {
    CometChat.getLoggedinUser()
      .then(u => {
        loggedInUser.current = u ?? null;
      })
      .catch(() => {
        loggedInUser.current = null;
      })
      .finally(() => {
        loadNext();
      });
  }, [loadNext]);

  /**
   * Keep the panel in step with pins made anywhere else — the message list next to it,
   * this user's other device, or another participant over the socket.
   *
   * Without this the list is a snapshot taken on mount: unpin a message from the
   * conversation and its row sits here until the screen is reopened.
   *
   * Two event families, deliberately both:
   *  - cc*  — emitted by the device that PERFORMED the action. Covers the local case,
   *           and 1-1 conversations, where the server emits no socket frame at all.
   *  - on*  — the socket echo, i.e. somebody else's pin. Groups AND 1-1: the DM
   *           case was confirmed at the handler on 1 Sep (receiverType='user'),
   *           so this panel accepts BOTH directions of a 1-1 frame.
   * The payload shapes differ (cc* wraps in {message}), hence the unwrap.
   */
  useEffect(() => {
    const id = "pinned-messages-panel";

    const belongsHere = (message: CometChat.BaseMessage): boolean => {
      const receiver = message.getReceiverId?.();
      if (group) return receiver === group.getGuid();
      if (!user) return false;

      // A 1-1 frame is NOT symmetric: on an INCOMING pin — the counterparty pinned it —
      // getReceiverId() is the logged-in user's own uid, not theirs. Matching on the
      // receiver alone therefore accepted only the pins this device sent and silently
      // dropped the other participant's, which is the case this listener exists for.
      // Match either direction, and require receiverType 'user' so a group message from
      // that same person cannot leak into a 1-1 panel.
      if (message.getReceiverType?.() !== CometChat.RECEIVER_TYPE.USER) return false;
      const uid = user.getUid();
      return receiver === uid || message.getSender?.()?.getUid?.() === uid;
    };

    const unwrap = (payload: any): CometChat.BaseMessage | null =>
      payload?.message ?? payload ?? null;

    const added = (payload: any) => {
      const message = unwrap(payload);
      if (!message || !belongsHere(message)) return;
      setMessages(prev => {
        if (prev.some(m => sameMessageId(m.getId(), message.getId()))) return prev;
        // Newest pin first — the list is ordered by pinnedAt, and this one is now the
        // most recent.
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
        // Only claim empty once the first page has actually been read; an event that
        // arrives mid-load would otherwise replace the spinner with "no pinned messages".
        if (next.length === 0 && exhausted.current) setState("empty");
        return next;
      });
    };

    /**
     * ENG-38177 — an edit rewrites the row in place.
     *
     * A pinned message stays pinned when it is edited, so the row must survive and show the
     * new content. Without this the panel serves whatever text was pinned, indefinitely.
     *
     * The edit response carries no pinnedAt (verified on staging 2026-08-14), so replacing
     * the row wholesale would strip the very attribute this list is built on — hence
     * carryPinSaveAttrs. Rows not already in the list are ignored: an edit is not a pin.
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

    /**
     * ENG-38181 — a deleted message cannot stay in the pinned list.
     *
     * The server drops it from the pinned set, so a row left behind is one the user can tap
     * into nothing. Reuses `removed`, which already handles the last-row empty state.
     */
    const deleted = (payload: any) => removed(payload);

    /**
     * A save or unsave made ANYWHERE rewrites the bookmark on the row in place.
     *
     * The row stays either way — `savedAt` is a private per-viewer flag with no bearing on
     * whether the message is pinned — so this is not `added`/`removed`, it is an update.
     *
     * applyPinSaveAnswer, NOT carryPinSaveAttrs (which `edited` above uses): on this path the
     * response IS the answer, and an ABSENT savedAt means "no longer saved". Carrying the old
     * value across would leave the bookmark on screen for ever, which is the exact mistake
     * the edit path has to make in the opposite direction.
     */
    const savedChanged = (payload: any) => {
      const message = unwrap(payload);
      if (!message) return;
      setMessages(prev => {
        const index = prev.findIndex(m => sameMessageId(m.getId(), message.getId()));
        if (index === -1) return prev;
        const next = [...prev];
        next[index] = applyPinSaveAnswer(prev[index], message);
        return next;
      });
    };

    // The keys must be written out literally. emitMessageEvent dispatches by matching
    // the event name against each callback's inferred function NAME, which an anonymous
    // arrow gets from its property key — passing `added` by reference would register a
    // function named "added" and never match anything.
    CometChatUIEventHandler.addMessageListener(id, {
      ccMessagePinned: (payload: any) => added(payload),
      onMessagePinned: (payload: any) => added(payload),
      ccMessageUnpinned: (payload: any) => removed(payload),
      onMessageUnpinned: (payload: any) => removed(payload),
      ccMessageEdited: (payload: any) => edited(payload),
      onMessageEdited: (payload: any) => edited(payload),
      ccMessageSaved: (payload: any) => savedChanged(payload),
      onMessageSaved: (payload: any) => savedChanged(payload),
      ccMessageUnsaved: (payload: any) => savedChanged(payload),
      onMessageUnsaved: (payload: any) => savedChanged(payload),
      ccMessageDeleted: (payload: any) => deleted(payload),
      onMessageDeleted: (payload: any) => deleted(payload),
    });

    return () => CometChatUIEventHandler.removeMessageListener(id);
  }, [group, user]);

  /**
   * Clearing a conversation deletes its messages FOR THIS VIEWER, pinned ones included.
   * The server is consistent about it — the pinned list comes back empty and every id
   * behind the old rows returns ERR_MESSAGE_ID_NOT_FOUND — but this panel had no idea it
   * had happened, so it kept rendering rows for messages that no longer existed and every
   * unpin from them 404'd.
   *
   * Emptying rather than refetching: there is nothing left to fetch, and a request here
   * would race the delete and could repopulate from a stale read.
   */
  useEffect(() => {
    const id = "pinned-messages-panel-conversation";

    CometChatUIEventHandler.addConversationListener(id, {
      ccConversationDeleted: ({ conversation }: { conversation: CometChat.Conversation }) => {
        const cleared = conversation?.getConversationWith?.();
        if (!cleared) return;
        const clearedId =
          cleared instanceof CometChat.Group ? cleared.getGuid() : (cleared as CometChat.User).getUid();
        const mine = group ? group.getGuid() : user ? user.getUid() : null;
        if (!mine || clearedId !== mine) return;

        setMessages([]);
        exhausted.current = true;
        setState("empty");
      },
    });

    return () => CometChatUIEventHandler.removeConversationListener(id);
  }, [group, user]);

  const templates: CometChatMessageTemplate[] = useMemo(
    () => ChatConfigurator.dataSource.getAllMessageTemplates(theme),
    [theme]
  );

  const templatesMap = useMemo(() => {
    const map = new Map<string, CometChatMessageTemplate>();
    templates.forEach(tpl => map.set(templateKey(tpl.category, tpl.type), tpl));
    return map;
  }, [templates]);

  const closeSheet = useCallback(() => {
    setSheetOptions([]);
    setSelectedMessage(null);
    infoObject.current = null;
    setShowInfo(false);
  }, []);

  /**
   * Unpin and unsave ASK first (Jitvar, 2026-08-04) — the removing half of each pair
   * confirms, on every surface it appears. Unpin especially: the pin may not be yours,
   * and nothing on this panel offers it back.
   */
  const onUnpin = (message: CometChat.BaseMessage) => setConfirm({ message, action: "unpin" });

  const runUnpin = (message: CometChat.BaseMessage) => {
    const id = message.getId();
    setMessages(prev => {
      const next = prev.filter(m => !sameMessageId(m.getId(), id));
      if (next.length === 0) setState("empty");
      return next;
    });
    unpinMessage(id)
      .then((updated) => {
        // Tell the other surfaces (ENG-38884). This panel sits ON TOP of the message list,
        // which holds its own copy of the message — without this the bubble behind kept its
        // pin glyph until a fetch rebuilt the list, so the message read as still pinned.
        // The server's response is the authoritative answer; the row we held is the fallback
        // for the case where it comes back empty.
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageUnpinned, {
          message: updated ?? message,
        });
        showToast(t("MESSAGE_UNPINNED") ?? "Message unpinned");
      })
      .catch((error: any) => {
        // A message that no longer exists must STAY removed. Reinstating the row — which is
        // right when the write merely failed — leaves the user tapping Unpin forever on
        // something the server will never accept. Clearing a chat with pinned messages does
        // exactly this: the rows survive in the open panel, but every id behind them is gone.
        if (isMessageGoneError(error)) {
          setMessages(prev => {
            if (prev.length === 0 && exhausted.current) setState("empty");
            return prev;
          });
          showToast(t("MESSAGE_NO_LONGER_AVAILABLE") ?? "This message is no longer available.");
          return;
        }
        setMessages(prev => [message, ...prev]);
        setState("loaded");
        showToast(t("PIN_SAVE_GENERIC_ERROR") ?? "Something went wrong. Please try again.");
      });
  };

  /**
   * Save/unsave from inside the panel. Unlike unpin, the row STAYS — `savedAt` is a
   * private per-viewer flag and has no bearing on whether a message is pinned.
   * Swaps in the settled server row so the bookmark indicator re-renders off it.
   */
  const onToggleSave = (message: CometChat.BaseMessage, save: boolean) => {
    // Saving is additive and runs straight away; unsaving asks.
    if (!save) {
      setConfirm({ message, action: "unsave" });
      return;
    }
    runToggleSave(message, true);
  };

  const runToggleSave = (message: CometChat.BaseMessage, save: boolean) => {
    const id = message.getId();
    const call = save ? saveMessage : unsaveMessage;
    call(id)
      .then(updated => {
        setMessages(prev => prev.map(m => (sameMessageId(m.getId(), id) ? (updated ?? m) : m)));
        // Same reason as the unpin above — the bookmark on the bubble behind this panel is a
        // second copy of the same state and has to be told.
        CometChatUIEventHandler.emitMessageEvent(
          save ? MessageEvents.ccMessageSaved : MessageEvents.ccMessageUnsaved,
          { message: updated ?? message }
        );
        showToast(
          save
            ? (t("MESSAGE_SAVED") ?? "Message saved")
            : (t("MESSAGE_UNSAVED") ?? "Message unsaved")
        );
      })
      .catch(() =>
        showToast(t("PIN_SAVE_GENERIC_ERROR") ?? "Something went wrong. Please try again.")
      );
  };

  const onCopy = (message: CometChat.BaseMessage) => {
    // ponytail: raw text, not the mention-resolved string the message list copies via
    // its local getPlainString (not exported). Copying "@uid" instead of "@Name" is
    // the known ceiling; lift it by extracting that helper into shared/utils.
    Clipboard.setString(textOf(message));
    // Deferred like the message list does: unmounting the Modal while Clipboard is
    // still touching views crashes Fabric on iOS.
    requestAnimationFrame(closeSheet);
  };

  const onShare = (message: CometChat.BaseMessage) => {
    const attachment =
      message instanceof CometChat.MediaMessage ? message.getAttachment() : undefined;
    const fileUrl = attachment?.getUrl() ?? "";
    const shareObj = {
      message: textOf(message),
      type: message.getType(),
      mediaName: attachment?.getName() ?? "",
      fileUrl,
      mimeType: attachment?.getMimeType() ?? "",
    };
    closeSheet();
    // Same 600ms as the message list: presenting the native share sheet before the
    // modal finishes dismissing freezes the screen on iOS/Fabric.
    setTimeout(() => {
      NativeModules?.FileManager?.shareMessage?.(shareObj, () => {});
    }, 600);
  };

  /**
   * Unpin is offered only to Admin/Moderator/Owner — the same gate as the
   * action-sheet option, so the panel cannot become a back door to an action the
   * message list refuses. A system pin (`app_system`) is never user-unpinnable.
   */
  const mayUnpin = (message: CometChat.BaseMessage) =>
    !hideUnpinMessageOption && !isSystemPin(message) && canPin(loggedInUser.current, group ?? null);

  /**
   * Takes the DataSource's options for this message, keeps only the allow-listed
   * ones, and binds a handler to each. Anything left unbound is dropped rather than
   * shown inert — the switch's default is the safety net for PANEL_OPTIONS drifting
   * ahead of the handlers below.
   */
  const buildOptions = (message: CometChat.BaseMessage): CometChatMessageOption[] => {
    const template = templatesMap.get(templateKey(message.getCategory(), message.getType()));
    // No logged-in user means no options at all rather than an unauthenticated menu.
    const raw =
      template?.options && loggedInUser.current
        ? (template.options(loggedInUser.current, message, theme, group) ?? [])
        : [];

    const bound: CometChatMessageOption[] = [];
    raw
      .filter(option => PANEL_OPTIONS.includes(option.id))
      .forEach(option => {
        switch (option.id) {
          case MessageOptionConstants.messageInformation:
            if (hideMessageInfoOption) break;
            bound.push({
              ...option,
              onPress: () => {
                infoObject.current = message;
                setShowInfo(true);
              },
            });
            break;
          case MessageOptionConstants.copyMessage:
            if (hideCopyMessageOption) break;
            bound.push({ ...option, onPress: () => onCopy(message) });
            break;
          case MessageOptionConstants.shareMessage:
            if (hideShareMessageOption) break;
            bound.push({ ...option, onPress: () => onShare(message) });
            break;
          case MessageOptionConstants.unpinMessage:
            if (!mayUnpin(message)) break;
            bound.push({
              ...option,
              onPress: () => {
                closeSheet();
                onUnpin(message);
              },
            });
            break;
          case MessageOptionConstants.saveMessage:
            if (hideSaveMessageOption) break;
            bound.push({
              ...option,
              onPress: () => {
                closeSheet();
                onToggleSave(message, true);
              },
            });
            break;
          case MessageOptionConstants.unsaveMessage:
            if (hideUnsaveMessageOption) break;
            bound.push({
              ...option,
              onPress: () => {
                closeSheet();
                onToggleSave(message, false);
              },
            });
            break;
          default:
            break;
        }
      });
    return bound;
  };

  const onLongPressRow = (message: CometChat.BaseMessage) => {
    const options = buildOptions(message);
    if (options.length === 0) return;
    setSelectedMessage(message);
    setSheetOptions(options);
  };

  const renderRow = ({ item, index }: { item: CometChat.BaseMessage; index: number }) => {
    const sender = item.getSender();
    const avatar = sender?.getAvatar();
    const isSelf = sender?.getUid() === loggedInUser.current?.getUid();

    return (
      <Pressable
        testID={`PinnedMessages.row-${index}`}
        onPress={() => onItemPress?.(item)}
        onLongPress={() => onLongPressRow(item)}
        accessibilityRole='button'
        style={styles.itemStyle?.containerStyle}
      >
        <View style={styles.itemStyle?.headerContainerStyle}>
          <CometChatAvatar
            // getAvatar() is a URL string; the avatar wraps bare strings into {uri}
            // at runtime but types the prop as ImageSourcePropType, so wrap it here.
            image={avatar ? { uri: avatar } : undefined}
            name={sender?.getName() ?? ""}
            style={styles.itemStyle?.avatarStyle}
          />
          {/* No source label here, unlike the saved list — every row is from THIS
              conversation, so it would be identical on every row and pure noise. */}
          <Text
            numberOfLines={1}
            style={styles.itemStyle?.senderNameStyle}
          >
            {isSelf ? (t("YOU") ?? "You") : (sender?.getName() ?? "")}
          </Text>
          <Text
            style={styles.itemStyle?.separatorStyle}
          >
            {"•"}
          </Text>
          <CometChatDate
            timeStamp={item.getSentAt() * 1000}
            pattern='dayDateFormat'
            style={styles.itemStyle?.dateStyle}
          />

          {/* A saved-too row shows the bookmark, so state reads consistently with the
              message list. The pin glyph lives in the bubble's own meta row. */}
          {isSaved(item) ? (
            <View
              accessible={true}
              accessibilityLabel={t("SAVED") ?? "Saved"}
              style={styles.itemStyle?.savedIndicatorContainerStyle}
            >
              <Icon
                name='bookmark-fill'
                color={styles.itemStyle?.savedIndicatorStyle?.tintColor}
                height={styles.itemStyle?.savedIndicatorStyle?.height}
                width={styles.itemStyle?.savedIndicatorStyle?.width}
              />
            </View>
          ) : null}
        </View>

        {/* pointerEvents none so the bubble never swallows the row's tap/long-press. */}
        <View pointerEvents='none' style={styles.itemStyle?.bubbleContainerStyle}>
          {ItemView
            ? ItemView(item)
            : MessageUtils.getMessageView({
                message: item,
                templates,
                alignment: "left",
                theme,
                // The row header above already carries the avatar and the sender
                // name. Both of the bubble's own copies are group-only, so leaving
                // these on printed each of them twice in a group.
                avatarVisibility: false,
                headerVisibility: false,
              })}
        </View>
      </Pressable>
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
            testID='PinnedMessages.back'
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
          {/* Static, matching the mobile mock. The web spec puts the count inline
              (§6.0), but there is no count field on the server — it would be a
              fetch-all-and-count that ticks upward as pages load, so the title would
              visibly change under the user while they scroll. */}
          {title ?? (t("PINNED_MESSAGES") ?? "Pinned Messages")}
        </Text>
      </View>

      {state === "empty" ? (
        <ErrorEmptyView
          testID='PinnedMessages.empty'
          // ErrorEmptyView carries no layout of its own — everything comes from these props.
          containerStyle={styles.emptyStateStyle?.containerStyle}
          title={t("NO_PINNED_MESSAGES") ?? "No pinned messages yet"}
          titleStyle={styles.emptyStateStyle?.titleStyle}
          subTitle={
            t("NO_PINNED_MESSAGES_SUBTITLE") ??
            "Pin important messages to keep them easy to find."
          }
          subTitleStyle={styles.emptyStateStyle?.subTitleStyle}
          Icon={
            // Filled, matching the design and the saved screen's bookmark-fill — an empty state
            // is an illustration, not the outline glyph used inline as metadata.
            <Icon
              name='keep-fill'
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
          testID='PinnedMessages.error'
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
          testID='PinnedMessages.list'
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

      {/* The message list's own sheet, so the panel's long-press looks and behaves
          identically. Reactions are off — this panel does not wire them. */}
      <MessageOptionsSheet
        bottomSheetRef={sheetRef}
        isOpen={sheetOptions.length > 0 || showInfo}
        showMessageOptions={sheetOptions}
        ExtensionsComponent={null}
        messageInfo={showInfo}
        infoObject={infoObject}
        selectedMessage={selectedMessage}
        hideReactionOption={true}
        templatesMap={templatesMap}
        mergedTheme={theme}
        deleteItem={deleteItem}
        pendingReportRef={pendingReportRef}
        onClose={closeSheet}
        onReactionPress={() => {}}
        onAddReactionPress={() => {}}
        setShowDeleteModal={() => {}}
        setShowReportDialog={() => {}}
        setShowMessageOptions={setSheetOptions}
        setExtensionsComponent={() => {}}
        setMessageInfo={setShowInfo}
        setShowEmojiKeyboard={() => {}}
      />

      <CometChatConfirmDialog
        titleText={
          confirm?.action === "unpin"
            ? (t("UNPIN_MESSAGE_TITLE") ?? "Unpin Message")
            : (t("UNSAVE_MESSAGE_TITLE") ?? "Unsave Message")
        }
        icon={
          <Icon
            name={confirm?.action === "unpin" ? "keep-off" : "unsave"}
            size={theme.spacing.spacing.s12}
            color={theme.color.error}
          />
        }
        cancelButtonText={t("CANCEL") ?? "Cancel"}
        confirmButtonText={
          confirm?.action === "unpin" ? (t("UNPIN") ?? "Unpin") : (t("UNSAVE") ?? "Unsave")
        }
        messageText={
          confirm?.action === "unpin"
            ? (t("UNPIN_MESSAGE_CONFIRM") ??
              "Do you want to unpin this message from this conversation?")
            : (t("UNSAVE_MESSAGE_CONFIRM") ??
              "Do you want to remove this message from your saved messages?")
        }
        isOpen={confirm != null}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.action === "unpin") runUnpin(confirm.message);
          else if (confirm) runToggleSave(confirm.message, false);
          setConfirm(null);
        }}
      />

      {ToastElement}
    </View>
  );
};
