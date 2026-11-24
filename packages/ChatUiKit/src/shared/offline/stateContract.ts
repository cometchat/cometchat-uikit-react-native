/**
 * The UI Kit state contract (TEST-PLAN §3.3): automation identifiers (`testID`) that test runners
 * read. They ship in release builds, are never read by screen readers (accessibility labels are
 * untouched) and never contain message text. Elements that already carried a `testID` keep it
 * (`message-list`, `CometChatComposer.send`, `ActionSheet.<optionId>`, `AttachmentTile-<n>`, …).
 *
 * | Element            | testID                                              |
 * |--------------------|-----------------------------------------------------|
 * | Message row        | `cc.message.<renderKey>.<sending|sent|delivered|read|failed>` |
 * | Notice             | `cc.notice.<noticeKind>` (Copy: `cc.notice.copy`)  |
 * | List footer        | `cc.list.footer.connect-to-load-more`               |
 * | Offline, no rows   | `cc.empty.connect-to-load` / `cc.empty.connect-to-search` |
 * | Composer input     | `cc-composer-input`                                  |
 * | Conversation row   | `cc.conversation.<with>.<sending|failed|sent|none>` |
 * | Unreachable media  | `cc.media.available-when-online`                    |
 *
 * @internal
 */
import { unsentRowInfo } from "./unsentActions";

export type ContractRowState = "sending" | "sent" | "delivered" | "read" | "failed";

function call(target: any, name: string): any {
  try {
    const fn = target?.[name];
    return typeof fn === "function" ? fn.call(target) : undefined;
  } catch {
    return undefined;
  }
}

/** The row state a runner reads: the offline state when unsent, else the receipt it shows. */
export function contractRowState(message: any): ContractRowState {
  const info = unsentRowInfo(message);
  if (info) return info.state === "failed" ? "failed" : "sending";
  const metadataError = call(message, "getMetadata")?.error || call(message, "getData")?.metaData?.error || message?.error;
  if (metadataError) return "failed";
  if (call(message, "getReadAt")) return "read";
  if (call(message, "getDeliveredAt")) return "delivered";
  const id = Number(call(message, "getId") ?? message?.id);
  if ((Number.isFinite(id) && id > 0) || call(message, "getSentAt")) return "sent";
  return "sending";
}

export function messageRowTestID(renderKey: string, message: any): string {
  return `cc.message.${renderKey}.${contractRowState(message)}`;
}

/**
 * The row's id, for a dev build whose runner asked for it (`globalThis.__ccContractRows`); nothing at
 * all otherwise, so a published row is the view tree it always was. A testID in a message row (on a
 * wrapper or on the row's root) crashes Fabric on Android once a chat overflows the screen:
 * `addViewAt: failed to insert view ... index=26 count=22`. It takes the testID,
 * maintainVisibleContentPosition and the text bubble's hidden measuring Text together; the native
 * mechanism is not established. `__DEV__` folds this out of release bundles (`probe:check`).
 */
export function messageRowContractProps(renderKey: string, message: any): { testID?: string; collapsable?: boolean } {
  if (!__DEV__ || (globalThis as any).__ccContractRows !== true) return {};
  // collapsable={false}: Fabric would flatten a style-less View away, and the id with it.
  return { testID: messageRowTestID(renderKey, message), collapsable: false };
}

/** `cc.conversation.<with>.<previewState>` for a conversation row. */
export function conversationRowTestID(conversation: any): string {
  const type = call(conversation, "getConversationType");
  const entity = call(conversation, "getConversationWith");
  const withId = (type === "group" ? call(entity, "getGuid") : call(entity, "getUid")) ?? "";
  const last = call(conversation, "getLastMessage");
  let preview = "none";
  if (last) {
    const info = unsentRowInfo(last);
    preview = info ? (info.state === "failed" ? "failed" : "sending") : "sent";
  }
  return `cc.conversation.${withId}.${preview}`;
}

export const CONTRACT_IDS = Object.freeze({
  composerInput: "cc-composer-input",
  footerConnectToLoadMore: "cc.list.footer.connect-to-load-more",
  emptyConnectToLoad: "cc.empty.connect-to-load",
  emptyConnectToSearch: "cc.empty.connect-to-search",
  noticeCopy: "cc.notice.copy",
  mediaOutOfReach: "cc.media.available-when-online",
  notice: (kind: string) => `cc.notice.${kind}`,
});
