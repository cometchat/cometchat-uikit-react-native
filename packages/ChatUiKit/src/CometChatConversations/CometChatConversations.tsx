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
import { Text, View, GestureResponderEvent } from "react-native";
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
  MentionsTargetElement,
  MessageCategoryConstants,
  MessageReceipt,
  MessageStatusConstants,
  ReceiverTypeConstants,
} from "../shared/constants/UIKitConstants";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { Icon } from "../shared/icons/Icon";
import { CommonUtils } from "../shared/utils/CommonUtils";
import { getMessagePreviewInternal } from "../shared/utils/MessageUtils";
import { CometChatBadge } from "../shared/views/CometChatBadge";
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
import { SuggestionItem } from "../shared/views/CometChatSuggestionList/SuggestionItem";

// Unique listener IDs for conversation, user, group, message and call events.
const conversationListenerId = "chatlist_" + new Date().getTime();
const userListenerId = "chatlist_user_" + new Date().getTime();
const groupListenerId = "chatlist_group_" + new Date().getTime();
const messageListenerId = "chatlist_message_" + new Date().getTime();
const callListenerId = "call_" + new Date().getTime();

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
    showSearchBar = false,
    onSearchBarClicked,
    onSearchTextChanged,
    searchText = "",
    SearchView,
  } = props;

  // Reference for accessing CometChatList methods
  const conversationListRef = React.useRef<CometChatListActionsInterface>(null);
  // Store the logged in user for comparison and event handling.
  const loggedInUser = React.useRef<CometChat.User>(undefined);
  // State to control the confirmation dialog for deleting a conversation.
  const [confirmDelete, setConfirmDelete] = React.useState<string | undefined>(undefined);
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
      conversationListRef.current!.updateList(newConversation);
    }
  };

  /**
   * Checks and updates the last message in a conversation if it matches the provided message.
   * @param newMessage - The new message object.
   */
  const checkAndUpdateLastMessage = (newMessage: CometChat.BaseMessage) => {
    CometChat.CometChatHelper.getConversationFromMessage(newMessage).then(
      (conversation: CometChat.Conversation) => {
        let conver: CometChat.Conversation = conversationListRef.current!.getListItem(
          conversation.getConversationId()
        );
        if (!conver) return;
        let lastMessageId = conver.getLastMessage().getId();
        if (lastMessageId == newMessage.getId()) {
          conversationListRef.current!.updateList(CommonUtils.clone(conversation));
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
      if (
        !customMessage.willUpdateConversation() &&
        !(
          customMessage.getMetadata() &&
          (customMessage.getMetadata() as any)["incrementUnreadCount"]
        ) &&
        !CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnCustomMessages()
      ) {
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
        const oldConversation: CometChat.Conversation = conversationListRef.current!.getListItem(
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
              conversationListRef.current!.addItemToList(newConversation, 0);
            })
            .catch((err) => onError && onError(err));
          return;
        }
        // Update last message and unread count.
        oldConversation.setLastMessage(newMessage);
        if (newMessage.getSender().getUid() != loggedInUser.current?.getUid())
          oldConversation.setUnreadMessageCount(oldConversation.getUnreadMessageCount() + 1);
        conversationListRef.current!.updateAndMoveToFirst(CommonUtils.clone(oldConversation));
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
      conv.getConversationType() == ConversationTypeConstants.group &&
      conv.getLastMessage().getSender().getUid() !== loggedInUser.current!.getUid()
    ) {
      return;
    }

    if (
      conv &&
      conv?.getLastMessage &&
      (conv.getLastMessage().id == receipt.getMessageId() ||
        conv.getLastMessage().messageId == receipt.getMessageId())
    ) {
      let newConversation = CommonUtils.clone(conv);
      if (receipt.getReadAt()) {
        newConversation.getLastMessage().setReadAt(receipt.getReadAt());
      }
      if (receipt.getDeliveredAt()) {
        newConversation.getLastMessage().setDeliveredAt(receipt.getDeliveredAt());
      }
      conversationListRef.current?.updateList(newConversation);
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
    } = {}
  ) => {
    let conversation: CometChat.Conversation = conversationListRef.current!.getListItem(
      message.getConversationId()
    ) as unknown as CometChat.Conversation;
    let { action, actionOn, actionBy, group, newScope, oldScope } = otherDetails;
    if (conversation) {
      if (action == "scopeChange" && actionOn?.getUid() !== loggedInUser.current!.getUid()) {
        oldScope = undefined;
        newScope = undefined;
      }
      const oldScopeLocal: any =
        oldScope ?? (conversation.getConversationWith() as CometChat.Group).getScope();
      if (
        action &&
        ["kicked", "banned", "left"].includes(action) &&
        actionOn &&
        actionOn.getUid() == loggedInUser.current!.getUid()
      ) {
        conversationListRef.current!.removeItemFromList(message.getConversationId());
        return;
      } else {
        if (!CometChatUIKit.getConversationUpdateSettings().shouldUpdateOnGroupActions()) {
          return;
        }
        conversation.setLastMessage(message);
        if (group) {
          !group.getScope() && group.setScope(newScope ?? oldScopeLocal);
          conversation.setConversationWith(group);
        }
        conversationListRef.current!.updateList(conversation);
      }
    } else {
      CometChat.CometChatHelper.getConversationFromMessage(message).then((newConversation) => {
        const conversation: CometChat.Conversation = conversationListRef.current!.getListItem(
          message.getConversationId()
        ) as unknown as CometChat.Conversation;
        if (conversation) {
          groupHandler(message);
        } else {
          conversationListRef.current!.addItemToList(newConversation, 0);
        }
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
    let conversation = conversationListRef.current!.getListItem(id);
    const { conversationWith, conversationType } = conversation;
    let conversationWithId =
      conversationType == "group" ? conversationWith.guid : conversationWith.uid;
    CometChat.deleteConversation(conversationWithId, conversationType)
      .then((success) => {
        CometChatUIEventHandler.emitConversationEvent(
          CometChatConversationEvents.ccConversationDeleted,
          { conversation: conversation }
        );
        conversationListRef.current!.removeItemFromList(id);
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
    const loggedInUserId = CometChatUIKit.loggedInUser!.getUid();
    let lastMessage: CometChat.BaseMessage =
      conversations?.getLastMessage && conversations.getLastMessage();
    if (!lastMessage) return null;
    let messageText: string | JSX.Element = "";
    messageText = ChatConfigurator.getDataSource().getLastConversationMessage(conversations, theme);

    if (lastMessage && typeof messageText === "string") {
      messageText = getFormattedText(lastMessage, messageText?.trim());
    }
    if (
      lastMessage instanceof CometChat.TextMessage &&
      lastMessage.getCategory() === "message" &&
      (() => {
        // Guard against undefined text or non-string values.
        const text = typeof lastMessage.getText === "function" ? lastMessage.getText() : undefined;
        return typeof text === "string" && text.slice(0, 50).match(/https?:\/\//);
      })()
    ) {
      messageText = getMessagePreviewInternal("link-fill", t("LINK"), { theme });
    } else if (messageText) {
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
            style={[mergedStyles.itemStyle.subtitleStyle, { flexShrink: 1 }]}
            numberOfLines={1}
            ellipsizeMode='middle'
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
    let messageTextTmp: string | JSX.Element = subtitle;
    let allFormatters = [...(textFormatters || [])];
    // Detect presence of @all alias token in raw string
    const containsAllAlias =
      typeof messageTextTmp === "string" && /<@all:(.*?)>/.test(messageTextTmp);

    if (message.getMentionedUsers().length || containsAllAlias) {
      let mentionsFormatter = ChatConfigurator.getDataSource().getMentionsFormatter();
      mentionsFormatter.setContext("conversation");
      mentionsFormatter.setLoggedInUser(CometChatUIKit.loggedInUser!);
      mentionsFormatter.setMentionsStyle(mergedStyles.mentionsStyles);
      mentionsFormatter.setTargetElement(MentionsTargetElement.conversation);
      mentionsFormatter.setMessage(message);

      // Inject alias suggestion item if needed so formatter can render styled @All
      if (containsAllAlias) {
        const match = (messageTextTmp as string).match(/<@all:(.*?)>/);
        const aliasLabel = match && match[1] ? match[1] : "all";
        let existing = mentionsFormatter.getSuggestionItems();
        const underlyingText = `<@all:${aliasLabel}>`;
        const already = existing.find((it: any) => it.underlyingText === underlyingText);
        if (!already) {
          const aliasItem = new SuggestionItem({
            id: aliasLabel,
            name: aliasLabel,
            promptText: aliasLabel,
            trackingCharacter: "@",
            underlyingText,
            hideLeadingIcon: true,
          });
          mentionsFormatter.setSuggestionItems([...existing, aliasItem]);
        }
      }

      allFormatters.push(mentionsFormatter);
    }

    if (
      message instanceof CometChat.TextMessage &&
      message.getCategory() === "message" &&
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
      lastMessage.getSender().getUid() == loggedInUser.current!.getUid() &&
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
      <View style={[Style.row, { gap: 2, alignItems: "center" }]}>
        {threadView}
        <View style={[Style.row, { gap: 2, alignItems: "center" }]}>
          {!["call", "action"].includes(params["conversations"].getLastMessage().getCategory())
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
  const getTrailingView = useCallback(
    (conversation: CometChat.Conversation) => {
      const customPattern = () => datePattern?.(conversation);
      const timestamp = conversation.getLastMessage()?.getSentAt();
      if (!timestamp) return <></>;
      return (
        <View
          style={[
            { marginHorizontal: 6, justifyContent: "center", alignItems: "flex-end" },
            mergedStyles.itemStyle.trailingViewContainerStyle,
          ]}
        >
          <CometChatDate
            timeStamp={timestamp * 1000}
            customDateString={customPattern && customPattern()}
            pattern={"conversationDate"}
            style={mergedStyles?.itemStyle?.dateStyle}
          />
          <CometChatBadge
            count={conversation.getUnreadMessageCount()}
            style={mergedStyles?.itemStyle?.badgeStyle}
          />
        </View>
      );
    },
    [mergedStyles, datePattern]
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
        conversationListRef.current?.updateAndMoveToFirst(conversation);
      } else {
        CometChat.CometChatHelper.getConversationFromMessage(message)
          .then((newConversation) => {
            if (
              newConversation?.getLastMessage().getSender().getUid() !==
              loggedInUser.current?.getUid()
            )
              newConversation.setUnreadMessageCount(1);
            conversationListRef.current!.addItemToList(newConversation, 0);
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
    const oldConversation: CometChat.Conversation = conversationListRef.current!.getListItem(
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
        loggedInUser.current = u!;
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
              conversationListRef.current!.updateList(conversation);
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
              conversationListRef.current!.updateList(conversation);
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
              conversationListRef.current!.updateList(conversation);
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
              conversationListRef.current!.updateList(conversation);
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
        conversationListRef.current!.removeItemFromList(conversation.getConversationId());
        removeItemFromSelectionList(conversation.getConversationId());
      },
      // Handle conversation updates from external sources (e.g., when conversation properties change)
      ccUpdateConversation: ({ conversation }: { conversation: CometChat.Conversation }) => {
        conversationListRef.current!.updateList(conversation);
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
    });
    // Listen for additional group events.
    CometChatUIEventHandler.addGroupListener(groupListenerId, {
      ccGroupCreated: ({ group }: { group: CometChat.Group }) => {
        CometChat.getConversation(
          group.getGuid(),
          CometChatUiKitConstants.ConversationTypeConstants.group
        ).then((conversation) => {
          conversationListRef.current?.addItemToList(conversation, 0);
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
            conversationListRef.current!.updateList(conversation);
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
            conversationListRef.current!.updateList(conversation);
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
            conversationListRef.current!.updateList(conversation);
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
            conversationListRef.current!.updateList(conversation);
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
          { flex: 1 },
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
      return <></>;
    }
    return getTrailingView(conv);
  }, [getTrailingView]);

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
    </View>
  );
};
