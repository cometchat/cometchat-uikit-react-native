let __listenerIdCounter = 0;
import { CometChat } from "@cometchat/chat-sdk-react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import React, {
  forwardRef,
  JSX,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  StyleSheet,
  StyleProp,
} from "react-native";
import {
  PanGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import { CometChatMessageEvents } from "../shared/events/CometChatMessageEvents";
import { CometChatConversationEvents } from "../shared/events/conversations";
import {
  CometChatMentionsFormatter,
  CometChatSoundManager,
  CometChatTextFormatter,
  CometChatUiKitConstants,
  CometChatUrlsFormatter,
  SuggestionItem,
} from "../shared";
import {
  MessageBubbleAlignmentType,
  MessageListAlignmentType,
} from "../shared/base/Types";
import {
  CallTypeConstants,
  CometChatCustomMessageTypes,
  GroupsConstants,
  MessageCategoryConstants,
  MessageOptionConstants,
  MessageReceipt,
  MessageStatusConstants,
  MessageTypeConstants,
  ReceiverTypeConstants,
  ViewAlignment,
} from "../shared/constants/UIKitConstants";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { MessageEvents } from "../shared/events/messages";
import { ChatConfigurator } from "../shared/framework/ChatConfigurator";
import { deepClone, deepMerge } from "../shared/helper/helperFunctions";
import { Icon } from "../shared/icons/Icon";
import { CometChatMessageTemplate } from "../shared/modals/CometChatMessageTemplate";
import { getUnixTimestamp, messageStatus } from "../shared/utils/CometChatMessageHelper";
import { CommonUtils } from "../shared/utils/CommonUtils";
import { CometChatBatchMediaContext, BatchMediaResult } from "../shared/utils/batchMediaContext";
import { CometChatUIKit } from "../shared/CometChatUiKit/CometChatUIKit";
import { CometChatNewMessageIndicator, CometChatReceipt, NewMessageIndicatorStyle } from "../shared/views";
import { CometChatAvatar } from "../shared/views/CometChatAvatar";
import { CometChatBadge } from "../shared/views/CometChatBadge";
import { CometChatDate } from "../shared/views/CometChatDate";
import { CometChatMessageBubble } from "../shared/views/CometChatMessageBubble";
import { getModerationStatus, ModerationBottomView, MimeErrorBottomView } from "../shared/utils/MessageUtils";
import { stripMarkdown } from "../shared/utils/MarkdownUtils";
import { CometChatReactions } from "../shared/views/CometChatReactions";
import { useTheme, useThemeInternal } from "../theme";
import { MessageSkeleton } from "./Skeleton";
import { ErrorEmptyView } from "../shared/views/ErrorEmptyView/ErrorEmptyView";
import { BubbleStyles, CometChatTheme } from "../theme/type";
import { ExtensionConstants } from "../extensions";
//@ts-ignore
import { getExtensionData } from "../shared/helper/functions";
import { DeepPartial } from "../shared/helper/types";
import {
  handleWebsocketMessage,
  setAIAssistantTools,
  setStreamSpeed,
  setQueueCompletionCallback,
  onConnected as streamOnConnected,
  onDisconnected as streamOnDisconnected,
  checkAndTriggerQueueCompletion,
  storeAIAssistantMessage,
} from "../shared/services/stream-message.service";
import { CometChatAIAssistantTools } from "../shared/modals/CometChatAIAssistantTools";
import { StreamMessage } from "../shared/modals";
import { internalMessageDataSource } from "../shared/framework/MessageDataSource";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";
import { MessageModals } from "./components/MessageModals";
import { ReactionModals } from "./components/ReactionModals";
import { MessageOptionsSheet } from "./components/MessageOptionsSheet";
import { MessageListItem } from "./components/MessageListItem";
import CometChatConversationStarter from "../shared/views/CometChatConversationStarter/CometChatConversationStarter";
import CometChatSmartReplies from "../shared/views/CometChatSmartReplies/CometChatSmartReplies";

let _defaultRequestBuilder: CometChat.MessagesRequestBuilder;
const AVERAGE_ITEM_LENGTH = 120;
const SMALL_LIST_THRESHOLD = 30;

/**
 * Module-level flag to skip auto-loading the last agent conversation.
 * Set to true by `skipNextAgentAutoLoad()` (called by "New Chat" button).
 * Consumed and cleared on the next message list mount.
 */
let _skipAgentAutoLoad = false;

/**
 * Call this before remounting the message list to prevent it from
 * auto-loading the last agent conversation. Used by the "New Chat" button
 * to ensure a fresh empty state on remount.
 */
export function skipNextAgentAutoLoad(): void {
  _skipAgentAutoLoad = true;
}
/**
 * Helper function to safely get message ID
 * Prevents "undefined is not a function" errors in release builds
 */
const safeGetId = (item: any): string | number | undefined => {
  return typeof item?.getId === 'function' ? item.getId() : item?.id;
};

/**
 * Helper function to safely get message MUID
 * Prevents "undefined is not a function" errors in release builds
 */
const safeGetMuid = (item: any): string | undefined => {
  return typeof item?.getMuid === 'function' ? item.getMuid() : item?.muid;
};



/**
 * Fetches a conversation if it exists, returning null for new users
 * who haven't exchanged any messages yet (ERR_CONVERSATION_NOT_ACCESSIBLE).
 */
async function getConversationIfExists(
  convId: string,
  conversationType: string
): Promise<CometChat.Conversation | null> {
  try {
    return await CometChat.getConversation(convId, conversationType);
  } catch (e: any) {
    if (e?.code === "ERR_CONVERSATION_NOT_ACCESSIBLE") {
      return null;
    }
    throw e;
  }
}

/**
 * Batch state updates using requestAnimationFrame
 * It delays the callback until the next animation frame, 
 * so all state updates inside the callback happen together, 
 * just before the UI paints.
 */

function batchStateUpdates(callback: () => void): void {
  requestAnimationFrame(() => {
    callback();
  });
}


/**
 * Uses Inverted Flat List
 * Array needs to be reversed meaning the latest message will be at array[0]
 * New message will be appended to the beginning of the array
 * ScrollToBottom -> scrollToOffset({offset: 0}) (top of the list is visual bottom, remember that latest message is at array[0])
 * layoutHeight is the viewport or visible portion of the list
 * Intially when the list is loaded, offset 0 is the bottom most item of the visible area
 */

/**
 * Properties for rendering the CometChat message list component.
 */
export interface CometChatMessageListProps {
  /**
   * ID of the parent message when rendering threaded messages.
   */
  parentMessageId?: string;
  /**
   * The user object associated with the message list.
   */
  user?: CometChat.User;
  /**
   * The group object associated with the message list.
   */
  group?: CometChat.Group;
  /**
   * A component to display when there are no messages.
   */
  EmptyView?: () => JSX.Element;
  /**
   * A component to display when an error occurs.
   */
  ErrorView?: () => JSX.Element;
  /**
   * Flag to hide the error view.
   */
  hideError?: boolean;
  /**
   * A component to display while messages are loading.
   */
  LoadingView?: () => JSX.Element;
  /**
   * Flag to hide read receipts.
   */
  receiptsVisibility?: boolean;
  /**
   * Flag to disable sound for incoming messages.
   */
  disableSoundForMessages?: boolean;
  /**
   * Custom sound URL for messages.
   */
  customSoundForMessages?: string;
  /**
   * Hides moderation status UI (bottom view) and suppresses moderation toasts.
   */
  hideModerationStatus?: boolean;
  /**
   * Alignment type for the message list.
   */
  alignment?: MessageListAlignmentType;
  /**
   * Flag to show or hide the user's avatar.
   */
  avatarVisibility?: boolean;
  /**
   * Function that returns a custom string representation for a message's date.
   *
   * @param message - The base message object.
   * @returns A string representing the custom date.
   */
  datePattern?: (message: CometChat.BaseMessage) => string;
  /**
   * Function that returns a custom date separator string based on a timestamp.
   *
   * @param date - The timestamp (in milliseconds).
   * @returns A string representing the date separator.
   */
  dateSeparatorPattern?: (date: number) => string;
  /**
   * An array of message templates for rendering custom message types.
   */
  templates?: Array<CometChatMessageTemplate>;
  /**
   * An array of message templates for rendering custom message types.
   */
  addTemplates?: Array<CometChatMessageTemplate>;
  /**
   * Builder for constructing a request to fetch messages.
   */
  messageRequestBuilder?: CometChat.MessagesRequestBuilder;
  /**
   * If true, the message list will scroll to the bottom when new messages arrive.
   */
  scrollToBottomOnNewMessages?: boolean;
  /**
   * If true, the "Mark as Unread" option will be shown in the message options.
   * @defaultValue false
   */
  showMarkAsUnreadOption?: boolean;
  /**
   * If true, the message list will start from the first unread message.
   * @defaultValue false
   */
  startFromUnreadMessages?: boolean;
  /**
   * Custom component to render the "New Messages" indicator.
   */
  NewMessageIndicatorView?: React.ComponentType<any>;
  /**
   * Custom styles for the "New Messages" indicator.
   */
  newMessageIndicatorStyle?: NewMessageIndicatorStyle;
  /**
   * Text to display in the "New Messages" indicator.
   */
  newMessageIndicatorText?: string;
  /**
   * Callback invoked when the thread replies view is pressed.
   *
   * @param messageObject - The message object triggering the event.
   * @param messageBubbleView - A function that returns the message bubble view component.
   */
  onThreadRepliesPress?: (
    messageObject: CometChat.BaseMessage,
    messageBubbleView: () => JSX.Element | null
  ) => void;
  /**
   * Custom header view component.
   *
   * @param props - The props object containing user, group, and identifiers.
   * @returns A JSX element representing the header.
   */
  HeaderView?: ({
    user,
    group,
    id,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    id?: { uid?: string; guid?: string; parentMessageId?: string };
  }) => JSX.Element;
  /**
   * Custom footer view component.
   *
   * @param props - The props object containing user, group, and identifiers.
   * @returns A JSX element representing the footer.
   */
  FooterView?: ({
    user,
    group,
    id,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    id?: { uid?: string; guid?: string; parentMessageId?: string };
  }) => JSX.Element;
  /**
   * Callback to handle errors.
   *
   * @param e - The error object from CometChat.
   */
  onError?: (e: CometChat.CometChatException) => void;
  /**
   * Callback invoked on back navigation.
   */
  onBack?: () => void;
  /**
   * Collection of text formatter classes to apply custom formatting.
   *
   * @type {Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>}
   */
  textFormatters?: Array<
    CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter
  >;
  /**
   * Callback invoked when a reaction is pressed.
   *
   * @param reaction - The reaction count object.
   * @param messageObject - The message object.
   */
  onReactionPress?: (
    reaction: CometChat.ReactionCount,
    messageObject: CometChat.BaseMessage
  ) => void;
  /**
   * Callback invoked when a reaction is long pressed.
   *
   * @param reaction - The reaction count object.
   * @param messageObject - The message object.
   */
  onReactionLongPress?: (
    reaction: CometChat.ReactionCount,
    messageObject: CometChat.BaseMessage
  ) => void;
  /**
   * Callback invoked when an item in the reaction list is pressed.
   *
   * @param messageReaction - The message reaction object.
   * @param messageObject - The message object.
   */
  onReactionListItemPress?: (
    messageReaction: CometChat.Reaction,
    messageObject: CometChat.BaseMessage
  ) => void;
  /**
   * Custom styles for the message list component.
   */
  style?: DeepPartial<CometChatTheme["messageListStyles"]>;
  /**
   * Builder for constructing a request to fetch reactions.
   */
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  /**
   * Callback invoked when the add reaction button is pressed.
   */
  onAddReactionPress?: () => void;
  /**
   * List of quick reactions.
   *
   * @type {[string, string?, string?, string?, string?]}
   */
  quickReactionList?: [string, string?, string?, string?, string?];
  /**
   * Callback to handle errors.
   *
   * @param messageList - Array of CometChat.BaseMessage
   */
  onLoad?: (messageList: CometChat.BaseMessage[]) => void;
  /**
   * Callback to handle errors.
   *
   * @param messageList - Array of CometChat.BaseMessage
   */
  onEmpty?: () => void;
  /**
   * Flag to hide the reply option
   */
  hideReplyOption?: boolean;
  /**
   * DD §9 — message-list attachment rendering. `true` (default): new per-type bubbles that render
   * 1..N attachments (including a single one). `false`: the deprecated single-attachment bubbles
   * (set this only to keep legacy single-bubble styling for messages that carry one attachment).
   */
  enableMultipleAttachments?: boolean;
  /**
   * Flag to hide the reply in thread option
   */
  hideReplyInThreadOption?: boolean;
  /**
   * Flag to hide the share message option
   */
  hideShareMessageOption?: boolean;
  /**
   * Flag to hide the edit message option
   */
  hideEditMessageOption?: boolean;
  /**
   * Flag to hide the translate message option
   */
  hideTranslateMessageOption?: boolean;
  /**
   * Flag to hide the delete message option
   */
  hideDeleteMessageOption?: boolean;
  /**
   * Flag to hide the react to message option
   */
  hideReactionOption?: boolean;
  /**
   * Flag to hide the message privately option
   */
  hideMessagePrivatelyOption?: boolean;
  /**
   * Flag to hide the copy message option
   */
  hideCopyMessageOption?: boolean;
  /**
   * Flag to hide the message info option
   */
  hideMessageInfoOption?: boolean;
  /**
   * Flag to hide the "Flag Message" option from the actions menu
   */
  hideFlagMessageOption?: boolean;
  /**
   * Flag to hide the remark text area in the flag dialog
   */
  hideFlagRemarkField?: boolean;
  /**
   * Flag to hide group action messages
   */
  hideGroupActionMessages?: boolean;
  /**
   * Flag to hide the timestamp on message bubbles
   */
  hideTimestamp?: boolean;
  /**
   * Array of suggested messages for AI agent empty view (only applies to @agentic users)
   */
  suggestedMessages?: Array<string>;
  /**
   * Flag to hide suggested messages in AI agent empty view (only applies to @agentic users)
   */
  hideSuggestedMessages?: boolean;
  /**
   * Custom AI agent greeting view (only applies to @agentic users)
   */
  emptyChatGreetingView?: React.ReactNode;
  /**
   * Custom AI agent intro message view (only applies to @agentic users)
   */
  emptyChatIntroMessageView?: React.ReactNode;
  /**
   * Custom AI agent image/avatar view (only applies to @agentic users)
   */
  emptyChatImageView?: React.ReactNode;
  /**
   * Callback when suggested message is clicked (only applies to @agentic users)
   */
  onSuggestedMessageClick?: (suggestion: string) => void;
  /**
   * When true, shows AI-generated conversation starters when the message list is empty.
   */
  showConversationStarters?: boolean;
  /**
   * When true, shows AI-generated smart reply chips above the composer after a new message arrives.
   */
  showSmartReplies?: boolean;
  /**
   * Custom AI assistant tools with action functions (only applies to @agentic users)
   */
  aiAssistantTools?: CometChatAIAssistantTools;
  /**
   * Controls the speed of AI message streaming (only applies to @agentic users)
   */
  streamingSpeed?: number;
  /**
   * Message ID to navigate to and highlight in the message list.
   * When provided, the message list will fetch messages around this ID and scroll to it.
   */
  goToMessageId?: string;
  /**
   * Search keyword to highlight in message text.
   * When provided, matching text in messages will be highlighted.
   */
  searchKeyword?: string;
  /**
   * @internal
   * Flag to indicate if the user navigated from search results.
   * When true, this modifies the message list behavior for better search navigation UX:
   * - The target message from search is highlighted with a temporary animation
   * - The "New Messages" indicator is suppressed to avoid visual clutter
   * - When startFromUnreadMessages is enabled, prevents automatic marking of messages as read
   *   to preserve unread status for user reference
   * This ensures users can easily find their searched message without UI distractions
   * and maintain their unread message state for later review.
   */
  navigatedFromSearch?: boolean;
  /**
   * If true, the message list will automatically load the most recent agent conversation
   * on mount (only applies to @agentic users). When false or omitted, a new agent chat
   * is started each time (current default behavior).
   * @defaultValue false
   */
  loadLastAgentConversation?: boolean;
}

/**
 * Interface defining the actions for managing a CometChat message list.
 */
export interface CometChatMessageListActionsInterface {
  /**
   * Adds a new message to the message list.
   *
   * @param messageObject - The message object to be added.
   */
  addMessage: (messageObject: object) => void;

  /**
   * Updates an existing message in the message list.
   *
   * @param messageObject - The base message object containing updated data.
   * @param withMuid - A flag indicating whether to update the message with a MUID.
   */
  updateMessage: (messageObject: CometChat.BaseMessage, withMuid: boolean) => void;

  /**
   * Removes a message from the message list.
   *
   * @param messageObject - The base message object to be removed.
   */
  removeMessage: (messageObject: CometChat.BaseMessage) => void;

  /**
   * Permanently deletes a message from the message list.
   *
   * @param messageObject - The base message object to be deleted.
   */
  deleteMessage: (messageObject: CometChat.BaseMessage) => void;

  /**
   * Scrolls the message list to the bottom.
   */
  scrollToBottom: () => void;

  /**
   * Creates an action message.
   *
   * @remarks
   * TODO: Clarify the purpose and the appropriate usage of this method.
   */
  createActionMessage: () => void;

  /**
   * Updates the receipt information of a message.
   *
   * @param message - The base message object whose receipt is to be updated.
   */
  updateMessageReceipt: (message: CometChat.BaseMessage) => void;
}

// ---------------------------------------------------------------------------
// §8.3a — Batch grouping helpers. After the §7 fan-out, one user "send" becomes
// N single-kind messages sharing metadata.batchId. Consecutive messages from the
// same sender that share a batchId render as ONE visual group: a single avatar on
// the group's first (top/oldest) member and a single receipt+timestamp on the last
// (bottom/newest) member. Pure functions (no closures) — safe to reuse anywhere.
// ---------------------------------------------------------------------------
function getMessageBatchId(m: any): string | number | null {
  try {
    const md = m?.getMetadata?.();
    const id = md?.batchId;
    return id === undefined || id === null || id === "" ? null : id;
  } catch {
    return null;
  }
}

/** True when both messages belong to the SAME batch (same non-empty batchId) AND the same sender. */
function isSameBatchGroup(a: any, b: any): boolean {
  if (!a || !b) return false;
  const ba = getMessageBatchId(a);
  const bb = getMessageBatchId(b);
  if (ba == null || bb == null || ba !== bb) return false;
  const ua = a.getSender?.()?.getUid?.();
  const ub = b.getSender?.()?.getUid?.();
  return !!ua && ua === ub;
}

function getMessageBatchIndex(m: any): number {
  try {
    const bi = m?.getMetadata?.()?.batchIndex;
    return typeof bi === "number" ? bi : 0;
  } catch {
    return 0;
  }
}

/**
 * §8.3a — enforce the sender's order within a batch on the RECEIVE side. Each kind fans out
 * into an INDEPENDENT async upload, so a small file can arrive (and be stored by the server)
 * before a large image — which would show Files above Images. We reorder each CONTIGUOUS run
 * of same-batch messages by `batchIndex` from metadata. The list is inverted (index 0 = newest
 * / bottom) and a higher batchIndex was sent later, so a run is ordered DESCENDING by batchIndex
 * (last-sent at the bottom). Non-batch messages and the overall message order are untouched.
 * Returns the SAME array reference when nothing needed reordering (keeps the memo stable).
 */
function orderBatchRuns(messages: any[]): any[] {
  if (!Array.isArray(messages) || messages.length < 2) return messages;
  const result = messages.slice();
  let changed = false;
  let i = 0;
  while (i < result.length) {
    if (getMessageBatchId(result[i]) == null) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < result.length && isSameBatchGroup(result[j + 1], result[i])) j++;
    if (j > i) {
      const run = result.slice(i, j + 1);
      const sorted = run.slice().sort((a, b) => getMessageBatchIndex(b) - getMessageBatchIndex(a));
      let runChanged = false;
      for (let k = 0; k < run.length; k++) {
        if (run[k] !== sorted[k]) { runChanged = true; break; }
      }
      if (runChanged) {
        result.splice(i, run.length, ...sorted);
        changed = true;
      }
    }
    i = j + 1;
  }
  return changed ? result : messages;
}

export const CometChatMessageList = memo(
  forwardRef<CometChatMessageListActionsInterface, CometChatMessageListProps>(
    (props: CometChatMessageListProps, ref) => {
      const {
        parentMessageId,
        user,
        group,
        EmptyView,
        ErrorView,
        hideError,
        LoadingView,
        receiptsVisibility = true,
        disableSoundForMessages,
        customSoundForMessages,
        hideModerationStatus = false,
        alignment = "standard",
        avatarVisibility = true,
        datePattern,
        dateSeparatorPattern,
        templates = [],
        messageRequestBuilder,
        scrollToBottomOnNewMessages = false,
        onThreadRepliesPress,
        HeaderView,
        FooterView,
        onError,
        onBack,
        reactionsRequestBuilder,
        textFormatters,
        onReactionPress: onReactionPressFromProp,
        onReactionLongPress: onReactionLongPressFromProp,
        onReactionListItemPress: onReactionListItemPressProp,
        style,
        onAddReactionPress,
        quickReactionList,
        addTemplates = [],
        onLoad,
        onEmpty,
        enableMultipleAttachments = true,
        hideReplyOption: propHideReplyOption = false,
        hideReplyInThreadOption: propHideReplyInThreadOption = false,
        hideShareMessageOption: propHideShareMessageOption = false,
        hideEditMessageOption: propHideEditMessageOption = false,
        hideTranslateMessageOption: propHideTranslateMessageOption = false,
        hideDeleteMessageOption: propHideDeleteMessageOption = false,
        hideReactionOption: propHideReactionOption = false,
        hideMessagePrivatelyOption: propHideMessagePrivatelyOption = false,
        hideCopyMessageOption: propHideCopyMessageOption = false,
        hideMessageInfoOption: propHideMessageInfoOption = false,
        hideGroupActionMessages: propHideGroupActionMessages = false,
        hideTimestamp = false,
        suggestedMessages = [],
        hideSuggestedMessages = false,
        emptyChatGreetingView,
        emptyChatIntroMessageView,
        emptyChatImageView,
        onSuggestedMessageClick,
        showConversationStarters = false,
        showSmartReplies = false,
        aiAssistantTools,
        streamingSpeed = 30,
        goToMessageId,
        searchKeyword,
        navigatedFromSearch = false,
        hideFlagRemarkField,
        hideFlagMessageOption: propHideFlagMessageOption = false,
        showMarkAsUnreadOption = false,//change it to false default is false
        startFromUnreadMessages = false,//change it to false default is false
        NewMessageIndicatorView,
        newMessageIndicatorStyle,
        newMessageIndicatorText,
        loadLastAgentConversation = false,
      } = props;

      // Helper to check if user is agentic - memoized as boolean for performance
      const isAgenticUser = useMemo(() => {
        return user?.getRole?.() === "@agentic";
      }, [user]);

      // hiding props for @agentic users
      const hideReplyOption = isAgenticUser ? true : propHideReplyOption;
      const hideReplyInThreadOption = isAgenticUser ? true : propHideReplyInThreadOption;
      const hideShareMessageOption = isAgenticUser ? true : propHideShareMessageOption;
      const hideEditMessageOption = isAgenticUser ? true : propHideEditMessageOption;
      const hideTranslateMessageOption = isAgenticUser ? true : propHideTranslateMessageOption;
      const hideDeleteMessageOption = isAgenticUser ? true : propHideDeleteMessageOption;
      const hideReactionOption = isAgenticUser ? true : propHideReactionOption;
      const hideMessagePrivatelyOption = isAgenticUser ? true : propHideMessagePrivatelyOption;
      const hideCopyMessageOption = isAgenticUser ? true : propHideCopyMessageOption;
      const hideMessageInfoOption = isAgenticUser ? true : (propHideMessageInfoOption || !receiptsVisibility);
      const hideGroupActionMessages = isAgenticUser ? true : propHideGroupActionMessages;
      const hideFlagMessageOption = isAgenticUser ? true : propHideFlagMessageOption;
      const hideMarkAsUnreadOption = (isAgenticUser || !!parentMessageId) ? true : !showMarkAsUnreadOption;//hide for threads and agentic users

      const callListenerId = "call_" + Date.now() + "_" + (++__listenerIdCounter);
      const effectiveHideModeration = hideModerationStatus;
      const groupListenerId = "group_" + Date.now() + "_" + (++__listenerIdCounter);
      const uiEventListener = "uiEvent_" + Date.now() + "_" + (++__listenerIdCounter);
      const callEventListener = "callEvent_" + Date.now() + "_" + (++__listenerIdCounter);
      const uiEventListenerShow = "uiEvent_show_" + Date.now() + "_" + (++__listenerIdCounter);
      const uiEventListenerHide = "uiEvent_hide_" + Date.now() + "_" + (++__listenerIdCounter);
      const connectionListenerId = "connectionListener_" + Date.now() + "_" + (++__listenerIdCounter);
      const messageEventListener = "messageEvent_" + Date.now() + "_" + (++__listenerIdCounter);
      const groupEventListener = "groupEvent_" + Date.now() + "_" + (++__listenerIdCounter);
      const streamListenerId = "agent_" + Date.now() + "_" + (++__listenerIdCounter);
      const deleteItem = useRef<CometChat.BaseMessage>(undefined);
      const shouldSuppressHighlightRef = useRef(false);

      useLayoutEffect(() => {
        // For agent chats (non-thread), don't set up message request builder
        if (isAgenticUser && !parentMessageId) {
          msgRequestBuilder.current = null as any;
          return;
        }

        if (user) {
          _defaultRequestBuilder = new CometChat.MessagesRequestBuilder()
            .setLimit(30)
            .setTags([])
            .setUID(user.getUid());
        } else if (group) {
          _defaultRequestBuilder = new CometChat.MessagesRequestBuilder()
            .setLimit(30)
            .setTags([])
            .setGUID(group.getGuid());
        }


        _defaultRequestBuilder.setTypes(ChatConfigurator.dataSource.getAllMessageTypes());
        _defaultRequestBuilder.setCategories(ChatConfigurator.dataSource.getAllMessageCategories());


        //updating users request builder
        let _updatedCustomRequestBuilder = _defaultRequestBuilder;
        if (messageRequestBuilder) {
          _updatedCustomRequestBuilder = messageRequestBuilder;
          if (user)
            _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setUID(user.getUid());
          if (group)
            _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setGUID(group.getGuid());
        } else {
          _updatedCustomRequestBuilder.hideReplies(true);
          if (user)
            _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setUID(user.getUid());
          if (group)
            _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setGUID(group.getGuid());
          if (parentMessageId) {
            _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setParentMessageId(
              parseInt(parentMessageId)
            );
            if (isAgenticUser) {
              _updatedCustomRequestBuilder.hideReplies(false);
              _updatedCustomRequestBuilder.withParent(true);
            }
          }
          let types: any[] = [],
            categories: any[] = [];
          if (templates.length) {
            types = templates.map((template) => template.type);
            categories = templates.map((template) => template.category);
          } else {
            types = ChatConfigurator.dataSource.getAllMessageTypes();
            categories = ChatConfigurator.dataSource.getAllMessageCategories();
            if (addTemplates.length) {
              types.push(...addTemplates.map((template) => template.type));
              categories.push(...addTemplates.map((template) => template.category));
            }
          }

          if (hideGroupActionMessages) {
            types = types.filter((type) => type !== MessageTypeConstants.groupMember);
          }
          _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setTypes(types);
          _updatedCustomRequestBuilder = _updatedCustomRequestBuilder.setCategories(categories);
        }

        msgRequestBuilder.current = _updatedCustomRequestBuilder;
      }, [hideGroupActionMessages, isAgenticUser, parentMessageId]);

      const theme = useTheme();
      const themeInternal = useThemeInternal();
      const themeMode = themeInternal.mode; // 'light' or 'dark' - used for FlatList extraData
      const { t } = useCometChatTranslation();

      const mergedTheme: CometChatTheme = useMemo(() => {
        const themeClone = deepClone(theme);
        themeClone.messageListStyles = deepMerge(theme.messageListStyles, style ?? {});
        return themeClone;
      }, [theme, style]);

      const overridenBubbleStyles = useMemo(() => {
        const styleCache = new Map();
        const outgoingBubbleStyles = mergedTheme.messageListStyles.outgoingMessageBubbleStyles;
        const incomingBubbleStyles = mergedTheme.messageListStyles.incomingMessageBubbleStyles;

        styleCache.set(MessageTypeConstants.text, {
          incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.textBubbleStyles ?? {}),
          outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.textBubbleStyles ?? {}),
        });

        styleCache.set(MessageTypeConstants.image, {
          incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.imageBubbleStyles ?? {}),
          outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.imageBubbleStyles ?? {}),
        });

        const fileIncoming = deepMerge(incomingBubbleStyles, incomingBubbleStyles.fileBubbleStyles ?? {});
        if (fileIncoming.containerStyle) fileIncoming.containerStyle.height = undefined;
        const fileOutgoing = deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.fileBubbleStyles ?? {});
        if (fileOutgoing.containerStyle) fileOutgoing.containerStyle.height = undefined;

        styleCache.set(MessageTypeConstants.file, {
          incoming: fileIncoming,
          outgoing: fileOutgoing,
        });

        const audioIncoming = deepMerge(incomingBubbleStyles, incomingBubbleStyles.audioBubbleStyles ?? {});
        if (audioIncoming.containerStyle) audioIncoming.containerStyle.height = undefined;
        const audioOutgoing = deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.audioBubbleStyles ?? {});
        if (audioOutgoing.containerStyle) audioOutgoing.containerStyle.height = undefined;

        styleCache.set(MessageTypeConstants.audio, {
          incoming: audioIncoming,
          outgoing: audioOutgoing,
        });

        styleCache.set(MessageTypeConstants.messageDeleted, {
          incoming: deepMerge(
            incomingBubbleStyles,
            mergedTheme.deletedBubbleStyles ?? {},
            incomingBubbleStyles.deletedBubbleStyles ?? {}
          ),
          outgoing: deepMerge(
            outgoingBubbleStyles,
            mergedTheme.deletedBubbleStyles ?? {},
            outgoingBubbleStyles.deletedBubbleStyles ?? {}
          ),
        });

        styleCache.set(MessageTypeConstants.sticker, {
          incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.stickerBubbleStyles ?? {}),
          outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.stickerBubbleStyles ?? {}),
        });

        styleCache.set(MessageTypeConstants.document, {
          incoming: deepMerge(
            incomingBubbleStyles,
            incomingBubbleStyles.collaborativeBubbleStyles ?? {}
          ),
          outgoing: deepMerge(
            outgoingBubbleStyles,
            outgoingBubbleStyles.collaborativeBubbleStyles ?? {}
          ),
        });

        styleCache.set(CometChatCustomMessageTypes.meeting, {
          incoming: deepMerge(
            incomingBubbleStyles,
            incomingBubbleStyles.meetCallBubbleStyles ?? {}
          ),
          outgoing: deepMerge(
            outgoingBubbleStyles,
            outgoingBubbleStyles.meetCallBubbleStyles ?? {}
          ),
        });

        styleCache.set(MessageTypeConstants.whiteboard, {
          incoming: deepMerge(
            incomingBubbleStyles,
            incomingBubbleStyles.collaborativeBubbleStyles ?? {}
          ),
          outgoing: deepMerge(
            outgoingBubbleStyles,
            outgoingBubbleStyles.collaborativeBubbleStyles ?? {}
          ),
        });

        styleCache.set(MessageTypeConstants.video, {
          incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.videoBubbleStyles ?? {}),
          outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.videoBubbleStyles ?? {}),
        });

        styleCache.set(MessageTypeConstants.poll, {
          incoming: deepMerge(incomingBubbleStyles, incomingBubbleStyles.pollBubbleStyles ?? {}),
          outgoing: deepMerge(outgoingBubbleStyles, outgoingBubbleStyles.pollBubbleStyles ?? {}),
        });

        styleCache.set(GroupsConstants.ACTION_TYPE_GROUPMEMBER, {
          incoming: mergedTheme.messageListStyles.groupActionBubbleStyles,
          outgoing: mergedTheme.messageListStyles.groupActionBubbleStyles,
        });

        styleCache.set(ExtensionConstants.linkPreview, {
          incoming: deepMerge(
            incomingBubbleStyles,
            incomingBubbleStyles.linkPreviewBubbleStyles ?? {}
          ),
          outgoing: deepMerge(
            outgoingBubbleStyles,
            outgoingBubbleStyles.linkPreviewBubbleStyles ?? {}
          ),
        });

        styleCache.set(MessageTypeConstants.assistant, {
          incoming: deepMerge(
            incomingBubbleStyles,
            incomingBubbleStyles.assistantBubbleStyles ?? {}
          ),
        });

        styleCache.set(CometChatUiKitConstants.streamMessageTypes.run_started, {
          incoming: deepMerge(
            incomingBubbleStyles,
            incomingBubbleStyles.assistantBubbleStyles ?? {}
          ),
        });

        styleCache.set(CometChatUiKitConstants.streamMessageTypes.run_finished, {
          incoming: deepMerge(
            incomingBubbleStyles,
            incomingBubbleStyles.assistantBubbleStyles ?? {}
          ),
        });

        styleCache.set(CometChatUiKitConstants.streamMessageTypes.text_message_content, {
          incoming: deepMerge(
            incomingBubbleStyles,
            incomingBubbleStyles.assistantBubbleStyles ?? {}
          ),
        });

        return styleCache;
      }, [mergedTheme]);

      // refs
      const currentScrollPosition = useRef({
        y: null,
        scrollViewHeight: 0,
        layoutHeight: 0,
        contentHeight: 0,
      });
      const messagesLength = useRef(0); // Tracks total message count to detect additions/updates
      const prevMessagesLength = useRef(0); // Tracks previous message count to handle scroll position adjustments when loading history
      const messageListRef = useRef<FlatList | null>(null); // Reference to the FlatList for programmatic scrolling
      const loggedInUser = useRef<CometChat.User | null>(null); // Stores current user to check sender identity (me vs others)
      const messageRequest = useRef<CometChat.MessagesRequest | null>(null); // Manages pagination state for fetching messages
      const messagesContentListRef = useRef<any[]>([]); // "Main Stage": Source of Truth for visible messages. Kept in sync with state to handle real-time updates without closure staleness.
      const temporaryMessageListRef = useRef<any[]>([]); // "Waiting Room": Buffer for new messages arriving while scrolled up. Prevents UI jumps/insertions while reading history.

      const msgRequestBuilder = useRef<CometChat.MessagesRequestBuilder>(undefined);
      const lastMessageDate = useRef(Date.now());

      // states
      const [messagesList, setMessagesList] = useState<any[]>([]);      
      const [listState, setListState] = useState(
        isAgenticUser && !parentMessageId
          ? (loadLastAgentConversation && !_skipAgentAutoLoad ? "loading" : "loaded")
          : "loading"
      );
      const [loadingMessages, setLoadingMessages] = useState(false);
      /** this is required to prevent duplicate api calls. Cannot use state for this since this is being used in scrollHandler  **/
      const loadingMessagesRef = useRef(false);
      const loadingPrevMessagesRef = useRef(false);
      // State for showing loading when navigating to far messages
      const [navigationLoading, setNavigationLoading] = useState(false);
      // State for showing loading when scrolling to searched messages
      const [scrollLoading, setScrollLoading] = useState(false);
      // State for showing bottom loading indicator when fetching next messages
      const [bottomLoading, setBottomLoading] = useState(false);
      const [unreadCount, setUnreadCount] = useState<number>(0);
      const [showSmartRepliesView, setShowSmartRepliesView] = useState(false);
      const [smartRepliesKey, setSmartRepliesKey] = useState('');
      const latestReceivedMessageRef = useRef<CometChat.BaseMessage | null>(null);
      const [showMessageOptions, setShowMessageOptions] = useState<any[]>([]);
      const [ExtensionsComponent, setExtensionsComponent] = useState<JSX.Element | null>(null);
      const [CustomListHeader, setCustomListHeader] = useState<any>(null);
      // State to track new message indicator visibility
      const [newMessageIndicatorId, setNewMessageIndicatorId] = useState<string | null>(null);
      // State to track if user has manually marked messages as unread
      const [hasManuallyMarkedUnread, setHasManuallyMarkedUnread] = useState<boolean>(false);
      const [messageInfo, setMessageInfo] = useState(false);
      const [showReportDialog, setShowReportDialog] = useState(false);
      const [ongoingCallView, setOngoingCallView] = useState(null);
      const [selectedMessage, setSelectedMessage] = useState<any>(null);
      const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
      const [showReactionList, setShowReactionList] = useState(false);
      const [selectedEmoji, setSelectedEmoji] = useState<string | undefined>(undefined);
      const [hideScrollToBottomButton, setHideScrollToBottomButton] = useState<boolean>(true);
      const [showDeleteModal, setShowDeleteModal] = useState(false);

      const infoObject = useRef<CometChat.BaseMessage | null>(undefined);
      const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
      const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
      const highlightAnimatedValue = useRef(new Animated.Value(0)).current;
      const reportedMessageRef = useRef<CometChat.BaseMessage | null>(null);
      const pendingReportRef = useRef<boolean>(false);
      const bottomSheetRef = useRef<any>(null);
      const conversationId = useRef<string | null>(null);
      const streamSubscriptionRef = useRef<any>(null);
      const lastID = useRef(0);
      const reachedFirstMessage = useRef<boolean>(false);
      const agenticParentMessageIdRef = useRef<string | undefined>(undefined);
      const [hasTargetMessageId, setHasTargetMessageId] = useState(false);
      const fetchingAroundIdRef = useRef<string | null>(null); // Track which message ID we're currently fetching
      const [itemPositions, setItemPositions] = useState<Map<string, { y: number; height: number }>>(new Map());
      const markUnreadMessageAsRead = (message?: CometChat.BaseMessage) => {
        const messageToMark = message || messagesContentListRef.current[0];
        if (
          messageToMark &&
          messageToMark.getSender?.()?.getUid() !== loggedInUser.current?.getUid()
        ) {
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, {
            message: messageToMark,
          });
          CometChat.markAsRead(messageToMark).catch((error: any) => {
            console.log("Error marking unread message as read", error);
            onError && onError(error);
          });
          setUnreadCount(0);
        }
      };
      const prevMsgListLengthRef = useRef<number>(0);
      const aMessageWasSentByMeRef = useRef<boolean>(false);
      const latestMessageRef = useRef<any | null>(null);



      useEffect(() => {
        if (messagesList.length === prevMsgListLengthRef.current + 1 && aMessageWasSentByMeRef.current) {
          aMessageWasSentByMeRef.current = false;
          setTimeout(() => {
            messageListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        }
        prevMsgListLengthRef.current = messagesList.length;
      }, [messagesList]);


      const newMsgIndicatorPressed = useCallback(async () => {
        if (hasTargetMessageId) {
          try {
            messageRequest.current = msgRequestBuilder.current?.build() || null;
            messagesContentListRef.current = [];
            setMessagesList([]);
            setListState("loading");
            reachedFirstMessage.current = false;
            msgRequestBuilder.current?.setMessageId(0);
            messageRequest.current = msgRequestBuilder.current?.build() || null;
            await getPreviousMessages();
            setTimeout(() => {
              scrollToBottom();
              setHideScrollToBottomButton(true);
            }, 100);
          } catch (error) {
            setListState("");
          }
        } else {
          // Merge temporary messages when unread count button is pressed
          messagesContentListRef.current = [
            ...temporaryMessageListRef.current,
            ...messagesContentListRef.current,
          ];
          temporaryMessageListRef.current = [];

          // Update latestMessageRef after merge
          if (messagesContentListRef.current.length > 0) {
            latestMessageRef.current = messagesContentListRef.current[0];
          }

          onLoad && onLoad([...messagesContentListRef.current].reverse());
          setMessagesList([...messagesContentListRef.current]);

          setTimeout(() => {
            scrollToBottom();
            setHideScrollToBottomButton(true);
            markUnreadMessageAsRead();
          }, 100);
        }
      }, [onLoad, hasTargetMessageId]);

      const getPreviousMessages = async () => {
        if (fetchingAroundIdRef.current) return;

        if (loadingPrevMessagesRef.current) {
          return;
        }
        loadingPrevMessagesRef.current = true;
        // For agent chats with no conversation loaded, don't fetch previous messages
        if (isAgenticUser && !parentMessageId && !agenticParentMessageIdRef.current) {
          return;
        }

        // Prevent concurrent API calls
        if (loadingMessagesRef.current) {
          return;
        }

        if (reachedFirstMessage.current) {
          return;
        }
        if (messagesList.length == 0) setListState("loading");
        else {
          setLoadingMessages(true);
          loadingMessagesRef.current = true;
        }
        // Fixed: Previously passed undefined GUID to getGroup() which always failed.
        // Now we skip the scope fetch entirely when GUID is missing — the scope
        // will be populated when the group data arrives from a valid source.
        if (group != undefined && !group.getGuid()) {
          console.warn("[CometChatMessageList] Group has no GUID — skipping scope fetch.");
        } else if (group != undefined && group.getGuid() && !group.getScope()) {
          try {
            const fetchedGroup = await CometChat.getGroup(group.getGuid());
            if (fetchedGroup) {
              group.setScope(fetchedGroup.getScope?.() ?? "participant");
            }
          } catch (e: any) {
            console.warn("[CometChatMessageList] Failed to fetch group scope:", e);
            onError && onError(e);
          }
        }
        return messageRequest.current
          ?.fetchPrevious()
          .then((msgs: any[]) => {
            if ((messageRequest.current?.getLimit() ?? 0) > msgs.length) {
              reachedFirstMessage.current = true;
            }
            let previousMessagesFetched = [...msgs].reverse(); // Reverse for UI use

            // For agentic users with parentMessageId: the server returns the parent
            // message (via withParent) at the END of the array, out of chronological order.
            // Sort by ID to restore correct order (higher ID = newer message = first in inverted list).
            if (isAgenticUser && parentMessageId) {
              previousMessagesFetched.sort((a, b) => {
                const aId = Number(typeof a.getId === 'function' ? a.getId() : 0);
                const bId = Number(typeof b.getId === 'function' ? b.getId() : 0);
                return bId - aId;
              });
            }

            // Deduplicate within the batch for agentic users
            // (withParent can include parent as both the thread parent and a reply)
            if (isAgenticUser) {
              const seenIds = new Set<number>();
              previousMessagesFetched = previousMessagesFetched.filter((msg) => {
                const msgId = Number(typeof msg.getId === 'function' ? msg.getId() : (msg as any)?.id);
                if (!msgId || seenIds.has(msgId)) return false;
                seenIds.add(msgId);
                return true;
              });
            }

            if (messagesList.length === 0 && msgs?.length > 0) {
              CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccActiveChatChanged, {
                message: previousMessagesFetched[0],
                user: user,
                group: group,
                theme: mergedTheme,
                parentMessageId: parentMessageId,
              });
              if (conversationId.current == null)
                conversationId.current = previousMessagesFetched[0].getConversationId();
            } else if (messagesList.length === 0 && !props?.parentMessageId) {
              CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccActiveChatChanged, {
                message: previousMessagesFetched[0],
                user: user,
                group: group,
                theme: mergedTheme,
                parentMessageId: parentMessageId,
              });
            }

            // When startFromUnreadMessages is enabled, the chat starts from the first unread message
            // and shows a "New Messages" indicator above the oldest unread message.
            // This allows users to quickly see where unread messages begin.
            if (startFromUnreadMessages && previousMessagesFetched.length > 0) {
              const lastMessage = previousMessagesFetched[0];//latest message
              if (!goToMessageId && messagesList.length === 0) {
                // If we are not navigating to a specific message, we want to show the new message indicator
                // above the oldest unread message (which is the last one in the fetched list since it's reversed).
                const oldestMessage = previousMessagesFetched[previousMessagesFetched.length - 1];

                if (oldestMessage) {
                  const msgId = safeGetId(oldestMessage);
                  if (msgId !== undefined) {
                    setNewMessageIndicatorId(String(msgId));
                  }
                }
              }

              // Only mark conversation as read on initial load.
              // If we do this on every fetch (pagination), it would reset the unread count
              // even if the user manually marked a message as unread.
              if (messagesContentListRef.current.length === 0 && !navigatedFromSearch) {
                // Mark entire conversation as read — clears unread count on server
                if (user) {
                  CometChat.markConversationAsRead(user.getUid(), CometChat.RECEIVER_TYPE.USER).catch((e) => {
                    console.log("Error marking user conversation as read", e);
                  });
                } else if (group) {
                  CometChat.markConversationAsRead(group.getGuid(), CometChat.RECEIVER_TYPE.GROUP).catch((e) => {
                    console.log("Error marking group conversation as read", e);
                  });
                }
                setUnreadCount(0);
                setNewMessageIndicatorId(null);
                //emitting event to update read receipts in other components
                CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, {
                  message: lastMessage,
                });
              }

            } else {
              for (let index = 0; index < previousMessagesFetched.length; index++) {
                 const message=previousMessagesFetched[index];
                  CometChat.markAsRead(message).catch((error: any) => {
                    console.log("Error marking message as read", error);
                  })  
                if (
                  message &&
                  !message.hasOwnProperty("readAt") &&
                  loggedInUser.current?.getUid() != message?.getSender()?.getUid()
                ) {
                  CometChat.markAsRead(message);
                  if (index == 0)
                    CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, {
                      message,
                    });
                 }
                 else break;
              }
            }
            previousMessagesFetched = previousMessagesFetched.map(
              (item: CometChat.BaseMessage, index: any) => {
                if (item.getCategory() === MessageCategoryConstants.interactive) {
                  return item;
                } else {
                  return item;
                }
              }
            );
            if (previousMessagesFetched.length > 0) {
              // For agentic users, deduplicate across batches to prevent duplicate keys
              if (isAgenticUser && messagesContentListRef.current.length > 0) {
                const existingIds = new Set(
                  messagesContentListRef.current.map((msg) =>
                    Number(typeof msg.getId === 'function' ? msg.getId() : (msg as any)?.id)
                  )
                );
                previousMessagesFetched = previousMessagesFetched.filter((msg) => {
                  const msgId = Number(typeof msg.getId === 'function' ? msg.getId() : (msg as any)?.id);
                  return !msgId || !existingIds.has(msgId);
                });
              }
              if (previousMessagesFetched.length > 0) {
                messagesContentListRef.current = [
                  ...messagesContentListRef.current,
                  ...previousMessagesFetched,
                ];
              }
              setMessagesList(messagesContentListRef.current);
            }
            if (messagesContentListRef.current.length == 0) {
              onEmpty && onEmpty();
            } else {
              onLoad && onLoad([...messagesContentListRef.current].reverse());
              setLoadingMessages(false);
              loadingMessagesRef.current = false;
            }
            setListState("");
          })
          .catch((e: any) => {
            if (messagesContentListRef.current.length == 0) setListState("error");
            if (e?.code === "REQUEST_IN_PROGRESS") return;
            else {
              setLoadingMessages(false);
              loadingMessagesRef.current = false;
            }
            onError && onError(e);
          }).finally(() => {
            loadingPrevMessagesRef.current = false;
          });
      };

      const highlightMessage = (messageId: string) => {
        setHighlightedMessageId(messageId);
        highlightAnimatedValue.setValue(0);
        Animated.sequence([
          Animated.timing(highlightAnimatedValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.delay(2000), // Hold highlighted state for 2 seconds
          Animated.timing(highlightAnimatedValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setHighlightedMessageId(null);
        });
      };

      const getMessagesAroundId = async (messageId: string) => {
        if (fetchingAroundIdRef.current === messageId) {
          return;
        }

        if (isAgenticUser && !parentMessageId && !agenticParentMessageIdRef.current) {
          return;
        }

        fetchingAroundIdRef.current = messageId; // Mark this message as being fetched

        // Check if message exists in current list
        const messageExists = messagesContentListRef.current.find(msg =>
          String(msg.getId()) === String(messageId)
        );

        if (messageExists) {
          setHasTargetMessageId(true);
        } else {
          // Message is far, show navigation loading
          setNavigationLoading(true);
          setHasTargetMessageId(true);
        }

        try {
          const targetMessageId = Number(messageId);
          msgRequestBuilder.current?.setMessageId(targetMessageId);
          messageRequest.current = msgRequestBuilder.current?.build() || null;

          // Get the target message first to ensure it exists
          const targetMessage = await CometChat.getMessageDetails(targetMessageId);
          if (!targetMessage) {
            setListState("");
            return;
          }

          // Create request builder for next messages (messages after the target)  
          let nextMessagesRequest = new CometChat.MessagesRequestBuilder()
            .setLimit(15)
            .setMessageId(targetMessageId);

          if (user) {
            nextMessagesRequest = nextMessagesRequest.setUID(user.getUid());
          }

          if (group) {
            nextMessagesRequest = nextMessagesRequest.setGUID(group.getGuid());
          }

          // Main chat: Server excludes thread replies
          if (!parentMessageId) {
            nextMessagesRequest = nextMessagesRequest.hideReplies(true);
          }
          // Thread: Server includes only relevant messages
          else {
            nextMessagesRequest = nextMessagesRequest
              .setParentMessageId(Number(parentMessageId))
              .hideReplies(false);
            if (isAgenticUser) {
              nextMessagesRequest = nextMessagesRequest.withParent(true);
            }
          }

          // Fetch messages before and after the target message
          const nextMessages = await nextMessagesRequest.build().fetchNext();

          // Combine messages: previous (reversed) + target + next
          const allMessages = [
            // ...previousMessages,
            targetMessage,
            ...nextMessages
          ].reverse();

          // Remove duplicates and sort by timestamp (newest at top for FlatList)
          const uniqueMessages = allMessages
          // .filter((message, index, array) => 
          //   array.findIndex(m => m.getId() === message.getId()) === index
          // )
          // .sort((a, b) => b.getSentAt() - a.getSentAt());

          if (uniqueMessages.length > 0) {
            // Check if this is the initial load using ref to ensure fresh state
            const isInitialLoad = messagesContentListRef.current.length === 0;
            messagesContentListRef.current = uniqueMessages;
            setMessagesList(uniqueMessages);
            onLoad && onLoad([...uniqueMessages].reverse());

            //This check is used to determine if this is the Initial Load of the chat screen.
            // Check if this is the initial load (messagesList is empty).
            // We check messagesList.length === 0 because setMessagesList above is async,
            // so messagesList still reflects the state before this update.
            // We only want to mark as read on the first load, not during subsequent updates.
            // The !navigatedFromSearch condition ensures we don't mark as read when navigating from search results,
            // as the user might want to keep messages unread for reference.
            if (startFromUnreadMessages && isInitialLoad && !navigatedFromSearch && !goToMessageId) {
              shouldSuppressHighlightRef.current = true;
              // Mark entire conversation as read — clears unread count on server
              if (user) {
                CometChat.markConversationAsRead(user.getUid(), CometChat.RECEIVER_TYPE.USER).catch((e) => {
                  console.log("Error marking user conversation as read", e);
                });
              } else if (group) {
                CometChat.markConversationAsRead(group.getGuid(), CometChat.RECEIVER_TYPE.GROUP).catch((e) => {
                  console.log("Error marking group conversation as read", e);
                });
              }
              setUnreadCount(0);
              // If we have next messages (unread messages), set the indicator on the first one.
              // Otherwise, fallback to the target message (last read message).
              if (nextMessages.length > 0) {
                setNewMessageIndicatorId(String(nextMessages[0].getId()));
              } else {
                setNewMessageIndicatorId(messageId);
              }
              //emitting event to update read receipts in other components
              CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, {
                message: uniqueMessages[0],
              });
            } else if (navigatedFromSearch) {
              // If we navigated from search, we want to show the "New Messages" indicator
              // but NOT mark the conversation as read immediately.
              // We fetch the first unread message to place the indicator correctly.
              const fetchFirstUnread = async () => {
                try {
                  const convId = user?.getUid() ?? group?.getGuid();
                  const conversationType = user
                    ? CometChat.RECEIVER_TYPE.USER
                    : CometChat.RECEIVER_TYPE.GROUP;

                  if (!convId) return;

                  const conversation = await getConversationIfExists(convId, conversationType);
                  if (!conversation) return;
                  const unreadCount = conversation.getUnreadMessageCount();
                  setUnreadCount(unreadCount);

                  if (unreadCount > 0) {
                    const lastReadMsgId = conversation.getLastReadMessageId();

                    if (lastReadMsgId) {
                      let request = new CometChat.MessagesRequestBuilder()
                        .setLimit(1)
                        .setMessageId(Number(lastReadMsgId));

                      if (user) request = request.setUID(user.getUid());
                      if (group) request = request.setGUID(group.getGuid());

                      if (!parentMessageId) {
                        request = request.hideReplies(true);
                      } else {
                        request = request.setParentMessageId(Number(parentMessageId)).hideReplies(false);
                        if (isAgenticUser) {
                          request = request.withParent(true);
                        }
                      }

                      const unreadMessages = await request.build().fetchNext();
                      if (unreadMessages.length > 0) {
                        setNewMessageIndicatorId(String(unreadMessages[0].getId()));
                      }
                    }
                  }
                } catch (e) {
                  console.log("Error fetching first unread message", e);
                }
              };
              fetchFirstUnread();
            }

            // Reset layout state and set up for scrolling to target message
            // console.log(`Setting scroll target to message: ${messageId}`);
            setScrollTargetId(messageId);
          }

          setListState("");
        } catch (error) {
          console.log("Error fetching messages around ID:", error);
          setListState("error");
          setNavigationLoading(false);
          onError && onError(error as CometChat.CometChatException);
        } finally {
          // setNavigationLoading(false);
          fetchingAroundIdRef.current = null;
        }
      };

      // Scrolls to a specific message by ID, centering it in the view
      // Uses position data from itemPositions map for precise scrolling
      const scrollToMessage = (messageId: string, retryCount: number = 0) => {
        if (messageListRef.current && messagesContentListRef.current.length > 0) {
          // Show loading indicator during scroll operation
          setNavigationLoading(true);

          const targetIndex = messagesContentListRef.current.findIndex(
            (msg) => String(msg.getId()) === messageId
          );

          if (targetIndex !== -1) {
            // Get the actual position of the target message
            const targetMessage = messagesContentListRef.current[targetIndex];
            const position = itemPositions.get(String(targetMessage.getId()));

            if (position) {
              // Calculate centered offset for the message
              // For inverted list, we need to position it from the top of the visible area
              const screenHeight = currentScrollPosition.current.scrollViewHeight || Dimensions.get('window').height;

              // Center the message: place it at middle of the screen
              // In inverted list: offset = message.y - (screenHeight/2 - messageHeight/2)
              const centeredOffset = Math.max(0, position.y - (screenHeight / 2) + (position.height / 2));

              // console.log(`📍 Scrolling to position-based offset ${centeredOffset.toFixed(1)}px for message ${messageId}`);
              messageListRef.current?.scrollToOffset({
                offset: centeredOffset,
                animated: true,
              });

              // Highlight after scroll animation starts
              setTimeout(() => {
                // console.log(`Highlighting message ${messageId} after position-based scroll`);
                if (!shouldSuppressHighlightRef.current) {
                  highlightMessage(messageId);
                }
                shouldSuppressHighlightRef.current = false;
                setNavigationLoading(false); // Clear loading when scroll completes
              }, 150);
            } else {
              // Position not measured yet - retry with faster progressive delays (up to 5 times)
              if (retryCount < 5) {
                // Faster progressive delays: 100ms, 200ms, 300ms, 400ms, 500ms
                const delay = (retryCount + 1) * 100;
                // console.log(`Retrying scroll for message ${messageId} (attempt ${retryCount + 1}/5) after ${delay}ms - waiting for layout`);
                setTimeout(() => {
                  scrollToMessage(messageId, retryCount + 1);
                }, delay);
              } else {
                // Final fallback: use scrollToIndex with onScrollToIndexFailed handling for dynamic heights
                try {
                  messageListRef.current?.scrollToIndex({
                    index: targetIndex,
                    animated: true,
                    viewPosition: 0.5, // For inverted FlatList
                  });
                  // onScrollToIndexFailed will handle retry logic if this fails
                  setTimeout(() => {
                    if (!shouldSuppressHighlightRef.current) {
                      highlightMessage(messageId);
                    }
                    shouldSuppressHighlightRef.current = false;
                    setNavigationLoading(false); // Clear loading when scroll completes
                  }, 250);
                } catch (scrollError) {
                  console.error('scrollToIndex failed immediately:', scrollError);
                  if (!shouldSuppressHighlightRef.current) {
                    highlightMessage(messageId);
                  }
                  shouldSuppressHighlightRef.current = false;
                  setNavigationLoading(false); // Clear loading on final failure
                }
              }
            }
          } else {
            setNavigationLoading(false); // Clear loading since we're fetching
            getMessagesAroundId(messageId);
          }
        }
      };

      const getUpdatedPreviousMessages = () => {
        // For agent chats with no conversation loaded, don't fetch updated previous messages
        if (isAgenticUser && !parentMessageId && !agenticParentMessageIdRef.current) {
          return;
        }

        let messagesRequest = new CometChat.MessagesRequestBuilder().setLimit(50);
        if (user) messagesRequest = messagesRequest.setUID(user.getUid());
        if (group) messagesRequest = messagesRequest.setGUID(group.getGuid());

        messagesRequest.setTypes([MessageCategoryConstants.message]);
        messagesRequest.setCategories([MessageCategoryConstants.action]);
        messagesRequest.setMessageId(lastID.current);

        messagesRequest
          .build()
          .fetchNext()
          .then((updatedMessages: string | any[]) => {
            let tmpList = [...messagesContentListRef.current];
            for (let i = 0; i < updatedMessages.length; i++) {
              let condition = (msg: any) => msg.getId() == updatedMessages[i]?.actionOn.getId();
              let msgIndex = messagesContentListRef.current.findIndex(condition);
              if (msgIndex > -1) {
                tmpList[msgIndex] = updatedMessages[i]?.actionOn;
              }
            }
            // console.log("UPDATES LIST LENGTH", tmpList.length)
            // setMessagesList(tmpList);
            getNewMessages(tmpList);
          })
          .catch((e: any) => console.log("error while fetching updated msgs", e));
      };

      const getNewMessages = (updatedList: any[]) => {
        let newRequestBuilder = msgRequestBuilder.current;
        newRequestBuilder?.setMessageId(lastID.current);

        newRequestBuilder
          ?.build()
          .fetchNext()
          .then((newMessages: any[]) => {
            let cleanUpdatedList = [...updatedList];
            let finalOutput = CommonUtils.mergeArrays(newMessages.reverse(), cleanUpdatedList, [
              "id",
              "muid",
            ]);
            let tmpList = [...finalOutput];
            tmpList = tmpList.map((item: CometChat.BaseMessage, index) => {
              if (item.getCategory() === MessageCategoryConstants.interactive) {
                return item;
              } else {
                return item;
              }
            });
            if (isAtBottom() || isNearBottom()) {
              messagesContentListRef.current = tmpList;
              setMessagesList(tmpList);
              onLoad && onLoad([...messagesContentListRef.current].reverse());
              for (let i = 0; i < newMessages.length; i++) {
                if (newMessages[i].getSender()?.getUid() !== loggedInUser.current?.getUid()) {
                  bottomHandler(newMessages[i], true, true);
                  break;
                }
              }
            } else {
              /*****
               * If scroll is not at bottom or near bottom then add the messages to temporary list
               * lastID in onDisconnected will always be messagesList[0].getId() (state)
               * Example:
               * - unreadCount is already 2 (meaning not near bottom or at bottom)
               * - App is now in the background
               * - Someone sends 2 messages to the user
               * - User now puts the app in foreground and onConnected handler fetches the messages from lastID onwards
               * - unreadCount will now be 4
               * ****/
              const currentUnreadCount = tmpList.length - messagesContentListRef.current.length;
              temporaryMessageListRef.current = [];
              const currentUnreadMessages = tmpList.slice(0, currentUnreadCount);
              temporaryMessageListRef.current = [...currentUnreadMessages];
              setUnreadCount(temporaryMessageListRef.current.length);
            }
            if (newMessages.length === 30) {
              getNewMessages(tmpList);
            }
            newRequestBuilder?.setMessageId(undefined);
          })
          .catch((e: any) => console.log("error while fetching updated msgs", e));
      };

      const templatesMap = useMemo(() => {
        const isAgenticUserCheck = isAgenticUser;
        const options = {
          textFormatters: textFormatters || [],
          enableMultipleAttachments,
          hideReplyOption: isAgenticUserCheck || hideReplyOption,
          hideReplyInThreadOption: isAgenticUserCheck || hideReplyInThreadOption,
          hideShareMessageOption: isAgenticUserCheck || hideShareMessageOption,
          hideEditMessageOption: isAgenticUserCheck || hideEditMessageOption,
          hideTranslateMessageOption: isAgenticUserCheck || hideTranslateMessageOption,
          hideDeleteMessageOption: isAgenticUserCheck || hideDeleteMessageOption,
          hideReactionOption: isAgenticUserCheck || hideReactionOption,
          hideMessagePrivatelyOption: isAgenticUserCheck || hideMessagePrivatelyOption,
          hideCopyMessageOption: isAgenticUserCheck || hideCopyMessageOption,
          hideMessageInfoOption: isAgenticUserCheck || hideMessageInfoOption || !receiptsVisibility,
          hideFlagMessageOption: isAgenticUserCheck || hideFlagMessageOption,
          hideMarkAsUnreadOption: isAgenticUserCheck || hideMarkAsUnreadOption,
          hideGroupActionMessages,
          onReplyClick: (messageId: string) => {
            scrollToMessage(messageId);
          },
        };
        let _formatters = textFormatters || [];
        let tempTemplates: CometChatMessageTemplate[] =
          templates && templates.length
            ? templates
            : [
              ...ChatConfigurator.dataSource.getAllMessageTemplates(mergedTheme, options),
              ...addTemplates,
            ];
        //for internal use only
        const streamTemplate = internalMessageDataSource.getStreamMessageTemplate(
          mergedTheme,
          options
        );

        if (isAgenticUserCheck) {
          tempTemplates.push(streamTemplate);
        }

        let templatesMapTemp = new Map<string, CometChatMessageTemplate>();

        tempTemplates.forEach((template) => {
          if (hideGroupActionMessages && template.type === MessageTypeConstants.groupMember) return;
          if (templatesMapTemp.get(`${template.category}_${template.type}`)) return;
          templatesMapTemp.set(`${template.category}_${template.type}`, template);
        });

        return templatesMapTemp;
      }, [
        mergedTheme,
        templates,
        addTemplates,
        isAgenticUser,
        hideReplyInThreadOption,
        hideShareMessageOption,
        hideEditMessageOption,
        hideTranslateMessageOption,
        hideDeleteMessageOption,
        hideReactionOption,
        hideMessagePrivatelyOption,
        hideCopyMessageOption,
        hideMessageInfoOption,
        hideGroupActionMessages,
        receiptsVisibility,
      ]);

      const getPlainString = (underlyingText: string, messageObject: CometChat.BaseMessage) => {
        let _plainString = underlyingText;

        let regexes: Array<RegExp> = [];
        let users: any = {};

        let edits: Array<{
          endIndex: number;
          replacement: string;
          startIndex: number;
          user: SuggestionItem;
        }> = [];

        let allFormatters = [...(textFormatters || [])];
        let mentionsTextFormatter = ChatConfigurator.getDataSource().getMentionsFormatter(
          loggedInUser.current ?? undefined
        );
        allFormatters.push(mentionsTextFormatter);

        allFormatters.forEach((formatter, key) => {
          regexes.push(formatter.getRegexPattern());
          let suggestionUsers = formatter.getSuggestionItems();
          if (formatter instanceof CometChatMentionsFormatter) {
            let mentionUsers =
              (messageObject?.getMentionedUsers && messageObject?.getMentionedUsers()).map(
                (item: { getUid: () => any; getName: () => string }) =>
                  new SuggestionItem({
                    id: item.getUid(),
                    name: item.getName(),
                    promptText: "@" + item.getName(),
                    trackingCharacter: "@",
                    underlyingText: `<@uid:${item.getUid()}>`,
                    hideLeadingIcon: false,
                  })
              ) || [];
            suggestionUsers = [...suggestionUsers, ...mentionUsers];
          }
          suggestionUsers?.length > 0 &&
            suggestionUsers.forEach((item: any) => (users[item.underlyingText] = item));
        });

        regexes.forEach((regex) => {
          let match;
          while ((match = regex.exec(_plainString)) !== null) {
            const user = users[match[0]];
            if (user) {
              edits.push({
                startIndex: match.index,
                endIndex: regex.lastIndex,
                replacement: user.promptText,
                user,
              });
            }
          }
        });

        // Sort edits by startIndex to apply them in order
        edits.sort((a, b) => a.startIndex - b.startIndex);

        // Get an array of the entries in the map using the spread operator
        const entries = [...edits].reverse();

        // Iterate over the array in reverse order
        entries.forEach(({ endIndex, replacement, startIndex, user }) => {
          let pre = _plainString.substring(0, startIndex);
          let post = _plainString.substring(endIndex);

          _plainString = pre + replacement + post;
        });

        return _plainString;
      };

      const playNotificationSound = useCallback((message: any) => {
        if (disableSoundForMessages) return;

        if (message?.category === MessageCategoryConstants.message) {
          if (customSoundForMessages) {
            CometChatSoundManager.play(
              loggedInUser.current?.getUid() == message["sender"]["uid"]
                ? "outgoingMessage"
                : "incomingMessage",
              customSoundForMessages
            );
          } else {
            CometChatSoundManager.play(
              // "incomingMessage"
              loggedInUser.current?.getUid() == message["sender"]["uid"]
                ? "outgoingMessage"
                : "incomingMessage"
            );
          }
        }
      }, []);

      const markMessageAsRead = (message: any) => {
        if (
          !message?.readAt &&
          message?.getSender?.()?.getUid() !== loggedInUser.current?.getUid()
        ) {
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message });
          CometChat.markAsRead(message).catch((error: any) => {
            console.log("Error", error);
            onError && onError(error);
            // errorHandler(error);
          });
        }
      };
      /**
       * Marks a specific message as unread in the conversation.
       * This function calls the CometChat SDK to mark the message as unread,
       * updates the conversation's unread count, and emits events to notify
       * other components of the conversation update. It also sets the new
       * message indicator to appear above this message.
       * @param message - The message to mark as unread
       */
      const markMessageAsUnread = (message: CometChat.BaseMessage) => {
        CometChat.markMessageAsUnread(message).then(
          (response: any) => {
            setShowMessageOptions([]);
            setHasManuallyMarkedUnread(true);
            let convId: string = "";
            let conversationType: string = "";
            if (user) {
              convId = user?.getUid();
              conversationType = CometChat.RECEIVER_TYPE.USER;
            } else if (group) {
              convId = group?.getGuid();
              conversationType = CometChat.RECEIVER_TYPE.GROUP;
            }
            //getting convesation using conversationId=Uid and conversationType
            getConversationIfExists(convId, conversationType).then((conversation) => {
              if (!conversation) return;
              // Emitting conversation update event
              CometChatUIEventHandler.emitConversationEvent(
                CometChatConversationEvents.ccUpdateConversation,
                { conversation }
              );
              setUnreadCount(conversation.getUnreadMessageCount());
              setNewMessageIndicatorId(message.getId().toString());
            }).catch((error) => {
              console.log("Error fetching conversation after marking as unread", error);
            });
          },
          (error: any) => {
            console.log("Error marking as unread", error);
          }
        );
      };

      function checkMessageInSameConversation(message: CometChat.BaseMessage | any): boolean {
        return (
          (message?.getReceiverType() == ReceiverTypeConstants.user &&
            user &&
            user?.getUid() == message.getReceiver()?.["uid"]) ||
          (message?.getReceiverType() == ReceiverTypeConstants.group &&
            message.getReceiverId() &&
            group &&
            group?.getGuid() == message.getReceiverId()) ||
          false
        );
      }

      function messageToSameConversation(message: CometChat.BaseMessage): boolean {
        return (
          (message?.getReceiverType() == ReceiverTypeConstants.user &&
            user &&
            user?.getUid() == message.getReceiverId()) ||
          (message?.getReceiverType() == ReceiverTypeConstants.group &&
            message.getReceiverId() &&
            group &&
            group?.getGuid() == message.getReceiverId()) ||
          false
        );
      }
      useEffect(() => {
        if (isAgenticUser && parentMessageId && !conversationId.current) {
          conversationId.current = parentMessageId;
        }
      }, [parentMessageId, isAgenticUser]);

      // Handle scrolling to highlighted message when FlatList layout is complete
      useEffect(() => {
        let rafId: number | undefined;

        if (scrollTargetId && messagesList.length > 0) {
          rafId = requestAnimationFrame(() => {
            scrollToMessage(scrollTargetId);
            setScrollTargetId(null);
          });
        }

        return () => {
          if (rafId) cancelAnimationFrame(rafId);
        };
      }, [scrollTargetId, messagesList.length]);

      function checkSameConversation(message: CometChat.BaseMessage): boolean {
        if ((message as any).isStreamMessage) {
          if (isAgenticUser) {
            return (message as any).targetMessageId === agenticParentMessageIdRef.current;
          }
          return true;
        }

        if (isAgenticUser) {
          if (agenticParentMessageIdRef.current) {
            return (
              message.getParentMessageId &&
              String(message.getParentMessageId()) === String(agenticParentMessageIdRef.current)
            );
          }
          return false;
        }

        return (
          message.getConversationId() == conversationId.current ||
          (message.getSender()?.getUid() === user?.getUid() &&
            message.getReceiverType() == CometChatUiKitConstants.ReceiverTypeConstants.user) ||
          checkMessageInSameConversation(message) ||
          messageToSameConversation(message)
        );
      }

      function isNearBottom() {
        const { layoutHeight, scrollViewHeight, y }: any = currentScrollPosition.current;

        // In an inverted list, scrolling up moves the user towards the top of the scrollable area,
        // which is actually the "bottom" of the visible chat (since it's inverted).
        let scrollPos = y; // 'y' is how far the user has scrolled from the top of the full content.

        // Calculate how far the user is from the top of the scrollable content (which is visually
        // the "bottom" in an inverted list) as a percentage of the total height.
        if (!layoutHeight) {
          return true;
        }

        // If we have navigated from search and are viewing old messages, we are NOT near bottom
        if (navigatedFromSearch && hasTargetMessageId) {
          return false;
        }

        let scrollPosFromTopInPercentage = (scrollPos / layoutHeight) * 100;

        // If the user has scrolled to within 30% from the top (which is the "bottom" in this case),
        // we consider them to be near the bottom of the list (since it's inverted).
        if (scrollPosFromTopInPercentage <= 30) {
          return true;
        }
        return false;
      }

      const newMessage = (newMessage: any, isReceived = true) => {
        let baseMessage = newMessage as CometChat.BaseMessage;
        if (baseMessage.getCategory() === MessageCategoryConstants.interactive) {
          //todo show unsupported bubble
        }

        if (isAgenticUser) {
          // A 1:1 agent conversation only ever contains user-receiver messages. Reject
          // anything addressed to a group (e.g. a group agent reply that reached this
          // listener) — otherwise a top-level group message matches the parent-id check
          // below (String(undefined) === String(undefined)) and leaks into the 1:1 chat.
          //
          // In a 1:1 agent chat the `parentMessageId` prop is undefined, but messages
          // from the 2nd onward are stamped with the first message's id (the thread
          // root), tracked in agenticParentMessageIdRef. Accept those too, otherwise
          // every message after the first is filtered out until a remount refetch.
          const agenticParentId = agenticParentMessageIdRef.current;
          if (
            baseMessage.getReceiverType?.() === ReceiverTypeConstants.user &&
            (String(baseMessage.getParentMessageId()) === String(parentMessageId) ||
              String(baseMessage.getId()) === String(parentMessageId) ||
              (agenticParentId !== undefined &&
                (String(baseMessage.getParentMessageId()) === String(agenticParentId) ||
                  String(baseMessage.getId()) === String(agenticParentId))))
          ) {
            CometChat.markAsDelivered(newMessage);
            bottomHandler(newMessage, isReceived);
          } else {
            return;
          }
        } else {
          const inSameConversation =
            checkSameConversation(baseMessage) ||
            checkMessageInSameConversation(baseMessage) ||
            messageToSameConversation(baseMessage);
          if (inSameConversation) {
            if (user) {
              CometChat.markConversationAsDelivered(user.getUid(), CometChat.RECEIVER_TYPE.USER);
            } else if (group) {
              CometChat.markConversationAsDelivered(group.getGuid(), CometChat.RECEIVER_TYPE.GROUP);
            }
            if (!parentMessageId && newMessage.getParentMessageId()) {
              const parentId = String(
                newMessage.getParentMessageId
                  ? newMessage.getParentMessageId()
                  : newMessage.parentMessageId
              );
              let index = messagesContentListRef.current.findIndex(
                (msg) => String(msg.getId ? msg.getId() : msg.id) === parentId
              );
              if (index !== -1 && messagesContentListRef.current[index]) {
                let oldMsg: CometChat.BaseMessage = CommonUtils.clone(
                  messagesContentListRef.current[index]
                );
                oldMsg.setReplyCount(oldMsg.getReplyCount() ? oldMsg.getReplyCount() + 1 : 1);
                let tmpList = [...messagesContentListRef.current];
                tmpList[index] = oldMsg;
                messagesContentListRef.current = tmpList;
                onLoad && onLoad([...messagesContentListRef.current].reverse());
                setMessagesList(tmpList);
              }
              return;
            }

            bottomHandler(newMessage, isReceived);
          }
        }

        playNotificationSound(newMessage);
      };

      const isAtBottom = () => {
        //0 or null
        const atBottom = !currentScrollPosition.current.y || currentScrollPosition.current.y === 0;
        return atBottom;
      };

      const bottomHandler = (
        newMessage: CometChat.BaseMessage | any,
        isReceived = false,
        skipAddToList = false
      ) => {
        if (newMessage?.isStreamMessage) {
          if (!skipAddToList) {
            addToMessageList(newMessage);
          }
          scrollToBottom();
          return;
        }

        // Thread mismatch check — must run BEFORE the sender check to prevent
        // messages from appearing in the wrong context (main list vs thread)
        // when the same user is logged in on multiple devices.
        //
        // Exception: in a 1:1 agent chat the `parentMessageId` prop is undefined,
        // but messages from the 2nd onward carry the agent thread-root id (tracked
        // in agenticParentMessageIdRef). Those belong in this list, so don't treat
        // them as a thread mismatch — otherwise every message after the first is
        // dropped here until a remount refetch.
        const isAgenticThreadRootMessage =
          isAgenticUser &&
          !parentMessageId &&
          agenticParentMessageIdRef.current !== undefined &&
          String(newMessage.getParentMessageId()) ===
            String(agenticParentMessageIdRef.current);
        if (
          (!parentMessageId &&
            newMessage.getParentMessageId() &&
            !isAgenticThreadRootMessage) ||
          (parentMessageId && !newMessage.getParentMessageId()) ||
          (parentMessageId &&
            newMessage.getParentMessageId() &&
            parentMessageId != newMessage.getParentMessageId())
        ) {
          return;
        }

        if (
          (newMessage.getSender()?.getUid() || newMessage?.["sender"]?.["uid"]) ==
          loggedInUser.current?.["uid"]
        ) {
          if (!skipAddToList) {
            addToMessageList(newMessage);
          }
          scrollToBottom();
          return;
        }
        if (!isReceived) {
          return;
        }
        if (isAtBottom() || isNearBottom() || scrollToBottomOnNewMessages) {
          if (!skipAddToList) {
            addToMessageList(newMessage);
          }
          scrollToBottom();
          
          markMessageAsRead(newMessage);
          latestMessageRef.current = newMessage;
        } else {
          const lastMsg = messagesContentListRef.current[0];

          // Helper to process the message after checking conversation state
          const processMessage = (isSequenceCorrect: boolean) => {
            if (isSequenceCorrect && temporaryMessageListRef.current.length === 0) {
              if (!skipAddToList) addToMessageList(newMessage);
              latestMessageRef.current = newMessage;
            } else {
              temporaryMessageListRef.current = [newMessage, ...temporaryMessageListRef.current];
            }
            setUnreadCount((prev) => prev + 1);
          };

          let conversationWith = "";
          const conversationType = newMessage.getReceiverType();

          if (conversationType === CometChat.RECEIVER_TYPE.USER) {
            const senderUid = newMessage.getSender()?.getUid();
            conversationWith =
              senderUid === loggedInUser.current?.getUid()
                ? newMessage.getReceiverId()
                : senderUid;
          } else {
            conversationWith = newMessage.getReceiverId();
          }

          /**
           * Sequence Integrity Check for New Message Handling
           *
           * Purpose:
           * Ensures message sequence integrity when appending new messages to the chat list while the user is scrolled up.
           * Prevents silent gaps in the conversation history due to network latency or missed real-time events.
           *
           * Implementation:
           * Fetches the latest conversation state from the server to compare the local last message ID with the server's last message ID.
           * If they match, the sequence is intact and the message can be safely appended to the visible list.
           * If they differ, a gap exists, and the message is buffered in the temporary list to prompt the user to load missing messages.
           *
           * Performance Considerations:
           * This asynchronous operation is conditionally executed only when the user is not at the bottom of the chat,
           * minimizing unnecessary network calls during active scrolling or bottom-positioned interactions.
           * A fallback mechanism reverts to local state comparison if the network request fails, ensuring robustness.
           */
          getConversationIfExists(conversationWith, conversationType)
            .then((conversation) => {
              if (!conversation) {
                // No conversation yet (fresh user) — treat as sequence correct
                processMessage(true);
                return;
              }
              const convLastMsg = conversation?.getLastMessage();
              // Check if the last message in our list matches the conversation's last message
              // This ensures we don't have a gap
              // THE CORE LOGIC:
              // Does the ID of the last message in our list (lastMsg)
              // MATCH the ID of the last message the server knows about (convLastMsg)?
              const isSequenceCorrect =
                lastMsg && convLastMsg && lastMsg.getId() === convLastMsg.getId();
              processMessage(isSequenceCorrect);
            })
            .catch((e) => {
              console.log("Error fetching conversation in bottomHandler", e);
              // Fall back to checking our local variable latestMessageRef.
              const isLatest =
                lastMsg &&
                latestMessageRef.current &&
                lastMsg.getId() === latestMessageRef.current.getId();
              processMessage(isLatest);
            });
        }
      };

      const addToMessageList = async (newMessage: CometChat.BaseMessage) => {
        // Handle incoming messages and prevent duplicate key errors
        if (isAgenticUser && !conversationId.current) {
          if (newMessage.getConversationId()) {
            conversationId.current = newMessage.getConversationId();
          } else if (!parentMessageId) {
            const msgId = newMessage.getId();
            if (msgId) {
              conversationId.current = `${loggedInUser.current?.getUid()}_${user?.getUid()}_${msgId}`;
            }
          }
        } else if (!conversationId.current && newMessage.getConversationId()) {
          conversationId.current = newMessage.getConversationId();
        }

        // Prevent duplicate messages by checking existing messages
        if (!isAgenticUser) {
          try {
            const incomingId = typeof (newMessage as any)?.getId === 'function' ? (newMessage as any).getId() : (newMessage as any)?.id;
            const incomingMuid = (newMessage as any)?.muid || (typeof (newMessage as any)?.getMuid === 'function' ? (newMessage as any).getMuid() : undefined);
            const existingIndex = messagesContentListRef.current.findIndex((m: any) => {
              const mid = typeof m?.getId === 'function' ? m.getId() : m?.id;
              const mmuid = m?.muid || (typeof m?.getMuid === 'function' ? m.getMuid() : undefined);
              return (
                (incomingId && mid && String(mid) === String(incomingId)) ||
                (incomingMuid && mmuid && String(mmuid) === String(incomingMuid))
              );
            });
            if (existingIndex !== -1) {
              // Update existing message instead of duplicating
              const updatedList = [...messagesContentListRef.current];
              updatedList[existingIndex] = CommonUtils.clone(newMessage);
              messagesContentListRef.current = updatedList;
              onLoad && onLoad([...messagesContentListRef.current].reverse());
              setMessagesList(updatedList);
              return;
            }
          } catch (e) {
            console.log("Error in message de-duplication:", e);
          }
        }

        const isStreamMessage = (newMessage as any).isStreamMessage;
        const targetMessageId = (newMessage as any).targetMessageId;
        if (isStreamMessage && targetMessageId) {
          const targetId = String(targetMessageId);
          let userMsgIdx = messagesContentListRef.current.findIndex(
            (msg) => String(msg.getId()) === targetId
          );
          let updatedList;
          if (userMsgIdx !== -1) {
            updatedList = [...messagesContentListRef.current].filter(
              (msg, idx) =>
                !(
                  idx === userMsgIdx - 1 &&
                  (msg as any).isStreamMessage &&
                  (msg as any).targetMessageId === targetId
                )
            );
            updatedList.splice(userMsgIdx, 0, newMessage);
            messagesContentListRef.current = updatedList;
            onLoad && onLoad([...messagesContentListRef.current].reverse());
            setMessagesList(updatedList);
            return;
          }
        }
        // Check for message sequence gaps and skip for own messages
        const isOwnMessage = (newMessage.getSender()?.getUid() || (newMessage as any)?.["sender"]?.["uid"]) === loggedInUser.current?.["uid"];

        if (!isOwnMessage &&
          latestMessageRef.current !== null &&
          messagesContentListRef.current.length > 0
        ) {
          const firstMsg = messagesContentListRef.current[0];
          const firstMsgId = firstMsg?.getId?.();
          const firstMsgMuid = firstMsg?.getMuid?.() || (firstMsg as any)?.muid;
          const latestMsgId = latestMessageRef.current?.getId?.();
          const latestMsgMuid = latestMessageRef.current?.getMuid?.() || (latestMessageRef.current as any)?.muid;

          const hasGap = (firstMsgId && latestMsgId && String(firstMsgId) !== String(latestMsgId)) &&
            (firstMsgMuid && latestMsgMuid && String(firstMsgMuid) !== String(latestMsgMuid));

          if (hasGap) {
            // A gap means our list is behind the server. Rebuild it from the server,
            // then only prepend the incoming message if the rebuilt page didn't
            // already include it. This avoids the double-insert that caused the
            // duplicate, while still covering the race where the read API hasn't
            // caught up with the just-received message yet.
            reachedFirstMessage.current = false;
            msgRequestBuilder.current?.setMessageId(0);
            messageRequest.current = msgRequestBuilder.current?.build() || null;
            messagesContentListRef.current = [];
            await getPreviousMessages();

            const incomingId = newMessage?.getId?.() ?? (newMessage as any)?.id;
            const incomingMuid =
              (newMessage as any)?.muid ??
              (typeof newMessage?.getMuid === "function" ? newMessage.getMuid() : undefined);
            const alreadyPresent = messagesContentListRef.current.some((msg: any) => {
              const mid = typeof msg?.getId === "function" ? msg.getId() : msg?.id;
              const mmuid = (msg as any)?.muid ?? (typeof msg?.getMuid === "function" ? msg.getMuid() : undefined);
              return (
                (incomingId != null && mid != null && String(mid) === String(incomingId)) ||
                (incomingMuid != null && mmuid != null && String(mmuid) === String(incomingMuid))
              );
            });

            if (!alreadyPresent) {
              messagesContentListRef.current = [newMessage, ...messagesContentListRef.current];
            }

            // Capture the snapshot synchronously — see note on the own-message append
            // below: the deferred (rAF) setMessagesList must not re-read the ref, which
            // an intervening render can clobber back to the pre-append state.
            const gapNextList = messagesContentListRef.current;
            latestMessageRef.current = gapNextList[0] ?? newMessage;
            onLoad && onLoad([...gapNextList].reverse());
            batchStateUpdates(() => {
              setMessagesList([...gapNextList]);
              if (hideScrollToBottomButton === false && unreadCount < 1 && !hasTargetMessageId) {
                setHideScrollToBottomButton(true);
              }
            });
            aMessageWasSentByMeRef.current = true;
            return;
          }
        }
        const nextList = [newMessage, ...messagesContentListRef.current];
        messagesContentListRef.current = nextList;
        onLoad && onLoad([...nextList].reverse());
        // Update latestMessageRef for gap detection
        latestMessageRef.current = newMessage;

        // Batch state updates for better performance.
        // NOTE: batchStateUpdates defers to the next animation frame. Capture the list
        // in `nextList` and commit THAT — do not re-read messagesContentListRef.current
        // inside the rAF. An intervening render (e.g. the composer clearing its reply
        // preview after sending a quoted reply) re-syncs the ref from state via the
        // `messagesContentListRef.current = orderedMessagesList` line below, which would
        // drop this just-appended message before the deferred setMessagesList runs.
        batchStateUpdates(() => {
          setMessagesList([...nextList]);
          if (hideScrollToBottomButton === false && unreadCount < 1 && !hasTargetMessageId) {
            setHideScrollToBottomButton(true);
          }
        });
        aMessageWasSentByMeRef.current = true;
      };

      const markParentMessageAsRead = (message: CometChat.BaseMessage) => {
        let condition: (value: any, index: number, obj: any[]) => unknown;
        condition = (msg) => msg.getId() == message?.["parentMessageId"];
        let msgIndex = messagesList.findIndex(condition);
        if (msgIndex > -1) {
          let tmpList = [...messagesList];
          if (message.getCategory() === MessageCategoryConstants.interactive) {
            //todo show unsupported bubble
          }
          tmpList[msgIndex]?.setUnreadReplyCount(0);
          messagesContentListRef.current = tmpList;
          onLoad && onLoad([...messagesContentListRef.current].reverse());
          setMessagesList(tmpList);
        }
      };

      const messageEdited = (editedMessage: CometChat.BaseMessage, withMuid: boolean = false) => {
        let condition: (value: any, index: number, obj: any[]) => unknown;
        if (withMuid) {
          condition = (msg) => msg["muid"] == editedMessage["muid"];
        } else condition = (msg) => msg.getId() == editedMessage.getId();
        let msgIndex = messagesContentListRef.current.findIndex(condition);
        if (msgIndex > -1) {

          let tmpList = [...messagesContentListRef.current];
          if (editedMessage.getCategory() === MessageCategoryConstants.interactive) {
            //todo show unsupported bubble
          }
          tmpList[msgIndex] = CommonUtils.clone(editedMessage);
          messagesContentListRef.current = tmpList;
          onLoad && onLoad([...messagesContentListRef.current].reverse());
          setMessagesList(tmpList);
        }
      };

      const removeMessage = (message: CometChat.BaseMessage) => {
        let msgIndex = messagesList.findIndex((msg) => msg.getId() == message.getId());
        if (msgIndex == -1) return;

        let tmpList = [...messagesList];
        tmpList.splice(msgIndex, 1);
        messagesContentListRef.current = tmpList;
        onLoad && onLoad([...messagesContentListRef.current].reverse());
        setMessagesList(tmpList);
      };

      const deleteMessage = (message: CometChat.BaseMessage) => {
        CometChat.deleteMessage(message.getId().toString())
          .then((res: any) => {
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageDeleted, {
              message: res,
            });
            setShowMessageOptions([]);
            setShowDeleteModal(false);
            deleteItem.current = undefined;
          })
          .catch((rej: any) => {
            deleteItem.current = undefined;
            setShowDeleteModal(false);
            onError && onError(rej);
          });
      };

      const createActionMessage = () => { };

      const updateMessageReceipt = (receipt: any) => {
        if (
          receipt?.getReceiverType() === ReceiverTypeConstants.group &&
          ![
            receipt.RECEIPT_TYPE.DELIVERED_TO_ALL_RECEIPT,
            receipt.RECEIPT_TYPE.READ_BY_ALL_RECEIPT,
          ].includes(receipt?.getReceiptType())
        ) {
          return;
        }
        // Use getter method for messageId (SDK receipt objects expose it via getMessageId())
        const receiptMessageId = typeof receipt.getMessageId === 'function' ? receipt.getMessageId() : receipt["messageId"];
        const index = messagesContentListRef.current.findIndex(
          (msg) => {
            const msgId = typeof msg.getId === 'function' ? msg.getId() : msg["id"];
            return String(msgId) === String(receiptMessageId);
          }
        );

        if (index === -1) return;

        // Clone-first approach: shallow copy the array, then clone only messages
        // whose receipt status actually changes. Unchanged items keep original references
        // so FlatList skips re-rendering them.
        const updatedList = [...messagesContentListRef.current];
        let hasChanges = false;

        for (let i = index; i < updatedList.length; i++) {
          const msg = updatedList[i];
          // Skip messages already marked as read — they're implicitly delivered too
          if (msg?.getReadAt?.()) continue;

          if (!Number.isNaN(Number(msg.getId()))) {
            const deliveredNeedsUpdate = receipt.getDeliveredAt() && !msg.getDeliveredAt?.();
            const readNeedsUpdate = receipt.getReadAt() && !msg.getReadAt?.();

            if (deliveredNeedsUpdate || readNeedsUpdate) {
              // Clone BEFORE mutating — never mutate objects React is holding
              const cloned = CommonUtils.clone(msg);
              if (deliveredNeedsUpdate) cloned.setDeliveredAt(receipt.getDeliveredAt());
              if (readNeedsUpdate) cloned.setReadAt(receipt.getReadAt());
              updatedList[i] = cloned;
              hasChanges = true;
            }
          }
        }

        // Only trigger re-render if at least one message was actually updated
        if (hasChanges) {
          messagesContentListRef.current = updatedList;
          onLoad && onLoad([...messagesContentListRef.current].reverse());
          setMessagesList(updatedList);
        }
      };

      const handlePannel = (item: any) => {
        if (
          item.alignment === ViewAlignment.messageListBottom &&
          user &&
          group &&
          CommonUtils.checkIdBelongsToThisComponent(item.id, user, group, parentMessageId || "")
        ) {
          if (item.child) setCustomListHeader(() => item.child);
          else setCustomListHeader(null);
        }
      };

      useEffect(() => {
        CometChatUIEventHandler.addUIListener(uiEventListenerShow, {
          showPanel: (item) => handlePannel(item),
          // ccMentionClick: (item) => {
          //     // console.log("item", item)
          // }
        });
        CometChatUIEventHandler.addUIListener(uiEventListenerHide, {
          hidePanel: (item) => handlePannel(item),
        });
        CometChatUIEventHandler.addUIListener(uiEventListener, {
          ccToggleBottomSheet: (item) => {
            bottomSheetRef.current?.togglePanel();
          },
        });
        CometChat.getLoggedinUser()
          .then(async (u: any) => {
            loggedInUser.current = u;
            if (isAgenticUser && !parentMessageId) {
              messageRequest.current = null;
              // Auto-load the last agent conversation if enabled
              if (loadLastAgentConversation && !_skipAgentAutoLoad) {
                try {
                  const lastMsgBuilder = new CometChat.MessagesRequestBuilder()
                    .setLimit(1)
                    .setCategories(ChatConfigurator.dataSource.getAllMessageCategories())
                    .setTypes(ChatConfigurator.dataSource.getAllMessageTypes())
                    .hideDeletedMessages(true)
                    .hideReplies(true)
        
                    
                  if (user) {
                    lastMsgBuilder.setUID(user.getUid());
                  }
                  if (group) {
                    lastMsgBuilder.setGUID(group.getGuid());
                  }
                  const lastMessages = await lastMsgBuilder.build().fetchPrevious();
                  if (lastMessages && lastMessages.length > 0) {
                    const lastMsg = lastMessages[0];
                    // Determine the conversation's parent message ID
                    const rawParentId = typeof lastMsg.getParentMessageId === 'function'
                      ? lastMsg.getParentMessageId()
                      : 0;
                    const lastParentId = rawParentId && Number(rawParentId) > 0
                      ? String(rawParentId)
                      : String(lastMsg.getId());
                    agenticParentMessageIdRef.current = lastParentId;
                    latestMessageRef.current = lastMsg;

                    // Build request to fetch messages for this conversation
                    let agentRequestBuilder = new CometChat.MessagesRequestBuilder()
                      .setLimit(30)
                      .setTags([]);
                    if (user) {
                      agentRequestBuilder = agentRequestBuilder.setUID(user.getUid());
                    }
                    if (group) {
                      agentRequestBuilder = agentRequestBuilder.setGUID(group.getGuid());
                    }
                    agentRequestBuilder = agentRequestBuilder.setParentMessageId(
                      parseInt(lastParentId)
                    );
                    agentRequestBuilder.hideReplies(false);
                    agentRequestBuilder.withParent(true);
                    agentRequestBuilder.setTypes(
                      ChatConfigurator.dataSource.getAllMessageTypes()
                    );
                    agentRequestBuilder.setCategories(
                      ChatConfigurator.dataSource.getAllMessageCategories()
                    );

                    messageRequest.current = agentRequestBuilder.build();
                    setListState("loading");
                    const msgs = await messageRequest.current.fetchPrevious();
                    if (msgs && msgs.length > 0) {
                      // Sort by ID descending (newest first for inverted list)
                      // Server returns parent (via withParent) at end, out of chronological order
                      const sorted = [...msgs].sort((a, b) => {
                        const aId = Number(typeof a.getId === 'function' ? a.getId() : 0);
                        const bId = Number(typeof b.getId === 'function' ? b.getId() : 0);
                        return bId - aId;
                      });
                      // Deduplicate (withParent may include parent twice)
                      const seenIds = new Set<number>();
                      const uniqueMsgs = sorted.filter((msg) => {
                        const msgId = Number(typeof msg.getId === 'function' ? msg.getId() : 0);
                        if (!msgId || seenIds.has(msgId)) return false;
                        seenIds.add(msgId);
                        return true;
                      });
                      if (msgs.length < 30) {
                        reachedFirstMessage.current = true;
                      }
                      messagesContentListRef.current = uniqueMsgs;
                      setMessagesList(uniqueMsgs);
                      onLoad && onLoad([...uniqueMsgs].reverse());
                      setListState("loaded");
                    } else {
                      setListState("loaded");
                      onEmpty && onEmpty();
                    }
                  } else {
                    // No previous conversation — show empty/greeting state
                    setListState("loaded");
                    onEmpty && onEmpty();
                  }
                } catch (e) {
                  console.log("Error auto-loading last agent conversation", e);
                  setListState("loaded");
                  onEmpty && onEmpty();
                }
              } else {
                // Clear skip flag if it was set
                _skipAgentAutoLoad = false;
              }
            } else {
              messageRequest.current = msgRequestBuilder.current?.build() || null;
            }
            if (!isAgenticUser || (isAgenticUser && parentMessageId)) {
              if (goToMessageId) {
                getMessagesAroundId(goToMessageId);
              } else if (startFromUnreadMessages && !(isAgenticUser && parentMessageId)) {


                try {
                  const convId = user?.getUid() ?? group?.getGuid();
                  const conversationType = user
                    ? CometChat.RECEIVER_TYPE.USER
                    : CometChat.RECEIVER_TYPE.GROUP;


                  if (convId && conversationType) {

                    const conversation = await getConversationIfExists(
                      convId,
                      conversationType
                    );
                    if (conversation && conversation.getUnreadMessageCount() > 0) {
                      setUnreadCount(conversation.getUnreadMessageCount());
                      const lastReadMessageId = conversation.getLastReadMessageId();
                      //if lastReadMessageId is 0, it means no messages have been read yet
                      if (lastReadMessageId && Number(lastReadMessageId) !== 0) {
                        // Validate that lastReadMessageId is not a thread reply.
                        // getLastReadMessageId() can return a thread reply's ID when the user
                        // read messages inside a thread. Using a thread reply as the anchor
                        // for getMessagesAroundId causes it to leak into the main message list.
                        if (!parentMessageId) {
                          try {
                            const lastReadMsg = await CometChat.getMessageDetails(Number(lastReadMessageId));
                            const lastReadParentId = lastReadMsg?.getParentMessageId
                              ? lastReadMsg.getParentMessageId()
                              : (lastReadMsg as any)?.parentMessageId;
                            if (lastReadParentId) {
                              // Last read message is a thread reply — use its parent as anchor instead
                              getMessagesAroundId(String(lastReadParentId));
                            } else {
                              getMessagesAroundId(String(lastReadMessageId));
                            }
                          } catch (e) {
                            // If we can't validate, fall back to normal load
                            getPreviousMessages();
                          }
                        } else {
                          getMessagesAroundId(String(lastReadMessageId));
                        }
                      } else {
                        getPreviousMessages();
                      }
                    } else {
                      getPreviousMessages();
                    }
                  } else {
                    getPreviousMessages();
                  }
                } catch (e) {
                  console.log("Error while getting conversation", e);

                  getPreviousMessages();
                }
              } else {
                getPreviousMessages();
              }
              fetchLatestMessage();
            }
          })
          .catch((e: any) => {
            console.log("Error while getting loggedInUser");
            onError && onError(e);
            loggedInUser.current = null;
          });

        return () => {
          CometChatUIEventHandler.removeUIListener(uiEventListenerShow);
          CometChatUIEventHandler.removeUIListener(uiEventListenerHide);
          CometChatUIEventHandler.removeUIListener(uiEventListener);
          onBack && onBack();
        };
      }, []);


      const fetchLatestMessage = useCallback(() => {
        const messageRequestBuilder = new CometChat.MessagesRequestBuilder()
          .setLimit(1)
          .setMessageId(0);

        if (user) {
          messageRequestBuilder.setUID(user.getUid());
        }
        if (group) {
          messageRequestBuilder.setGUID(group.getGuid());
        }

        // Mirror the main list's population so latestMessageRef stays comparable to
        // the list head. The main list hides thread replies (hideReplies), while a
        // thread view scopes to its parent. Without this, latestMessageRef could be
        // set to a thread reply that never appears in the main list, which makes the
        // gap check in addToMessageList read a false "gap" on the next message.
        if (parentMessageId) {
          messageRequestBuilder.setParentMessageId(parseInt(parentMessageId)).hideReplies(false);
        } else {
          messageRequestBuilder.hideReplies(true);
        }

        messageRequestBuilder
          .build()
          .fetchPrevious()
          .then((messages) => {
            if (messages[0]) {
              latestMessageRef.current = messages[0];
            }
          });
      }, [user, group, parentMessageId]);

      // Callback to add stream message and register queue completion callback
      const createStreamMessage = useCallback(
        (userMessage: CometChat.BaseMessage) => {
          const runId = String(userMessage.getId());
          const streamMessage = new StreamMessage(
            user?.getUid() || group?.getGuid() || "",
            user ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP,
            CometChatUiKitConstants.streamMessageTypes.run_started,
            CometChatUiKitConstants.MessageCategoryConstants.stream
          );
          streamMessage.setId(Number(userMessage.getId()));
          if (user) {
            streamMessage.setSender(user);
          }
          streamMessage.setReceiver(loggedInUser.current as CometChat.User);
          streamMessage.setReceiverType(CometChat.RECEIVER_TYPE.USER);
          streamMessage.setSentAt(Math.floor(Date.now() / 1000));
          (streamMessage as any).targetMessageId = runId;
          (streamMessage as any).isStreamMessage = true;
          return streamMessage;
        },
        [user, group, addToMessageList, setMessagesList, onLoad]
      );

      const updateStreamMessageWithActualId = useCallback(
        (actualMessageId: string, runId: string) => {
          const updatedList = messagesContentListRef.current.map((msg) => {
            if ((msg as any).isStreamMessage === true && (msg as any).targetMessageId === runId) {
              const updatedStreamMessage = { ...msg };
              msg.setId(actualMessageId);
              msg.targetMessageId = String(actualMessageId);
              return msg;
            }
            return msg;
          });

          messagesContentListRef.current = updatedList;
          onLoad && onLoad([...messagesContentListRef.current].reverse());
          setMessagesList(updatedList);
        },
        [onLoad]
      );

      useEffect(() => {
        if (isAgenticUser) {
          agenticParentMessageIdRef.current = undefined;
        }
      }, [user?.getUid(), group?.getGuid(), isAgenticUser]);

      useEffect(() => {
        //add listeners

        // AI Assistant listener for agent chats
        if (isAgenticUser && user && (!parentMessageId || (parentMessageId && isAgenticUser))) {
          CometChat.addAIAssistantListener(streamListenerId, {
            onAIAssistantEventReceived: (message: CometChat.AIAssistantBaseEvent) => {
              if (
                message.getConversationId &&
                (!message.getConversationId()?.includes(user.getUid()) ||
                  !message.getConversationId()?.includes(loggedInUser.current?.getUid() ?? ""))
              ) {
                return;
              }

              if (message.getType() === CometChatUiKitConstants.streamMessageTypes.run_started) {
                const lastMessage = messagesContentListRef.current[0];
                updateStreamMessageWithActualId(message.getMessageId(), message.getRunId());
              }

              if (message.getType() === CometChatUiKitConstants.streamMessageTypes.run_finished) {
                const runId = String(message.getRunId?.() || message.getMessageId?.());

                setQueueCompletionCallback(
                  runId,
                  (aiAssistantMessage, aiToolResultMessage, aiToolArgumentMessage) => {
                    const replacement = aiAssistantMessage || aiToolResultMessage || aiToolArgumentMessage;
                    if (!replacement) return;

                    const replacementId = typeof (replacement as any)?.getId === 'function' ? (replacement as any).getId() : (replacement as any)?.id;
                    const replacementRunId = (replacement as any)?.data?.runId;

                    if (messagesContentListRef.current?.[0]?.isStreamMessage && messagesContentListRef.current?.[0]?.targetMessageId === runId) {
                      latestMessageRef.current = replacement;
                    }

                    const list = messagesContentListRef.current;
                    let updatedList: any[];

                    // Find indices in one pass
                    const existingIndex = list.findIndex((msg) => {
                      const msgId = typeof (msg as any)?.getId === 'function' ? (msg as any).getId() : (msg as any)?.id;
                      return msgId && String(msgId) === String(replacementId);
                    });

                    const streamIndex = existingIndex === -1 ? list.findIndex((msg) =>
                      (msg as any).isStreamMessage === true && (msg as any).targetMessageId === runId
                    ) : -1;

                    const matchingIndex = (existingIndex === -1 && streamIndex === -1) ? list.findIndex((msg) => {
                      const msgRunId = (msg as any)?.data?.runId;
                      return msgRunId && String(msgRunId) === String(replacementRunId);
                    }) : -1;

                    // Update list based on what we found
                    if (existingIndex !== -1) {
                      // Update existing message
                      updatedList = list.map((msg, idx) => idx === existingIndex ? replacement : msg);
                    } else if (streamIndex !== -1) {
                      // Replace stream message
                      updatedList = list.map((msg, idx) => idx === streamIndex ? replacement : msg);
                    } else if (matchingIndex !== -1) {
                      // Insert before matching message
                      updatedList = [...list];
                      updatedList.splice(matchingIndex, 0, replacement);
                    } else {
                      // Add at beginning
                      updatedList = [replacement, ...list];
                    }

                    messagesContentListRef.current = updatedList;
                    setMessagesList(updatedList);
                    onLoad && onLoad([...updatedList].reverse());
                  }
                );
                checkAndTriggerQueueCompletion(runId);
              }

              handleWebsocketMessage(message);
            },
          });
        }

        let reactionListeners = {
          onMessageReactionAdded: (reaction: CometChat.ReactionEvent) => {
            updateMessageReaction(reaction, true);
          },
          onMessageReactionRemoved: (reaction: CometChat.ReactionEvent) => {
            updateMessageReaction(reaction, false);
          },
        };

        CometChat.addGroupListener(
          groupListenerId,
          new CometChat.GroupListener({
            onGroupMemberScopeChanged: (message: any) => {
              newMessage(message);
            },
            onGroupMemberLeft: (message: any) => {
              newMessage(message);
            },
            onGroupMemberKicked: (message: any) => {
              newMessage(message);
            },
            onGroupMemberBanned: (message: any) => {
              newMessage(message);
            },
            onGroupMemberUnbanned: (message: any) => {
              newMessage(message);
            },
            onMemberAddedToGroup: (message: any) => {
              newMessage(message);
            },
            onGroupMemberJoined: (message: any) => {
              newMessage(message);
            },
          })
        );

        CometChatUIEventHandler.addMessageListener(messageEventListener, {
          ccMessageSent: ({ message, status }: any) => {
            if (status == MessageStatusConstants.inprogress) {
              newMessage(message, false);
            }

            if (status == MessageStatusConstants.success) {
              messageEdited(message, true);
              if (
                isAgenticUser &&
                agenticParentMessageIdRef.current === undefined &&
                messagesContentListRef.current.length !== 0 &&
                message.getType() === MessageTypeConstants.text &&
                message.getCategory() === MessageCategoryConstants.message
              ) {
                agenticParentMessageIdRef.current = String(message.getId());
              }
              if (isAgenticUser && agenticParentMessageIdRef.current !== undefined) {
                const streamMessage = createStreamMessage(message);
                addToMessageList(streamMessage);
              }
            }
            if (status == MessageStatusConstants.error) {
              messageEdited(message, true);
            }
          },
          ccMessageEdited: ({ message, status }: any) => {
            if (status == messageStatus.success) {
              messageEdited(message, false);
            }
          },
          ccMessageDeleted: ({ message }: any) => {
            messageEdited(message, false);
          },
          ccMessageRead: ({ message }: any) => {
            if (!parentMessageId && message.parentMessageId) {
              // markParentMessageAsRead(message); //NOTE: uncomment this when want unread count in thread view
            }
          },
          onTextMessageReceived: (textMessage: any) => {
            if (isAgenticUser) {
              if (
                textMessage.getSender?.()?.getRole?.() === "@agentic" ||
                textMessage.getCategory?.() === MessageCategoryConstants.agentic ||
                textMessage.getCategory?.() ===
                CometChatUiKitConstants.MessageCategoryConstants.stream
              ) {
                newMessage(textMessage);
              }
            } else {
              newMessage(textMessage);
            }
            if (showSmartReplies && textMessage.getSender?.()?.getUid() !== loggedInUser.current?.getUid()) {
              latestReceivedMessageRef.current = textMessage;
              // keys CometChatSmartReplies below so back-to-back messages force a refetch
              setSmartRepliesKey(String(textMessage.getId?.() ?? Date.now()));
              setShowSmartRepliesView(true);
            }
          },
          onMediaMessageReceived: (mediaMessage: any) => {
            if (isAgenticUser) {
              if (
                mediaMessage.getSender?.()?.getRole?.() === "@agentic" ||
                mediaMessage.getCategory?.() === MessageCategoryConstants.agentic ||
                mediaMessage.getCategory?.() ===
                CometChatUiKitConstants.MessageCategoryConstants.stream
              ) {
                newMessage(mediaMessage);
              }
            } else {
              newMessage(mediaMessage);
            }
          },
          onCustomMessageReceived: (customMessage: any) => {
            if (isAgenticUser) {
              if (
                customMessage.getSender?.()?.getRole?.() === "@agentic" ||
                customMessage.getCategory?.() === MessageCategoryConstants.agentic ||
                customMessage.getCategory?.() ===
                CometChatUiKitConstants.MessageCategoryConstants.stream
              ) {
                newMessage(customMessage);
              }
            } else {
              newMessage(customMessage);
            }
          },
          onMessagesDelivered: (messageReceipt: any) => {
            updateMessageReceipt(messageReceipt);
          },
          onMessagesRead: (messageReceipt: any) => {
            updateMessageReceipt(messageReceipt);
          },
          //suraj
          onMessageDeleted: (deletedMessage: any) => {
            // If the deleted message was unread, decrement the unread count
            if (!deletedMessage.getReadAt?.() && deletedMessage.getSender()?.getUid() !== loggedInUser.current?.getUid()) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
            messageEdited(deletedMessage);
          },
          onMessageEdited: (editedMessage: any) => {
            messageEdited(editedMessage);
          },
          onMessageModerated: (moderatedMessage: any) => {
            if (isAgenticUser) return;
            // A moderation verdict can arrive BEFORE the optimistic message has reconciled to its
            // server id — common when sending 3+ images at once, where the last sends are still
            // keyed by muid in the list. messageEdited() matches by id XOR muid, so when the id
            // isn't present in the list yet, fall back to muid matching (the event carries the
            // muid and the optimistic bubble has it). Otherwise the block silently misses that
            // bubble until a refetch (navigate away + back).
            const mid = moderatedMessage?.getId?.() ?? (moderatedMessage as any)?.id;
            const foundById = mid != null && messagesContentListRef.current.some((m: any) => m?.getId?.() == mid);
            messageEdited(moderatedMessage, !foundById && !!(moderatedMessage as any)?.muid);
          },
          onFormMessageReceived: (formMessage: any) => {
            newMessage(formMessage);
          },
          onCardMessageReceived: (cardMessage: any) => {
            if (isAgenticUser) {
              if (
                cardMessage.getSender?.()?.getRole?.() === "@agentic" ||
                cardMessage.getCategory?.() === MessageCategoryConstants.agentic ||
                cardMessage.getCategory?.() ===
                CometChatUiKitConstants.MessageCategoryConstants.stream
              ) {
                newMessage(cardMessage);
              }
            } else {
              newMessage(cardMessage);
            }
          },
          onSchedulerMessageReceived: (schedulerMessage: any) => {
            newMessage(schedulerMessage);
          },
          onCustomInteractiveMessageReceived: (customInteractiveMessage: any) => {
            newMessage(customInteractiveMessage);
          },
          onInteractionGoalCompleted: (interactionReceipt: CometChat.InteractionReceipt) => {
            //todo show unsupported bubble
          },
          onAIAssistantMessageReceived: (aiAssistantMessage: CometChat.AIAssistantMessage) => {
            const assistantData = typeof aiAssistantMessage.getAssistantMessageData === 'function' ? aiAssistantMessage.getAssistantMessageData() : null;
            const runIdFromData = assistantData && typeof assistantData.getRunId === 'function' ? assistantData.getRunId() : null;
            const runIdFromId = typeof aiAssistantMessage.getId === 'function' ? aiAssistantMessage.getId() : (aiAssistantMessage as any)?.id;
            const runId = runIdFromData || runIdFromId;
            const parentMsgId = typeof aiAssistantMessage.getParentMessageId === 'function' ? aiAssistantMessage.getParentMessageId() : (aiAssistantMessage as any)?.parentMessageId;

            if (
              parentMessageId &&
              String(parentMessageId) !== String(parentMsgId)
            ) {
              return;
            }
            // Group agent reply belongs ONLY to its own group conversation. In a 1:1
            // agent chat `group` is undefined, and a different group won't match the
            // guid — so the reply can never leak outside its own group list.
            if (
              aiAssistantMessage.getReceiverType?.() === ReceiverTypeConstants.group
            ) {
              if (group && aiAssistantMessage.getReceiverId?.() === group.getGuid()) {
                newMessage(aiAssistantMessage);
              }
              return;
            }
            // 1:1 agent reply belongs ONLY to the matching 1:1 agent conversation — its
            // sender is the agent represented by `user`. Anything else (a group list, or
            // a different agent's chat) ignores it so it can't leak across conversations.
            if (
              !user ||
              aiAssistantMessage.getSender?.()?.getUid?.() !== user.getUid()
            ) {
              return;
            }
            if (runId) {
              storeAIAssistantMessage(String(runId), aiAssistantMessage);
            }
          },
          ...reactionListeners,
          onMessagesDeliveredToAll: (messageReceipt: CometChat.MessageReceipt) => {
            updateMessageReceipt(messageReceipt);
          },
          onMessagesReadByAll: (messageReceipt: CometChat.MessageReceipt) => {
            updateMessageReceipt(messageReceipt);
          },
        });
        CometChatUIEventHandler.addGroupListener(groupEventListener, {
          ccGroupMemberUnBanned: ({ message }: any) => {
            message["action"] = "unbanned";
            newMessage(message, false);
          },
          ccGroupMemberBanned: ({ message }: any) => {
            message["action"] = "banned";
            newMessage(message, false);
          },
          ccGroupMemberAdded: ({ message, usersAdded, userAddedIn }: any) => {
            usersAdded.forEach((user: any) => {
              message["message"] = `${loggedInUser.current?.getName()} added ${user.name}`;
              message["muid"] = String(getUnixTimestamp());
              message["sentAt"] = getUnixTimestamp();
              message["actionOn"] = user;
              message["action"] = "added";
              newMessage(message, false);
            });
          },
          ccGroupMemberKicked: ({ message }: any) => {
            message["action"] = "kicked";
            newMessage(message, false);
          },
          ccGroupMemberScopeChanged: ({
            action,
            updatedUser,
            scopeChangedTo,
            scopeChangedFrom,
            group,
          }: any) => {
            action["action"] = "scopeChanged";
            action["newScope"] = scopeChangedTo;
            action["oldScope"] = scopeChangedFrom;
            newMessage(action, false);
          },
          ccOwnershipChanged: ({ group, message }: any) => {
            // newMessage(message, false); removed after discussion.
          },
        });

        CometChat.addCallListener(
          callListenerId,
          new CometChat.CallListener({
            onIncomingCallReceived: (call: any) => {
              Platform.OS === "ios" && Keyboard.dismiss();
              newMessage(call);
            },
            onOutgoingCallAccepted: (call: any) => {
              newMessage(call);
            },
            onOutgoingCallRejected: (call: any) => {
              newMessage(call);
            },
            onIncomingCallCancelled: (call: any) => {
              newMessage(call);
            },
          })
        );

        CometChatUIEventHandler.addCallListener(callEventListener, {
          ccCallInitiated: ({ call }: any) => {
            if (
              call["type"] == CallTypeConstants.audio ||
              call["type"] == CallTypeConstants.video
            ) {
              newMessage(call);
            }
          },
          ccOutgoingCall: ({ call }: any) => {
            if (
              call["type"] == CallTypeConstants.audio ||
              call["type"] == CallTypeConstants.video
            ) {
              newMessage(call);
            }
          },
          ccCallAccepted: ({ call }: any) => {
            if (
              call["type"] == CallTypeConstants.audio ||
              call["type"] == CallTypeConstants.video
            ) {
              newMessage(call);
            }
          },
          ccCallRejected: ({ call }: any) => {
            if (
              call["type"] == CallTypeConstants.audio ||
              call["type"] == CallTypeConstants.video
            ) {
              newMessage(call);
            }
          },
          ccCallEnded: ({ call }: any) => {
            if (
              call["type"] == CallTypeConstants.audio ||
              call["type"] == CallTypeConstants.video
            ) {
              newMessage(call);
            }
          },
          ccShowOngoingCall: (CometChatOngoingComponent) => {
            //show ongoing call
            setOngoingCallView(CometChatOngoingComponent?.child);
          },
        });
        CometChat.addConnectionListener(
          connectionListenerId,
          new CometChat.ConnectionListener({
            onConnected: () => {
              streamOnConnected();
              if (lastID.current && !isAgenticUser) {
                getUpdatedPreviousMessages();
              }
            },
            inConnecting: () => { },
            onDisconnected: () => {
              streamOnDisconnected();
              const currentMessages = messagesContentListRef.current;
              if (currentMessages.length > 0 && !currentMessages[0].id) {
                for (let i = 0; i < currentMessages.length; i++) {
                  if (currentMessages[i].id) {
                    lastID.current = currentMessages[i].id;
                    break;
                  }
                }
              } else if (currentMessages.length > 0) {
                lastID.current = currentMessages[0].id;
              }
            },
          })
        );

        return () => {
          // clean up code like removing listeners
          CometChatUIEventHandler.removeMessageListener(messageEventListener);
          CometChatUIEventHandler.removeGroupListener(groupEventListener);
          CometChatUIEventHandler.removeCallListener(callEventListener);

          CometChat.removeGroupListener(groupListenerId);
          CometChat.removeCallListener(callListenerId);
          CometChat.removeConnectionListener(connectionListenerId);
          if (isAgenticUser) {
            CometChat.removeAIAssistantListener(streamListenerId);
            if (streamSubscriptionRef.current) {
              streamSubscriptionRef.current.unsubscribe();
            }
          }
        };
      }, [unreadCount, user, group, isAgenticUser]);

      useEffect(() => {
        if (aiAssistantTools) {
          setAIAssistantTools(aiAssistantTools);
        }
      }, [aiAssistantTools]);

      // Initialize streaming configuration and subscribe to streaming state
      useEffect(() => {
        setStreamSpeed(streamingSpeed);
        return () => streamSubscriptionRef.current?.unsubscribe();
      }, [streamingSpeed]);

      useEffect(() => {
        prevMessagesLength.current =
          messagesLength.current || messagesContentListRef.current.length;
        messagesLength.current = messagesContentListRef.current.length;
      }, [messagesContentListRef.current]);

      useEffect(() => {
        if (selectedEmoji) {
          Keyboard.dismiss();
          setShowReactionList(true);
        }
      }, [selectedEmoji]);

      useImperativeHandle(ref, () => {
        return {
          addMessage: newMessage,
          updateMessage: messageEdited,
          removeMessage,
          deleteMessage,
          scrollToBottom,
          /// todo: not handeled yet
          createActionMessage,
          updateMessageReceipt,
        };
      });

      const getMessageById = (messageId: string): CometChat.BaseMessage => {
        // Read from the live ref so reactions resolve against the current list.
        const message = messagesContentListRef.current.find(
          (message) => message.getId() === messageId
        );
        return message;
      };

      function isReactionOfThisList(receipt: CometChat.ReactionEvent) {
        const receiverId = receipt?.getReceiverId();
        const receiverType = receipt?.getReceiverType();
        const reactedById = receipt?.getReaction()?.getReactedBy()?.getUid();
        const reactionMessageId = receipt?.getReaction()?.getMessageId();

        // If the reacted message is rendered in this list, the reaction belongs here.
        if (reactionMessageId != null) {
          const exists = messagesContentListRef.current.some(
            (msg) => String(msg.getId?.() ?? msg.id) === String(reactionMessageId)
          );
          if (exists) return true;
        }

        const reactionParentId = receipt?.getParentMessageId();

        // Thread list: message not loaded yet, accept only if it belongs to this thread.
        if (parentMessageId) {
          return (
            Boolean(reactionParentId) &&
            String(reactionParentId) === String(parentMessageId)
          );
        }

        // Main list: reject reactions that belong to a thread.
        if (reactionParentId) {
          return false;
        }

        if (user) {
          if (
            receiverType === ReceiverTypeConstants.user &&
            (receiverId === user.getUid() || reactedById === user.getUid())
          ) {
            return true;
          }
        } else if (group) {
          if (receiverType === ReceiverTypeConstants.group && receiverId === group.getGuid()) {
            return true;
          }
        }
        return false;
      }

      const updateMessageReaction = (message: CometChat.ReactionEvent, isAdded: boolean): void => {
        let _isReactionOfThisList = isReactionOfThisList(message);
        if (!_isReactionOfThisList) return;

        const messageId = message?.getReaction()?.getMessageId();
        const messageObject = getMessageById(messageId);
        if (!messageObject) return;

        let action: any;
        if (isAdded) {
          action = CometChat.REACTION_ACTION.REACTION_ADDED;
        } else {
          action = CometChat.REACTION_ACTION.REACTION_REMOVED;
        }
        const modifiedMessage = CometChat.CometChatHelper.updateMessageWithReactionInfo(
          messageObject,
          message.getReaction(),
          action
        );
        if (modifiedMessage instanceof CometChat.CometChatException) {
          onError && onError(modifiedMessage);
          return;
        }
        messageEdited(modifiedMessage, false);
      };

      const getCurrentBubbleStyle = useCallback(
        (item: CometChat.BaseMessage): BubbleStyles => {
          const type = (() => {
            if (item.getDeletedAt()) {
              return MessageTypeConstants.messageDeleted;
            }
            if (item.getType() === MessageTypeConstants.text) {
              let linkData = getExtensionData(item, ExtensionConstants.linkPreview);
              if (linkData && linkData.links.length != 0) {
                return ExtensionConstants.linkPreview;
              }
            }
            return item.getType();
          })();

          if (item.getSender()?.getUid() != loggedInUser.current?.getUid()) {
            // Agent (assistant) replies use the normal incoming bubble — which has a
            // background container and no negative top margin — so the reply is visually
            // contained like other messages. Applies to both group and 1:1 AI chat.
            if (type === MessageTypeConstants.assistant) {
              return mergedTheme.messageListStyles.incomingMessageBubbleStyles as BubbleStyles;
            }
            return (
              overridenBubbleStyles.get(type)?.incoming ??
              mergedTheme.messageListStyles.incomingMessageBubbleStyles
            );
          }

          return (
            overridenBubbleStyles.get(type)?.outgoing ??
            mergedTheme.messageListStyles.outgoingMessageBubbleStyles
          );
        },
        [mergedTheme, overridenBubbleStyles]
      );

      // functions returning view
      const getLeadingView = useCallback((item: CometChat.BaseMessage, currentIndex?: number): JSX.Element | undefined => {
        let _style = getCurrentBubbleStyle(item);

        if (
          [MessageCategoryConstants.action, MessageCategoryConstants.call].includes(
            item.getCategory()
          )
        ) {
          return undefined;
        }
        const isIncomingMessage = item.getSender()?.getUid() !== loggedInUser.current?.getUid();
        const shouldShowAvatar =
          avatarVisibility &&
          (alignment === "leftAligned" ||
            (isIncomingMessage && !user) ||
            (isAgenticUser && isIncomingMessage));

        if (shouldShowAvatar) {
          // §8.3a — within a batch, show the avatar only on the FIRST (top/oldest) member.
          // The list is inverted (index 0 = newest), so the older neighbour is at index+1.
          // For the rest of the batch, render a same-width spacer so the stack stays aligned.
          const list = messagesContentListRef.current || [];
          const older = typeof currentIndex === "number" ? list[currentIndex + 1] : undefined;
          const newer = typeof currentIndex === "number" ? list[currentIndex - 1] : undefined;
          const isBatchMember =
            getMessageBatchId(item) != null &&
            (isSameBatchGroup(item, older) || isSameBatchGroup(item, newer));
          const isBatchFirst = !isSameBatchGroup(item, older);
          if (isBatchMember && !isBatchFirst) {
            const avatarWidth = (_style?.avatarStyle?.containerStyle?.width as number) ?? 32;
            return <View style={{ width: avatarWidth }} />;
          }
          return (
            <CometChatAvatar
              image={
                item?.getSender()?.getAvatar && item?.getSender()?.getAvatar()
                  ? { uri: item.getSender()?.getAvatar() }
                  : undefined
              }
              name={
                item?.getSender()?.getName && item?.getSender()?.getName()
                  ? item?.getSender()?.getName()
                  : ""
              }
              style={_style.avatarStyle}
            />
          );
        }
        return undefined;
      }, []);

      const getHeaderView = useCallback(
        (item: CometChat.BaseMessage | any, currentIndex?: number): JSX.Element | undefined => {
          const _style = getCurrentBubbleStyle(item);
          // §8.3a — within a batch, the sender name shows only on the first (top/oldest) member.
          const _list = messagesContentListRef.current || [];
          const _older = typeof currentIndex === "number" ? _list[currentIndex + 1] : undefined;
          const _newer = typeof currentIndex === "number" ? _list[currentIndex - 1] : undefined;
          const _isBatchMember =
            getMessageBatchId(item) != null &&
            (isSameBatchGroup(item, _older) || isSameBatchGroup(item, _newer));
          if (_isBatchMember && isSameBatchGroup(item, _older)) {
            // not the first of the batch → suppress the duplicate sender name
            return undefined;
          }
          if (
            (alignment === "leftAligned" ||
              (item.getSender()?.getUid() != loggedInUser.current?.getUid() && !user)) &&
            ![MessageCategoryConstants.action, MessageCategoryConstants.call].includes(
              item.getCategory()
            )
          ) {
            const senderName = (item.getSender()?.getName() || "").trim();
            return (
              <View style={staticStyles.flexRow}>
                {Boolean(senderName) && (
                  <Text
                    style={_style.senderNameTextStyles}
                    numberOfLines={1}
                    ellipsizeMode={"tail"}
                  >
                    {senderName}
                  </Text>
                )}
              </View>
            );
          }
          return undefined;
        },
        []
      );

      const getStatusInfoView = useCallback(
        (
          item:
            | CometChat.TextMessage
            | CometChat.MediaMessage
            | CometChat.CustomMessage
            | CometChat.InteractiveMessage
            | CometChat.BaseMessage
            | any,
          bubbleAlignment: MessageBubbleAlignmentType,
          currentIndex?: number
        ): JSX.Element | undefined => {
          // Skip action category messages
          if ((item as CometChat.BaseMessage).getCategory() === MessageCategoryConstants.action)
            return undefined;

          // §8.3a — within a batch, the receipt+timestamp shows only on the LAST (bottom/newest)
          // member. List is inverted (index 0 = newest) → the newer neighbour is at index-1.
          // Hide the row on any batch member that still has a same-batch neighbour below it.
          // EXCEPTION (§12.1): a FAILED member must always show its own status so its error
          // (and any retry affordance) is never hidden by the group collapse.
          const _batchList = messagesContentListRef.current || [];
          const _newerNeighbour =
            typeof currentIndex === "number" ? _batchList[currentIndex - 1] : undefined;
          // A batch member with a same-batch neighbour BELOW it (newer) is not the last one — its
          // receipt/timestamp is normally collapsed onto the last member of the group.
          const _isCollapsibleBatchMember =
            getMessageBatchId(item) != null && isSameBatchGroup(item, _newerNeighbour);
          // EXCEPTION (§12.1): a FAILED or moderation-BLOCKED member must always show its own error
          // icon, so a blocked/failed first/middle attachment isn't left with NO indication. A
          // moderation block is NOT stamped as metadata.error, so check the moderation status here too.
          const _hasError =
            item?.getData?.()?.metaData?.error ||
            item?.getMetadata?.()?.error ||
            (item as any)?.error ||
            getModerationStatus(item) === "disapproved";
          if (!_hasError && _isCollapsibleBatchMember) {
            // Non-last, non-failed batch member: the receipt/timestamp shows only on the LAST member,
            // but that row is what gives the bubble its bottom footprint. Returning `undefined` leaves
            // the content flush to the edge, so the rounded bottom corner doesn't render like the top.
            // Keep a small spacer so the bottom matches the top. Scoped to this branch — the default
            // (non-batch) bubble is untouched.
            return <View style={{ height: theme.spacing.spacing.s2 }} />;
          }

          let isOutgoingMessage = item.getSender()?.getUid() === loggedInUser.current?.getUid();
          let _style = getCurrentBubbleStyle(item);

          let messageState;
          const nextItemIsRead =
            messagesContentListRef.current[currentIndex! - 1] &&
            messagesContentListRef.current[currentIndex! - 1].getReadAt();
          const nextItemIsDelivered =
            messagesContentListRef.current[currentIndex! - 1] &&
            messagesContentListRef.current[currentIndex! - 1].getDeliveredAt();
          // Moderation status should override other receipt states for immediate error display
          const moderationStatus = getModerationStatus(item);

          // Check error metadata FIRST before sentAt/deliveredAt/readAt
          const hasErrorMetadata = item?.getData?.()?.metaData?.error;
          const hasErrorInMetadata = item?.getMetadata?.()?.error;
          const hasErrorProp = (item as any)?.error;
          if (hasErrorMetadata || hasErrorInMetadata || hasErrorProp) {
            messageState = MessageReceipt.ERROR;
          } else if (item.getReadAt() || nextItemIsRead) messageState = MessageReceipt.READ;
          else if (item.getDeliveredAt() || nextItemIsDelivered)
            messageState = MessageReceipt.DELIVERED;
          else if (item.getSentAt()) messageState = MessageReceipt.SENT;
          else if (isOutgoingMessage) messageState = MessageReceipt.WAIT;
          else messageState = MessageReceipt.ERROR;

          // Moderation overrides
          if (moderationStatus === "disapproved") {
            messageState = MessageReceipt.ERROR;
          }
          // Determine if message has been edited. Text edits always qualify; media messages qualify
          // only when they carry a caption (that's the only thing you can edit on media) — the caption
          // guard also keeps async server edits like thumbnail generation from falsely tagging images.
          const editedType = (item as CometChat.BaseMessage).getType();
          const isEditedMedia =
            (editedType === MessageTypeConstants.image ||
              editedType === MessageTypeConstants.video ||
              editedType === MessageTypeConstants.audio ||
              editedType === MessageTypeConstants.file) &&
            !!(item as CometChat.MediaMessage).getCaption?.()?.trim();
          const isEdited =
            !!item.getEditedAt?.() &&
            (editedType === MessageTypeConstants.text || isEditedMedia);

          // A first/middle failed/blocked batch member shows JUST the error icon (below) — hide its
          // timestamp so only the last member of the group carries the timestamp.
          const shouldShowTimestamp =
            (isAgenticUser ? isOutgoingMessage : !hideTimestamp) &&
            !(_isCollapsibleBatchMember && messageState === MessageReceipt.ERROR);
          return (
            <View>
              <View
                style={[
                  {
                    flexDirection: "row",
                    justifyContent: bubbleAlignment === "right" ? "flex-end" : "flex-start",
                    alignSelf: "flex-end",
                    alignItems: "center",
                  },
                  _style.dateReceiptContainerStyle,
                ]}
              >
                {isEdited && (
                  <Text
                    style={[
                      _style.dateStyles.textStyle,
                      {
                        textTransform: "none",
                      },
                    ]}
                  >
                    {t("EDITED")}
                  </Text>
                )}
                {shouldShowTimestamp && (
                  <CometChatDate
                    timeStamp={
                      !hideTimestamp
                        ? (item.getDeletedAt() || item.getSentAt()) * 1000 ||
                        getSentAtTimestamp(item)
                        : undefined
                    }
                    pattern={"timeFormat"}
                    customDateString={datePattern && datePattern(item)}
                    style={_style.dateStyles}
                  />
                )}
                {receiptsVisibility &&
                  alignment !== "leftAligned" &&
                  isOutgoingMessage &&
                  !item.getDeletedAt?.() ? (
                  (() => {
                    const receiptEl = (
                      <CometChatReceipt
                        receipt={messageState}
                        style={{
                          deliveredIcon: _style.receiptStyles.deliveredIcon,
                          readIcon: _style.receiptStyles.readIcon,
                          sentIcon: _style.receiptStyles.sentIcon,
                          waitIcon: _style.receiptStyles.waitIcon,
                          errorIcon: _style.receiptStyles.errorIcon,
                          sentIconStyle: _style.receiptStyles.sentIconStyle,
                          readIconStyle: _style.receiptStyles.readIconStyle,
                          waitIconStyle: _style.receiptStyles.waitIconStyle,
                          errorIconStyle: _style.receiptStyles.errorIconStyle,
                          deliveredIconStyle: _style.receiptStyles.deliveredIconStyle,
                        }}
                      />
                    );
                    // A first/middle failed/blocked batch member shows JUST the error icon (no
                    // timestamp, no Retry label) so the group collapse never hides the failure.
                    if (messageState === MessageReceipt.ERROR && _isCollapsibleBatchMember) {
                      return <View testID="batch-error-icon" style={staticStyles.receiptContainer}>{receiptEl}</View>;
                    }
                    // §12.1 — a failed send becomes a tappable "Retry" (re-sends this message).
                    return messageState === MessageReceipt.ERROR ? (
                      <TouchableOpacity
                        style={[staticStyles.receiptContainer, staticStyles.receiptRow]}
                        onPress={() => resendMediaMessage(item)}
                        accessibilityRole="button"
                        accessibilityLabel={t("RETRY") ?? "Retry"}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        {receiptEl}
                        <Text
                          style={[
                            _style.dateStyles.textStyle,
                            { textTransform: "none", marginLeft: 4, color: mergedTheme.color.error },
                          ]}
                        >
                          {t("RETRY") ?? "Retry"}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={staticStyles.receiptContainer}>{receiptEl}</View>
                    );
                  })()
                ) : null}
              </View>
            </View>
          );
        },
        [mergedTheme, isAgenticUser, hideTimestamp]
      );

      // §8.2 — batch-spanning viewer source: the union of image+video attachments
      // across all messages of this message's batch (in batchIndex order), plus the
      // offset where the queried message's own media begins. Null when not a real batch.
      const getBatchImageVideoItems = useCallback(
        (message: CometChat.MediaMessage): BatchMediaResult | null => {
          const batchId = getMessageBatchId(message);
          if (batchId == null) return null;
          const list = messagesContentListRef.current || [];
          const siblings = list.filter((m) => isSameBatchGroup(m, message));
          if (siblings.length <= 1) return null;
          const idxOf = (m: any) => {
            const bi = m?.getMetadata?.()?.batchIndex;
            return typeof bi === "number" ? bi : 0;
          };
          siblings.sort((a, b) => idxOf(a) - idxOf(b));
          const isVisual = (a: any) => {
            const mime = a?.getMimeType?.() ?? "";
            return mime.startsWith("image/") || mime.startsWith("video/");
          };
          const sameMsg = (a: any, b: any) => {
            const ai = a?.getId?.();
            const bi = b?.getId?.();
            if (ai && bi) return ai === bi;
            const am = a?.getMuid?.();
            const bm = b?.getMuid?.();
            return !!am && am === bm;
          };
          let items: CometChat.Attachment[] = [];
          let offsetForMessage = 0;
          for (const sib of siblings) {
            const media = ((sib as CometChat.MediaMessage).getAttachments?.() ?? []).filter(isVisual);
            if (sameMsg(sib, message)) offsetForMessage = items.length;
            items = items.concat(media);
          }
          if (items.length === 0) return null;
          return { items, offsetForMessage };
        },
        []
      );

      const batchMediaContextValue = useMemo(
        () => ({ getBatchImageVideoItems }),
        [getBatchImageVideoItems]
      );

      // §12.1 — retry a FAILED outgoing media message (e.g. one member of a partial batch).
      // Clears the error flag, then re-sends via the canonical CometChatUIKit path which
      // re-emits ccMessageSent inprogress→success/error; this list reconciles by muid in place.
      const resendMediaMessage = useCallback((message: CometChat.BaseMessage) => {
        try {
          if (!(message instanceof CometChat.MediaMessage)) return;
          const data: any = (message as any).getData?.() || {};
          if (data?.metaData?.error) {
            delete data.metaData.error;
            (message as any).setData?.(data);
          }
          const md: any = (message as any).getMetadata?.();
          if (md?.error) {
            delete md.error;
            (message as any).setMetadata?.(md);
          }
          (message as any).error = undefined;
          // On failure CometChatUIKit.sendMediaMessage re-applies the error flag + emits error.
          CometChatUIKit.sendMediaMessage(message as CometChat.MediaMessage).catch(() => {});
        } catch (e) {
          // best-effort retry
        }
      }, []);

      const reactToMessage = (emoji: string, messageObj?: CometChat.BaseMessage) => {
        const originalMessage = messageObj || selectedMessage;
        const msgObj = CommonUtils.clone(originalMessage);

        if (!msgObj.getId() && originalMessage?.getId()) {
          msgObj.getId = () => originalMessage.getId();
        }

        const messageId = msgObj?.getId();
        const reactions = msgObj?.getReactions() || [];
        const emojiObject = reactions?.find((reaction: any) => {
          return reaction?.reaction == emoji;
        });

        if (emojiObject && emojiObject?.getReactedByMe()) {
          const updatedReactions: any[] = [];
          reactions.forEach((reaction: any) => {
            if (reaction?.getReaction() == emoji) {
              if (reaction?.getCount() === 1) {
                return;
              } else {
                reaction.setCount(reaction?.getCount() - 1);
                reaction.setReactedByMe(false);
                updatedReactions.push(reaction);
              }
            } else {
              updatedReactions.push(reaction);
            }
          });

          const newMessageObj = CommonUtils.clone(msgObj);
          newMessageObj.setReactions(updatedReactions);

          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, {
            message: newMessageObj,
            status: messageStatus.success,
          });

          CometChat.removeReaction(messageId, emoji)
            .then((message: any) => { })
            .catch((error: any) => {
              CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, {
                message: msgObj,
                status: messageStatus.success,
              });
            });
        } else {
          const updatedReactions: any[] = [];
          const reactionAvailable = reactions.find((reaction: any) => {
            return reaction?.getReaction() == emoji;
          });

          reactions.forEach((reaction: any) => {
            if (reaction?.getReaction() == emoji) {
              reaction.setCount(reaction?.getCount() + 1);
              reaction.setReactedByMe(true);
              updatedReactions.push(reaction);
            } else {
              updatedReactions.push(reaction);
            }
          });
          if (!reactionAvailable) {
            const react: CometChat.ReactionCount = new CometChat.ReactionCount(emoji, 1, true);
            updatedReactions.push(react);
          }

          const newMessageObj = CommonUtils.clone(msgObj);

          newMessageObj.setReactions(updatedReactions);

          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, {
            message: newMessageObj,
            status: messageStatus.success,
          });

          CometChat.addReaction(messageId, emoji)
            .then((response: any) => { })
            .catch((error: any) => {
              CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, {
                message: msgObj,
                status: messageStatus.success,
              });
            });
        }

        setShowMessageOptions([]);
      };

      const onReactionPress = useCallback(
        (reaction: CometChat.ReactionCount, messageObject: CometChat.BaseMessage) => {
          if (reaction.getReaction() == "All") {
            setSelectedMessage(messageObject);
            setSelectedEmoji(reaction.getReaction());
            return;
          }
          if (onReactionPressFromProp) {
            onReactionPressFromProp(reaction, messageObject);
            return;
          }
          reactToMessage(reaction.getReaction(), messageObject);
        },
        [onReactionPressFromProp]
      );

      const onReactionLongPress = useCallback(
        (reaction: CometChat.ReactionCount, messageObject: CometChat.BaseMessage) => {
          if (onReactionLongPressFromProp && reaction.getReaction() !== "All") {
            onReactionLongPressFromProp(reaction, messageObject);
            return;
          }
          setSelectedMessage(messageObject);
          setSelectedEmoji(reaction.getReaction());
        },
        [onReactionLongPressFromProp]
      );

      const getFooterView = useCallback(
        (messageObject: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
          let hasReaction =
            messageObject?.getReactions &&
            messageObject?.getReactions() &&
            messageObject?.getReactions().length > 0;
          return hasReaction
            ? (params: { maxContentWidth?: number }) => {
              return (
                <CometChatReactions
                  messageObject={messageObject}
                  onReactionPress={onReactionPress}
                  onReactionLongPress={onReactionLongPress}
                  alignment={alignment}
                  style={getCurrentBubbleStyle(messageObject).reactionStyles}
                  maxContentWidth={params?.maxContentWidth}
                />
              );
            }
            : null;
        },
        [mergedTheme]
      );

      const getAlignment = useCallback(
        (item: CometChat.BaseMessage | any): MessageBubbleAlignmentType => {
          if (item && item.getCategory() == MessageCategoryConstants.action) return "center";
          if (
            alignment == "standard" &&
            (item.getSender()?.getUid() || item?.["sender"]?.["uid"]) ==
            loggedInUser.current?.getUid()
          )
            return "right";
          return "left";
        },
        []
      );

      const openMessageInfo = (message: any) => {
        infoObject.current = message;
        setMessageInfo(true);
        setShowMessageOptions([]);
      };

      const openReportDialog = (message: any) => {
        reportedMessageRef.current = message;
        // On iOS wait for BottomSheet modal dismiss animation to avoid flashing
        if (Platform.OS === "ios") {
          pendingReportRef.current = true;
        } else {
          setShowReportDialog(true);
        }
        setShowMessageOptions([]);
      };

      const openThreadView = (...params: any[]) => {
        if (onThreadRepliesPress) {
          onThreadRepliesPress(params[0], () => (
            <MessageView message={params[0]} isThreaded={true} showOptions={false} />
          ));
        }
        setShowMessageOptions([]);
        return onThreadRepliesPress;
      };

      const editMessage = (item: any) => {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, {
          message: item,
          status: messageStatus.inprogress,
        });
        setShowMessageOptions([]);
      };

      const copyMessage = (item: any) => {
        let copyMessage = getPlainString(item["text"], item);
        Clipboard.setString(copyMessage);
        // Defer modal dismiss to next frame to avoid Fabric race condition
        // where unmounting the Modal while Clipboard is still accessing views
        // causes EXC_BAD_ACCESS (SIGSEGV) at null pointer in mount phase.
        requestAnimationFrame(() => {
          setShowMessageOptions([]);
        });
      };

      const getThreadView = useCallback(
        (item: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
          let isThreaded = item.getReplyCount() > 0;

          let _style = getCurrentBubbleStyle(item);
          const moderationStatus = getModerationStatus(item);
          const isOutgoing = item.getSender()?.getUid() === loggedInUser.current?.getUid();
          if (isOutgoing && moderationStatus === "disapproved") {
            return undefined; // hide thread view if disapproved
          }
          return !isThreaded ? undefined : (
            <TouchableOpacity
              onPress={() => openThreadView(item, null)}
              style={_style.threadedMessageStyles?.containerStyle}
            >
              <Icon
                icon={_style.threadedMessageStyles?.icon}
                size={16}
                name='subdirectory-arrow-right-fill'
              />

              <Text
                style={_style.threadedMessageStyles?.indicatorTextStyle}
              >{`${item.getReplyCount()} ${item.getReplyCount() > 1 ? t("REPLIES") : t("REPLY")
                }`}</Text>
              <CometChatBadge
                style={{
                  containerStyle: _style.threadedMessageStyles?.unreadCountStyle?.containerStyle,
                  textStyle: _style.threadedMessageStyles?.unreadCountStyle?.textStyle,
                }}
                count={item.getUnreadRepliesCount()}
              />
            </TouchableOpacity>
          );
        },
        [mergedTheme]
      );

      const privateMessage = (item: CometChat.BaseMessage) => {
        setShowMessageOptions([]);
        CometChat.getUser(item.getSender()?.getUid())
          .then((user: any) => {
            CometChatUIEventHandler.emitUIEvent("openChat", { user });
          })
          .catch((e: any) => {
            onError && onError(e);
          });
      };

      const shareMedia = async (messageObject: CometChat.MediaMessage | any) => {
        // Strip markdown/HTML from raw text BEFORE mention replacement,
        // because getPlainString can break HTML tags (e.g., </u> becomes /u>)
        let rawText = messageObject?.getData()["text"] || "";
        let strippedText = stripMarkdown(rawText);
        let textMessage = getPlainString(strippedText, messageObject);
        let fileUrl = messageObject.getData()["url"];

        const getFileName = () => {
          if (!fileUrl) return "";
          return fileUrl.substring(fileUrl.lastIndexOf("/") + 1, fileUrl.length).replace(" ", "_");
        };

        let shareObj = {
          message: textMessage,
          type: messageObject["type"],
          mediaName: getFileName(), // get File name
          fileUrl: fileUrl || "", // get File url
          mimeType:
            messageObject["type"] === "text"
              ? ""
              : (messageObject as CometChat.MediaMessage)?.getAttachment()?.getMimeType(), // get Mime Type
        };

        // Dismiss message options modal before presenting native share sheet
        // to prevent screen freeze when share sheet is dismissed on iOS (Fabric).
        // Use setTimeout with enough delay for the modal dismiss animation to complete.
        setShowMessageOptions([]);
        setTimeout(() => {
          NativeModules.FileManager.shareMessage(shareObj, (callback: any) => {
          });
        }, 600);
      };

      const openOptionsForMessage = useCallback(
        (item: CometChat.BaseMessage | any, template: CometChatMessageTemplate) => {
          let options = template?.options
            ? loggedInUser.current
              ? template.options(loggedInUser.current, item, mergedTheme, group)
              : []
            : [];
          if (hideFlagMessageOption) {
            options = options.filter((opt: any) => opt.id !== MessageOptionConstants.reportMessage);
          }
          if (hideMarkAsUnreadOption) {
            options = options.filter((opt: any) => opt.id !== MessageOptionConstants.markAsUnread);
          }
          let optionsWithPressHandling = options.map((option) => {
            if (!option.onPress)
              switch (option.id) {
                case MessageOptionConstants.messageInformation:
                  option.onPress = openMessageInfo.bind(this, item);
                  break;
                case MessageOptionConstants.replyMessage:
                  option.onPress = () => {
                    // Trigger swipe-to-reply functionality
                    CometChatMessageEvents.emit(CometChatMessageEvents.ccReplyToMessage, {
                      message: item,
                      status: messageStatus.inprogress,
                    });
                    setShowMessageOptions([]);
                  };
                  break;
                case MessageOptionConstants.reportMessage:
                  option.onPress = openReportDialog.bind(this, item);
                  break;
                case MessageOptionConstants.replyInThread:
                  option.onPress = openThreadView.bind(this, item);
                  break;
                case MessageOptionConstants.deleteMessage:
                  option.onPress = () => {
                    deleteItem.current = item;
                    bottomSheetRef.current?.togglePanel();
                    Platform.OS === "android" && setShowDeleteModal(true);
                  };

                  break;
                case MessageOptionConstants.editMessage:
                  option.onPress = editMessage.bind(this, item);
                  break;
                case MessageOptionConstants.copyMessage:
                  option.onPress = copyMessage.bind(this, item);
                  break;
                case MessageOptionConstants.sendMessagePrivately:
                  option.onPress = privateMessage.bind(this, item);
                  break;
                // case MessageOptionConstants.forwardMessage:
                //     option.onPress = showForwardMessage.bind(this, item);
                //     break
                case MessageOptionConstants.shareMessage:
                  option.onPress = shareMedia.bind(this, item);
                  break;
                case MessageOptionConstants.markAsUnread:
                  option.onPress = markMessageAsUnread.bind(this, item);
                  break;
              }
            else {
              // If overriding `onPress`, make sure to pass `item` explicitly
              const customOnPress = option.onPress;
              option.onPress = () => {
                customOnPress(item);
                setShowMessageOptions([]);
              };
            }
            if (option.id === MessageOptionConstants.reactToMessage) {
              option.onPress = () => {
                if (option.CustomView) {
                  let view = option.CustomView(item);
                  setExtensionsComponent(() => view);
                }
              };
            }
            return option;
          });
          // Restrict options for disapproved outgoing messages (only delete + copy for text)
          const moderationStatus = getModerationStatus(item);
          const isOutgoing = item.getSender?.()?.getUid?.() === loggedInUser.current?.getUid?.();
          if (moderationStatus === "disapproved" && isOutgoing) {
            optionsWithPressHandling = optionsWithPressHandling.filter((opt) => {
              if (opt.id === MessageOptionConstants.deleteMessage) return true;
              if (
                opt.id === MessageOptionConstants.copyMessage &&
                (item.getType?.() === MessageTypeConstants.text || item?.getType === MessageTypeConstants.text)
              )
                return true;
              return false;
            });
          }
          setShowMessageOptions(optionsWithPressHandling);
        },
        [mergedTheme]
      );

      const MessageView = useCallback(
        (params: {
          message: CometChat.BaseMessage;
          showOptions?: boolean;
          isThreaded?: boolean;
          currentIndex?: number;
        }) => {
          const { message, showOptions = true, isThreaded = false, currentIndex } = params

          const hasTemplate = useMemo(() => {
            // Detect InteractiveMessage instances where Object.assign
            // (from mergeObjects during history fetch dedup) overwrote `category` and `type`
            let lookupCategory: string = message.getCategory();
            let lookupType: string = message.getType();
            if (lookupCategory === MessageCategoryConstants.card) {
              lookupType = MessageTypeConstants.card;
            }

            const hasInteractiveData =
              typeof (message as any).getInteractiveData === 'function' &&
              (message as any).getInteractiveData() != null;

            if (hasInteractiveData && lookupCategory !== MessageCategoryConstants.interactive) {
              lookupCategory = MessageCategoryConstants.interactive;
              const interactiveData = (message as any).getInteractiveData();
              if (interactiveData?.formFields) {
                lookupType = MessageTypeConstants.form;
              } else if (interactiveData?.scheduleElement || interactiveData?.timezoneCode) {
                lookupType = MessageTypeConstants.scheduler;
              } else if (interactiveData?.cardActions) {
                lookupType = MessageTypeConstants.card;
              }
              (message as any).category = lookupCategory;
              (message as any).type = lookupType;
            }

            const defaultTemplate = templatesMap.get(
              `${lookupCategory}_${lookupType}`
            );

            if (templates?.length > 0) {
              const customTemplate = templates.find(
                (template) =>
                  template.type === lookupType && template.category === lookupCategory
              );
              return customTemplate ?? defaultTemplate;
            }

            return defaultTemplate;
          }, [message, templatesMap, templates]);

          let bubbleAlignment: MessageBubbleAlignmentType = useMemo(() => {
            return getAlignment(message);
          }, [getAlignment]);

          const ContentView = useMemo(() => {
            return hasTemplate?.ContentView?.(message, bubbleAlignment);
          }, [hasTemplate, message, bubbleAlignment]);

          const HeaderView = useMemo(() => {
            return hasTemplate?.HeaderView
              ? hasTemplate?.HeaderView(message, bubbleAlignment)
              : !isThreaded
                ? getHeaderView(message, currentIndex)
                : undefined;
          }, [message, bubbleAlignment, hasTemplate, getHeaderView, currentIndex]);

          const FooterView = useMemo(() => {
            return hasTemplate?.FooterView
              ? hasTemplate?.FooterView(message, bubbleAlignment)
              : isThreaded
                ? undefined
                : getFooterView(message, bubbleAlignment);
          }, [hasTemplate, isThreaded, getFooterView, message, bubbleAlignment]);

          const ThreadedView = useMemo(() => {
            if (isAgenticUser) return undefined;
            return !isThreaded
              ? !message.getDeletedBy()
                ? getThreadView(message, bubbleAlignment)
                : undefined
              : undefined;
          }, [isThreaded, message, getThreadView, bubbleAlignment]);

          const LeadingView = useMemo(() => {
            if (hasTemplate?.LeadingView) {
              return hasTemplate.LeadingView(message, bubbleAlignment);
            }
            return !isThreaded ? getLeadingView(message, currentIndex) : undefined;
          }, [isThreaded, message, getLeadingView, hasTemplate, bubbleAlignment, currentIndex]);

          const BottomView = useMemo(() => {
            const moderationStatus = getModerationStatus(message);
            const isOutgoing = message?.getSender?.()?.getUid() === loggedInUser.current?.getUid();
            
            // Check for MIME type error (ERR_PERMISSION_DENIED)
            const hasErrorMetadata = message?.getData?.()?.metaData?.error;
            const hasErrorInMetadata = (message as any)?.getMetadata?.()?.error;
            if (isOutgoing && (hasErrorMetadata || hasErrorInMetadata) && !isAgenticUser) {
              return (
                <MimeErrorBottomView
                  moderationStyle={
                    mergedTheme.messageListStyles.outgoingMessageBubbleStyles.moderationStyle
                  }
                />
              );
            }

            if (effectiveHideModeration) {
              return hasTemplate?.BottomView && hasTemplate?.BottomView(message, bubbleAlignment);
            } else {
              if (isOutgoing && moderationStatus === "disapproved" && !isAgenticUser) {
                return (
                  <ModerationBottomView
                    status={moderationStatus}
                    moderationStyle={
                      mergedTheme.messageListStyles.outgoingMessageBubbleStyles.moderationStyle
                    }
                  />
                );
              }
              return hasTemplate?.BottomView && hasTemplate?.BottomView(message, bubbleAlignment);
            }
          }, [hasTemplate, message, bubbleAlignment, effectiveHideModeration]);

          const StatusInfoView = useMemo(() => {
            return hasTemplate?.StatusInfoView &&
              hasTemplate?.StatusInfoView(message, bubbleAlignment)
              ? hasTemplate?.StatusInfoView(message, bubbleAlignment)
              : getStatusInfoView(message, bubbleAlignment, currentIndex);
          }, [hasTemplate, message, bubbleAlignment, currentIndex, getStatusInfoView]);

         
          const ReplyView = useMemo(() => {
            if (templates && templates.length > 0) {
              return ChatConfigurator.dataSource.getReplyView?.(message, mergedTheme, {
                onReplyClick: (messageId: string) => {
                  scrollToMessage(messageId);
                },
              }) || null;
            }
            return hasTemplate?.ReplyView?.(message, bubbleAlignment) || null;
          }, [hasTemplate, message, bubbleAlignment, mergedTheme, templates]);

          if (hasTemplate) {
            if (hasTemplate?.BubbleView) return hasTemplate?.BubbleView(message);

            const onLongPress = useCallback(() => {
              // Ensure the keyboard is dismissed before showing options so the action sheet / menu isn't obscured
              Keyboard.dismiss();

              if (message.getDeletedBy() != null) return;

              if (!message.getId()) {
                return;
              }
              // console.log({hasTemplate});

              setSelectedMessage(message);
              hasTemplate && openOptionsForMessage(message, hasTemplate);
            }, [hasTemplate, message, openOptionsForMessage]);

            const onPress = useCallback(() => {
              Keyboard.dismiss();
            }, []);

            // Swipe-to-reply functionality
            const onReply = useCallback(() => {
              if (message.getDeletedBy() != null) return;
              if (!message.getId()) return;

              CometChatMessageEvents.emit(CometChatMessageEvents.ccReplyToMessage, {
                message: message,
                status: messageStatus.inprogress,
              });
            }, [message]);

            const swipeAnimatedValue = useRef(new Animated.Value(0)).current;
            const replyIconOpacity = useRef(new Animated.Value(0)).current;

            const handlePanGesture = useCallback((event: PanGestureHandlerGestureEvent) => {
              const { translationX, velocityX } = event.nativeEvent;

              // Only allow swiping from left to right for replies
              if (translationX <= 0) return;

              const swipeThreshold = 80; // Threshold to trigger reply
              const maxSwipeDistance = 120; // Maximum swipe distance

              // Calculate progress (0 to 1)
              const progress = Math.min(translationX / maxSwipeDistance, 1);

              // Update animated values
              swipeAnimatedValue.setValue(Math.min(translationX, maxSwipeDistance));
              replyIconOpacity.setValue(progress);
            }, []);

            const handlePanStateChange = useCallback((event: PanGestureHandlerStateChangeEvent) => {
              const { state, translationX, velocityX } = event.nativeEvent;

              if (state === State.END) {
                const swipeThreshold = 80;

                // Reset animations
                Animated.parallel([
                  Animated.spring(swipeAnimatedValue, {
                    toValue: 0,
                    useNativeDriver: true,
                  }),
                  Animated.spring(replyIconOpacity, {
                    toValue: 0,
                    useNativeDriver: true,
                  }),
                ]).start();

                const moderationStatus = getModerationStatus(message);
                const isOutgoing = message.getSender()?.getUid() === loggedInUser.current?.getUid();
                if (isOutgoing && moderationStatus && moderationStatus !== "approved" && moderationStatus !== "unmoderated") return;

                // Trigger reply if threshold is met
                if (translationX > swipeThreshold || velocityX > 500) {
                  onReply();
                }
              }
            }, [onReply, message]);

            // Disable swipe-to-reply for agent ("@agentic") messages. Covers both the
            // 1:1 AI chat (isAgenticUser, whole conversation) and agent messages inside a
            // group — where the reply context-menu option is already removed, so the swipe
            // gesture is suppressed to match (otherwise mobile users could still swipe-reply).
            const isAgenticMessage =
              isAgenticUser ||
              message.getSender?.()?.getRole?.() === "@agentic" ||
              message.getCategory?.() === MessageCategoryConstants.agentic;

            return (
              message.getCategory() === MessageCategoryConstants.action || isAgenticMessage ? (
                <View style={staticStyles.positionRelative}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={Platform.OS === "ios" ? onPress : undefined}
                    onLongPress={() => (showOptions ? onLongPress() : undefined)}
                  >
                    <CometChatMessageBubble
                      id={`${message.getId()}`}
                      LeadingView={LeadingView}
                      HeaderView={HeaderView}
                      FooterView={FooterView}
                      ReplyView={ReplyView}
                      alignment={isThreaded ? "left" : bubbleAlignment}
                      ContentView={ContentView}
                      ThreadView={ThreadedView}
                      BottomView={BottomView}
                      StatusInfoView={StatusInfoView}
                      style={getCurrentBubbleStyle(message)}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <PanGestureHandler
                  onGestureEvent={handlePanGesture}
                  onHandlerStateChange={handlePanStateChange}
                  activeOffsetX={[-10, 10]}
                  failOffsetY={[-50, 50]}
                >
                  <Animated.View style={{ transform: [{ translateX: swipeAnimatedValue }] }}>
                    <View style={staticStyles.positionRelative}>
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={Platform.OS === "ios" ? onPress : undefined}
                        onLongPress={() => (showOptions ? onLongPress() : undefined)}
                      >
                        <CometChatMessageBubble
                          id={`${message.getId()}`}
                          LeadingView={LeadingView}
                          HeaderView={HeaderView}
                          FooterView={FooterView}
                          ReplyView={ReplyView}
                          alignment={isThreaded ? "left" : bubbleAlignment}
                          ContentView={ContentView}
                          ThreadView={ThreadedView}
                          BottomView={BottomView}
                          StatusInfoView={StatusInfoView}
                          style={getCurrentBubbleStyle(message)}
                        />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </PanGestureHandler>
              )
            );
          } else {
            return null;
          }
        },
        [
          mergedTheme,
          templates,
          templatesMap,
          getCurrentBubbleStyle,
          getThreadView,
          getFooterView,
          getLeadingView,
          getAlignment,
          highlightedMessageId,
        ]
      );

      const getSentAtTimestamp = useCallback((item: any) => {
        return item.getSentAt() ? item.getSentAt() * 1000 : Date.now();
      }, []);


      //extract once per item
      const sentAtToMs = useCallback((msg?: any): number | undefined => {
        if (!msg) return undefined;
        const raw = typeof msg.getSentAt === "function"
          ? msg.getSentAt()
          : (msg?.sentAt ?? msg?.sent_at ?? msg?.sentOn ?? msg?.senton);
        if (raw === undefined || raw === null) return undefined;
        return raw < 1e12 ? raw * 1000 : raw;
      }, []);

      const makeDayKey = useCallback((ms?: number | undefined) => {
        if (!ms) return null;
        const d = new Date(ms);
        // use local date parts so "Today" follows user's timezone
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      }, []);

      const messageDayKeys = useMemo(() => {
        return messagesList.map((m) => {
          const ms = sentAtToMs(m);
          return makeDayKey(ms); // null if no timestamp
        });
      }, [messagesList]);

      //extract once per item
      const isSameLocalDay = useCallback((ms?: number) => {
        if (!ms) return false;
        const now = new Date();
        const date = new Date(ms);
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        );
      }, []);

      // Memoize separator calculation with cache
      const separatorCache = useRef(new Map<string, boolean>());
      const shouldShowSeparator = useCallback((index: number, currentMs?: number, nextMs?: number) => {
        const cacheKey = `${index}-${currentMs}-${nextMs}`;

        if (separatorCache.current.has(cacheKey)) {
          return separatorCache.current.get(cacheKey)!;
        }

        const listLength = messagesContentListRef.current.length;

        // Last item in small list
        if (index === listLength - 1 && listLength < SMALL_LIST_THRESHOLD) {
          separatorCache.current.set(cacheKey, true);
          return true;
        }

        // Different days
        if (currentMs && nextMs) {
          const currentDate = new Date(currentMs).getDate();
          const nextDate = new Date(nextMs).getDate();
          const result = currentDate !== nextDate;
          separatorCache.current.set(cacheKey, result);
          return result;
        }

        separatorCache.current.set(cacheKey, false);
        return false;
      }, []);

      // Clear cache when messages change
      useEffect(() => {
        separatorCache.current.clear();
      }, [messagesList.length]);

      const getDayHeaderString = useCallback((ms?: number | undefined) => {
        if (!ms) return undefined;
        if (isSameLocalDay(ms)) return t("TODAY") || "Today";
        return dateSeparatorPattern ? dateSeparatorPattern(ms) : undefined;
      }, [isSameLocalDay, t, dateSeparatorPattern]);

      const RenderMessageItem = useCallback(
        ({
          item,
          theme,
          idx,
        }: {
          item: CometChat.BaseMessage;
          theme: CometChatTheme;
          idx: number;
        }) => {
          const index = idx;
          lastMessageDate.current = getSentAtTimestamp(item);
          const id = typeof item?.getId === 'function' ? item.getId() : (item as any)?.id;
          const muid = typeof item?.getMuid === 'function' ? item.getMuid() : (item as any)?.muid;
          return (
            <React.Fragment key={`${id}_${muid}`}>
              <MessageView message={item} currentIndex={index} />
            </React.Fragment>
          );
        },
        [themeMode] // Only recreate when theme mode changes - MessageView accessed via closure
      );

      const keyExtractor = useCallback((item: any, index: number) => {
        // Safely check if methods exist before calling them
        const id = typeof item?.getId === 'function' ? item.getId() : item?.id;
        const muid = typeof item?.getMuid === 'function' ? item.getMuid() : item?.muid;


        // For stream messages in agentic mode, use a unique combination
        // to prevent duplicate keys when navigating between chat and history
        if (item?.isStreamMessage) {
          const targetId = item?.targetMessageId || '';
          return `stream_${id}_${targetId}_${index}`;
        }

        // Use id + muid if both exist
        if (id && muid) {
          return `${id}_${muid}`;
        }


        // Use muid if id doesn't exist (pending message)
        if (muid) {
          return `muid_${muid}`;
        }


        // Use id if muid doesn't exist
        if (id) {
          return `id_${id}`;
        }


        // Fallback to index if neither exist (should not happen, but prevents duplicates)
        if (__DEV__) {
          console.warn('[MessageList] Message without id or muid at index:', index, item);
        }
        return `index_${index}`;
      }, []);

      // `tight` collapses the gap between two consecutive messages of the SAME batch so a
      // fanned-out mixed batch (images + files + audio…) reads as one grouped message.
      const itemSeparator = useCallback(
        (tight?: boolean) => (
          <View style={tight ? staticStyles.itemSeparatorTight : staticStyles.itemSeparator} />
        ),
        [staticStyles]
      );

      const getAgentEmptyView = useCallback(() => {
        if (!user) return <></>;

        const userMetadata = user.getMetadata() as any;
        const displaySuggestions =
          suggestedMessages.length > 0
            ? suggestedMessages
            : (userMetadata?.suggestedMessages as string[]) || [];

        const isDark = mergedTheme.mode === "dark";
        const { background2, textPrimary, textSecondary, borderLight, primary, textTertiary } =
          mergedTheme.color;

        const avatarURL = user.getAvatar();
        const isSVG = avatarURL && (avatarURL.includes(".svg") || avatarURL.includes("svg"));
        const imageSource = !isSVG && avatarURL ? { uri: avatarURL } : undefined;

        return (
          <ScrollView
            contentContainerStyle={staticStyles.emptyScrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={staticStyles.emptyContainer}>
              {emptyChatImageView || (
                <CometChatAvatar
                  image={imageSource}
                  name={user.getName()}
                  style={{
                    containerStyle: {
                      ...staticStyles.avatarContainer,
                      backgroundColor: mergedTheme.avatarStyle.containerStyle?.backgroundColor,
                    },
                    imageStyle: staticStyles.avatarImage,
                    textStyle: {
                      ...staticStyles.avatarText,
                      color: mergedTheme.avatarStyle.textStyle?.color,
                    },
                  }}
                />
              )}

              {emptyChatGreetingView || (
                <Text
                  style={{
                    fontSize: theme.typography.heading4.medium.fontSize,
                    fontWeight: theme.typography.heading4.medium.fontWeight,
                    textAlign: "center",
                    color: textPrimary,
                  }}
                >
                  {userMetadata?.greetingMessage ?? `Hi, I'm ${user.getName()}`}
                </Text>
              )}

              {emptyChatIntroMessageView || (
                <Text
                  style={{
                    fontSize: theme.typography.body.regular.fontSize,
                    fontWeight: theme.typography.body.regular.fontWeight,
                    marginBottom: theme.spacing.spacing.s5,
                    textAlign: "center",
                    lineHeight: 22,
                    paddingHorizontal: 20,
                    color: textTertiary,
                  }}
                >
                  {userMetadata?.introductoryMessage ??
                    "I'm here to help! Ask me anything or choose from the suggestions below."}
                </Text>
              )}

              {!hideSuggestedMessages && displaySuggestions?.length > 0 && (
                <View style={staticStyles.suggestionsWrap}>
                  {displaySuggestions.map((suggestion, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{
                        borderRadius: 20,
                        paddingHorizontal: theme.spacing.spacing.s4,
                        paddingVertical: theme.spacing.spacing.s2,
                        margin: theme.spacing.margin.m1,
                        borderWidth: 1,
                        backgroundColor: isDark ? theme.color.background1 : theme.color.background1,
                        borderColor: isDark
                          ? mergedTheme.color.borderDefault
                          : mergedTheme.color.borderDefault,
                        flexDirection: "row",
                        alignItems: "center",
                        maxWidth: "100%",
                      }}
                      onPress={() => {
                        if (onSuggestedMessageClick) {
                          onSuggestedMessageClick(suggestion);
                        } else {
                          CometChatUIEventHandler.emitUIEvent("ccComposeMessage", {
                            text: suggestion,
                          });
                        }
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: theme.typography.body.regular.fontWeight,
                          fontSize: theme.typography.body.regular.fontSize,
                          color: textSecondary,
                          paddingRight: mergedTheme.spacing.padding.p2,
                          flexShrink: 1,
                        }}
                      >
                        {suggestion}
                      </Text>
                      <Icon size={14} name='right-arrow' color={theme.color.iconSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        );
      }, [
        user,
        suggestedMessages,
        hideSuggestedMessages,
        emptyChatGreetingView,
        emptyChatIntroMessageView,
        emptyChatImageView,
        onSuggestedMessageClick,
        mergedTheme,
      ]);

      const fetchConversationStarters = (): Promise<string[]> => {
        const receiverId = user?.getUid() ?? group?.getGuid() ?? '';
        const receiverType = user
          ? CometChat.RECEIVER_TYPE.USER
          : CometChat.RECEIVER_TYPE.GROUP;
        return CometChat.getConversationStarter(receiverId, receiverType);
      };

      const fetchSmartReplies = (): Promise<string[]> => {
        const msg = latestReceivedMessageRef.current;
        if (!msg) return Promise.resolve([]);
        const receiverId = user?.getUid() ?? group?.getGuid() ?? '';
        const receiverType = user
          ? CometChat.RECEIVER_TYPE.USER
          : CometChat.RECEIVER_TYPE.GROUP;
        return CometChat.getSmartReplies(receiverId, receiverType)
          .then((res) => Object.values(res) as string[]);
      };

      // ponytail: group action messages (e.g. "X joined the group") aren't real
      // conversation messages, so they shouldn't hide the conversation starter chips (ENG-36769).
      const hasOnlyActionMessages = useMemo(
        () =>
          messagesList.length > 0 &&
          messagesList.every(
            (m) => m?.getCategory?.() === MessageCategoryConstants.action
          ),
        [messagesList]
      );

      const getEmptyStateView = useCallback(() => {
        const isAgenticUserCheck = user?.getRole?.() === "@agentic";

        if (isAgenticUserCheck) {
          return getAgentEmptyView();
        }
        if (showConversationStarters) {
          return (
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <CometChatConversationStarter
                getConversationStarters={fetchConversationStarters}
                onSuggestionClicked={(text) => onSuggestedMessageClick?.(text)}
              />
            </View>
          );
        }
        if (EmptyView)
          return (
            <>
              <ScrollView contentContainerStyle={{}}>{EmptyView()}</ScrollView>
            </>
          );
        return (
          <ErrorEmptyView
            containerStyle={
              (mergedTheme.messageListStyles.emptyStateStyle?.containerStyle ??
                mergedTheme?.messageListStyles.containerStyle) as ViewStyle
            }
            titleStyle={mergedTheme.messageListStyles.emptyStateStyle?.textStyle as TextStyle}
          />
        );
      }, [mergedTheme, EmptyView, getAgentEmptyView, user, group, showConversationStarters]);

      const getErrorStateView = useCallback(() => {
        if (hideError) return null;
        if (ErrorView) return ErrorView();
        return (
          <ErrorEmptyView
            title={t("OOPS")}
            subTitle={t("SOMETHING_WENT_WRONG")}
            tertiaryTitle={t("WRONG_TEXT_TRY_AGAIN")}
            Icon={
              <Icon
                name='error-state'
                size={mergedTheme.spacing.spacing.s15 * 2}
                icon={mergedTheme.messageListStyles.errorStateStyle?.icon}
                height={mergedTheme.messageListStyles.errorStateStyle?.iconStyle?.height}
                width={mergedTheme.messageListStyles.errorStateStyle?.iconStyle?.width}
                imageStyle={mergedTheme.messageListStyles.errorStateStyle?.iconStyle}
                containerStyle={mergedTheme.messageListStyles.errorStateStyle?.iconContainerStyle}
              />
            }
            containerStyle={mergedTheme.messageListStyles.errorStateStyle?.containerStyle}
            titleStyle={mergedTheme.messageListStyles.errorStateStyle?.titleStyle}
            subTitleStyle={mergedTheme.messageListStyles.errorStateStyle?.subtitleStyle}
          />
        );
      }, [mergedTheme]);

      const getLoadingStateView = useCallback(() => {
        if (LoadingView) return LoadingView();

        return (
          <View style={staticStyles.skeletonPadding}>
            <MessageSkeleton />
          </View>
        );
      }, []);

      const fetchNextMessages = async () => {
        if (loadingMessagesRef.current || !hasTargetMessageId) return;

        if (messagesContentListRef.current.length === 0) return;

        const newestMessage = messagesContentListRef.current[0];
        const newestMessageId = newestMessage.getId();
        setBottomLoading(true);
        loadingMessagesRef.current = true;

        try {
          let nextMessagesRequest = new CometChat.MessagesRequestBuilder()
            .setLimit(30)
            .setMessageId(newestMessageId);

          if (user) {
            nextMessagesRequest = nextMessagesRequest.setUID(user.getUid());
          }
          if (group) {
            nextMessagesRequest = nextMessagesRequest.setGUID(group.getGuid());
          }
          if (!parentMessageId) {
            nextMessagesRequest = nextMessagesRequest.hideReplies(true);
          }
          // Thread: Server includes only relevant messages
          else {
            nextMessagesRequest = nextMessagesRequest
              .setParentMessageId(Number(parentMessageId))
              .hideReplies(false);
            if (isAgenticUser) {
              nextMessagesRequest = nextMessagesRequest.withParent(true);
            }
          }

          const nextMessages = await nextMessagesRequest.build().fetchNext();
          if (nextMessages.length > 0) {

            const existingIds = new Set(messagesContentListRef.current.map(m => m.getId()));
            const uniqueNewMessages = nextMessages.filter(m => !existingIds.has(m.getId()));

            if (uniqueNewMessages.length > 0) {
              const reversedNewMessages = uniqueNewMessages.reverse();
              messagesContentListRef.current = [
                ...reversedNewMessages,
                ...messagesContentListRef.current
              ];

              setMessagesList(messagesContentListRef.current);
              onLoad && onLoad([...messagesContentListRef.current].reverse());
            }
          } else {
            setHasTargetMessageId(false);
          }
        } catch (error) {
          console.error('[fetchNextMessages] Error:', error);
        } finally {
          setBottomLoading(false);
          loadingMessagesRef.current = false;
        }
      };

      const renderFooter = () => {
        if (!bottomLoading) return null;
        return (
          <View style={staticStyles.footerContainer}>
            <ActivityIndicator size='small' color={mergedTheme.color.primary} />
          </View>
        );
      };

      const scrollHandler = (event: any) => {
        /********************************************************************************
             * layoutMeasurement.height: The height of the visible area within the ScrollView.
             * contentOffset.y: The current vertical scroll position (distance from the top of the content).
                                The y value in contentOffset indicates how far the top edge of the visible area is from the top of the scrollable content.
                                For example:
                                   If contentOffset.y is 0, the top of the visible area is aligned with the top of the content.
                                   If contentOffset.y is 50, the top of the visible area is 50 units (pixels) below the top of the content.
             * contentSize.height: The total height of the scrollable content.
            *********************************************************************************/
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        currentScrollPosition.current.y = contentOffset.y;
        currentScrollPosition.current.contentHeight = contentSize.height;

        if (currentScrollPosition.current.layoutHeight != layoutMeasurement.height) {
          currentScrollPosition.current.layoutHeight = layoutMeasurement.height;
        }
        if (currentScrollPosition.current.scrollViewHeight !== contentSize.height) {
          currentScrollPosition.current.scrollViewHeight = contentSize.height;
        }

        const nearBottom = isNearBottom();
        setHideScrollToBottomButton(nearBottom);

        if (nearBottom && temporaryMessageListRef.current.length > 0) {
          // Merge temporary messages when scrolling near bottom
          messagesContentListRef.current = [
            ...temporaryMessageListRef.current,
            ...messagesContentListRef.current,
          ];
          temporaryMessageListRef.current = [];

          // Update latestMessageRef after merge
          if (messagesContentListRef.current.length > 0) {
            latestMessageRef.current = messagesContentListRef.current[0];
          }

          setMessagesList([...messagesContentListRef.current]);
          onLoad && onLoad([...messagesContentListRef.current].reverse());

          setUnreadCount(0);

          if (hasManuallyMarkedUnread) {
            setHasManuallyMarkedUnread(false);
          }

          if (messagesContentListRef.current.length > 0) {
            const latestMessage = messagesContentListRef.current[0];
            markMessageAsRead(latestMessage);
          }
        }
      };

      const scrollToBottom = useCallback((scrollToFirstUnread = false) => {
        // Merge temporary messages when scrolling to bottom
        if (temporaryMessageListRef.current.length > 0) {
          messagesContentListRef.current = [
            ...temporaryMessageListRef.current,
            ...messagesContentListRef.current,
          ];
          temporaryMessageListRef.current = [];

          // Update latestMessageRef after merge
          if (messagesContentListRef.current.length > 0) {
            latestMessageRef.current = messagesContentListRef.current[0];
          }

          setMessagesList([...messagesContentListRef.current]);
          onLoad && onLoad([...messagesContentListRef.current].reverse());

          if (hasManuallyMarkedUnread) {
            setHasManuallyMarkedUnread(false);
          }
        }

        setUnreadCount(0);
        setHideScrollToBottomButton(true);
        messageListRef.current?.scrollToOffset({ offset: 0 });
        // Clear navigation flags
        setHasTargetMessageId(false);
        setHighlightedMessageId(null);
        setHasManuallyMarkedUnread(false);

        // Mark latest message as read if available
        if (messagesContentListRef.current.length > 0) {
          const latestMessage = messagesContentListRef.current[0];
          markMessageAsRead(latestMessage);
        }
        // setNavigatedFromSearch(false); // navigatedFromSearch is a prop, cannot set it
      }, [hasTargetMessageId, messagesList.length]);

      const handleScrollInternal = useCallback((event: any) => {
        scrollHandler(event);
      }, [scrollHandler]);


      const handleScrollToIndexFailed = useCallback((error: any) => {

        // Calculate dynamic average height from measured items
        const measuredItems = Array.from(itemPositions.values());
        let averageHeight = AVERAGE_ITEM_LENGTH;

        if (measuredItems.length > 0) {
          const totalHeight = measuredItems.reduce((sum, item) => sum + item.height, 0);
          averageHeight = totalHeight / measuredItems.length;
        }

        // Scroll to estimated position to load more items
        const targetOffset = error.index * averageHeight;

        messageListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });

        // After scrolling to load more items, retry scrollToIndex
        setTimeout(() => {
          if (messageListRef.current) {
            try {
              messageListRef.current.scrollToIndex({
                index: error.index,
                animated: true,
                viewPosition: 0.5, // For inverted FlatList
              });
            } catch (retryError) {
              console.warn('Retry scrollToIndex also failed:', retryError);
            }
          }
        }, 300); // Wait for items to load
      }, [itemPositions]);



      // Clear item positions when messages list changes significantly
      // Don't clear on minor changes (like adding one message) or when navigating
      useEffect(() => {
        const lengthDiff = Math.abs(messagesList.length - prevMessagesLength.current);
        const isSignificantChange = lengthDiff > 5; // Only clear if 5+ messages added/removed

        if (isSignificantChange) {
          setItemPositions(new Map());
        }

        prevMessagesLength.current = messagesList.length;
      }, [messagesList.length]);

      // Handle layout measurement for accurate scrolling
      const handleItemLayout = useCallback((event: any, messageId: string) => {
        const { y, height } = event.nativeEvent.layout;
        setItemPositions(prev => {
          const newMap = new Map(prev);
          newMap.set(messageId, { y, height });
          return newMap;
        });
      }, []);
      //
      // Configuration for determining when list items are considered "viewable" (visible on screen)
      // itemVisiblePercentThreshold: 50 means an item is viewable when at least 50% of it is visible
      // This is used by onViewableItemsChanged to detect when messages come into view for auto-read functionality
      const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
      }).current;

      // This function handles marking the conversation as read ONLY when the user scrolls
      // to the "New Message" indicator (the first unread message).
      // This preserves the unread count while the user is viewing searched messages.
      const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (navigatedFromSearch && newMessageIndicatorId && unreadCount > 0 && !hasManuallyMarkedUnread) {
          const indicatorItem = viewableItems.find(
            (item: any) => String(item.item.getId()) === newMessageIndicatorId
          );

          if (indicatorItem) {
            // Mark entire conversation as read when user scrolls to the unread indicator
            if (user) {
              CometChat.markConversationAsRead(user.getUid(), CometChat.RECEIVER_TYPE.USER).catch((e) => {
                console.log("Error marking user conversation as read", e);
              });
            } else if (group) {
              CometChat.markConversationAsRead(group.getGuid(), CometChat.RECEIVER_TYPE.GROUP).catch((e) => {
                console.log("Error marking group conversation as read", e);
              });
            }
            setUnreadCount(0);
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, {
              message: indicatorItem.item,
            });
          }
        }
      }, [navigatedFromSearch, newMessageIndicatorId, unreadCount, user, group, hasManuallyMarkedUnread, parentMessageId]);



      // Optimized FlatList renderItem using memoized component
      const memoizedRenderItem = useCallback(
        ({ item, index }: any) => {
          const nextItem = messagesContentListRef.current[index + 1];
          const prevItem = messagesContentListRef.current[index - 1];
          // Collapse this row's vertical padding (and the separator) toward a neighbour that belongs
          // to the SAME fan-out batch, so a mixed batch (images + files + audio…) reads as one grouped
          // message. Gated on a shared batchId + sender on the NEIGHBOUR alone — that already proves a
          // real multi-message batch, so we do NOT also require the `batchSize > 1` metadata field,
          // which can be absent on reloaded messages and silently left the batch un-clubbed (the big
          // gap). A lone batchId (single-attachment send) has no same-batch neighbour → never tightened.
          // List is inverted: index+1 = older (above), index-1 = newer (below); tightTop shrinks toward
          // the older member, tightBottom toward the newer.
          const tightTop = isSameBatchGroup(item, nextItem);
          const tightBottom = isSameBatchGroup(item, prevItem);
          const currentItemMs = sentAtToMs(item);
          const nextItemMs = sentAtToMs(nextItem);
          const showSeparator = shouldShowSeparator(index, currentItemMs, nextItemMs);
          const ms = currentItemMs ?? Date.now();
          const itemId = typeof item?.getId === 'function' ? item.getId() : (item as any)?.id;
          const isHighlighted = highlightedMessageId === String(itemId);
          const dayHeaderString = getDayHeaderString(ms);
          // Show the "New Messages" indicator above a message if:
          // - startFromUnreadMessages is enabled (to indicate unread messages start here), OR
          // - showMarkAsUnreadOption is enabled (to show where a message was marked as unread)
          // - OR navigatedFromSearch is true (when navigating from search to unread messages)
          // - and this message matches the newMessageIndicatorId
          // - and NOT in agentic mode (agentic chats don't support unread indicators)
          const showNewMessageIndicator = !isAgenticUser && (startFromUnreadMessages || showMarkAsUnreadOption || navigatedFromSearch) && newMessageIndicatorId === String(item.getId());

          return (
            <View>
              <MessageListItem
                item={item}
                index={index}
                showSeparator={showSeparator}
                isHighlighted={isHighlighted}
                highlightAnimatedValue={highlightAnimatedValue}
                theme={mergedTheme}
                themeMode={themeMode}
                timestamp={ms}
                dayHeaderString={dayHeaderString}
                RenderMessageItem={RenderMessageItem}
                itemSeparator={itemSeparator}
                tightTop={tightTop}
                tightBottom={tightBottom}
                staticStyles={staticStyles}
                onLayout={handleItemLayout}
                showNewMessageIndicator={showNewMessageIndicator}
                NewMessageIndicatorView={NewMessageIndicatorView}
                newMessageIndicatorStyle={newMessageIndicatorStyle}
                newMessageIndicatorText={newMessageIndicatorText}
              />
            </View>
          );
        },
        [
          mergedTheme,
          themeMode,
          highlightedMessageId,
          highlightAnimatedValue,
          sentAtToMs,
          shouldShowSeparator,
          getDayHeaderString,
          itemSeparator,
          RenderMessageItem,
          handleItemLayout,
          newMessageIndicatorId,
          NewMessageIndicatorView,
          newMessageIndicatorStyle,
          newMessageIndicatorText,
          startFromUnreadMessages,
          showMarkAsUnreadOption,
          navigatedFromSearch,
          isAgenticUser
        ]
      );


      // §8.3a — reorder each batch's messages by batchIndex for display, so a batch always
      // shows in the sender's order even if the kinds arrived out of order (independent uploads).
      // Keep the neighbour-lookup ref pointing at the SAME ordered list the FlatList renders,
      // so batch grouping (avatar-first / receipt-last) and the pager stay index-consistent.
      const orderedMessagesList = useMemo(() => orderBatchRuns(messagesList), [messagesList]);
      messagesContentListRef.current = orderedMessagesList;

      return (
        <CometChatBatchMediaContext.Provider value={batchMediaContextValue}>
        <View style={mergedTheme.messageListStyles.containerStyle}>
          {listState == "loading" && messagesList.length == 0 ? (
            getLoadingStateView()
          ) : listState == "error" ? (
            getErrorStateView()
          ) : (
            messagesList.length == 0 ? (
              getEmptyStateView()
            ) : (
              <View style={staticStyles.listContainer}>
                {HeaderView && (
                  <View style={staticStyles.headerContainer}>
                    <HeaderView
                      group={group}
                      user={user}
                      id={{
                        guid: group && (group as any)["guid"],
                        uid: user && (user as any)["uid"],
                        parentMessageId: parentMessageId,
                      }}
                    />
                  </View>
                )}
                {loadingMessages && (
                  <View style={staticStyles.activityIndicatorContainer}>
                    <ActivityIndicator size='small' color={mergedTheme.color.primary} />
                  </View>
                )}

                {/* Navigation loading for far message fetching and scroll operations */}
                {navigationLoading && (getLoadingStateView())}
                <FlatList
                  testID="message-list"
                  showsVerticalScrollIndicator={false}
                  ref={messageListRef}
                  onMomentumScrollEnd={handleScrollInternal}
                  onScroll={handleScrollInternal}
                  inverted={true}
                  maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                  }}
                  onEndReachedThreshold={0.5}
                  onEndReached={getPreviousMessages}
                  onStartReached={fetchNextMessages}
                  onStartReachedThreshold={0.5}
                  scrollEventThrottle={16}
                  keyboardShouldPersistTaps={(Platform.OS === "ios" ? "handled" : "always") as "handled" | "always"}
                  data={orderedMessagesList}
                  extraData={themeMode}
                  keyExtractor={keyExtractor}
                  renderItem={memoizedRenderItem}
                  ListHeaderComponent={renderFooter}
                  onScrollToIndexFailed={handleScrollToIndexFailed}
                  viewabilityConfig={viewabilityConfig}
                  onViewableItemsChanged={handleViewableItemsChanged}
                  // Performance optimizations
                  windowSize={10}
                  removeClippedSubviews={Platform.OS === 'android'}
                  maxToRenderPerBatch={5}
                  updateCellsBatchingPeriod={100}
                  initialNumToRender={15}
                />


                {/* ENG-36769: keep conversation starters visible when the group only
                    has action messages (e.g. "X joined the group") and no real messages yet */}
                {showConversationStarters && hasOnlyActionMessages && (
                  <CometChatConversationStarter
                    getConversationStarters={fetchConversationStarters}
                    onSuggestionClicked={(text) => onSuggestedMessageClick?.(text)}
                  />
                )}
                {CustomListHeader && <CustomListHeader />}
                {ongoingCallView}
                {showSmartReplies && showSmartRepliesView && (
                  <CometChatSmartReplies
                    key={smartRepliesKey}
                    getSmartReplies={fetchSmartReplies}
                    onSuggestionClicked={(text) => {
                      setShowSmartRepliesView(false);
                      onSuggestedMessageClick?.(text);
                    }}
                    closeCallback={() => setShowSmartRepliesView(false)}
                  />
                )}
                {FooterView && (
                  <View style={staticStyles.bottomZero}>
                    <FooterView
                      group={group}
                      user={user}
                      id={{
                        guid: group && (group as any)["guid"],
                        uid: user && (user as any)["uid"],
                        parentMessageId: parentMessageId,
                      }}
                    />
                  </View>
                )}
              </View>
            )
          )}

          {!hideScrollToBottomButton && (
            <Pressable
              onPress={newMsgIndicatorPressed}
              style={[mergedTheme.messageListStyles.scrollToBottomButtonStyle.containerStyle]}
            >
              {unreadCount > 0 && (
                <CometChatBadge
                  style={
                    mergedTheme.messageListStyles.scrollToBottomButtonStyle.unreadCountBadgeStyle
                  }
                  count={unreadCount}
                />
              )}

              <Icon
                name='keyboard-arrow-down'
                color={mergedTheme.messageListStyles.scrollToBottomButtonStyle.iconStyle.tintColor}
                height={mergedTheme.messageListStyles.scrollToBottomButtonStyle.iconStyle.height}
                width={mergedTheme.messageListStyles.scrollToBottomButtonStyle.iconStyle.width}
                icon={mergedTheme.messageListStyles.scrollToBottomButtonStyle.icon}
                imageStyle={mergedTheme.messageListStyles.scrollToBottomButtonStyle.iconStyle}
                containerStyle={
                  mergedTheme.messageListStyles.scrollToBottomButtonStyle.iconContainerStyle
                }
              ></Icon>
            </Pressable>
          )}

          <MessageModals
            showDeleteModal={showDeleteModal}
            showReportDialog={showReportDialog}
            deleteItem={deleteItem}
            reportedMessageRef={reportedMessageRef}
            theme={theme}
            hideFlagRemarkField={hideFlagRemarkField}
            t={t}
            onDeleteCancel={() => {
              deleteItem.current = undefined;
              setShowDeleteModal(false);
            }}
            onDeleteConfirm={deleteMessage}
            onReportCancel={() => {
              setShowReportDialog(false);
              reportedMessageRef.current = null;
            }}
            onReportSubmit={(payload) => {
              setShowReportDialog(false);
              reportedMessageRef.current = null;
            }}
          />

          <MessageOptionsSheet
            bottomSheetRef={bottomSheetRef}
            isOpen={showMessageOptions.length > 0 || Boolean(ExtensionsComponent) || messageInfo}
            showMessageOptions={showMessageOptions}
            ExtensionsComponent={ExtensionsComponent}
            messageInfo={messageInfo}
            infoObject={infoObject}
            selectedMessage={selectedMessage}
            hideReactionOption={hideReactionOption}
            quickReactionList={quickReactionList as [string, string?, string?, string?, string?]}
            templatesMap={templatesMap}
            mergedTheme={mergedTheme}
            deleteItem={deleteItem}
            pendingReportRef={pendingReportRef}
            onClose={() => {
              if (ExtensionsComponent) setExtensionsComponent(null);
              setShowMessageOptions([]);
              infoObject.current = null;
              setMessageInfo(false);
            }}
            onReactionPress={reactToMessage}
            onAddReactionPress={onAddReactionPress}
            setShowDeleteModal={setShowDeleteModal}
            setShowReportDialog={setShowReportDialog}
            setShowMessageOptions={setShowMessageOptions}
            setExtensionsComponent={setExtensionsComponent}
            setMessageInfo={setMessageInfo}
            setShowEmojiKeyboard={setShowEmojiKeyboard}
          />

          <ReactionModals
            showEmojiKeyboard={showEmojiKeyboard}
            showReactionList={showReactionList}
            selectedMessage={selectedMessage}
            selectedEmoji={selectedEmoji}
            reactionsRequestBuilder={reactionsRequestBuilder}
            onReactionListItemPress={onReactionListItemPressProp}
            onEmojiSelect={reactToMessage}
            onEmojiKeyboardClose={() => setShowEmojiKeyboard(false)}
            onReactionListClose={() => {
              setShowReactionList(false);
              setSelectedEmoji(undefined);
            }}
            onReactionListEmpty={() => {
              setShowReactionList(false);
              setSelectedEmoji(undefined);
            }}
          />
        </View>
        </CometChatBatchMediaContext.Provider>
      );

    }
  )
);


const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative' as 'relative',
  },
  contentWrapper: {
    position: 'relative' as 'relative',
    zIndex: 2,
  },
  separatorContainer: {
    alignItems: 'center' as 'center',
    marginBottom: 8,
  },
  // Collapse the padding on the side of a message row that faces a same-batch neighbour,
  // so a fanned-out batch reads as one grouped message (vs the default paddingVertical: 8).
  messageTightTop: {
    paddingTop: 2,
  },
  messageTightBottom: {
    paddingBottom: 2,
  },
  // Full-bleed highlight behind a message row; the background colour is animated at the call site.
  highlightOverlay: {
    position: 'absolute' as 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  // When a date separator sits above the row, drop the highlight below it (separator height).
  highlightOverlayBelowSeparator: {
    top: 40,
  },
  footerContainer: {
    padding: 10,
    alignItems: 'center' as 'center',
  },
  itemSeparator: {
    height: 8,
  },
  // Collapsed gap between two members of the same fan-out batch (grouped-message look).
  itemSeparatorTight: {
    height: 2,
  },
  loadingContainer: {
    padding: 16,
  },
  listContainer: {
    height: '100%',
    width: '100%',
  },
  headerContainer: {
    top: 0,
  },
  activityIndicatorContainer: {
    position: 'absolute' as 'absolute',
    alignSelf: 'center' as 'center',
  },
  flexOne: {
    flex: 1,
  },
  emptyScrollView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 40,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    textAlignVertical: "center",
  },
  receiptContainer: {
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 0,
    maxWidth: "100%",
  },
  bottomZero: {
    bottom: 0,
  },
  positionRelative: {
    position: 'relative',
  },
  flexRow: {
    flexDirection: "row",
  },
  skeletonPadding: {
    padding: 16,
  },
})


