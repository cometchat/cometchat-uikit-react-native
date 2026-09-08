/**
 * Kit-side thread subscription — the feature gate, the toggle both entry points call
 * (thread header §6.2, message action sheet §6.3), and the two local mirrors of the
 * server's auto-subscribe behaviour.
 *
 * ── THE MODEL ─────────────────────────────────────────────────────────────────────────
 *
 * **The message object is the source of truth. There is no kit-side cache.**
 *
 * The SDK used to keep a subscription store, infer changes and emit events. It no longer
 * does any of it: it reports the server's flag on the message (`isThreadSubscribed()`) and
 * offers a local setter (`setThreadSubscribed()`) plus two server calls. The mistake the SDK
 * just removed is not one this file reintroduces — every surface reads the flag off the
 * message object it is holding, and when the kit learns of a change it writes the flag back
 * onto the objects it holds so the next read, including one after a remount, is correct.
 *
 * Surfaces do not share message instances (the list, the thread header's parent and a bubble
 * may each hold a copy), so a write to one is invisible to the others. That is what
 * `ccThreadSubscriptionChanged` is for: whoever changes state publishes, and every surface
 * both re-renders and stamps the objects it holds.
 *
 * ── THE ONE RULE ──────────────────────────────────────────────────────────────────────
 *
 * `threadSubscribed` is only populated on responses to requests that ASKED for it. A
 * socket-delivered message carries no flag and reads `false`.
 *
 *   **`false` means "the server did not tell me", NOT "the user is unsubscribed".**
 *
 * The one exception is the logged-in user's OWN message, fetched: the author is subscribed
 * by default, so a `false` there is an explicit unsubscribe and nothing may override it.
 *
 * That rule bites hardest on a thread REPLY arriving over the socket — its own flag is
 * `false` whatever the truth, so its bubble would offer "Subscribe" on a thread the user
 * already follows. `applyIncomingReply` fixes it by stamping each arriving reply from the
 * parent, which is the authority.
 *
 * ── THE FOUR CASES ────────────────────────────────────────────────────────────────────
 *
 *  1. **Manual toggle** — `toggleThreadSubscription`. The only case that writes to the server.
 *  2. **You authored the message** — the server subscribes you outright. Stamped locally by
 *     `applySentMessage`, because the SEND RESPONSE omits the flag.
 *  3. **A reply @-mentions you** — `applyIncomingReply`. Mirror only.
 *  4. **You sent a reply** — same rule as 2, same call.
 *
 * Cases 2 and 4 collapsed into one when author-subscribed-by-default shipped (staging,
 * 2026-08-19): any message you send subscribes you to its thread. The old "first reply to
 * your own root" mirror was deleted with it — it was a workaround for the author NOT being
 * subscribed until someone replied, and keeping it would risk reviving a subscription the
 * author had cancelled.
 *
 * ── WHO OWNS WHAT ─────────────────────────────────────────────────────────────────────
 *
 * The API sets `threadSubscribed` on FETCHED messages only (confirmed with the backend team,
 * 2026-08-19). Send responses and realtime frames never carry it. So:
 *
 *   fetched message   → the flag on the object IS the answer. Read it, never override it.
 *   sent message      → the kit stamps it (applySentMessage).
 *   realtime message  → the kit stamps it from the parent (applyIncomingReply).
 *
 * Every mirror below exists to cover the two paths the API deliberately does not populate.
 * None of them is waiting on a backend change.
 *
 * Cases 3 and 4 mirror server-side truths for immediate feedback; they never call
 * `subscribeToThread`. Where a mirror and a later fetched flag disagree, the fetched flag
 * wins — it overwrites the object the surface reads.
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatUIEventHandler } from "../events/CometChatUIEventHandler/CometChatUIEventHandler";
import { MessageEvents } from "../events/messages";

/** ≥400 ms per §7.6, so a double-tap can't fire two writes. */
const DEBOUNCE_MS = 400;

/**
 * A11: there is no plan gate, no feature flag and no capability flag in
 * init/app-settings, so the client cannot feature-detect. This boolean is not a
 * temporary scaffold — it is the only control that will ever exist.
 *
 * Default OFF: the integrator opts in. Gate off means NEITHER surface renders,
 * whatever the two per-component visibility flags say.
 */
export class ThreadSubscriptionConfig {
  /**
   * ON by default, to match the React UI Kit.
   *
   * React has no equivalent switch at all: it ships `hideThreadSubscriptionOption` (default
   * false) on the message list and a matching toggle prop on the thread header, so the feature
   * is visible unless an integrator opts OUT. RN carried an extra global gate defaulting to
   * false on top of those same two props, which meant the identical integration code showed the
   * control on web and nothing on mobile — and the only way to find out was to read the source.
   *
   * The per-instance props remain the real control surface and are ANDed with this, so anyone
   * already calling setEnabled(false) keeps that behaviour.
   */
  private static enabled: boolean = true;

  public static setEnabled(enabled: boolean): void {
    ThreadSubscriptionConfig.enabled = !!enabled;
  }

  public static isEnabled(): boolean {
    return ThreadSubscriptionConfig.enabled;
  }
}

/**
 * One in-flight write per parentMessageId, and the last tap time for the debounce.
 *
 * This is NOT subscription state — it is request bookkeeping, and it is deliberately the
 * only module-level map left in this file.
 */
const inFlight: { [messageId: string]: boolean } = {};
const lastToggleAt: { [messageId: string]: number } = {};

/**
 * The id of the thread a message belongs to — a reply carries its parent's id, a root
 * message IS the thread.
 *
 * Used for exactly two things: the id sent to the server, and matching a
 * `ccThreadSubscriptionChanged` event so one follow flips every bubble in the thread. It is
 * NEVER used to decide which object to read state from — every message carries its own flag
 * and each surface reads its own (§5.7).
 */
export function getThreadIdFor(message: CometChat.BaseMessage): number {
  const parentId = Number(message?.getParentMessageId?.() ?? 0);
  return parentId > 0 ? parentId : Number(message?.getId?.() ?? 0);
}

/**
 * Does the user follow this message's thread?
 *
 * Reads the message and nothing else. The server stamps `threadSubscribed` on EVERY fetched
 * message in a thread — parent and replies alike — so a fetched reply answers correctly off
 * its own object, exactly like its parent does.
 */
export function isThreadSubscribed(message: CometChat.BaseMessage): boolean {
  try {
    return message?.isThreadSubscribed?.() === true;
  } catch {
    // A message model older than the accessor renders un-followed rather than throwing;
    // this runs during render, where a throw is a blank screen.
    return false;
  }
}

/**
 * Write the flag onto a message object the caller is holding. Local only — this is the
 * SDK's `setThreadSubscribed`, which never touches the network.
 *
 * Every surface calls this from its `ccThreadSubscriptionChanged` handler, so the objects it
 * holds stay coherent with what it just rendered.
 */
export function stampThreadSubscribed(
  message: CometChat.BaseMessage | null | undefined,
  subscribed: boolean
): void {
  try {
    (message as any)?.setThreadSubscribed?.(subscribed === true);
  } catch {
    // Older model, or a plain object from a path that skipped the parser. Nothing to sync.
  }
}

/** Emitted on the optimistic flip, on the server's answer, and on a revert. */
function emitChanged(parentMessageId: number, subscribed: boolean, inProgress: boolean): void {
  CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccThreadSubscriptionChanged, {
    parentMessageId: Number(parentMessageId),
    subscribed,
    inProgress,
  });
}

/**
 * Stamp the message the caller is holding and tell every other surface, in one place so the
 * two cannot drift. Mirrors only ever raise to `true` (§ the one rule): a socket frame's
 * silence is not a negative answer, so nothing here may clear a known `true`.
 */
function mirrorSubscribed(parentMessageId: number, message?: CometChat.BaseMessage): void {
  if (!parentMessageId) return;
  stampThreadSubscribed(message, true);
  emitChanged(parentMessageId, true, false);
}

/**
 * Flips the subscription for a thread. Case 1 — the only path that writes to the server.
 *
 * Resolves with the state that ended up applying — the caller does not need to revert
 * anything itself, but SHOULD show the `thread_subscription_failed` snackbar when this
 * rejects. There is no queue and no retry (§7.6): a Follow tapped offline fails visibly
 * and reverts. Both server calls are idempotent, so a duplicate never errors.
 *
 * @returns {Promise<boolean>} true if the user is now following the thread
 */
export function toggleThreadSubscription(message: CometChat.BaseMessage): Promise<boolean> {
  const threadId = getThreadIdFor(message);
  const key = String(threadId);
  const now = Date.now();

  // Debounce and in-flight guard. Both resolve with the CURRENT state rather than
  // rejecting: the tap was ignored, nothing failed.
  if (inFlight[key] || (lastToggleAt[key] && now - lastToggleAt[key] < DEBOUNCE_MS)) {
    return Promise.resolve(isThreadSubscribed(message));
  }
  lastToggleAt[key] = now;
  inFlight[key] = true;

  const wasSubscribed = isThreadSubscribed(message);
  const optimistic = !wasSubscribed;

  // Flip the UI first, and stamp the object we were handed with it — there is no cache
  // behind this, so the message IS what the surfaces read.
  stampThreadSubscribed(message, optimistic);
  emitChanged(threadId, optimistic, true);

  const write = optimistic
    ? CometChat.subscribeToThread(threadId)
    : CometChat.unsubscribeFromThread(threadId);

  return write.then(
    () => {
      inFlight[key] = false;
      // The resolved call IS the acknowledgement; no event follows it.
      emitChanged(threadId, optimistic, false);
      return optimistic;
    },
    (error: any) => {
      inFlight[key] = false;
      stampThreadSubscribed(message, wasSubscribed);
      emitChanged(threadId, wasSubscribed, false);
      throw error;
    }
  );
}

/**
 * Cases 2 and 4 — you sent a message, so the server subscribed you to its thread.
 *
 * ONE rule covers both now: **any message you send subscribes you to the thread it belongs
 * to** — the parent's, if it is a reply; its own, if it is a root message that may grow one.
 * That is exactly the server's behaviour since the author-subscribed-by-default change
 * (verified on staging 2026-08-19: a fetched message with zero replies reads `true` for its
 * sender, in groups and 1-1 alike, and `false` for everybody else).
 *
 * ⚠️ THIS IS PERMANENT, not a workaround. The API populates `threadSubscribed` on FETCHED
 * messages only — confirmed with the backend team (Siva, 2026-08-19) and measured the same
 * day: neither the plain nor the threaded send response carries it, and neither does a
 * realtime frame. That is the agreed division of responsibility, so covering the send and
 * socket paths is the UI Kit's job and always will be.
 *
 * Do not delete this on the reasoning that "the server subscribes the author now". It does —
 * but it only SAYS so on a fetch, and the sender's own screen is holding a send response.
 *
 * Your own sends never arrive on a listener, so this is the only place the kit learns of them.
 */
export function applySentMessage(sent: CometChat.BaseMessage): void {
  try {
    const threadId = getThreadIdFor(sent);
    if (threadId > 0) mirrorSubscribed(threadId, sent);
  } catch {
    // A malformed send response must not take the send path down.
  }
}

/**
 * Cases 2b and 4b — a message YOU sent, arriving from ANOTHER of your devices.
 *
 * Sending subscribes you to the thread, wherever you sent it from. But the copy that reaches
 * your other devices comes over the socket, and a socket frame carries no `threadSubscribed`
 * — so without this the message you just wrote on your phone shows "Subscribe to thread" on
 * your tablet until something refetches it.
 *
 * Applies to ROOT messages as much as replies: authoring subscribes you to the thread the
 * message may later grow, so the root case is not a no-op (that was the gap — the incoming
 * path only ever looked at replies, and a root message has no parentMessageId to notice).
 *
 * Deliberately the same call as a local send: "I sent this" is one rule, and where the bytes
 * came from does not change it.
 *
 * @returns true when it handled the message, so the caller can skip the incoming-reply rules
 */
export function applyOwnIncomingMessage(
  message: CometChat.BaseMessage,
  loggedInUid: string | null
): boolean {
  try {
    if (!loggedInUid) return false;
    if (message?.getSender?.()?.getUid?.() !== loggedInUid) return false;
    applySentMessage(message);
    return true;
  } catch {
    return false;
  }
}

/**
 * Case 5 — a message was EDITED to mention you, so the server subscribed you to its thread.
 *
 * Covers all three shapes the edit can take, because it only ever asks the one question the
 * server asks — does the message, as it now stands, mention me:
 *
 *   5a  you edit your own message to mention yourself
 *   5b  somebody else edits theirs to mention you
 *   5c  an edit that PRESERVES an existing mention while changing other text — the mention
 *       still stands afterwards, so the subscription still applies. Nothing here compares
 *       against the previous version, which is exactly why this case falls out for free.
 *
 * Subscribes to the thread the edited message BELONGS to — its parent's if it is a reply, its
 * own if it is a root — via the same getThreadIdFor() every other path uses.
 *
 * ⚠️ Call this from the EDIT listeners, never from the shared list-replace helper: deletes and
 * reaction updates travel through that same helper, and neither should subscribe anybody.
 */
export function applyEditedMessage(
  edited: CometChat.BaseMessage,
  loggedInUid: string | null
): void {
  try {
    if (!loggedInUid) return;
    if ((edited as any)?.getDeletedAt?.()) return;
    const mentioned = edited?.getMentionedUsers?.() ?? [];
    if (!Array.isArray(mentioned)) return;
    if (!mentioned.some((user: any) => user?.getUid?.() === loggedInUid)) return;
    const threadId = getThreadIdFor(edited);
    if (threadId > 0) mirrorSubscribed(threadId, edited);
  } catch {
    // Mirroring is a nicety; the next fetch corrects it regardless.
  }
}

/**
 * Case 3, plus the socket-`false` correction — an incoming reply from somebody else.
 *
 * ONE server behaviour is mirrored: **you were @mentioned** in the reply, so the server
 * subscribed you.
 *
 * The old "you wrote the parent and this is the FIRST reply" rule is GONE. It existed only
 * because the author was not subscribed until someone replied; since the
 * author-subscribed-by-default change (staging, 2026-08-19) authoring subscribes you
 * outright, applySentMessage stamps that locally at send time, and any refetch confirms it.
 * Re-deriving it from a reply would now be strictly worse — it could resurrect a
 * subscription the author had deliberately cancelled in between.
 *
 * Every OTHER reply changes nothing about the subscription — but it still arrives with
 * `threadSubscribed: false` because it came off the socket, and rendering that verbatim
 * would offer "Subscribe" inside a thread the user already follows. So it inherits the
 * parent's current state. This is why the parent must be held as a whole message and not
 * just an id: an id cannot answer "is this thread followed right now".
 *
 * Nothing here ever writes `false`. A socket frame carries no flag and its silence is not a
 * negative answer.
 *
 * @param reply the incoming reply, from the message listener
 * @param parentMessage the reply's parent, as the consumer has it rendered — pass null if it
 *        is not on screen, in which case only the mention rule can fire
 * @param loggedInUid the logged-in user's uid
 */
export function applyIncomingReply(
  reply: CometChat.BaseMessage,
  parentMessage: CometChat.BaseMessage | null,
  loggedInUid: string | null
): void {
  try {
    const parentId = Number(reply?.getParentMessageId?.() ?? 0);
    if (!parentId) return;

    // Case 3 — mentioned. Stamp both, tell everyone, and MAKE IT STICK.
    const mentioned = reply?.getMentionedUsers?.() ?? [];
    if (
      loggedInUid &&
      Array.isArray(mentioned) &&
      mentioned.some((user: any) => user?.getUid?.() === loggedInUid)
    ) {
      // Read the state BEFORE the mirror below overwrites it — this is what decides whether
      // the server still needs telling.
      const wasSubscribed = parentMessage ? isThreadSubscribed(parentMessage) : false;

      stampThreadSubscribed(reply, true);
      mirrorSubscribed(parentId, parentMessage ?? undefined);

      // ENG-38880 — the stamp above is LOCAL. The server does not subscribe you when you are
      // mentioned, so it was the only thing holding the flip, and any refetch replaced it
      // with the server's `false`. The user hit that on the worst possible path: the mention
      // sends them a push, they open the app FROM it, the list loads from a fetch, and the
      // thread they were just pulled into reads "Subscribe to thread".
      //
      // So write it through instead of pretending. The rule — a mention subscribes you — is
      // the product's, stated in the kit's own copy ("Notifications are off until you reply
      // or are mentioned"); this makes the server agree with it.
      //
      // Skipped when the thread is already followed, so an active thread does not fire a
      // write per mention. The call is idempotent, so the fallback when the parent is not on
      // screen (and `wasSubscribed` is unknowable) is simply to send it.
      if (!wasSubscribed) {
        try {
          const write = CometChat.subscribeToThread(parentId);
          // Fire and forget: this is a correction, not the user's action. A failure leaves the
          // optimistic flip in place and the next fetch settles it — the pre-existing
          // behaviour, so failing here is never worse than not having tried.
          if (write && typeof (write as any).catch === "function") {
            (write as any).catch(() => {});
          }
        } catch {
          // An SDK build without the method must not take the message listener down.
        }
      }
      return;
    }

    if (!parentMessage) return;

    // Everything else: correct the socket `false` from the authority, without publishing —
    // nothing about the subscription changed, only this object's knowledge of it.
    stampThreadSubscribed(reply, isThreadSubscribed(parentMessage));
  } catch {
    // Mirroring is a nicety; the next fetch corrects it regardless.
  }
}

/**
 * Only for tests — the in-flight/debounce guards are process-wide by design (one user, one
 * session), which otherwise leaks state between test cases.
 * @internal
 */
export function resetThreadSubscriptionGuards(): void {
  Object.keys(inFlight).forEach((key) => delete inFlight[key]);
  Object.keys(lastToggleAt).forEach((key) => delete lastToggleAt[key]);
}
