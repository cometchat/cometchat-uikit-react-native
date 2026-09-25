import { CometChat } from "@cometchat/chat-sdk-react-native";

/**
 * A copy of an integrator's request builder, so a panel can assert its own invariants
 * without writing to the caller's object. See PinnedMessagesHelper for why that matters.
 *
 * Prototype-preserving, so the copy keeps its methods — `{ ...builder }` would not.
 *
 * Arrays are re-pointed, not shared. Every SETTER replaces its array, so sharing looks
 * safe — but `build()` is not a setter and it mutates: SDK 4.1.0 runs
 * `this.categories.push(this.category)` and the same for types. A shallow copy therefore
 * grows the CALLER's array once per build.
 *
 * Dependency-free on purpose: CommonUtils.clone drags the constants barrel (and its
 * CometChat.CALL_STATUS read) into a leaf helper and breaks every narrow SDK mock.
 */
export const cloneRequestBuilder = (
  builder: CometChat.MessagesRequestBuilder
): CometChat.MessagesRequestBuilder => {
  const copy = Object.assign(Object.create(Object.getPrototypeOf(builder)), builder);
  for (const [key, value] of Object.entries(copy)) {
    if (Array.isArray(value)) (copy as unknown as Record<string, unknown>)[key] = [...value];
  }
  return copy;
};
