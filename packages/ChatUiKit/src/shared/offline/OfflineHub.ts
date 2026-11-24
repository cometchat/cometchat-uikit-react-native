/**
 * OfflineHub: the kit's single bridge from the Chat SDK's offline listeners to the screens that
 * are mounted (README §3.5).
 *
 * - Started by `CometChatUIKit.init()` / `initFromSettings()` inside the SDK init's `.then`, never
 *   at import. Idempotent.
 * - Registers each SDK listener once, under its own id, and only those the installed SDK has.
 *   They are inert while offline is off: the SDK never fires them.
 * - Never unregistered on logout (SDK registrations survive logout/login). A logout or user switch
 *   clears the hub's own bookkeeping and bumps `gen`, so late callbacks of the old session are
 *   dropped by every screen.
 * - Fans out on private subjects, never on the kit's public event bus. Integrators get only the
 *   additive public events (`ccMessageSendStateChanged`, `ccOfflineCacheReset`) and the existing
 *   `ccMessageSent`, emitted once per transition per `localMessageId`.
 *
 * @internal
 */
import { Subject } from "rxjs";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatUIEventHandler } from "../events/CometChatUIEventHandler/CometChatUIEventHandler";
import { hasSdkFunction, offlineSdk } from "./gate";
import { conversationIdOf, localIdOf, muidOf, OfflineFailureReason } from "./identity";
import { isGroupMemberAction } from "./groupActions";

import { MessageSendState, OfflineMessageEvents } from "../events/offline";

export type { MessageSendState };
export { OfflineMessageEvents };

export interface SendStateEvent {
  gen: number;
  localMessageId: string;
  message: any;
  state: MessageSendState;
  /** `MessageFailureReason` for `failed` / `discarded`. */
  reason?: string;
  /** A failure the outbox does not hold: its Retry is a fresh send. */
  direct?: boolean;
}

export interface MessageSyncEvent { gen: number; messages: any[]; outcome: string }
export interface ConversationSyncEvent { gen: number; conversations: any[] }
export interface MessagesUpdatedEvent { gen: number; messages: any[] }
export interface CacheResetEvent { gen: number; reason: string; pendingMessagesLost: number | null }
export interface MediaReadyEvent { gen: number; messageKey: string; urlKey: string; localPath: string }
export interface SyncFailedEvent { gen: number; phase: "conversation" | "message"; error: unknown }
/** A conversation pinned or unpinned on another device or by an admin (SDK `ConversationListener`). */
export interface ConversationPinEvent { gen: number; pinned: boolean; conversation: any }
/** One group-member action the catch-up sweep delivered (no GroupListener callback fires for it). */
export interface GroupActionSweptEvent { gen: number; message: any }

export type OfflineNoticeKind =
  | "unsent_message_removed"
  | "queue_full"
  | "file_too_large_offline"
  | "messages_not_sent"
  | "unsent_messages_lost"
  | "unsent_messages_maybe_lost"
  /** Retry or Delete tapped while the send is under way (R162): try again shortly. */
  | "send_in_flight"
  /** Download / Share on media the device has no copy of, while offline (BEH-MEDIA-18). */
  | "media_available_when_online";

export interface OfflineNotice {
  gen: number;
  kind: OfflineNoticeKind;
  count?: number;
  /** The removed message, for Copy (text only). */
  message?: any;
  /** Conversation the notice belongs to, when it belongs to one. */
  conversationId?: string;
  /** About chat-list previews only: an open chat, which has its own count, does not show it. */
  previewsOnly?: boolean;
}

export const OFFLINE_LISTENER_IDS = Object.freeze({
  outbox: "uikit_offline_hub_outbox",
  sync: "uikit_offline_hub_sync",
  cacheReset: "uikit_offline_hub_cache_reset",
  media: "uikit_offline_hub_media",
  messagesSynced: "uikit_offline_hub_messages_synced",
  login: "uikit_offline_hub_login",
  conversationPin: "uikit_offline_hub_conversation_pin",
  connection: "uikit_offline_hub_connection",
});

const MAX_TRACKED_SENDS = 500;

/** Forward-only transitions; `failed → sending` is a retry, anything may become `sent`. */
function isForward(from: MessageSendState | undefined, to: MessageSendState): boolean {
  if (from === undefined) return true;
  if (from === to) return false;
  if (to === "sent") return from !== "discarded";
  if (from === "sent" || from === "discarded") return false;
  if (from === "failed") return to === "sending" || to === "discarded";
  return true;
}

function normalizeReason(raw: unknown): string {
  if (typeof raw === "string") return raw;
  const code = (raw as any)?.code ?? (raw as any)?.reason;
  return typeof code === "string" ? code : "";
}

function safeEmit(name: string, payload: object): void {
  try {
    CometChatUIEventHandler.emitMessageEvent(name, payload);
  } catch (e) {
    console.warn(`[CometChatUIKit] ${name} listener threw:`, e);
  }
}

const MAX_UNDELIVERED_NOTICES = 8;

export class OfflineHub {
  private static instance: OfflineHub | null = null;

  static getInstance(): OfflineHub {
    if (!OfflineHub.instance) OfflineHub.instance = new OfflineHub();
    return OfflineHub.instance;
  }

  /** Tests only: drop the singleton so each test starts clean. */
  static resetForTests(): void {
    OfflineHub.instance = null;
  }

  readonly sendState$ = new Subject<SendStateEvent>();
  readonly messageSync$ = new Subject<MessageSyncEvent>();
  readonly syncFailed$ = new Subject<SyncFailedEvent>();
  readonly conversationSync$ = new Subject<ConversationSyncEvent>();
  readonly messagesUpdated$ = new Subject<MessagesUpdatedEvent>();
  readonly cacheReset$ = new Subject<CacheResetEvent>();
  readonly mediaReady$ = new Subject<MediaReadyEvent>();
  readonly notice$ = new Subject<OfflineNotice>();
  /** Remote conversation pin / unpin (UIK-CONV-01). Screens gate it per event. */
  readonly conversationPin$ = new Subject<ConversationPinEvent>();
  /** Swept group-member actions, after `messageSync$` (UIT-SYNC-13). */
  readonly groupActionSwept$ = new Subject<GroupActionSweptEvent>();
  /** Emits the new `gen` after a logout, user switch or cache reset. */
  readonly session$ = new Subject<number>();
  /**
   * Emits the new `gen` after a logout or a user switch only (not a cache reset, which also fires
   * `session$`). A send still waiting for the SDK is settled by it (Android `SessionEnded`).
   */
  readonly sessionEnd$ = new Subject<number>();
  /**
   * The SDK's realtime connection came up. A plain SDK listener, so it fires with offline off too;
   * screens read the gate before acting on it.
   */
  readonly connected$ = new Subject<number>();
  /** The SDK's realtime connection went down. Same listener as `connected$`; screens read the gate. */
  readonly disconnected$ = new Subject<number>();

  private started = false;
  private cacheResetRegistered = false;
  private undeliveredNotices: OfflineNotice[] = [];
  private startAnnouncementsRegistered = false;
  private genValue = 0;
  private sessionUid: string | null = null;
  /** Last state emitted, per `localMessageId` (ON path only). */
  private readonly lastState = new Map<string, MessageSendState>();
  /** Conversations whose read could not reach the server while offline (AC-7.4). */
  private readonly readWhileOffline = new Map<string, { id: string; type: string }>();
  /** Own messages that failed without entering the outbox ("direct"), by muid, for the session. */
  private readonly directFailures = new Map<string, string>();
  /** Retries handed to the SDK and not answered yet; further taps are ignored. */
  private readonly retriesInFlight = new Set<string>();
  /** The `MessageFailureReason` of the last failure, per `localMessageId` (BEH-SEND-35/37). */
  private readonly failureReasons = new Map<string, string>();
  /**
   * Own messages whose refusal (queue full, file too large offline) already raised its notice, by
   * `localMessageId` (else muid): the notice shows once per message.
   */
  private readonly refusalNotices = new Set<string>();
  /** Server id of an own message once it was reported sent, per `localMessageId` (Delete race). */
  private readonly sentIds = new Map<string, number>();
  /**
   * Own messages the user deleted while the SDK no longer held them, by `localMessageId`: if a
   * sent copy still arrives, it is deleted on the server.
   */
  private readonly deleteOnSent = new Set<string>();

  get gen(): number {
    return this.genValue;
  }

  get isStarted(): boolean {
    return this.started;
  }

  /** The signed-in uid as last reported by the SDK (scopes per-user files such as playable copies). */
  get currentUid(): string | null {
    return this.sessionUid;
  }

  /**
   * The two listeners for what the SDK announces about a start go in before the SDK's init. A start
   * can wipe a bad store (cache reset) and lose queued sends (`DISCARDED`), and the SDK tells only the
   * listeners registered when it delivers them: during init, or just after it resolves. A listener
   * added later never hears them, so these cannot wait for the rest of `start()`, which needs the
   * SDK initialized. Registering stores a callback and nothing else, so they are inert while offline
   * is off; a no-op on an SDK without them. Idempotent.
   */
  listenForStartAnnouncements(): void {
    if (this.startAnnouncementsRegistered) return;
    this.startAnnouncementsRegistered = true;
    this.register("addOfflineCacheResetListener", OFFLINE_LISTENER_IDS.cacheReset, {
      onOfflineCacheReset: (reason: unknown, lost: unknown) => this.onCacheReset(reason, lost),
    });
    this.register("addOfflineMessageListener", OFFLINE_LISTENER_IDS.outbox, {
      onOutboxMessagePending: (m: any) => this.onOutboxPending(m),
      onOutboxMessageSent: (m: any) => this.onOutboxSent(m),
      onOutboxMessageFailed: (m: any, reason: unknown) => this.onOutboxFailed(m, reason),
    });
  }

  /** Register the SDK listeners. Safe from every init entry point; only the first call registers. */
  start(): void {
    if (this.started) return;
    this.started = true;
    // An SDK without the offline surface gets nothing registered, so a kit on an older SDK
    // behaves exactly as before.
    if (!hasSdkFunction("isOfflineEnabled")) return;
    this.listenForStartAnnouncements();
    this.register("addSyncListener", OFFLINE_LISTENER_IDS.sync, {
      onConversationSyncCompleted: (list: any[]) =>
        this.conversationSync$.next({ gen: this.genValue, conversations: Array.isArray(list) ? list : [] }),
      onConversationSyncError: (error: unknown) =>
        this.syncFailed$.next({ gen: this.genValue, phase: "conversation", error }),
      onMessageSyncCompleted: (list: any[], outcome: unknown) => this.onMessageSyncCompleted(list, outcome),
      onMessageSyncError: (error: unknown) => this.syncFailed$.next({ gen: this.genValue, phase: "message", error }),
    });
    this.register("addMediaDownloadListener", OFFLINE_LISTENER_IDS.media, {
      onMediaDownloaded: (messageKey: unknown, urlKey: unknown, localPath: unknown) =>
        this.mediaReady$.next({
          gen: this.genValue,
          messageKey: String(messageKey ?? ""),
          urlKey: String(urlKey ?? ""),
          localPath: String(localPath ?? ""),
        }),
    });
    try {
      CometChat.addMessageListener(
        OFFLINE_LISTENER_IDS.messagesSynced,
        new CometChat.MessageListener({
          onMessagesSynced: (list: any[]) =>
            this.messagesUpdated$.next({ gen: this.genValue, messages: Array.isArray(list) ? list : [] }),
        } as any)
      );
    } catch (e) {
      console.warn("[CometChatUIKit] OfflineHub: could not register the synced-messages listener", e);
    }
    this.registerConversationPinListener();
    try {
      CometChat.addConnectionListener(
        OFFLINE_LISTENER_IDS.connection,
        new CometChat.ConnectionListener({
          onConnected: () => this.connected$.next(this.genValue),
          onDisconnected: () => this.disconnected$.next(this.genValue),
        })
      );
    } catch (e) {
      console.warn("[CometChatUIKit] OfflineHub: could not register the connection listener", e);
    }
    try {
      CometChat.addLoginListener(
        OFFLINE_LISTENER_IDS.login,
        new CometChat.LoginListener({
          loginSuccess: (user: any) => this.onLogin(user),
          logoutSuccess: () => this.endSession(),
        } as any)
      );
    } catch (e) {
      console.warn("[CometChatUIKit] OfflineHub: could not register the login listener", e);
    }
  }

  /**
   * Conversation pin / unpin from the user's other devices and from admin pins
   * (`CometChat.addConversationListener`, feature-detected: older SDKs have none). The SDK fires it
   * whether offline is on or not, so the conversation list reads the gate per event and ignores it
   * with offline off, as the release before it did.
   */
  private registerConversationPinListener(): void {
    if (!hasSdkFunction("addConversationListener")) return;
    const handlers = {
      onConversationPinned: (conversation: any) =>
        this.conversationPin$.next({ gen: this.genValue, pinned: true, conversation }),
      onConversationUnpinned: (conversation: any) =>
        this.conversationPin$.next({ gen: this.genValue, pinned: false, conversation }),
    };
    try {
      const sdk = offlineSdk();
      const ListenerClass = sdk.ConversationListener;
      const listener = typeof ListenerClass === "function" ? new ListenerClass(handlers) : handlers;
      sdk.addConversationListener(OFFLINE_LISTENER_IDS.conversationPin, listener);
    } catch (e) {
      console.warn("[CometChatUIKit] OfflineHub: could not register the conversation pin listener", e);
    }
  }

  private register(method: string, id: string, handlers: Record<string, Function>): void {
    if (!hasSdkFunction(method)) return;
    try {
      const result = offlineSdk()[method](id, handlers);
      // addMediaDownloadListener is async on RN.
      if (result && typeof result.then === "function") result.then(undefined, () => {});
    } catch (e) {
      console.warn(`[CometChatUIKit] OfflineHub: could not register ${method}`, e);
    }
  }

  // ── Session ───────────────────────────────────────────────────────────────

  /** Record who is signed in; a different uid ends the previous session first (AC-2.3). */
  onLogin(user: any): void {
    const uid = typeof user?.getUid === "function" ? user.getUid() : user?.uid ?? null;
    if (this.sessionUid !== null && uid !== this.sessionUid) this.endSession();
    this.sessionUid = uid ?? null;
  }

  /** Logout or user switch: forget every per-session mark and bump `gen`. Never clears the SDK cache. */
  endSession(): void {
    this.lastState.clear();
    this.readWhileOffline.clear();
    this.directFailures.clear();
    this.retriesInFlight.clear();
    this.failureReasons.clear();
    this.sentIds.clear();
    this.deleteOnSent.clear();
    this.refusalNotices.clear();
    this.undeliveredNotices = [];
    this.sessionUid = null;
    this.genValue++;
    this.session$.next(this.genValue);
    this.sessionEnd$.next(this.genValue);
  }

  // ── Sends ─────────────────────────────────────────────────────────────────

  /**
   * Report one transition of an own message's send. The per-send listener and the outbox
   * listener both funnel through here, so each transition reaches the screens and the public
   * events exactly once per `localMessageId`. `announced` marks a `sending` the caller already
   * announced publicly (the composer emits `inprogress` at compose time).
   */
  reportSendState(
    message: any,
    state: MessageSendState,
    options: { reason?: string; direct?: boolean; announced?: boolean } = {}
  ): boolean {
    const localMessageId = localIdOf(message);
    if (state === "failed" && options.direct) this.markDirectFailed(message, options.reason ?? "");
    else if (state !== "failed") this.clearDirectFailed(message);
    if (state !== "sending" && localMessageId) this.retriesInFlight.delete(localMessageId);
    if (!localMessageId) {
      // Nothing to dedupe on; a direct failure the SDK never queued still has to reach the screen.
      if (state === "failed") {
        this.sendState$.next({ gen: this.genValue, localMessageId: "", message, state, reason: options.reason, direct: true });
        this.emitPublic(message, state, options.reason);
      }
      return state === "failed";
    }
    const previous = this.lastState.get(localMessageId);
    if (state === "sent") this.rememberSentId(localMessageId, message);
    if (!isForward(previous, state)) return false;
    this.track(localMessageId, state);
    if (state === "failed") this.remember(this.failureReasons, localMessageId, options.reason ?? "");
    else this.failureReasons.delete(localMessageId);
    this.sendState$.next({ gen: this.genValue, localMessageId, message, state, reason: options.reason, direct: options.direct });
    if (state === "sending" && (options.announced || previous === undefined)) {
      this.emitStateChanged(message, state, options.reason);
    } else {
      this.emitPublic(message, state, options.reason);
    }
    return true;
  }

  stateOf(localMessageId: string): MessageSendState | undefined {
    return this.lastState.get(localMessageId);
  }

  /** The reason the last failure of `localMessageId` reported, `""` when unknown (R95). */
  failureReasonFor(localMessageId: string): string {
    return (localMessageId && this.failureReasons.get(localMessageId)) || "";
  }

  /** The server id `localMessageId` was sent under, if this session saw it sent. */
  sentIdFor(localMessageId: string): number | undefined {
    return localMessageId ? this.sentIds.get(localMessageId) : undefined;
  }

  /** Whether a retry of `localMessageId` is handed to the SDK and not answered yet. */
  isRetrying(localMessageId: string): boolean {
    return !!localMessageId && this.retriesInFlight.has(localMessageId);
  }

  private rememberSentId(localMessageId: string, message: any): void {
    const raw = typeof message?.getId === "function" ? message.getId() : message?.id;
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0) return;
    this.remember(this.sentIds, localMessageId, id);
    if (this.deleteOnSent.delete(localMessageId)) {
      CometChat.deleteMessage(String(id)).catch((error: unknown) =>
        console.warn("[CometChatUIKit] deleting a removed message on the server failed", error)
      );
    }
  }

  /** Delete the sent copy of `localMessageId` on the server if it still arrives. */
  deleteWhenSent(localMessageId: string): void {
    if (localMessageId) this.deleteOnSent.add(localMessageId);
  }

  private remember<V>(map: Map<string, V>, key: string, value: V): void {
    map.delete(key);
    map.set(key, value);
    if (map.size > MAX_TRACKED_SENDS) {
      const oldest = map.keys().next().value;
      if (oldest !== undefined) map.delete(oldest);
    }
  }

  markDirectFailed(message: any, reason: string): void {
    const muid = muidOf(message);
    if (muid) this.directFailures.set(muid, reason);
  }

  clearDirectFailed(message: any): void {
    const muid = muidOf(message);
    if (muid) this.directFailures.delete(muid);
  }

  /** The failure reason when `message` failed direct this session, else `undefined`. */
  directFailureOf(message: any): string | undefined {
    const muid = muidOf(message);
    return muid ? this.directFailures.get(muid) : undefined;
  }

  /** Claim a retry for `localMessageId`; false while one is already in flight. */
  beginRetry(localMessageId: string): boolean {
    if (!localMessageId || this.retriesInFlight.has(localMessageId)) return false;
    this.retriesInFlight.add(localMessageId);
    return true;
  }

  endRetry(localMessageId: string): void {
    this.retriesInFlight.delete(localMessageId);
  }

  /**
   * The SDK answered `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` to a Retry or a Delete (BEH-SEND-20/36): the
   * message's send is under way and nothing changed. The user gets the short "Sending… try again
   * in a moment" notice (R162 / S73). Screens show one at a time and it dismisses itself.
   */
  raiseSendInFlightNotice(message: any): void {
    this.notify({ kind: "send_in_flight", message, conversationId: conversationIdOf(message) });
  }

  notify(notice: Omit<OfflineNotice, "gen">): void {
    const stamped = { gen: this.genValue, ...notice };
    // No screen is mounted yet (the SDK reported it during or just after init): keep it for the first.
    // A chat's notice is also kept while screens are mounted, until that chat's list shows it
    // (`claimNotice`): raised while the chat list is up, it shows when the chat is opened.
    // The short "Sending…" answer to one tap is never kept: it would show later, on another screen.
    const forOneChat = !!notice.conversationId && !notice.previewsOnly;
    if (notice.kind !== "send_in_flight" && (!this.notice$.observed || forOneChat)) {
      // Full: a newer chat notice replaces the oldest chat one (never a session-wide one).
      const oldestChat = this.undeliveredNotices.findIndex((kept) => !!kept.conversationId);
      if (forOneChat && this.undeliveredNotices.length >= MAX_UNDELIVERED_NOTICES && oldestChat >= 0) {
        this.undeliveredNotices.splice(oldestChat, 1);
      }
      if (this.undeliveredNotices.length < MAX_UNDELIVERED_NOTICES) this.undeliveredNotices.push(stamped);
    }
    this.notice$.next(stamped);
  }

  /** A mounted screen showed this notice: it is no longer kept for a later one. */
  claimNotice(notice: OfflineNotice): void {
    this.undeliveredNotices = this.undeliveredNotices.filter((kept) => kept !== notice);
  }

  /** The notices that fired before any screen was listening and belong to this screen, oldest first. */
  takeUndeliveredNotices(belongsHere: (notice: OfflineNotice) => boolean): OfflineNotice[] {
    const mine = this.undeliveredNotices.filter((notice) => belongsHere(notice));
    this.undeliveredNotices = this.undeliveredNotices.filter((notice) => !mine.includes(notice));
    return mine;
  }

  private track(localMessageId: string, state: MessageSendState): void {
    this.lastState.delete(localMessageId);
    this.lastState.set(localMessageId, state);
    if (this.lastState.size > MAX_TRACKED_SENDS) {
      const oldest = this.lastState.keys().next().value;
      if (oldest !== undefined) this.lastState.delete(oldest);
    }
  }

  private emitPublic(message: any, state: MessageSendState, reason?: string): void {
    const status = state === "sent" ? "success" : state === "sending" ? "inprogress" : "error";
    safeEmit("ccMessageSent", { message, status });
    this.emitStateChanged(message, state, reason);
  }

  private emitStateChanged(message: any, state: MessageSendState, reason?: string): void {
    safeEmit(OfflineMessageEvents.ccMessageSendStateChanged, { message, state, reason });
  }

  private onOutboxPending(message: any): void {
    // A retry turns a failed row back into a sending one; a fresh send was already announced.
    this.reportSendState(message, "sending", { announced: this.lastState.get(localIdOf(message)) !== "failed" });
  }

  private onOutboxSent(message: any): void {
    this.reportSendState(message, "sent");
  }

  private onOutboxFailed(message: any, rawReason: unknown): void {
    this.reportFailure(message, rawReason);
  }

  /**
   * A final failure, from the per-send `onError` or the outbox `onOutboxMessageFailed` (whichever
   * comes first; the other is deduped). `DISCARDED` / `QUEUE_OVERFLOW` remove the row with a
   * notice; `QUEUE_FULL` / `BYTE_OVERFLOW` are failed (direct) whatever came before, with a
   * notice; anything else is failed (outbox), retried with `retryMessage`.
   */
  reportFailure(message: any, rawReason: unknown, options: { direct?: boolean } = {}): boolean {
    const reason = normalizeReason(rawReason);
    if (reason === OfflineFailureReason.discarded || reason === OfflineFailureReason.queueOverflow) {
      const removed = this.reportSendState(message, "discarded", { reason });
      if (removed) {
        this.notify({ kind: "unsent_message_removed", count: 1, message, conversationId: conversationIdOf(message) });
      }
      return removed;
    }
    const refusal = reason === OfflineFailureReason.queueFull || reason === OfflineFailureReason.byteOverflow;
    const direct = !!options.direct || refusal;
    // A refused message may carry no local id; the per-send and global callbacks both report it.
    if (direct && !localIdOf(message) && this.directFailureOf(message) === reason && this.directFailureOf(message) !== undefined) {
      return false;
    }
    const reported = this.reportSendState(message, "failed", { reason, direct });
    if (!refusal) return reported;
    if (!reported) {
      // The send's own onError reported the failure first and did not name the refusal; the
      // outbox's callback names it for certain, so the row keeps that reason.
      this.markDirectFailed(message, reason);
      const localMessageId = localIdOf(message);
      if (localMessageId) this.remember(this.failureReasons, localMessageId, reason);
    }
    this.raiseRefusalNotice(message, reason);
    return reported;
  }

  /**
   * The notice for a send the outbox refused (`QUEUE_FULL`, `BYTE_OVERFLOW`), raised once per
   * message whichever SDK callback reports the refusal first (UIK-SEND-03): the SDK reports one
   * refusal twice, to the send's own `onError` and to the global `onOutboxMessageFailed`. Any
   * other reason raises nothing.
   */
  raiseRefusalNotice(message: any, reason: string): void {
    if (reason !== OfflineFailureReason.queueFull && reason !== OfflineFailureReason.byteOverflow) return;
    const key = localIdOf(message) || muidOf(message);
    if (key) {
      if (this.refusalNotices.has(key)) return;
      this.refusalNotices.add(key);
      if (this.refusalNotices.size > MAX_TRACKED_SENDS) {
        const oldest = this.refusalNotices.values().next().value;
        if (oldest !== undefined) this.refusalNotices.delete(oldest);
      }
    }
    this.notify({
      kind: reason === OfflineFailureReason.queueFull ? "queue_full" : "file_too_large_offline",
      message,
      conversationId: conversationIdOf(message),
    });
  }

  /** A user removed an unsent row (Delete): tell screens and integrators, no legacy error event. */
  reportDiscardedByUser(message: any): void {
    this.clearDirectFailed(message);
    const localMessageId = localIdOf(message);
    if (localMessageId) {
      if (!isForward(this.lastState.get(localMessageId), "discarded")) return;
      this.track(localMessageId, "discarded");
    }
    this.sendState$.next({ gen: this.genValue, localMessageId, message, state: "discarded", reason: OfflineFailureReason.discarded });
    this.emitStateChanged(message, "discarded", OfflineFailureReason.discarded);
  }

  // ── Sync, reset ───────────────────────────────────────────────────────────

  private onMessageSyncCompleted(list: any[], outcome: unknown): void {
    const messages = Array.isArray(list) ? list : [];
    this.messageSync$.next({ gen: this.genValue, messages, outcome: String(outcome ?? "") });
    // The rows are in; now the screens run their live group handlers for each swept action.
    for (const message of messages) {
      if (isGroupMemberAction(message)) this.groupActionSwept$.next({ gen: this.genValue, message });
    }
    this.flushReadsMadeOffline();
  }

  private onCacheReset(rawReason: unknown, rawLost: unknown): void {
    const reason = String(rawReason ?? "");
    const lostNumber = typeof rawLost === "number" ? rawLost : rawLost == null ? null : Number(rawLost);
    const pendingMessagesLost =
      lostNumber === null || !Number.isFinite(lostNumber) || lostNumber < 0 ? null : lostNumber;
    // Everything on screen came from the old cache: every list reloads.
    this.lastState.clear();
    this.directFailures.clear();
    this.retriesInFlight.clear();
    this.failureReasons.clear();
    this.sentIds.clear();
    this.genValue++;
    // A reset announced together with a lost send must not take that send's notice with it.
    this.undeliveredNotices = this.undeliveredNotices.map((notice) => ({ ...notice, gen: this.genValue }));
    this.session$.next(this.genValue);
    this.cacheReset$.next({ gen: this.genValue, reason, pendingMessagesLost });
    safeEmit(OfflineMessageEvents.ccOfflineCacheReset, { reason, pendingMessagesLost });
    // ENCRYPTION_CHANGED already reported each lost send as DISCARDED, with its own notice (BEH-ENC-16).
    if (reason === "ENCRYPTION_CHANGED") return;
    if (pendingMessagesLost !== null && pendingMessagesLost > 0) {
      this.notify({ kind: "unsent_messages_lost", count: pendingMessagesLost });
    } else if (pendingMessagesLost === null) {
      this.notify({ kind: "unsent_messages_maybe_lost" });
    }
  }

  // ── Reads made offline (AC-7.4) ───────────────────────────────────────────

  rememberReadWhileOffline(receiverId: string, receiverType: string): void {
    if (!receiverId || !receiverType) return;
    this.readWhileOffline.set(`${receiverType}:${receiverId}`, { id: receiverId, type: receiverType });
  }

  private flushReadsMadeOffline(): void {
    if (this.readWhileOffline.size === 0) return;
    const pending = Array.from(this.readWhileOffline.values());
    this.readWhileOffline.clear();
    for (const { id, type } of pending) {
      try {
        const result: any = (CometChat as any).markConversationAsRead?.(id, type);
        if (result && typeof result.catch === "function") result.catch(() => this.rememberReadWhileOffline(id, type));
      } catch {
        this.rememberReadWhileOffline(id, type);
      }
    }
  }
}
