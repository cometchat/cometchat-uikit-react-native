/**
 * Swept group actions (README §3.7 row `onMessageSyncCompleted`, UIT-SYNC-13).
 *
 * Action rows come on neither MessageListener channel during the SDK's catch-up sweep
 * (BEH-SYNC-25), and the SDK fires no `GroupListener` callback for them. So a member kicked,
 * banned, left or whose scope changed while the device was offline would update the open chat's
 * rows but nothing else. The hub hands each swept group-member action to the screens, and each
 * screen runs the very `GroupListener` handlers it registered for the live event, called with the
 * SDK's own argument order (`WSConnectionHelper.publishActionMessage`).
 *
 * Only on the offline (ON) path: the sync listener never fires with offline off.
 *
 * @internal
 */

/** The `GroupListener` callbacks a screen registers (any subset). */
export interface GroupListenerHandlers {
  onGroupMemberJoined?: (message: any, joinedUser: any, joinedGroup: any) => void;
  onGroupMemberLeft?: (message: any, leavingUser: any, group: any) => void;
  onGroupMemberKicked?: (message: any, kickedUser: any, kickedBy: any, kickedFrom: any) => void;
  onGroupMemberBanned?: (message: any, bannedUser: any, bannedBy: any, bannedFrom: any) => void;
  onGroupMemberUnbanned?: (message: any, unbannedUser: any, unbannedBy: any, unbannedFrom: any) => void;
  onGroupMemberScopeChanged?: (message: any, changedUser: any, newScope: any, oldScope: any, changedGroup: any) => void;
  onMemberAddedToGroup?: (message: any, userAdded: any, userAddedBy: any, userAddedIn: any) => void;
}

function call(target: any, name: string): any {
  try {
    const fn = target?.[name];
    return typeof fn === "function" ? fn.call(target) : undefined;
  } catch {
    return undefined;
  }
}

/** A group-member action message (`category: action`, `type: groupMember`). */
export function isGroupMemberAction(message: any): boolean {
  const category = call(message, "getCategory") ?? message?.category;
  const type = call(message, "getType") ?? message?.type;
  return category === "action" && type === "groupMember";
}

/**
 * Run the screen's live `GroupListener` handler for one swept group-member action. Returns
 * whether a handler ran. A handler that throws is logged, never rethrown (one screen must not
 * stop the others).
 */
export function dispatchSweptGroupAction(message: any, handlers: GroupListenerHandlers | null | undefined): boolean {
  if (!handlers || !isGroupMemberAction(message)) return false;
  const action = call(message, "getAction") ?? message?.action;
  const on = call(message, "getActionOn");
  const by = call(message, "getActionBy");
  const group = call(message, "getActionFor");
  const run = (fn: Function | undefined, ...args: unknown[]): boolean => {
    if (typeof fn !== "function") return false;
    try {
      fn(...args);
    } catch (e) {
      console.warn("[CometChatUIKit] a group listener threw on a swept action", e);
    }
    return true;
  };
  switch (action) {
    case "joined":
      return run(handlers.onGroupMemberJoined, message, by, group);
    case "left":
      return run(handlers.onGroupMemberLeft, message, by, group);
    case "kicked":
      return run(handlers.onGroupMemberKicked, message, on, by, group);
    case "banned":
      return run(handlers.onGroupMemberBanned, message, on, by, group);
    case "unbanned":
      return run(handlers.onGroupMemberUnbanned, message, on, by, group);
    case "scopeChanged":
      return run(handlers.onGroupMemberScopeChanged, message, on, call(message, "getNewScope"), call(message, "getOldScope"), group);
    case "added":
      return run(handlers.onMemberAddedToGroup, message, on, by, group);
    default:
      return false;
  }
}
