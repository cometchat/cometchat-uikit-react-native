/**
 * The one send helper for every own send (README §3.4, UIK-SEND-10): composer and compact
 * composer text, media, voice notes and attachment batches, and the `CometChatUIKit.send*`
 * statics (which stickers, call buttons and extensions go through).
 *
 * {@link routeSend} reads the gate once, when the user sends. Offline OFF: it runs the call
 * site's existing code unchanged, so each path keeps its own OFF payload (composer text replaces
 * metadata with `{error:true}`, statics merge into `data.metaData`, `ccReplyToMessage`,
 * `onSendButtonPress`). Offline ON: it sends with the SDK's three-phase `MessageSentListener`
 * (the form the SDK queues) and reports each transition to the {@link OfflineHub}, which updates
 * the row and emits the public events exactly once.
 *
 * UI state never waits on the SDK's Promise: offline it rejects for a queued send, and a send
 * that was never attempted may never settle on logout (SDK known issue, A3). The kit settles such
 * a send itself when the session ends or the cache is reset, once and quietly, as Android does
 * (`OfflineSend.rejectOpenCalls`): see {@link isQuietRejection}.
 *
 * @internal
 */
import { CometChatUIEventHandler } from "../events/CometChatUIEventHandler/CometChatUIEventHandler";
import { offlineSdk, isOfflineOn, sdkConnected } from "./gate";
import { localIdOf, OfflineFailureReason, OfflineMessageStatus, statusOf } from "./identity";
import { OfflineHub } from "./OfflineHub";
import { DISCARD_ERROR, errorCodeOf } from "./unsentActions";

export type OfflineSendKind = "text" | "media" | "custom" | "interactive";

export interface OfflineSendResult {
  /** `sending` = accepted and queued: the row keeps the clock; not a failure. */
  state: "sent" | "sending" | "failed";
  message: any;
  error?: unknown;
  reason?: string;
  /** Failed without entering the outbox; Retry is a fresh send. */
  direct?: boolean;
  /**
   * Failed only because the session ended (logout, user switch) or the cache was reset: nothing to
   * show or report, as on Android ({@link isQuietRejection}).
   */
  quiet?: boolean;
}

export interface OfflineSendHooks {
  /** The message reached the server (also after it was queued). */
  onSent?(message: any): void;
  /**
   * A final failure or a direct error (never for a queued send). `quiet` is true when the send
   * ended only because the session ended or the cache was reset: the app is not told of an error.
   */
  onFailed?(error: unknown, message: any, reason: string, direct: boolean, quiet?: boolean): void;
}

/**
 * True for a rejection the kit must never surface as an error (Android `isQuietRejection`): the
 * session ended (logout or user switch), the cache was reset, or the unsent message was removed.
 */
export function isQuietRejection(error: unknown): boolean {
  const code = errorCodeOf(error);
  return code === DISCARD_ERROR.discarded || code === OfflineFailureReason.discarded || code === DISCARD_ERROR.notLoggedIn;
}

/** An `onFailed` hook that hands the app's `onError` every failure except a quiet one. */
export function quietAwareOnError(onError?: (error: any) => void): OfflineSendHooks["onFailed"] {
  if (!onError) return undefined;
  return (error, _message, _reason, _direct, quiet) => {
    if (!quiet && !isQuietRejection(error)) onError(error);
  };
}

/** The rejection of a send that ended with the session or the cache (Android `ERROR_DISCARDED`). */
function quietDiscardError(why: string): Error {
  return Object.assign(new Error(why), {
    code: DISCARD_ERROR.discarded,
    reason: OfflineFailureReason.discarded,
  });
}

/** Which SDK send a message goes through. */
export function sendKindOf(message: any): OfflineSendKind {
  const category = message?.getCategory?.();
  if (category === "custom") return "custom";
  if (category === "interactive") return "interactive";
  return message?.getType?.() === "text" ? "text" : "media";
}

const KNOWN_REASONS = Object.values(OfflineFailureReason) as string[];

/**
 * SDK error codes that stand for a `MessageFailureReason`. The outbox refuses a send it cannot
 * admit with Android's one code, `ERROR_PENDING_QUEUE_LIMIT` (UIK-SEND-03), and names the reason
 * (`QUEUE_FULL`, `QUEUE_OVERFLOW`, `BYTE_OVERFLOW`) beside it. A reason that rides along always
 * wins; the code alone means a full queue.
 */
const REASON_BY_ERROR_CODE: Readonly<Record<string, string>> = Object.freeze({
  ERROR_PENDING_QUEUE_LIMIT: OfflineFailureReason.queueFull,
});

/** The `MessageFailureReason` carried by a per-send `onError`, if any. */
export function failureReasonFromError(error: unknown, reasonArg?: unknown): string {
  const candidates = [reasonArg, (error as any)?.reason, (error as any)?.details?.reason];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && KNOWN_REASONS.includes(candidate)) return candidate;
  }
  const code = (error as any)?.code ?? (error as any)?.name;
  return (typeof code === "string" && REASON_BY_ERROR_CODE[code]) || "";
}

/** The SDK's "queued, not failed" notice (`errorParams.queued === true`, RN `OfflineErrors.ts`). */
export function isQueuedNotice(error: unknown): boolean {
  return (error as any)?.errorParams?.queued === true || (error as any)?.details?.queued === true;
}

function isRefusal(reason: string): boolean {
  return reason === OfflineFailureReason.queueFull || reason === OfflineFailureReason.byteOverflow;
}

function sdkSend(kind: OfflineSendKind, message: any, listener: any): unknown {
  const sdk = offlineSdk();
  switch (kind) {
    case "media":
      return sdk.sendMediaMessage(message, listener);
    case "custom":
      return sdk.sendCustomMessage(message, listener);
    case "interactive":
      return sdk.sendInteractiveMessage(message, listener);
    default:
      return sdk.sendMessage(message, listener);
  }
}

/**
 * How long an online send waits, after its pending callback, for a further answer before the
 * caller is released with "sending". The SDK may never give one for a while: a send queued behind
 * an earlier unsent message in its chat gets `onMessagePending` and nothing else until that chat
 * drains (SDK Outbox R77), and a chat can stall while online (R94).
 */
export const PENDING_ANSWER_WAIT_MS = 3000;

/**
 * Send `message` on the offline path. Resolves once the SDK has answered the first time (sent,
 * queued or failed); never rejects. Later transitions of a queued send arrive through the hub's
 * outbox bridge and through `hooks`.
 *
 * A pending callback counts as the first answer ("sending") when the SDK is not connected (a
 * send queued behind another unsent one gets no further callback, R77), and after
 * {@link PENDING_ANSWER_WAIT_MS} online, so nothing that waits on this Promise (the composer's
 * reply bar and recorder, the next send of a batch) is held by a send that is simply queued.
 * An answer in the same tick as the pending (a queued notice, an iOS-order refusal) still wins.
 */
export function sendWithState(message: any, kind: OfflineSendKind, hooks: OfflineSendHooks = {}): Promise<OfflineSendResult> {
  const hub = OfflineHub.getInstance();
  return new Promise<OfflineSendResult>((resolve) => {
    let pendingMessage: any = null;
    let settled = false;
    let finished = false;
    // Set when the session ended or the cache was reset under this send: whatever the SDK says
    // afterwards is stale and is dropped (Android `stale()`).
    let ended = false;
    let pendingWait: ReturnType<typeof setTimeout> | null = null;
    const settle = (result: OfflineSendResult) => {
      if (pendingWait !== null) {
        clearTimeout(pendingWait);
        pendingWait = null;
      }
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };
    const settleSendingAfterPending = () => {
      if (settled || pendingWait !== null) return;
      const asSending = () => settle({ state: "sending", message: pendingMessage ?? message });
      if (sdkConnected() === false) {
        // Offline: the pending callback is the answer for now. Let a same-tick answer win.
        Promise.resolve().then(asSending);
        return;
      }
      pendingWait = setTimeout(asSending, PENDING_ANSWER_WAIT_MS);
    };
    // A send waits for the SDK's answer. If the session ends (logout, user switch) or the SDK wipes
    // its cache and loses the outbox, the listener it held is gone and no answer ever comes: settle
    // the send here, once and quietly, with DISCARDED, as Android does (`rejectOpenCalls`,
    // `rejectOpenCallsOnReset`). The session watch runs from the start of the send (a send the SDK
    // never answers is open too); the reset watch from the first pending callback.
    let resetWatch: Array<{ unsubscribe(): void }> = [];
    let sessionWatch: { unsubscribe(): void } | null = null;
    const stopResetWatch = () => {
      resetWatch.forEach((w) => w.unsubscribe());
      resetWatch = [];
    };
    const stopWatches = () => {
      stopResetWatch();
      sessionWatch?.unsubscribe();
      sessionWatch = null;
    };
    /** End the send as a quiet DISCARDED failure: no failed row, no notice, no app error. */
    const endQuietly = (why: string) => {
      if (finished) return;
      ended = true;
      const target = pendingMessage ?? message;
      const reason = OfflineFailureReason.discarded;
      const error = quietDiscardError(why);
      // No hub.reportFailure: the session is over, or the hub raises its own notice for the reset.
      settle({ state: "failed", message: target, error, reason, quiet: true });
      finishFailed(error, target, reason, false, true);
    };
    const watchForCacheReset = () => {
      if (resetWatch.length > 0 || finished) return;
      resetWatch = [
        hub.cacheReset$.subscribe((event) => {
          if (finished) return stopResetWatch();
          if (event.pendingMessagesLost === 0) return; // the reset lost no queued send (BEH-ENC-15)
          // ENCRYPTION_CHANGED fails each readable unsent message as DISCARDED first (R20/R136); any
          // send still unanswered here was lost with the cache, as for every other reset reason.
          endQuietly(`Message lost: the offline cache was reset (${event.reason || "unknown"})`);
        }),
      ];
    };
    const finishSent = (sent: any) => {
      if (finished) return;
      finished = true;
      stopWatches();
      try { hooks.onSent?.(sent); } catch (e) { console.warn("[CometChatUIKit] onSent hook threw", e); }
    };
    const finishFailed = (error: unknown, failed: any, reason: string, direct: boolean, quiet = false) => {
      if (finished) return;
      finished = true;
      stopWatches();
      try { hooks.onFailed?.(error, failed, reason, direct, quiet); } catch (e) { console.warn("[CometChatUIKit] onFailed hook threw", e); }
    };
    const failDirect = (failed: any, error: unknown, reason: string) => {
      hub.reportFailure(failed, reason, { direct: true });
      settle({ state: "failed", message: failed, error, reason, direct: true });
      finishFailed(error, failed, reason, true);
    };

    const listener = {
      onMessagePending: (pending: any) => {
        if (ended) return;
        pendingMessage = pending ?? message;
        hub.reportSendState(pendingMessage, "sending", { announced: true });
        watchForCacheReset();
        settleSendingAfterPending();
      },
      onMessageSent: (sent: any) => {
        if (ended) return;
        hub.reportSendState(sent, "sent");
        settle({ state: "sent", message: sent });
        finishSent(sent);
      },
      onError: (error: unknown, reasonArg?: unknown) => {
        if (ended) return;
        const reason = failureReasonFromError(error, reasonArg);
        if (isRefusal(reason)) {
          // Queue full / too large: failed (direct) whatever came before (A7).
          failDirect(pendingMessage ?? message, error, reason);
          return;
        }
        if (!pendingMessage && !isQueuedNotice(error)) {
          // No pending came first: the SDK never queued it (BEH-SEND-33).
          failDirect(message, error, reason);
          return;
        }
        const target = pendingMessage ?? message;
        if (reason) {
          // A final failure of a queued send (TRANSIENT / PERMANENT / DISCARDED / QUEUE_OVERFLOW).
          hub.reportFailure(target, reason);
          settle({ state: "failed", message: target, error, reason });
          finishFailed(error, target, reason, false);
          return;
        }
        if (!isQueuedNotice(error) && statusOf(target) === OfflineMessageStatus.failed) {
          hub.reportFailure(target, OfflineFailureReason.transient);
          settle({ state: "failed", message: target, error, reason: OfflineFailureReason.transient });
          finishFailed(error, target, OfflineFailureReason.transient, false);
          return;
        }
        // Queued, not failed (BEH-SEND-10): the row keeps the clock; the outbox reports the end.
        settle({ state: "sending", message: target, error });
      },
    };

    sessionWatch = hub.sessionEnd$.subscribe(() => endQuietly("The session ended before the message was sent."));
    try {
      const result: any = sdkSend(kind, message, listener);
      // The SDK settles its Promise as well; offline it rejects for a queued send.
      if (result && typeof result.then === "function") result.then(undefined, () => {});
    } catch (error) {
      console.warn("[CometChatUIKit] SDK send threw", error);
      if (!pendingMessage && !ended) failDirect(message, error, failureReasonFromError(error));
    }
  });
}

/**
 * The Promise contract of the public `CometChatUIKit.send*` statics on the ON path: resolves when
 * the message is sent, rejects on a final failure, a direct error or a discard, and never because
 * it was queued. Like Android (`OfflineSend.rejectOpenCalls`, `rejectOpenCallsOnReset`), it also
 * rejects, once and quietly, with `ERROR_OFFLINE_MESSAGE_DISCARDED` when the session ends (logout
 * or user switch) or the SDK's cache reset lost the queued send, so the Promise never stays
 * unsettled. Kit callers treat that rejection as quiet ({@link isQuietRejection}).
 */
export function sendWithStatePromise(message: any, kind: OfflineSendKind): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const hub = OfflineHub.getInstance();
    let watch: { unsubscribe(): void } | null = null;
    const stop = () => {
      watch?.unsubscribe();
      watch = null;
    };
    sendWithState(message, kind, {
      onSent: (sent) => {
        stop();
        resolve(sent);
      },
      onFailed: (error, failed, reason) => {
        stop();
        reject(error ?? Object.assign(new Error(reason || "Message send failed"), { code: reason, message: failed }));
      },
    }).then((first) => {
      if (first.state !== "sending") return;
      // A queued send that is later discarded releases its listener with no answer: reject then.
      const localMessageId = localIdOf(first.message);
      if (!localMessageId) return;
      const startGen = hub.gen;
      watch = hub.sendState$.subscribe((event) => {
        // A session end or a reset settles the send itself (see sendWithState): nothing to do here.
        if (hub.gen !== startGen) return stop();
        if (event.localMessageId !== localMessageId || event.state !== "discarded") return;
        stop();
        reject(Object.assign(new Error("Message discarded"), { code: OfflineFailureReason.discarded, reason: event.reason }));
      });
    });
  });
}

/**
 * Route one send: offline OFF → `today()` (the call site's existing code, unchanged); offline ON
 * → {@link sendWithState}. The gate is read once here, when the user sends.
 */
export function routeSend<T>(message: any, kind: OfflineSendKind, today: () => T, hooks?: OfflineSendHooks): T | Promise<OfflineSendResult> {
  if (!isOfflineOn()) return today();
  return sendWithState(message, kind, hooks);
}

/**
 * Retry an unsent own message on the user's tap (UIK-SEND-07). Every unsent row offers it (R162 /
 * S73): an outbox row (PENDING, SENDING or FAILED, any reason) is retried by the SDK
 * (`retryMessage(localMessageId)`, the same row, never a second copy, so a retry on a row whose send is
 * under way cannot duplicate the message); a direct failure is sent again as a fresh send through
 * {@link sendWithState} (a new local id). A row whose send is under way is answered
 * `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` by the SDK, and the "Sending… try again in a moment" notice is
 * raised. While a retry is in flight a further tap raises the same notice. A row the SDK no longer
 * holds (`ERROR_OFFLINE_MESSAGE_NOT_FOUND`: its chat was purged after it failed, e.g. the user was
 * removed from the group) has nothing left to send, so the row is removed, as Android does
 * (`OfflineSend.retry` → `ActionResult.Removed`); a row the kit has seen sent is never removed.
 */
export function retryFailedMessage(message: any, kind: OfflineSendKind = sendKindOf(message), hooks?: OfflineSendHooks): boolean {
  const hub = OfflineHub.getInstance();
  const sdk = offlineSdk();
  const localMessageId = localIdOf(message);
  // Only a row the outbox does not hold is sent fresh: a direct failure (kept in memory), or one
  // with no local id. A PENDING, SENDING or FAILED outbox row goes back through `retryMessage`, the
  // same row, never a second copy (R162: Retry is offered on every unsent row).
  const direct = hub.directFailureOf(message) !== undefined || !localMessageId;
  if (direct) {
    hub.clearDirectFailed(message);
    // Same signal a retry gives with offline off: the row turns back to "sending" at once.
    try {
      CometChatUIEventHandler.emitMessageEvent("ccMessageSent", { message, status: "inprogress" });
    } catch {
      /* the pending callback will redraw the row */
    }
    sendWithState(message, kind, hooks);
    return true;
  }
  if (typeof sdk.retryMessage !== "function") return false;
  if (!hub.beginRetry(localMessageId)) {
    // A retry of this row is still under way: say so instead of ignoring the tap.
    hub.raiseSendInFlightNotice(message);
    return false;
  }
  try {
    sdk.retryMessage(localMessageId, {
      onMessagePending: (pending: any) => hub.reportSendState(pending ?? message, "sending"),
      onMessageSent: (sent: any) => {
        hub.reportSendState(sent, "sent");
        hooks?.onSent?.(sent);
      },
      onError: (error: unknown, reasonArg?: unknown) => {
        hub.endRetry(localMessageId);
        if (answerRetryRefusal(hub, message, error)) return;
        const reason = failureReasonFromError(error, reasonArg);
        // Not connected: it stays queued. Not retryable (unknown / not FAILED): nothing changed.
        if (reason) hub.reportFailure(message, reason);
      },
    });
  } catch (error) {
    hub.endRetry(localMessageId);
    if (!answerRetryRefusal(hub, message, error)) console.warn("[CometChatUIKit] retryMessage threw", error);
    return false;
  }
  return true;
}

/**
 * The SDK refused a retry with a code that changes the row (Android `OfflineSend.retry`): IN_FLIGHT
 * (the send is on the wire: nothing changed, the user is told) or NOT_FOUND (the SDK no longer
 * holds the message: nothing is left to send, so the row goes; the hub never turns a row it saw
 * sent into a removed one). False for any other answer.
 */
function answerRetryRefusal(hub: OfflineHub, message: any, error: unknown): boolean {
  switch (errorCodeOf(error)) {
    case DISCARD_ERROR.inFlight:
      hub.raiseSendInFlightNotice(message);
      return true;
    case DISCARD_ERROR.notFound:
      hub.reportDiscardedByUser(message);
      return true;
    default:
      return false;
  }
}

/** Run `fn` once the ON-path send got its first answer; a no-op for the OFF path's return value. */
export function afterFirstAnswer(routed: unknown, fn: () => void): void {
  if (routed && typeof (routed as any).then === "function") {
    (routed as Promise<unknown>).then(fn, fn);
  }
}
