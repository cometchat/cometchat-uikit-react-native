/**
 * Building the pinned panel's request — the twin of buildSavedMessagesRequest.
 *
 * Extracted from the component so the invariants below can be tested without mounting
 * a screen, and kept dependency-free so a test can stub CometChat narrowly.
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { cloneRequestBuilder } from "./cloneRequestBuilder";

/**
 * The ordinary messages request, filtered to pinned rows. Paging is the ordinary cursor
 * walk — setPinnedOnly() only changes the field the cursor rides on, from sentAt to
 * pinnedAt, because that is the order the server returns pins in.
 *
 * Single-use by design — build a new one to refresh.
 */
export const buildPinnedMessagesRequest = ({
  user,
  group,
  limit,
  messagesRequestBuilder,
}: {
  user?: CometChat.User;
  group?: CometChat.Group;
  limit?: number;
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
}) => {
  // A COPY of the integrator's builder, never their object. They may hand the same
  // instance to CometChatSavedMessages too, whose invariants contradict these —
  // mutating in place would make whichever panel built second corrupt the first.
  // See cloneRequestBuilder for why the copy is prototype-preserving.
  const builder = messagesRequestBuilder
    ? cloneRequestBuilder(messagesRequestBuilder)
    : new CometChat.MessagesRequestBuilder();

  // The full invariant, not just half of it. setPinnedOnly alone is not enough: a
  // builder carrying savedOnly=true makes the SDK reject the request with
  // PINNED_AND_SAVED_BOTH_SET before any network call, and this panel shows its error
  // state instead of the pinned list.
  builder.setPinnedOnly(true);
  builder.setSavedOnly(false);

  // ALWAYS set, on every path. The SDK has no default: a request that never called
  // setLimit() is rejected with SET_LIMIT_IS_COMPULSORY *before* any network call —
  // an error screen with an empty network log. So we cannot simply trust a passed-in
  // builder to have set one. Precedence: the `limit` prop, else whatever the builder
  // already carries, else 30 (the SDK's own DEFAULT_VALUES.MSGS_LIMIT).
  const builderLimit = (builder as unknown as { limit?: number }).limit;
  builder.setLimit(limit ?? builderLimit ?? 30);

  // Exactly one of these; the SDK rejects neither-set. Clear the OTHER first: setGUID and
  // setUID only write their own field, and createEndpoint() prefers guid when both are set,
  // so a caller's stale guid would make this 1-1 panel list that GROUP's pins. Only cleared
  // when we have a scope to put in its place, so a builder-only scope still stands.
  const scope = builder as unknown as { uid?: string; guid?: string };
  if (group) {
    scope.uid = undefined;
    builder.setGUID(group.getGuid());
  } else if (user) {
    scope.guid = undefined;
    builder.setUID(user.getUid());
  }

  return builder.build();
};
