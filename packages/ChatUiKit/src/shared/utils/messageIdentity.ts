/**
 * Null-safe identity checks for the message list's replace-in-place paths (plan D2).
 *
 * The list used to match `msg.getId() == edited.getId()` and `msg["muid"] == edited["muid"]`
 * directly, so a message with no id (an unsent row) matched the first other row with no id
 * (`undefined == undefined`), and a message with no muid matched any row without one. Two
 * missing identities are never the same message.
 */

function present(value: unknown): value is string | number {
  return value !== undefined && value !== null && value !== "" && value !== 0 && value !== "0";
}

function idOf(message: any): unknown {
  if (!message) return undefined;
  return typeof message.getId === "function" ? message.getId() : message.id;
}

function muidOf(message: any): unknown {
  if (!message) return undefined;
  return message["muid"] ?? (typeof message.getMuid === "function" ? message.getMuid() : undefined);
}

/** Same server id, and both actually have one. Loose compare: ids arrive as numbers or strings. */
export function sameMessageById(a: any, b: any): boolean {
  const left = idOf(a);
  const right = idOf(b);
  // eslint-disable-next-line eqeqeq
  return present(left) && present(right) && left == right;
}

/** Same muid, and both actually have one. */
export function sameMessageByMuid(a: any, b: any): boolean {
  const left = muidOf(a);
  const right = muidOf(b);
  // eslint-disable-next-line eqeqeq
  return present(left) && present(right) && left == right;
}
