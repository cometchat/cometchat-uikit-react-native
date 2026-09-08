/*
 * CometChatConversations.tsx
 * ---------------------------------------------------------------------------
 * CometChatConversations is a React Native component that displays a list of conversations
 * It provides features such as message receipt visibility, custom sound notifications,
 * date formatting, and selection modes (none, single, multiple).
 * It also allows for custom rendering of conversation items, error handling, and loading states.
 * The component supports user and group events, message events, and call events.
 * It also provides options for customizing the appearance of the conversation list.
 * ---------------------------------------------------------------------------
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useCallback, useMemo } from "react";
import { Text, View, GestureResponderEvent, Platform, StyleSheet } from "react-native";
import {
  ChatConfigurator,
  CometChatAvatar,
  CometChatConversationEvents,
  CometChatList,
  CometChatListActionsInterface,
  CometChatMentionsFormatter,
  CometChatRetryButton,
  CometChatSoundManager,
  CometChatStatusIndicator,
  CometChatTextFormatter,
  CometChatUIKit,
  CometChatUiKitConstants,
  CometChatUrlsFormatter,
} from "../shared";
import { CometChatSearch } from "../CometChatSearch";
import { SelectionMode } from "../shared/base/Types";
import {
  ConversationTypeConstants,
  GroupTypeConstants,
  MessageCategoryConstants,
  MessageReceipt,
  MessageStatusConstants,
  ReceiverTypeConstants,
} from "../shared/constants/UIKitConstants";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { Icon } from "../shared/icons/Icon";
import { CommonUtils } from "../shared/utils/CommonUtils";
import { stripMarkdown, preparePreviewText } from "../shared/utils/MarkdownUtils";
import { CometChatRichTextFormatter } from "../shared/formatters/CometChatRichTextFormatter";
import { getMessagePreviewInternal, applyMentionsFormatting } from "../shared/utils/MessageUtils";
import { CometChatBadge } from "../shared/views/CometChatBadge";
import { useToast } from "../shared/helper/useToast";
import {
  PinConversationConfig,
  isConversationPinned,
  isSystemPinnedConversation,
  conversationInsertIndex,
  targetOf,
  pinConversation as sdkPinConversation,
  unpinConversation as sdkUnpinConversation,
  isConversationCapError,
  isConversationNotPinnable,
  isConversationFeatureOff,
  resolveConversationCapLimit,
} from "../shared/utils/PinConversationHelper";
import { CometChatConfirmDialog } from "../shared/views/CometChatConfirmDialog";
import { CometChatDate } from "../shared/views/CometChatDate";
import { CometChatReceipt } from "../shared/views/CometChatReceipt";
import { CometChatTooltipMenu } from "../shared/views/CometChatTooltipMenu";
import { ErrorEmptyView } from "../shared/views/ErrorEmptyView/ErrorEmptyView";
import { useTheme } from "../theme";
import { Skeleton } from "./Skeleton";
import { ConversationStyle, Style } from "./style";
import MessageReceiptUtils from "../shared/utils/MessageReceiptUtils";
import { deepMerge } from "../shared/helper/helperFunctions";
import Delete from "../shared/icons/components/delete";
import { DeepPartial } from "../shared/helper/types";
import { CometChatTheme } from "../theme/type";
import { MenuItemInterface } from "../shared/views/CometChatTooltipMenu/CometChatTooltipMenu";
import { JSX } from "react";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";

let __listenerIdCounter = 0;

// Unique listener IDs for conversation, user, group, message and call events.
const conversationListenerId = "chatlist_" + Date.now() + "_" + (++__listenerIdCounter);
const userListenerId = "chatlist_user_" + Date.now() + "_" + (++__listenerIdCounter);
const groupListenerId = "chatlist_group_" + Date.now() + "_" + (++__listenerIdCounter);
const messageListenerId = "chatlist_message_" + Date.now() + "_" + (++__listenerIdCounter);
const callListenerId = "call_" + Date.now() + "_" + (++__listenerIdCounter);

/** Module-level rich text formatter — reused across renders (no GC churn) */
const conversationRichTextFormatter = new CometChatRichTextFormatter();

/**
 * Interface defining props for the CometChatConversations component.
 */
export interface ConversationInterface {
  /**
   * Hide the submit (selection) button.
   */
  hideSubmitButton?: boolean;
  /**
   * Toggles message receipts (single/double‑tick) inside the subtitle. When
   * `false`, ticks are not rendered for the last outgoing message.
   */
  receiptsVisibility?: boolean;
  /**
   * Toggle sound playback for received messages.
   */
  disableSoundForMessages?: boolean;
  /**
   * Custom sound file path for received messages.
   */
  customSoundForMessages?: string;
  /**
   * Function to generate a custom date string for a conversation.
   * @param conversation - The conversation object.
   * @returns A string representing the date.
   */
  datePattern?: (conversation: CometChat.Conversation) => string;
  /**
   * Completely overrides the default rendering of each conversation item in the list.
   *
   * **Note:** When `ItemView` is provided, all internal rendering logic – including
   * LeadingView, TitleView, SubtitleView, TrailingView – is ignored.
   *
   * **Important:** If you use `ItemView`, you are also responsible for handling:
   *
   * - **`onItemPress`** — trigger conversation open or custom action.
   * - **`onItemLongPress`** — show tooltip or perform contextual action.
   * - **Selection mode** (`selectionMode: "single" | "multiple"`) — you must manage
   *   selection state, checkboxes, and visual feedback yourself.
   */
  ItemView?: (item: CometChat.Conversation) => JSX.Element;
  /**
   * Functional component for rendering options in the app bar.
   */
  AppBarOptions?: () => JSX.Element;
  /**
   * Hide the back button.
   */
  hideBackButton?: boolean;
  /**
   * Selection mode: "none" | "single" | "multiple".
   */
  selectionMode?: SelectionMode;
  /**
   * Callback when conversation selection is complete.
   */
  onSelection?: (conversations: Array<CometChat.Conversation>) => void;
  /**
   * Callback when submit selection button is pressed.
   */
  onSubmit?: (conversation: Array<CometChat.Conversation>) => void;
  /**
   * Custom view for the empty state.
   */
  EmptyView?: () => JSX.Element;
  /**
   * Custom view for the error state.
   */
  ErrorView?: () => JSX.Element;
  /**
   * Custom view for the loading state.
   */
  LoadingView?: () => JSX.Element;
  /**
   * Request builder to fetch conversations.
   */
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
  /**
   * Custom leading view for a conversation item.
   */
  LeadingView?: (conversation: CometChat.Conversation) => JSX.Element;
  /**
   * Custom title view for a conversation item.
   */
  TitleView?: (conversation: CometChat.Conversation) => JSX.Element;
  /**
   * Custom subtitle view for a conversation item.
   */
  SubtitleView?: (item: CometChat.Conversation) => JSX.Element;
  /**
   * Custom tail view for a conversation item.
   */
  TrailingView?: (item: CometChat.Conversation) => JSX.Element;
  /**
   * Hide error view.
   */
  hideError?: boolean;
  /**
   * Callback for when a conversation item is pressed.
   */
  onItemPress?: (item: CometChat.Conversation) => void;
  /**
   * Callback for when a conversation item is long pressed.
   */
  onItemLongPress?: (item: CometChat.Conversation) => void;
  /**
   * Callback when an error occurs while fetching conversations.
   */
  onError?: (e: CometChat.CometChatException) => void;
  /**
   * Callback for when the back action is triggered.
   */
  onBack?: () => void;
  /**
   * Array of text formatter classes.
   */
  textFormatters?: Array<
    CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter
  >;
  /**
   * Custom styles for the conversation view.
   */
  style?: DeepPartial<ConversationStyle>;
  /**
   * Hide the header of the conversation list.
   */
  hideHeader?: boolean;
  /**
   * Callback triggered when the fetched list is empty.
   */
  onEmpty?: () => void;
  /**
   * Callback triggered once the users have loaded and are not empty.
   */
  onLoad?: (list: CometChat.Conversation[]) => void;
  /**
   * A function to **replace** the default menu items entirely for a users.
   */
  options?: (conversation: CometChat.Conversation) => MenuItemInterface[];
  /**
   * A function to **append** more menu items on top of the default menu items for a users.
   */
  addOptions?: (conversation: CometChat.Conversation) => MenuItemInterface[];
  /**
   * Toggle user status visibilty.
   */
  usersStatusVisibility?: boolean;
  /**
   * Toggle group type visibilty.
   */
  groupTypeVisibility?: boolean;
  /**
   * Toggle delete conversation option  visibilty.
   */
  deleteConversationOptionVisibility?: boolean;
  /**
   * Show Pin/Unpin in the conversation long-press menu. Also requires
   * PinConversationConfig.enable() — the module gate — and the app's
   * `features.ux.conversations.pinned.enabled` server flag.
   */
  pinConversationOptionVisibility?: boolean;
  /**
   * Toggle search bar visibility in the conversations header.
   */
  showSearchBar?: boolean;
  /**
   * Callback triggered when the search bar is clicked or focused.
   */
  onSearchBarClicked?: () => void;
  /**
   * Callback triggered when search text changes.
   */
  onSearchTextChanged?: (searchText: string) => void;
  /**
   * Current search text value.
   */
  searchText?: string;
  /**
   * Custom search view component to display in the conversations header.
   */
  SearchView?: () => JSX.Element;

}

/**
 * CometChatConversations is a container component that wraps and formats the conversation list.
 * It handles events such as new messages, typing indicators, call events, and group events.
 */
export const CometChatConversations = (props: ConversationInterface) => {
  const {
    receiptsVisibility = true,
    disableSoundForMessages = false,
    hideHeader = false,
    customSoundForMessages,
    datePattern,
    ItemView,
    AppBarOptions,
    hideSubmitButton = false,
    hideBackButton = true,
    selectionMode = "none",
    onSelection,
    onSubmit,
    EmptyView,
    ErrorView,
    LoadingView,
    conversationsRequestBuilder,
    LeadingView,
    TitleView,
    SubtitleView,
    TrailingView,
    hideError = false,
    onItemPress,
    onItemLongPress,
    onError,
    onBack,
    textFormatters,
    style,
    onEmpty,
    onLoad,
    options,
    addOptions,
    usersStatusVisibility = true,
    groupTypeVisibility = true,
    deleteConversationOptionVisibility = true,
    pinConversationOptionVisibility = true,
    showSearchBar = false,
    onSearchBarClicked,
    onSearchTextChanged,
    searchText = "",
    SearchView,
  } = props;

  // Reference for accessing CometChatList methods
  const conversationListRef = React.useRef<CometChatListActionsInterface>(null);
  const { showToast, ToastElement } = useToast();

  /**
   * Re-seat a conversation at its correct index — the ONE ordering rule, used by
   * pin, unpin and every incoming message.
   *
   * Replaces bare updateAndMoveToFirst, which sent everything to index 0 and so
   * broke two ways once pins existed: a message in a pinned chat reshuffled the
   * pinned block by recency instead of leaving it in its pinned slot, and a message
   * in an unpinned chat jumped it ABOVE the pins.
   *
   * With no pins in the list this is behaviourally identical to
   * updateAndMoveToFirst for a newly-messaged row, so it is a safe generalisation.
   */
  const placeConversation = (row: any) => {
    const id = row?.getConversationId?.();
    if (id === undefined || id === null) return;

    const all = conversationListRef.current?.getAllListItems?.() ?? [];
    const currentIndex = all.findIndex(
      (o: any) => String(o?.getConversationId?.() ?? "") === String(id)
    );
    const targetIndex = conversationInsertIndex(row, all);

    // Not moving? Update in place. This is the COMMON case — a message arriving in
    // a pinned chat, which must keep its slot — and it matters for more than
    // efficiency: removeItemFromList flips the list to NO_DATA_FOUND the moment it
    // empties, so a remove-then-add on a single-row list would flash the empty
    // state. Updating in place never empties it.
    // Not in the list at all — a brand-new conversation, or one the user deleted
    // that just received a message. Insert at the ORDERED index, never at 0: a
    // message in a deleted chat must not surface above the user's pins.
    if (currentIndex === -1) {
      conversationListRef.current?.addItemToList(row, targetIndex);
      return;
    }

    // Not moving? Update in place. This is the COMMON case — a message arriving in
    // a pinned chat, which must keep its slot — and it matters for more than
    // efficiency: removeItemFromList flips the list to NO_DATA_FOUND the moment it
    // empties, so a remove-then-add on a single-row list would flash the empty
    // state. Updating in place never empties it.
    if (currentIndex === targetIndex) {
      conversationListRef.current?.updateList(row);
      return;
    }

    conversationListRef.current?.removeItemFromList(id);
    conversationListRef.current?.addItemToList(row, targetIndex);
  };

  /**
   * Pin or unpin a conversation, OPTIMISTICALLY (owner decision).
   *
   * Unlike the message pin/save flow — which applies the server's response because
   * every message call returns the full updated entity — a conversation pin's whole
   * point is the ROW MOVING. Waiting a round trip before it moves reads as a dead
   * tap, so the row moves first and reverts if the server refuses.
   *
   * Placement goes through placeConversation, the same single ordering rule the
   * incoming-message paths use, so pin, unpin and a new message can never disagree
   * about where a row belongs.
   */
  const togglePinConversation = (conversation: CometChat.Conversation) => {
    const target = targetOf(conversation);
    if (!target) return;

    const wasPinned = isConversationPinned(conversation);
    const clone: any = CommonUtils.clone(conversation);


    // Optimistic flip. The timestamp is a local placeholder — the next fetch
    // replaces it with the server's, and only PRESENCE is ever read anyway.
    if (wasPinned) {
      clone.setPinnedAt?.(undefined);
      clone.setPinnedBy?.(undefined);
      placeConversation(clone);
    } else {
      clone.setPinnedAt?.(Math.floor(Date.now() / 1000));
      placeConversation(clone);
    }

    const call = wasPinned ? sdkUnpinConversation : sdkPinConversation;
    call(target.id, target.type)
      .then((updated: CometChat.Conversation) => {
        // Replace the optimistic guess with the server's own row. The local
        // pinnedAt above was a placeholder; this is the authoritative value, so a
        // later refetch cannot appear to "change" the pin time.
        if (updated) {
          const settled: any = CommonUtils.clone(updated);
          placeConversation(settled);
        }
        showToast(
          wasPinned
            ? (t("CONVERSATION_UNPINNED") ?? "Conversation unpinned")
            : (t("CONVERSATION_PINNED") ?? "Conversation pinned")
        );
      })
      .catch(async (error: any) => {
        // Revert to exactly the object we started from, so a failed pin cannot
        // leave a half-flipped row behind.
        //
        // Through placeConversation, NOT updateList (ENG-38898). The optimistic flip
        // above MOVED the row — that is the whole point of it — so restoring the object
        // is only half the revert. updateList rewrites the row in place and leaves it
        // wherever the optimistic placement put it, which on a refused pin means an
        // unpinned conversation sitting at the top of the list wearing no pin icon.
        // placeConversation re-runs the same ordering rule that moved it and puts it
        // back among the unpinned rows, so a refused pin leaves nothing behind at all.
        placeConversation(CommonUtils.clone(conversation));

        let messageText: string;
        if (isConversationFeatureOff(error)) {
          messageText = t("PIN_SAVE_FEATURE_OFF") ?? "This feature isn't available for this app.";
        } else if (isConversationNotPinnable(error)) {
          messageText = t("CONVERSATION_NOT_PINNABLE") ?? "This conversation can't be pinned yet.";
        } else if (isConversationCapError(error)) {
          // Cap is 5 here, not the messages' 100 — and the server usually does not
          // send the number, so the no-count copy is the expected path.
          // errorParams first, then app settings (SDK getter, ENG-37790).
          const limit = await resolveConversationCapLimit(error);
          messageText =
            limit !== null
              ? (t("PIN_CONVERSATION_LIMIT_REACHED") ??
                  "You can only pin {limit} chats. Unpin one to pin another.")
                  .replace("{limit}", String(limit))
              : (t("PIN_CONVERSATION_LIMIT_REACHED_NO_COUNT") ??
                "You've reached your pinned chats limit. Unpin one to pin another.");
        } else {
          messageText = t("PIN_SAVE_GENERIC_ERROR") ?? "Something went wrong. Please try again.";
        }
        showToast(messageText);
      });
  };
  // Store the logged in user for comparison and event handling.
  const loggedInUser = React.useRef<CometChat.User>(undefined);
  // Buffer receipts by messageId to handle race conditions where receipts arrive
  // before the message becomes the conversation's last message (due to async updateLastMessage)
  const pendingReceiptsMap = React.useRef<Map<string, { readAt?: number; deliveredAt?: number }>>(new Map());
  // State to control the confirmation dialog for deleting a conversation.
  const [confirmDelete, setConfirmDelete] = React.useState<string | undefined>(undefined);
  /**
   * The conversation awaiting unpin confirmation, or undefined. Holds the whole
   * conversation rather than an id because togglePinConversation needs the object,
   * and `longPressedConversation` has already moved on by the time the user answers.
   */
  const [confirmUnpin, setConfirmUnpin] = React.useState<CometChat.Conversation | undefined>(
    undefined
  );
  // State to control selection mode for conversation items.
  const [selecting, setSelecting] = React.useState(selectionMode === "none" ? false : true);
  const [selectedConversation, setSelectedConversations] = React.useState<
    Array<CometChat.Conversation>
  >([]);
  // Timer for debouncing member-added events.
  const onMemberAddedToGroupDebounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // Reference to store long press identifier.
  const longPressId = React.useRef<string | undefined>(undefined);
  const longPressedConversation = React.useRef<CometChat.Conversation>(undefined);

  // Reference to store tooltip position for long press events.
  const tooltipPositon = React.useRef({
    pageX: 0,
    pageY: 0,
  });
  const [tooltipVisible, setTooltipVisible] = React.useState(false);

  // Merge theme styles with provided style overrides.
  const theme = useTheme();
  const { t } = useCometChatTranslation()

  // Configure conversation subtitle formatter with theme-aware inline code colors
  useMemo(() => {
    conversationRichTextFormatter.setStyle({
      inlineCodeStyle: {
        color: theme.color.primary as string,
      },
      inlineCodeContainerStyle: {
        backgroundColor: "rgba(120, 120, 128, 0.22)",
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: "rgba(120, 120, 128, 0.35)",
        paddingHorizontal: 4,
        paddingVertical: 1,
      },
    });
  }, [theme]);

  const mergedStyles = useMemo(() => {
    const baseStyles = deepMerge(theme.conversationStyles, style ?? {});
    // Add search styling for CometChatList component
    return {
      ...baseStyles,
      searchStyle: {
        textStyle: {
          color: theme.color.textPrimary,
          ...theme.typography.heading4.regular,
        },
        placehodlerTextStyle: {
          color: theme.color.textTertiary,
        },
        containerStyle: {
          backgroundColor: theme.color.background3,
          borderRadius: theme.spacing.radius.max,
          paddingHorizontal: theme.spacing.spacing.s3,
          marginVertical: theme.spacing.spacing.s2,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          gap: theme.spacing.spacing.s1,
        },
        iconStyle: {
          tintColor: theme.color.iconSecondary,
          width: 24,
          height: 24,
        },
      },
    } as any;
  }, [theme, style]);



  /**
   * ErrorStateView renders a view to show when an error occurs.
   */
  const ErrorStateView = useCallback(() => {
    if (hideError) return null;
    return (
      <ErrorEmptyView
        title={t("OOPS")}
        subTitle={t("SOMETHING_WENT_WRONG")}
        tertiaryTitle={t("WRONG_TEXT_TRY_AGAIN")}
        Icon={
          <Icon
            name='error-state'
            size={theme.spacing.margin.m15 << 1}
            containerStyle={{
              marginBottom: theme.spacing.margin.m5,
              ...mergedStyles?.errorStateStyle?.iconContainerStyle,
            }}
            icon={mergedStyles?.errorStateStyle?.icon}
            imageStyle={mergedStyles?.errorStateStyle?.iconStyle}
          />
        }
        containerStyle={mergedStyles?.errorStateStyle?.containerStyle}
        titleStyle={mergedStyles?.errorStateStyle?.titleStyle}
        subTitleStyle={mergedStyles?.errorStateStyle?.subTitleStyle}
        RetryView={<CometChatRetryButton onPress={() => conversationListRef.current?.reload()} />}
      />
    );
  }, [theme, mergedStyles, hideError]);

  /**
   * EmptyStateView renders a view when no conversations are available.
   */
  const EmptyStateView = useCallback(() => {
    return (
      <ErrorEmptyView
        title={t("NO_CONVERSATIONS")}
        subTitle={t("CONVERSATIONS_EMPTY_MESSAGE")}
        Icon={
          <Icon
            name='empty-state'
            size={theme.spacing.spacing.s15 << 1}
            containerStyle={{
              marginBottom: theme.spacing.spacing.s5,
              ...mergedStyles?.emptyStateStyle?.iconContainerStyle,
            }}
            icon={mergedStyles?.emptyStateStyle?.icon}
            imageStyle={mergedStyles?.emptyStateStyle?.iconStyle}
          />
        }
        containerStyle={mergedStyles?.emptyStateStyle?.containerStyle}
        titleStyle={mergedStyles?.emptyStateStyle?.titleStyle}
        subTitleStyle={mergedStyles?.emptyStateStyle?.subTitleStyle}
      />
    );
  }, [theme, mergedStyles]);

  /**
   * Handler for user online/offline events. Finds the corresponding conversation and updates it.
   */
  const userEventHandler = (...args: any[]) => {
    const { uid } = args[0];
    let item: CometChat.Conversation | any =
      (conversationListRef.current?.getListItem(
        `${uid}_user_${loggedInUser.current?.getUid()}`
      ) as unknown as CometChat.Conversation) ||
      (conversationListRef.current?.getListItem(
        `${loggedInUser.current?.getUid()}_user_${uid}`
      ) as unknown as CometChat.Conversation);
    if (!item) return;
    const user: CometChat.User = item.getConversationWith();
    if (user.getBlockedByMe() || user.getHasBlockedMe()) return;
    if (item) {
      let updatedConversation = CommonUtils.clone(item);
      updatedConversation.setConversationWith(args[0]);
      conversationListRef.current?.updateList(updatedConversation);
    }
  };

  /**
   * Returns a conversation that matches a typing indicator.
   */
  const getConversationRefFromTypingIndicator = (typingIndicator: CometChat.TypingIndicator) => {
    let list = conversationListRef.current?.getAllListItems();
    return list?.find((item: CometChat.Conversation) => {
      return (
        (typingIndicator.getReceiverType() == ReceiverTypeConstants.user &&
          item.getConversationType() == ReceiverTypeConstants.user &&
          (item.getConversationWith() as CometChat.User).getUid() ==
            typingIndicator.getSender().getUid() &&
          !(
            (item.getConversationWith() as CometChat.User)?.getBlockedByMe() ||
            (item.getConversationWith() as CometChat.User)?.getHasBlockedMe()
          )) ||
        (typingIndicator.getReceiverType() == ReceiverTypeConstants.group &&
          item.getConversationType() == ReceiverTypeConstants.group &&
          (item.getConversationWith() as CometChat.Group).getGuid() ==
            typingIndicator.getReceiverId())
      );
    });
  };

  /**
   * Handler for typing events in conversations.
   * Toggle the *live typing…* indicator on a conversation row.
   */
  const typingEventHandler = (...args: any) => {
    let conversation: CometChat.Conversation = CommonUtils.clone(
      getConversationRefFromTypingIndicator(args[0])
    );
    if (conversation) {
      let isTyping = args[1];
      let newConversation = conversation;
      if (isTyping && !newConversation?.["lastMessage"]?.["typing"]) {
        newConversation["lastMessage"]["typing"] =
          args[0]?.receiverType === "group"
            ? `${args[0].sender.name} ${t("IS_TYPING")}`
            : t("IS_TYPING");
      } else {
        delete newConversation["lastMessage"]["typing"];
      }
      conversationListRef.current?.updateList(newConversation);
    }
  };

  /**
   * Checks and updates the last message in a conversation if it matches the provided message.
   * @param newMessage - The new message object.
   */
  const checkAndUpdateLastMessage = (newMessage: CometChat.BaseMessage) => {
    CometChat.CometChatHelper.getConversationFromMessage(newMessage).then(
      (conversation: CometChat.Conversation) => {
        let conver: CometChat.Conversation = conversationListRef.current?.getListItem(
          conversation.getConversationId()
        );
        if (!conver) return;
        let lastMessageId = conver.getLastMessage()?.getId();
        if (lastMessageId == newMessage.getId()) {
          // Preserve the real-time user status from the existing conversation.
          // The server-returned conversation may have stale user status/lastActiveAt.
          const existingWith = conver.getConversationWith();
          const newWith = conversation.getConversationWith();
          if (existingWith instanceof CometChat.User && newWith instanceof CometChat.User) {
            if (existingWith.getStatus() === "online" && newWith.getStatus() !== "online") {
              newWith.setStatus("online");
              const existingLastActive = existingWith.getLastActiveAt();
              if (existingLastActive) {
                newWith.setLastActiveAt(existingLastActive);
              }
            }
          }
          // Preserve receipt status from the existing conversation if the server-returned
          // conversation has stale receipt info (due to async timing)
          const existingLastMsg = conver.getLastMessage();
          const newLastMsg = conversation.getLastMessage();
          if (existingLastMsg && newLastMsg && existingLastMsg.getId() === newLastMsg.getId()) {
            if (existingLastMsg.getReadAt?.() && !newLastMsg.getReadAt?.()) {
              newLastMsg.setReadAt(existingLastMsg.getReadAt());
            }
            if (existingLastMsg.getDeliveredAt?.() && !newLastMsg.getDeliveredAt?.()) {
              newLastMsg.setDeliveredAt(existingLastMsg.getDeliveredAt());
            }
          }
          conversationListRef.current?.updateList(CommonUtils.clone(conversation));
        }
      }
    );
  };

  /**
   * Determines whether the last message and unread count should be updated.
   * @param message - The message to check.
   * @returns True if an update is needed.
   */
  const shouldUpdateLastMessageAndUnreadCount = (message: CometChat.BaseMessage) => {
    // Do not update for threaded messages if not enabled.
    if (
      message.getParentMessageId() &&
      !CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnMessageReplies()
    ) {
      return false;
    }

    // Do not update for custom messages if not allowed.
    if (message.getCategory() == CometChatUiKitConstants.MessageCategoryConstants.custom) {
      let customMessage = message as CometChat.CustomMessage;

      // Group calls arrive as custom messages with type "meeting" — 
      // they should respect the call activities setting, not the custom messages setting.
      if (customMessage.getType() === CometChatUiKitConstants.MessageTypeConstants.meeting) {
        return CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities();
      }

      // When "Include Custom Messages" is OFF, block all custom messages from updating unread count
      if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCustomMessages()) {
        return false;
      }
    }

    // Check for group actions.
    if (
      message.getCategory() == CometChatUiKitConstants.MessageCategoryConstants.action &&
      message.getReceiverType() == CometChatUiKitConstants.ReceiverTypeConstants.group
    ) {
      return CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnGroupActions();
    }

    // Check for call activities.
    if (
      message.getCategory() == CometChatUiKitConstants.MessageCategoryConstants.call &&
      !CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()
    ) {
      return false;
    }
    return true;
  };

  /**
   * Updates the conversation with a new message and moves it to the top of the list.
   * @param newMessage - The new message to update.
   */
  const updateLastMessage = (newMessage: CometChat.BaseMessage) => {
    CometChat.CometChatHelper.getConversationFromMessage(newMessage)
      .then((conversation) => {
        if (newMessage.getCategory() === MessageCategoryConstants.interactive) {
          // TODO: Show unsupported message view.
        }
        const oldConversation: CometChat.Conversation = conversationListRef.current?.getListItem(
          conversation.getConversationId()
        );
        if (oldConversation == undefined) {
          // If conversation not found, add it.
          CometChat.CometChatHelper.getConversationFromMessage(newMessage)
            .then((newConversation) => {
              if (
                newConversation?.getLastMessage().getSender().getUid() !==
                loggedInUser.current?.getUid()
              )
                newConversation.setUnreadMessageCount(1);
              placeConversation(newConversation);
            })
            .catch((err) => onError && onError(err));
          return;
        }
        // Preserve receipt status if the existing last message is the same message
        // (receipts may have arrived while this async operation was in flight)
        const existingLastMessage = oldConversation.getLastMessage();
        if (existingLastMessage && existingLastMessage.getId() === newMessage.getId()) {
          if (existingLastMessage.getReadAt?.() && !newMessage.getReadAt?.()) {
            newMessage.setReadAt(existingLastMessage.getReadAt());
          }
          if (existingLastMessage.getDeliveredAt?.() && !newMessage.getDeliveredAt?.()) {
            newMessage.setDeliveredAt(existingLastMessage.getDeliveredAt());
          }
        }
        // Also check if a receipt arrived BEFORE this message was set as lastMessage
        // (race condition: receipt fires before updateLastMessage completes)
        const newMsgId = String(newMessage.getId?.() ?? "");
        const bufferedReceipt = pendingReceiptsMap.current.get(newMsgId);
        if (bufferedReceipt) {
          if (bufferedReceipt.readAt && !newMessage.getReadAt?.()) {
            newMessage.setReadAt(bufferedReceipt.readAt);
          }
          if (bufferedReceipt.deliveredAt && !newMessage.getDeliveredAt?.()) {
            newMessage.setDeliveredAt(bufferedReceipt.deliveredAt);
          }
        }
        // Update last message and unread count.
        oldConversation.setLastMessage(newMessage);
        if (newMessage.getSender().getUid() != loggedInUser.current?.getUid())
          oldConversation.setUnreadMessageCount(oldConversation.getUnreadMessageCount() + 1);
        placeConversation(CommonUtils.clone(oldConversation));
      })
      .catch((err) => {
        console.log("Error", err);
      });
  };

  /**
   * Plays the notification sound for incoming messages.
   */
  const playNotificationSound = () => {
    if (disableSoundForMessages) return;
    CometChatSoundManager.play(
      customSoundForMessages || CometChatSoundManager.SoundOutput.incomingMessageFromOther
    );
  };

  /**
   * Determines if a message should be marked as delivered.
   * @param message - The message object.
   * @returns True if the message does not have a "deliveredAt" property.
   */
  const shouldMarkAsDelivered = (message: object) => {
    return !message.hasOwnProperty("deliveredAt");
  };

  /**
   * Marks a message as delivered and plays notification sound if applicable.
   * @param message - The message to mark as delivered.
   */
  const markMessageAsDelivered = (message: CometChat.BaseMessage) => {
    if (message.hasOwnProperty("deletedAt")) return;

    if (shouldMarkAsDelivered(message)) {
      CometChat.markAsDelivered(message);
      playNotificationSound();
    }
  };

  /**
   * Updates message receipt for the conversation.
   * @param receipt - The message receipt.
   */
  const updateMessageReceipt = (receipt: CometChat.MessageReceipt) => {
    const receiptMessageId = typeof (receipt as any).getMessageId === 'function' ? String((receipt as any).getMessageId()) : String((receipt as any)["messageId"] ?? "");

    // Always buffer the receipt by messageId — this handles race conditions where
    // the receipt arrives before updateLastMessage has set the message as lastMessage
    if (receiptMessageId) {
      const existing = pendingReceiptsMap.current.get(receiptMessageId) || {};
      if (receipt.getReadAt()) existing.readAt = receipt.getReadAt();
      if (receipt.getDeliveredAt()) existing.deliveredAt = receipt.getDeliveredAt();
      pendingReceiptsMap.current.set(receiptMessageId, existing);
    }

    const conv: CometChat.Conversation | boolean =
      receipt?.getReceiverType() === ReceiverTypeConstants.user
        ? (conversationListRef.current?.getListItem(
            `${receipt?.getReceiver()}_user_${receipt?.getSender().getUid()}`
          ) as unknown as CometChat.Conversation) ||
          (conversationListRef.current?.getListItem(
            `${receipt?.getSender()?.getUid()}_user_${receipt?.getReceiver()}`
          ) as unknown as CometChat.Conversation)
        : [
            receipt.RECEIPT_TYPE.DELIVERED_TO_ALL_RECEIPT,
            receipt.RECEIPT_TYPE.READ_BY_ALL_RECEIPT,
          ].includes(receipt?.getReceiptType()) &&
          (conversationListRef.current?.getListItem(
            `group_${receipt?.getReceiver()}`
          ) as unknown as CometChat.Conversation);

    if (
      conv &&
      (conv as CometChat.Conversation).getConversationType() == ConversationTypeConstants.group &&
      (conv as CometChat.Conversation).getLastMessage().getSender().getUid() !== loggedInUser.current?.getUid()
    ) {
      return;
    }

    if (conv && (conv as CometChat.Conversation)?.getLastMessage) {
      let newConversation = CommonUtils.clone(conv as CometChat.Conversation);
      const lastMessage = newConversation.getLastMessage();

      // Only update if the last message was sent by the logged-in user (receipts are for outgoing messages)
      if (lastMessage?.getSender?.()?.getUid?.() !== loggedInUser.current?.getUid()) {
        return;
      }

      // Apply any buffered receipt for this specific message
      const lastMsgId = String(lastMessage?.getId?.() ?? "");
      const pending = pendingReceiptsMap.current.get(lastMsgId);

      let updated = false;

      // Apply read status — never downgrade (if already read, skip)
      const readAtToApply = pending?.readAt || (receipt.getReadAt() && String(receiptMessageId) === lastMsgId ? receipt.getReadAt() : undefined);
      if (readAtToApply && !lastMessage.getReadAt?.()) {
        lastMessage.setReadAt(readAtToApply);
        updated = true;
      }

      // Apply delivered status — never downgrade (if already read or delivered, skip delivered)
      const deliveredAtToApply = pending?.deliveredAt || (receipt.getDeliveredAt() && String(receiptMessageId) === lastMsgId ? receipt.getDeliveredAt() : undefined);
      if (deliveredAtToApply && !lastMessage.getDeliveredAt?.() && !lastMessage.getReadAt?.()) {
        lastMessage.setDeliveredAt(deliveredAtToApply);
        updated = true;
      }

      if (updated) {
        conversationListRef.current?.updateList(newConversation);
      }
    }
  };

  /**
   * Handler for when a message (text/media/custom) is received.
   * Marks the message as delivered and updates the conversation.
   * @param args - Contains the new message.
   */
  const messageEventHandler = (...args: any) => {
    let message = args[0];
    markMessageAsDelivered(message);
    updateLastMessage(message);
  };

  /**
   * Handler for various group actions such as member kicked, banned, left, or scope change.
   * @param message - The action message.
   * @param otherDetails - Additional details about the action.
   */
  const groupHandler = (
    message: CometChat.Action,
    otherDetails: {
      action?: string;
      actionOn?: CometChat.User;
      actionBy?: CometChat.User;
      group?: CometChat.Group;
      newScope?: CometChat.GroupMemberScope;
      oldScope?: CometChat.GroupMemberScope;
    } = {},
    _depth: number = 0
  ) => {
    if (!conversationListRef.current) return;

    let conversation: CometChat.Conversation = conversationListRef.current.getListItem(
      message.getConversationId()
    ) as unknown as CometChat.Conversation;
    let { action, actionOn, group, newScope, oldScope } = otherDetails;

    if (conversation) {
      if (action === "scopeChange" && actionOn?.getUid() !== loggedInUser.current?.getUid()) {
        oldScope = undefined;
        newScope = undefined;
      }

      if (
        action &&
        ["kicked", "banned", "left"].includes(action) &&
        actionOn &&
        actionOn.getUid() === loggedInUser.current?.getUid()
      ) {
        conversationListRef.current.removeItemFromList(message.getConversationId());
        return;
      } else {
        if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnGroupActions()) {
          return;
        }

        // Helper to apply group action updates to a conversation
        const applyGroupUpdate = (conv: CometChat.Conversation, unreadCount?: number) => {
          conv.setLastMessage(message);
          if (group) {
            const currentScope = (conv.getConversationWith() as CometChat.Group).getScope();
            const resolvedScope = newScope ?? oldScope ?? currentScope;
            if (!group.getScope()) {
              group.setScope(resolvedScope);
            }
            conv.setConversationWith(group);
          }
          if (unreadCount !== undefined) {
            conv.setUnreadMessageCount(unreadCount);
          }
          conversationListRef.current?.updateList(conv);
        };

        // Update immediately with incremented unread count for instant UI feedback
        const currentUnread = conversation.getUnreadMessageCount() || 0;
        applyGroupUpdate(conversation, currentUnread + 1);
      }
    } else {
      if (_depth > 0) return; // Already retried once — don't recurse further

      CometChat.CometChatHelper.getConversationFromMessage(message).then((newConversation) => {
        const existingConv = conversationListRef.current?.getListItem(
          message.getConversationId()
        ) as unknown as CometChat.Conversation;
        if (existingConv) {
          groupHandler(message, otherDetails, _depth + 1);
        } else {
          placeConversation(newConversation);
        }
      }).catch(() => {
        // Silently ignore — conversation won't appear until next refresh
      });
    }
  };

  /**
   * Handles the conversation click event.
   * If an onItemPress callback is provided, it is invoked.
   * Else, toggles selection of the conversation.
   * @param conversation - The conversation object that was clicked.
   */
  const conversationClicked = (conversation: CometChat.Conversation) => {
    if (onItemPress) {
      onItemPress(conversation);
      return;
    }
    if (!selecting) {
      // Fire event if not selecting.
      return;
    }

    if (selectionMode == "none") return;

    let index = selectedConversation.findIndex(
      (tmpConver: CometChat.Conversation) =>
        tmpConver.getConversationId() == conversation.getConversationId()
    );
    if (index < 0) {
      if (selectionMode == "single") setSelectedConversations([conversation]);

      if (selectionMode == "multiple")
        setSelectedConversations([...selectedConversation, conversation]);
    } else {
      selectedConversation.splice(index, 1);
      setSelectedConversations([...selectedConversation]);
    }
  };

  /**
   * Removes a conversation from the selection list.
   * @param id - The conversation ID.
   */
  const removeItemFromSelectionList = (id: any) => {
    if (selecting) {
      let index = selectedConversation.findIndex((member) => member.getConversationId() == id);
      if (index > -1) {
        let tmpSelectedConversations = [...selectedConversation];
        tmpSelectedConversations.splice(index, 1);
        setSelectedConversations(tmpSelectedConversations);
      }
    }
  };

  /**
   * Removes a conversation from the list by calling the delete API and then updating the UI.
   * @param id - The conversation ID to remove.
   */
  const removeConversation = (id: string) => {
    let conversation = conversationListRef.current?.getListItem(id);
    const { conversationWith, conversationType } = conversation;
    let conversationWithId =
      conversationType == "group" ? conversationWith.guid : conversationWith.uid;
    CometChat.deleteConversation(conversationWithId, conversationType)
      .then((success) => {
        CometChatUIEventHandler.emitConversationEvent(
          CometChatConversationEvents.ccConversationDeleted,
          { conversation: conversation }
        );
        conversationListRef.current?.removeItemFromList(id);
        removeItemFromSelectionList(id);
      })
      .catch((err) => console.log(err));
  };

  /**
   * Returns a formatted preview for the last message in a conversation.
   * @param conversations - The conversation object.
   * @param theme - The theme object.
   * @returns A JSX.Element containing the preview.
   */
  const getMessagePreview = (conversations: CometChat.Conversation, theme?: CometChatTheme) => {
    const loggedInUserId = CometChatUIKit.loggedInUser?.getUid() ?? "";
    let lastMessage: CometChat.BaseMessage =
      conversations?.getLastMessage && conversations.getLastMessage();
    if (!lastMessage) return null;
    let messageText: string | JSX.Element = "";
    messageText = ChatConfigurator.getDataSource().getLastConversationMessage(conversations, theme);
    
    // Detect block-level elements in text messages before stripMarkdown flattens them
    let blockType: 'blockquote' | 'codeBlock' | 'list' | null = null;
    let codeBlockLine = '';
    let listPrefix = '';
    if (
      lastMessage instanceof CometChat.TextMessage &&
      lastMessage.getCategory() === MessageCategoryConstants.message &&
      typeof messageText === "string"
    ) {
      const rawText = messageText;
      const preview = preparePreviewText(rawText);
      if (preview.isBlockquote) {
        blockType = 'blockquote';
        // Run formatter on content only (no `> ` prefix) so it won't re-parse as block
        messageText = getFormattedText(lastMessage, preview.text.trim());
      } else if (preview.codeBlockFirstLine !== null) {
        blockType = 'codeBlock';
        codeBlockLine = preview.codeBlockFirstLine;
      } else if (preview.listPrefix) {
        blockType = 'list';
        listPrefix = preview.listPrefix;
        messageText = getFormattedText(lastMessage, preview.text.trim());
      } else {
        messageText = getFormattedText(lastMessage, preview.text.trim());
      }
    } else if (lastMessage && typeof messageText === "string") {
      messageText = getFormattedText(lastMessage, messageText?.trim());
    }

    if (
      lastMessage instanceof CometChat.TextMessage &&
      lastMessage.getCategory() === MessageCategoryConstants.message &&
      (() => {
        const text = typeof lastMessage.getText === "function" ? lastMessage.getText() : undefined;
        return typeof text === "string" && text.slice(0, 50).match(/https?:\/\//);
      })()
    ) {
      messageText = getMessagePreviewInternal("link-fill", t("LINK"), { theme });
    } else if (blockType === 'codeBlock') {
      messageText = (
        <View style={conversationPreviewStyles.codeBlockRow}>
          <View style={[conversationPreviewStyles.codeBlockBadge, { backgroundColor: theme?.color?.background2 as string || '#FAFAFA', borderColor: theme?.color?.borderDefault as string || '#E8E8E8' }]}>
            <Text numberOfLines={1} ellipsizeMode='tail' style={[conversationPreviewStyles.codeBlockText, { color: theme?.color?.textPrimary as string || '#141414' }]}>
              {codeBlockLine + '..'}
            </Text>
          </View>
        </View>
      );
    } else if (blockType === 'blockquote') {
      messageText = (
        <View style={conversationPreviewStyles.blockquoteRow}>
          <View style={[conversationPreviewStyles.blockquoteBar, { backgroundColor: theme?.color?.primary as string }]} />
          <Text numberOfLines={1} ellipsizeMode='tail' style={[mergedStyles.itemStyle.subtitleStyle, conversationPreviewStyles.blockquoteText]}>
            {messageText}
          </Text>
        </View>
      );
    } else if (blockType === 'list') {
      messageText = (
        <Text
          style={[mergedStyles.itemStyle.subtitleStyle, { flexShrink: 2 }]}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {listPrefix}{messageText}{'...'}
        </Text>
      );
    } else if (messageText && typeof messageText === 'string') {
      messageText = (
        <Text
          style={[mergedStyles.itemStyle.subtitleStyle, { flexShrink: 2 }]}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {messageText}
        </Text>
      );
    } else if (messageText && typeof messageText !== 'string') {
      // JSX element from rich text formatter — wrap with truncation
      messageText = (
        <Text
          style={[mergedStyles.itemStyle.subtitleStyle, { flexShrink: 2 }]}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {messageText}
        </Text>
      );
    }

    let groupText = "";
    if (!(lastMessage instanceof CometChat.Action)) {
      if (lastMessage.getReceiverType() == ReceiverTypeConstants.group) {
        if (lastMessage.getSender().getUid() == loggedInUserId) {
          groupText = t("YOU") + ": ";
        } else {
          groupText = lastMessage.getSender().getName() + ": ";
        }
      }
    }

    return (
      <>
        {groupText && (
          <Text
            style={[mergedStyles.itemStyle.subtitleStyle, conversationPreviewStyles.subtitleClamp]}
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {groupText}
          </Text>
        )}
        {messageText}
      </>
    );
  };

  /**
   * Applies text formatters to the message text.
   * @param message - The message object.
   * @param subtitle - The raw text to format.
   * @returns The formatted text.
   */
  function getFormattedText(message: CometChat.BaseMessage, subtitle: string) {
    // For text messages, use the rich text formatter to preserve inline styles
    // (bold, italic, underline, strikethrough, inline code). The subtitle has
    // already been processed by preparePreviewText which strips block-level
    // markers, so the formatter will only encounter inline formatting.
    let messageTextTmp: string | JSX.Element;
    if (
      message instanceof CometChat.TextMessage &&
      message.getCategory() === MessageCategoryConstants.message
    ) {
      const formatted = conversationRichTextFormatter.getFormattedText(subtitle);
      messageTextTmp = formatted ?? subtitle;
    } else {
      // Non-text messages: strip markdown as before
      messageTextTmp = stripMarkdown(subtitle);
    }
    let allFormatters = [...(textFormatters || [])];

    // Apply mentions formatting using shared helper (DRY — same as CometChatMessagePreview)
    messageTextTmp = applyMentionsFormatting(message, messageTextTmp, subtitle, mergedStyles.mentionsStyles);

    if (
      message instanceof CometChat.TextMessage &&
      message.getCategory() === MessageCategoryConstants.message &&
      (() => {
        const text = typeof message.getText === "function" ? message.getText() : undefined;
        return typeof text === "string" && text.slice(0, 50).match(/https?:\/\//);
      })()
    ) {
      // For link messages, simply return the text.
      return messageTextTmp;
    }

    if (allFormatters && allFormatters.length) {
      for (let i = 0; i < allFormatters.length; i++) {
        let suggestionUsers = allFormatters[i].getSuggestionItems();
        allFormatters[i].setMessage(message);
        suggestionUsers.length > 0 && allFormatters[i].setSuggestionItems(suggestionUsers);
        let _formatter = CommonUtils.clone(allFormatters[i]);
        messageTextTmp = _formatter.getFormattedText(
          messageTextTmp,
          mergedStyles.itemStyle.subtitleStyle
        );
      }
    }

    return messageTextTmp;
  }

  /**
   * Component to render the last message view for a conversation item.
   * @param params - Contains conversation and typing indicator text.
   * @returns A JSX.Element rendering the last message.
   */
  const LastMessageView = (params: {
    conversations: CometChat.Conversation;
    typingText: string;
  }) => {
    const lastMessage = params.conversations.getLastMessage();
    if (!lastMessage)
      return (
        <Text
          style={[mergedStyles.itemStyle.subtitleStyle]}
          numberOfLines={1}
          ellipsizeMode={"tail"}
        >
          {t("TAP_TO_START_CONVERSATION")}
        </Text>
      );
    let readReceipt;
    if (params.typingText) {
      return (
        <View style={Style.row}>
          <Text
            numberOfLines={1}
            ellipsizeMode={"tail"}
            style={[mergedStyles.typingIndicatorStyle]}
          >
            {params.typingText}
          </Text>
        </View>
      );
    }

    if (
      lastMessage &&
      lastMessage.getSender().getUid() == loggedInUser.current?.getUid() &&
      !lastMessage.getDeletedAt()
    ) {
      const status = MessageReceiptUtils.getReceiptStatus(lastMessage);
      readReceipt =
        !receiptsVisibility || lastMessage?.getDeletedAt() ? null : (
          <CometChatReceipt receipt={status as MessageReceipt} style={mergedStyles.itemStyle.receiptStyles} />
        );
    }

    let threadView: JSX.Element | null = null;

    if (lastMessage?.getParentMessageId()) {
      threadView = (
        <>
          <Icon
            name='subdirectory-arrow-right-fill'
            size={theme.spacing.spacing.s4}
            color={mergedStyles.itemStyle.subtitleStyle.color}
          />
          {/* Optional: Add text for thread indicator */}
        </>
      );
    }

    return (
      <View style={[Style.row, conversationPreviewStyles.iconRowGap]}>
        {threadView}
        <View style={[Style.row, conversationPreviewStyles.iconRowGap]}>
          {lastMessage && !["call", "action"].includes(lastMessage.getCategory())
            ? readReceipt
            : null}
          {getMessagePreview(params["conversations"], theme)}
        </View>
      </View>
    );
  };

  /**
   * Returns the trailing view (date and badge) for a conversation item.
   * @param conversation - The conversation object.
   * @returns A JSX.Element for the trailing view.
   */
  /**
   * The pin glyph on its own, for the rows that render no date and no badge.
   *
   * A pin is state the user set deliberately, so it has to be visible wherever a pinned row
   * is — it is the only thing on screen telling them the row is pinned rather than merely
   * near the top. Two rows used to lose it (ENG, agent rows): an AGENT conversation, whose
   * trailing view is blanked on purpose so it shows no preview or timestamp, and any
   * conversation with NO last message, where the date-driven trailing view bailed out early.
   * Both kept the pin working everywhere except on screen.
   *
   * Deliberately NOT the full trailing view: the date and unread badge stay hidden on those
   * rows, because hiding them was a design decision and only the pin was collateral.
   */
  const getPinOnlyTrailingView = useCallback(
    (conversation: CometChat.Conversation) => {
      if (!isConversationPinned(conversation)) return <></>;
      return (
        <View
          style={[
            conversationPreviewStyles.trailingContainer,
            mergedStyles.itemStyle.trailingViewContainerStyle,
          ]}
        >
          <View
            accessible={true}
            accessibilityLabel={t("PINNED") ?? "Pinned"}
            style={{ marginRight: theme.spacing.margin.m1 }}
          >
            <Icon name='keep-fill' color={theme.color.iconSecondary} height={14} width={14} />
          </View>
        </View>
      );
    },
    [mergedStyles, theme, t]
  );

  const getTrailingView = useCallback(
    (conversation: CometChat.Conversation) => {
      const customPattern = () => datePattern?.(conversation);
      const timestamp = conversation.getLastMessage()?.getSentAt();
      // No last message — nothing to date-stamp, but a pin still has to show.
      if (!timestamp) return getPinOnlyTrailingView(conversation);
      return (
        <View
          style={[
            conversationPreviewStyles.trailingContainer,
            mergedStyles.itemStyle.trailingViewContainerStyle,
          ]}
        >
          <CometChatDate
            timeStamp={timestamp * 1000}
            customDateString={customPattern && customPattern()}
            pattern={"conversationDate"}
            style={mergedStyles?.itemStyle?.dateStyle}
          />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Pin indicator. Sits with the badge rather than in the title so it
                cannot push a long conversation name into truncation. */}
            {isConversationPinned(conversation) ? (
              <View
                accessible={true}
                accessibilityLabel={t("PINNED") ?? "Pinned"}
                style={{ marginRight: theme.spacing.margin.m1 }}
              >
                <Icon name='keep-fill' color={theme.color.iconSecondary} height={14} width={14} />
              </View>
            ) : null}
            <CometChatBadge
              count={conversation.getUnreadMessageCount()}
              style={mergedStyles?.itemStyle?.badgeStyle}
            />
          </View>
        </View>
      );
    },
    [mergedStyles, datePattern, theme, t, getPinOnlyTrailingView]
  );

  /**
   * Updates the conversation's last message for a group conversation.
   * @param message - The new message.
   * @param group - The group the conversation belongs to.
   */
  const updateConversationLastMessage = (
    message: CometChat.BaseMessage,
    group: CometChat.Group
  ) => {
    try {
      let conversation: CometChat.Conversation = conversationListRef.current?.getListItem(
        message.getConversationId()
      );
      if (conversation) {
        conversation = CommonUtils.clone(conversation);
        conversation.setLastMessage(message);
        conversation.setConversationWith(group);
        placeConversation(conversation);
      } else {
        CometChat.CometChatHelper.getConversationFromMessage(message)
          .then((newConversation) => {
            if (
              newConversation?.getLastMessage().getSender().getUid() !==
              loggedInUser.current?.getUid()
            )
              newConversation.setUnreadMessageCount(1);
            placeConversation(newConversation);
          })
          .catch((err) => onError && onError(err));
      }
    } catch (error: any) {
      onError && onError(error);
    }
  };

  /**
   * Increments the unread message count for a conversation.
   * @param conversation - The conversation to update.
   * @returns The updated conversation.
   */
  const updateUnreadMessageCount = (conversation: CometChat.Conversation) => {
    if (!conversationListRef.current) {
      conversation.setUnreadMessageCount(1);
      return conversation;
    }
    const oldConversation: CometChat.Conversation = conversationListRef.current.getListItem(
      conversation["conversationId"]
    ) as unknown as CometChat.Conversation;
    if (oldConversation == undefined) {
      conversation.setUnreadMessageCount(1);
      return conversation;
    }
    oldConversation.setUnreadMessageCount(oldConversation.getUnreadMessageCount() + 1);
    return oldConversation;
  };

  // Set up event listeners for user, call, group and message events.
  React.useEffect(() => {
    // Get logged in user.
    CometChat.getLoggedinUser()
      .then((u) => {
        loggedInUser.current = u ?? undefined;
      })
      .catch((err) => console.log(err));

    // Listen for user online/offline changes.
    CometChat.addUserListener(
      userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: any) => {
          userEventHandler(onlineUser);
        },
        onUserOffline: (offlineUser: any) => {
          userEventHandler(offlineUser);
        },
      })
    );

    // Listen for call events.
    CometChat.addCallListener(
      callListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          CometChat.CometChatHelper.getConversationFromMessage(call)
            .then((conversation) => {
              if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                return;
              }
              conversation = updateUnreadMessageCount(conversation);
              conversation.setLastMessage(call);
              conversationListRef.current?.updateList(conversation);
            })
            .catch((e) => {
              onError && onError(e);
            });
        },
        onOutgoingCallAccepted: (call: any) => {
          CometChat.CometChatHelper.getConversationFromMessage(call)
            .then((conversation) => {
              if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                return;
              }
              conversation = updateUnreadMessageCount(conversation);
              conversation.setLastMessage(call);
              conversationListRef.current?.updateList(conversation);
            })
            .catch((e) => {
              onError && onError(e);
            });
        },
        onOutgoingCallRejected: (call: any) => {
          CometChat.CometChatHelper.getConversationFromMessage(call)
            .then((conversation) => {
              if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                return;
              }
              conversation = updateUnreadMessageCount(conversation);
              conversation.setLastMessage(call);
              conversationListRef.current?.updateList(conversation);
            })
            .catch((e) => {
              onError && onError(e);
            });
        },
        onIncomingCallCancelled: (call: any) => {
          CometChat.CometChatHelper.getConversationFromMessage(call)
            .then((conversation) => {
              if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
                return;
              }
              conversation = updateUnreadMessageCount(conversation);
              conversation.setLastMessage(call);
              conversationListRef.current?.updateList(conversation);
            })
            .catch((e) => {
              onError && onError(e);
            });
        },
      })
    );

    // Listen for group events.
    CometChat.addGroupListener(
      groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberScopeChanged: (
          message: CometChat.Action,
          changedUser: CometChat.GroupMember,
          newScope: CometChat.GroupMemberScope,
          oldScope: CometChat.GroupMemberScope,
          changedGroup: CometChat.Group
        ) => {
          groupHandler(message, {
            action: "scopeChange",
            actionOn: changedUser,
            newScope: newScope,
            oldScope: oldScope,
            group: changedGroup,
          });
        },
        onGroupMemberKicked: (
          message: CometChat.Action,
          kickedUser: CometChat.User,
          kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          groupHandler(message, {
            action: "kicked",
            actionOn: kickedUser,
            actionBy: kickedBy,
            group: kickedFrom,
          });
        },
        onGroupMemberLeft: (
          message: CometChat.Action,
          leavingUser: CometChat.User,
          group: CometChat.Group
        ) => {
          groupHandler(message, { action: "left", actionOn: leavingUser, group });
        },
        onGroupMemberUnbanned: (message: CometChat.Action) => {
          groupHandler(message);
        },
        onGroupMemberBanned: (
          message: CometChat.Action,
          bannedUser: CometChat.User,
          bannedBy: CometChat.User,
          bannedFrom: CometChat.Group
        ) => {
          groupHandler(message, {
            action: "banned",
            actionOn: bannedUser,
            actionBy: bannedBy,
            group: bannedFrom,
          });
        },
        onMemberAddedToGroup: (
          message: CometChat.Action,
          userAdded: CometChat.User,
          userAddedBy: CometChat.User,
          userAddedIn: CometChat.Group
        ) => {
          if (onMemberAddedToGroupDebounceTimer.current) {
            clearTimeout(onMemberAddedToGroupDebounceTimer.current);
          }
          onMemberAddedToGroupDebounceTimer.current = setTimeout(() => {
            groupHandler(message, {
              action: "joined",
              actionOn: userAdded,
              actionBy: userAddedBy,
              group: userAddedIn,
            });
          }, 50);
        },
        onGroupMemberJoined: (message: CometChat.Action) => {
          groupHandler(message);
        },
      })
    );

    // Listen for conversation deletion events.
    CometChatUIEventHandler.addConversationListener(conversationListenerId, {
      ccConversationDeleted: ({ conversation }: { conversation: CometChat.Conversation }) => {
        conversationListRef.current?.removeItemFromList(conversation.getConversationId());
        removeItemFromSelectionList(conversation.getConversationId());
      },
      // Handle conversation updates from external sources (e.g., when conversation properties change)
      ccUpdateConversation: ({ conversation }: { conversation: CometChat.Conversation }) => {
        conversationListRef.current?.updateList(conversation);
      },
    });
    // Listen for message events.
    CometChatUIEventHandler.addMessageListener(messageListenerId, {
      ccMessageSent: ({ message, status }: any) => {
        if (status == MessageStatusConstants.success) {
          if (!shouldUpdateLastMessageAndUnreadCount(message)) {
            return;
          }
          updateLastMessage(message);
        }
      },
      ccMessageRead: ({ message }: { message: CometChat.BaseMessage }) => {
        // When a message is marked as read, clear the unread count for that conversation
        if (message) {
          const convId = message.getConversationId?.();
          if (convId) {
            let conver: CometChat.Conversation = conversationListRef.current?.getListItem(convId);
            if (conver) {
              conver.setUnreadMessageCount(0);
              conversationListRef.current?.updateList(CommonUtils.clone(conver));
            }
          }
        }
        checkAndUpdateLastMessage(message);
      },
      ccMessageDeleted: ({ message }: { message: CometChat.BaseMessage }) => {
        checkAndUpdateLastMessage(message);
      },
      ccMessageEdited: ({ message }: { message: CometChat.BaseMessage }) => {
        checkAndUpdateLastMessage(message);
      },
      onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
        if (!shouldUpdateLastMessageAndUnreadCount(textMessage)) {
          return;
        }
        messageEventHandler(textMessage);
        !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
      },
      onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
        if (!shouldUpdateLastMessageAndUnreadCount(mediaMessage)) {
          return;
        }
        messageEventHandler(mediaMessage);
        !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
      },
      onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
        if (!shouldUpdateLastMessageAndUnreadCount(customMessage)) {
          return;
        }
        messageEventHandler(customMessage);
        !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
      },
      onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
        // Skip thread replies — they don't affect conversation unread count
        if (deletedMessage.getParentMessageId()) return;
        checkAndUpdateLastMessage(deletedMessage);
      },
      onMessageEdited: (editedMessage: CometChat.BaseMessage) => {
        checkAndUpdateLastMessage(editedMessage);
      },
      onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
        updateMessageReceipt(messageReceipt);
      },
      onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
        updateMessageReceipt(messageReceipt);
      },
      onMessagesDeliveredToAll: (messageReceipt: CometChat.MessageReceipt) => {
        updateMessageReceipt(messageReceipt);
      },
      onMessagesReadByAll: (messageReceipt: CometChat.MessageReceipt) => {
        updateMessageReceipt(messageReceipt);
      },
      onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
        typingEventHandler(typingIndicator, true);
      },
      onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
        typingEventHandler(typingIndicator, false);
      },
      onFormMessageReceived: (formMessage: any) => {
        if (!shouldUpdateLastMessageAndUnreadCount(formMessage)) {
          return;
        }
        messageEventHandler(formMessage);
        !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
      },
      onCardMessageReceived: (cardMessage: any) => {
        if (!shouldUpdateLastMessageAndUnreadCount(cardMessage)) {
          return;
        }
        messageEventHandler(cardMessage);
        !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
      },
      onSchedulerMessageReceived: (schedulerMessage: any) => {
        if (!shouldUpdateLastMessageAndUnreadCount(schedulerMessage)) {
          return;
        }
        messageEventHandler(schedulerMessage);
        !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
      },
      onCustomInteractiveMessageReceived: (customInteractiveMessage: any) => {
        if (!shouldUpdateLastMessageAndUnreadCount(customInteractiveMessage)) {
          return;
        }
        messageEventHandler(customInteractiveMessage);
        !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
      },
      // Agent (agentic/assistant) reply — update the conversation's last message + unread
      // count in real time, otherwise the subtitle only refreshes after a re-fetch.
      onAIAssistantMessageReceived: (aiAssistantMessage: any) => {
        if (!shouldUpdateLastMessageAndUnreadCount(aiAssistantMessage)) {
          return;
        }
        messageEventHandler(aiAssistantMessage);
        !disableSoundForMessages && CometChatSoundManager.play("incomingMessage");
      },
      onMessageModerated: (moderatedMessage: CometChat.BaseMessage) => {
        checkAndUpdateLastMessage(moderatedMessage);
      },
    });
    // Listen for additional group events.
    CometChatUIEventHandler.addGroupListener(groupListenerId, {
      ccGroupCreated: ({ group }: { group: CometChat.Group }) => {
        CometChat.getConversation(
          group.getGuid(),
          CometChatUiKitConstants.ConversationTypeConstants.group
        ).then((conversation) => {
          placeConversation(conversation);
        });
      },
      ccGroupDeleted: ({ group }: { group: CometChat.Group }) => {
        CometChat.getConversation(
          group.getGuid(),
          CometChatUiKitConstants.ConversationTypeConstants.group
        ).then((conversation) => {
          conversationListRef.current?.removeItemFromList(conversation.getConversationId());
          removeItemFromSelectionList(conversation.getConversationId());
        });
      },
      ccGroupLeft: ({ leftGroup }: { leftGroup: CometChat.Group }) => {
        const foundConversation = conversationListRef.current?.getAllListItems().find((conv) => {
          const convWith = conv.getConversationWith();
          return convWith instanceof CometChat.Group && convWith.getGuid() === leftGroup.getGuid();
        });
        if (foundConversation) {
          conversationListRef.current?.removeItemFromList(foundConversation.getConversationId());
          removeItemFromSelectionList(foundConversation.getConversationId());
        }
      },
      ccGroupMemberKicked: ({
        message,
        kickedFrom,
      }: {
        message: CometChat.Action;
        kickedFrom: CometChat.Group;
      }) => {
        if (!shouldUpdateLastMessageAndUnreadCount(message)) {
          return;
        }
        updateConversationLastMessage(message, kickedFrom);
      },
      ccGroupMemberBanned: ({ message }: { message: CometChat.Action }) => {
        if (!shouldUpdateLastMessageAndUnreadCount(message)) {
          return;
        }
        groupHandler(message);
      },
      ccGroupMemberUnBanned: ({ message }: { message: CometChat.Action }) => {
        if (!shouldUpdateLastMessageAndUnreadCount(message)) {
          return;
        }
        groupHandler(message);
      },
      ccOwnershipChanged: ({ message }: { message: CometChat.Action }) => {
        if (!shouldUpdateLastMessageAndUnreadCount(message)) {
          return;
        }
        CometChat.CometChatHelper.getConversationFromMessage(message)
          .then((conversation) => {
            conversationListRef.current?.updateList(conversation);
          })
          .catch((e) => {
            onError && onError(e);
          });
      },
      ccGroupMemberAdded: ({
        message,
        userAddedIn,
      }: {
        message: CometChat.Action;
        userAddedIn: CometChat.Group;
      }) => {
        if (!shouldUpdateLastMessageAndUnreadCount(message)) {
          return;
        }
        updateConversationLastMessage(message, userAddedIn);
      },
    });

    // Listen for user block events.
    CometChatUIEventHandler.addUserListener(userListenerId, {
      ccUserBlocked: ({ user }: { user: CometChat.User }) => {
        const uid = user.getUid();
        const loggedInUid = loggedInUser.current?.getUid();
        if (!loggedInUid) return;

        const candidateIds = [`${uid}_user_${loggedInUid}`, `${loggedInUid}_user_${uid}`];

        const item: CometChat.Conversation | undefined = candidateIds
          .map((id) => conversationListRef.current?.getListItem(id))
          .find(Boolean);

        if (!item) return;

        if (
          conversationsRequestBuilder &&
          conversationsRequestBuilder.build().isIncludeBlockedUsers()
        ) {
          const updatedConversation = CommonUtils.clone(item);
          updatedConversation.setConversationWith(user);
          conversationListRef.current?.updateList(updatedConversation);
          return;
        }

        conversationListRef?.current?.removeItemFromList(item.getConversationId());
        removeItemFromSelectionList(item.getConversationId());
      },
      ccUserUnBlocked: ({ user }: { user: CometChat.User }) => {
        /**unblocked handling is required to enable user presence listener for the user**/
        const uid = user.getUid();
        let item: CometChat.Conversation | any =
          (conversationListRef.current?.getListItem(
            `${uid}_user_${loggedInUser.current?.getUid()}`
          ) as unknown as CometChat.Conversation) ||
          (conversationListRef.current?.getListItem(
            `${loggedInUser.current?.getUid()}_user_${uid}`
          ) as unknown as CometChat.Conversation);
        if (item) {
          let updatedConversation = CommonUtils.clone(item);
          updatedConversation.setConversationWith(user);
          conversationListRef.current?.updateList(updatedConversation);
        }
      },
    });

    // Listen for call events via UI event handler.
    CometChatUIEventHandler.addCallListener(callListenerId, {
      ccOutgoingCall: ({ call }: any) => {
        CometChat.CometChatHelper.getConversationFromMessage(call)
          .then((conversation) => {
            if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
              return;
            }
            conversation = updateUnreadMessageCount(conversation);
            conversationListRef.current?.updateList(conversation);
          })
          .catch((e) => {
            onError && onError(e);
          });
      },
      ccCallAccepted: ({ call }: any) => {
        CometChat.CometChatHelper.getConversationFromMessage(call)
          .then((conversation) => {
            if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
              return;
            }
            conversation = updateUnreadMessageCount(conversation);
            conversationListRef.current?.updateList(conversation);
          })
          .catch((e) => {
            onError && onError(e);
          });
      },
      ccCallRejected: ({ call }: any) => {
        CometChat.CometChatHelper.getConversationFromMessage(call)
          .then((conversation) => {
            if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
              return;
            }
            conversation = updateUnreadMessageCount(conversation);
            conversationListRef.current?.updateList(conversation);
          })
          .catch((e) => {
            onError && onError(e);
          });
      },
      ccCallEnded: ({ call }: any) => {
        CometChat.CometChatHelper.getConversationFromMessage(call)
          .then((conversation) => {
            if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCallActivities()) {
              return;
            }
            conversation = updateUnreadMessageCount(conversation);
            conversationListRef.current?.updateList(conversation);
          })
          .catch((e) => {
            onError && onError(e);
          });
      },
    });

    // Cleanup all listeners on unmount.
    return () => {
      CometChat.removeUserListener(userListenerId);
      CometChat.removeCallListener(callListenerId);
      CometChat.removeGroupListener(groupListenerId);
      CometChatUIEventHandler.removeMessageListener(messageListenerId);
      CometChatUIEventHandler.removeConversationListener(conversationListenerId);
      CometChatUIEventHandler.removeGroupListener(groupListenerId);
      CometChatUIEventHandler.removeUserListener(userListenerId);
    };
  }, []);

  const getStatusIndicator = (conv: CometChat.Conversation) => {
    const withObj = conv.getConversationWith();

    if (groupTypeVisibility) {
      if (withObj instanceof CometChat.Group) {
        if (withObj.getType() === GroupTypeConstants.password) return "password";
        if (withObj.getType() === GroupTypeConstants.private) return "private";
      }
    } else {
      return undefined;
    }

    if (usersStatusVisibility) {
      if (
        withObj instanceof CometChat.User &&
        withObj.getStatus() === CometChatUiKitConstants.UserStatusConstants.online &&
        !withObj.getHasBlockedMe() &&
        !withObj.getBlockedByMe()
      ) {
        return "online";
      }
      return "offline";
    } else {
      return undefined;
    }
  };

  const LeadingViewRaw = useCallback(
    (conv: CometChat.Conversation) => {
      const withObj = conv.getConversationWith();
      const avatarURL = withObj instanceof CometChat.User ? withObj.getAvatar() : withObj.getIcon();
      const name = withObj.getName();

      return (
        <>
          <CometChatAvatar
            image={{ uri: avatarURL }}
            name={name}
            style={mergedStyles.itemStyle.avatarStyle}
          />
          <CometChatStatusIndicator
            type={getStatusIndicator(conv)}
            style={mergedStyles?.itemStyle?.statusIndicatorStyle}
          />
        </>
      );
    },
    [mergedStyles]
  );

  const TitleViewRaw = useCallback(
    (conv: CometChat.Conversation) => {
      const conversationWith = conv.getConversationWith();
      const isAgentic = conversationWith instanceof CometChat.User && conversationWith.getRole() === "@agentic";

      return (
        <View style={[
          isAgentic ? { justifyContent: 'center' } : null
        ]}>
          <Text
            numberOfLines={1}
            ellipsizeMode='tail'
            style={mergedStyles.itemStyle.titleStyle}
          >
            {conversationWith.getName()}
          </Text>
        </View>
      );
    },
    [mergedStyles]
  );

  const SubtitleViewRaw = (conv: CometChat.Conversation) => {
    const conversationWith = conv.getConversationWith();
    if (conversationWith instanceof CometChat.User && conversationWith.getRole() === "@agentic") {
      return <></>;
    }
    return (
      <LastMessageView conversations={conv} typingText={conv?.["lastMessage"]?.["typing"]} />
    );
  };

  const TrailingViewRaw = useCallback((conv: CometChat.Conversation) => {
    const conversationWith = conv.getConversationWith();
    if (conversationWith instanceof CometChat.User && conversationWith.getRole() === "@agentic") {
      // An agent row shows no preview, date or unread count — but it can be pinned like any
      // other conversation, and a pinned row with no pin is indistinguishable from an
      // unpinned one that happens to be sorted high.
      return getPinOnlyTrailingView(conv);
    }
    return getTrailingView(conv);
  }, [getTrailingView, getPinOnlyTrailingView]);

  return (
    <View style={mergedStyles.containerStyle}>
      <CometChatList
            AppBarOptions={AppBarOptions}
            onError={onError}
            ref={conversationListRef}
            LeadingView={LeadingView ? LeadingView : LeadingViewRaw}
            TitleView={TitleView ? TitleView : TitleViewRaw}
            SubtitleView={SubtitleView ? SubtitleView : SubtitleViewRaw}
            TrailingView={TrailingView ? TrailingView : TrailingViewRaw}
            requestBuilder={
              conversationsRequestBuilder || new CometChat.ConversationsRequestBuilder().setLimit(30)
            }
            hideStickyHeader={true}
            title={!hideHeader ? t("CHATS") : ""}
            listStyle={mergedStyles}
            hideSearch={!showSearchBar}
            hideHeader={hideHeader}
            hideSubmitButton={hideSubmitButton}
            SearchView={SearchView}
            onSearchBarClicked={onSearchBarClicked}
            onItemPress={(conversation) =>
              selectionMode === "none" ? conversationClicked(conversation) : null
            }
            onItemLongPress={(conversation: CometChat.Conversation, e?: GestureResponderEvent) => {
              if (selectionMode === "none") {
                if (onItemLongPress) {
                  onItemLongPress(conversation);
                  return;
                }
                if (e && "nativeEvent" in e) {
                  longPressId.current = conversation.getConversationId();
                  longPressedConversation.current = conversation;
                  tooltipPositon.current = {
                    pageX: e.nativeEvent.pageX,
                    pageY: e.nativeEvent.pageY,
                  };
                  setTooltipVisible(true);
                }
              }
            }}
            listItemKey={"conversationId"}
            LoadingView={LoadingView ?? (() => <Skeleton style={mergedStyles.skeletonStyle} />)}
            ItemView={ItemView}
            EmptyView={EmptyView ? EmptyView : () => <EmptyStateView />}
            ErrorView={ErrorView ? ErrorView : () => <ErrorStateView />}
            onBack={onBack}
            hideBackButton={hideBackButton}
            onSelection={onSelection}
            onSubmit={onSubmit}
            selectionMode={selectionMode}
            hideError={hideError}
            onListFetched={(conversations: CometChat.Conversation[]) => {
              if (conversations.length === 0) {
                onEmpty?.();
              } else {
                onLoad?.(conversations);
              }
            }}
          />
      <CometChatTooltipMenu
        visible={tooltipVisible}
        onClose={() => {
          setTooltipVisible(false);
        }}
        event={{
          nativeEvent: tooltipPositon.current,
        }}
        menuItems={
          options
            ? options(longPressedConversation.current!)
            : [
                ...[
                  // Pin sits ABOVE Delete: non-destructive actions should not be
                  // below the one the user must not hit by accident.
                  ...(PinConversationConfig.isEnabled() &&
                  pinConversationOptionVisibility &&
                  longPressedConversation.current &&
                  // A user cannot unpin an admin/global pin, so offer nothing rather
                  // than an option the server will refuse.
                  !isSystemPinnedConversation(longPressedConversation.current)
                    ? [
                        {
                          text: isConversationPinned(longPressedConversation.current)
                            ? (t("UNPIN_CONVERSATION") ?? "Unpin")
                            : (t("PIN_CONVERSATION") ?? "Pin"),
                          onPress: () => {
                            const target = longPressedConversation.current!;
                            setTooltipVisible(false);
                            // Unpin asks, pin does not — the same asymmetry the message
                            // list applies (Jitvar, 2026-08-04): pinning is additive and
                            // undoable in one tap, unpinning discards a deliberate act
                            // with nothing on screen offering it back.
                            if (isConversationPinned(target)) {
                              setConfirmUnpin(target);
                              return;
                            }
                            togglePinConversation(target);
                          },
                          icon: (
                            <Icon
                              name={
                                isConversationPinned(longPressedConversation.current)
                                  ? "keep-off"
                                  : "keep"
                              }
                              color={theme.color.iconSecondary}
                              height={theme.spacing.spacing.s6}
                              width={theme.spacing.spacing.s6}
                            />
                          ),
                        },
                      ]
                    : []),
                  ...(deleteConversationOptionVisibility
                    ? [
                        {
                          text: "Delete",
                          onPress: () => {
                            setConfirmDelete(longPressId.current);
                            setTooltipVisible(false);
                          },
                          icon: (
                            <Delete
                              color={theme.color.error}
                              height={theme.spacing.spacing.s6}
                              width={theme.spacing.spacing.s6}
                            />
                          ),
                          textStyle: { color: theme.color.error },
                        },
                      ]
                    : []),
                ],
                ...(addOptions ? addOptions(longPressedConversation.current!) : []),
              ]
        }
      />
      <CometChatConfirmDialog
        titleText={t("DELETE_THIS_CONVERSATION")}
        icon={<Icon name='delete' size={theme.spacing.spacing.s12} color={theme.color.error} />}
        cancelButtonText={t("CANCEL")}
        confirmButtonText={t("DELETE")}
        messageText={t("SURE_TO_DELETE_CHAT")}
        isOpen={confirmDelete != undefined}
        onCancel={() => setConfirmDelete(undefined)}
        onConfirm={() => {
          removeConversation(confirmDelete!);
          setConfirmDelete(undefined);
        }}
        {...mergedStyles.confirmDialogStyle}
      />
      <CometChatConfirmDialog
        titleText={t("UNPIN_CONVERSATION_TITLE") ?? "Unpin Conversation"}
        icon={<Icon name='keep-off' size={theme.spacing.spacing.s12} color={theme.color.error} />}
        cancelButtonText={t("CANCEL")}
        confirmButtonText={t("UNPIN_CONVERSATION") ?? "Unpin"}
        messageText={
          t("UNPIN_CONVERSATION_CONFIRM") ??
          "Do you want to unpin this conversation from the top of your list?"
        }
        isOpen={confirmUnpin != undefined}
        onCancel={() => setConfirmUnpin(undefined)}
        onConfirm={() => {
          togglePinConversation(confirmUnpin!);
          setConfirmUnpin(undefined);
        }}
        {...mergedStyles.confirmDialogStyle}
      />
      {/* Without this the useToast hook runs but nothing ever appears — the
          conversation pin/unpin toasts and every error message are invisible. */}
      {ToastElement}
    </View>
  );
};

// Static styles for conversation preview block-level elements (code block, blockquote, list).
// Theme-dependent values (colors) are applied inline via style array merging.
const conversationPreviewStyles = StyleSheet.create({
  codeBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 2,
  },
  codeBlockBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 1,
  },
  codeBlockText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  blockquoteRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(104, 81, 214, 0.08)',
    borderRadius: 6,
    flexShrink: 2,
    minHeight: 22,
    paddingVertical: 1,
  },
  blockquoteBar: {
    width: 3,
    borderRadius: 1.5,
    marginVertical: 3,
    marginLeft: 4,
  },
  blockquoteText: {
    flex: 1,
    paddingHorizontal: 5,
    lineHeight: 18,
  },
  trailingContainer: {
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  iconRowGap: {
    gap: 2,
    alignItems: 'center',
  },
  subtitleClamp: {
    flexShrink: 0,
    maxWidth: '40%',
  },
});
