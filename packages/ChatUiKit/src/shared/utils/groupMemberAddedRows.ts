import { CommonUtils } from './CommonUtils';
import { getUnixTimestamp, uniqueMuid } from './CometChatMessageHelper';

/**
 * The "added X" rows to show for one ccGroupMemberAdded event: one copy per member, each with its own
 * muid (members added in the same second shared a timestamp muid and were merged into one row).
 * Accepts both shapes that reach the list: { message } from apps that emit once per member, and
 * { messages } (one action per member) from CometChatUIKitHelper.onGroupMemberAdded.
 */
export function groupMemberAddedRows(
  event: { message?: object; messages?: object[]; usersAdded?: any[] },
  loggedInUserName: string | undefined
): any[] {
  const users = event.usersAdded ?? [];
  const rows: any[] = [];
  users.forEach((user, i) => {
    const base = event.messages?.[i] ?? event.message ?? event.messages?.[0];
    if (!base) return;
    const row: any = CommonUtils.clone(base);
    row['message'] = `${loggedInUserName} added ${user.name}`;
    row['muid'] = uniqueMuid();
    row['sentAt'] = getUnixTimestamp();
    row['actionOn'] = user;
    row['action'] = 'added';
    rows.push(row);
  });
  return rows;
}
