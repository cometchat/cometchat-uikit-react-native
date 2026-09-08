import * as CometChatUiKitConstants from "./constants/UIKitConstants";
export { CometChatUiKitConstants };

export { Icon } from "./icons/Icon";

export type {
  AdditionalParams,
  ConversationType,
  MessageBubbleAlignmentType,
  MessageListAlignmentType,
  MessageTimeAlignmentType,
  SelectionMode,
} from "./base";

export {
  CometChatConversationEvents,
  CometChatGroupsEvents,
  CometChatUIEventHandler,
  CometChatUIEvents,
  MessageEvents,
} from "./events";

export type { DataSource } from "./framework";

export {
  ChatConfigurator,
  DataSourceDecorator,
  ExtensionsDataSource,
  MessageDataSource,
} from "./framework";

export type {
  CometChatMessageOption,
} from "./modals";

export {
  CometChatMessageTemplate,
} from "./modals";

export {
  CometChatConversationUtils,
  CometChatMessagePreview,
  CometChatSoundManager,
} from "./utils";

export {
  CometChatActionSheet,
  CometChatAudioBubble,
  CometChatAvatar,
  CometChatBadge,
  CometChatBottomSheet,
  CometChatConfirmDialog,
  CometChatReportDialog,
  CometChatDate,
  CometChatEmojiKeyboard,
  CometChatFileBubble,
  CometChatImageBubble,
  CometChatInlineAudioRecorder,
  CometChatList,
  CometChatListItem,
  CometChatMediaRecorder,
  CometChatMessageInput,
  CometChatQuickReactions,
  CometChatReactionList,
  CometChatReactions,
  CometChatRetryButton,
  CometChatStatusIndicator,
  CometChatSuggestionList,
  CometChatTextBubble,
  CometChatVideoBubble,
  SuggestionItem,
  CometChatReceipt,
} from "./views";

export type{
  ActionItemInterface,
  AudioWaveformVisualizerProps,
  BadgeStyle,
  CometChatAudioBubbleInterface,
  CometChatBottomSheetInterface,
  CometChatConfirmDialogInterface,
  CometChatDateInterface,
  CometChatFileBubbleInterface,
  CometChatImageBubbleInterface,
  CometChatInlineAudioRecorderProps,
  CometChatInlineAudioRecorderStyle,
  CometChatListActionsInterface,
  CometChatListItemInterface,
  CometChatListProps,
  CometChatListStylesInterface,
  CometChatMediaRecorderInterface,
  CometChatMessageInputInterface,
  CometChatReactionListInterface,
  CometChatReactionsInterface,
  CometChatRetryButtonProps,
  CometChatStatusIndicatorInterface,
  CometChatSuggestionListInterface,
  CometChatTextBubbleInterface,
  CometChatVideoBubbleInterface,
  DateStyle,
  MenuItemInterface,
  RecorderState,
  UseAudioRecorderReturn,
  WaveformStyle,
} from "./views";

// Multiple Attachment Support — forward the new multi-attachment views/types to the
// public entry so external consumers can import them (PR review B1).
export {
  CometChatAttachmentTray,
  CometChatAttachmentTile,
  CometChatAttachmentPreview,
  CometChatAttachmentPreviewItem,
  getAttachmentPreviewStyle,
  CometChatImagesBubble,
  CometChatVideosBubble,
  CometChatFilesBubble,
  CometChatAudiosBubble,
  CometChatVoiceNoteBubble,
  CometChatMediaViewer,
  CometChatAttachmentViewer,
} from "./views";
export type {
  CometChatAttachmentTrayProps,
  CometChatAttachmentTileProps,
  CometChatAttachmentPreviewProps,
  CometChatAttachmentPreviewItemProps,
  CometChatFilesBubbleProps,
  CometChatAudiosBubbleProps,
  CometChatVoiceNoteBubbleProps,
  CometChatMediaViewerProps,
  CometChatAttachmentViewerProps,
} from "./views";

export {
  CometChatMentionsFormatter,
  CometChatTextFormatter,
  CometChatUrlsFormatter,
  CometChatRichTextFormatter,
  MentionTextStyle,
  RichTextStyle,
} from "./formatters";

export { CometChatUIKit, CometChatUIKitHelper, UIKitSettings } from "./CometChatUiKit";

export type { CometChatMessageComposerAction } from "./helper/types";

export { messageStatus } from "./utils/CometChatMessageHelper/index";
export {
  ThreadSubscriptionConfig,
  applyIncomingReply,
  applyEditedMessage,
  applySentMessage,
  applyOwnIncomingMessage,
  isThreadSubscribed,
  stampThreadSubscribed,
  toggleThreadSubscription,
} from "./utils/ThreadSubscriptionHelper";

/**
 * Pin & Save. PinSaveConfig is the opt-in gate and MUST be exported — without it
 * the feature is unreachable and therefore permanently off for every integrator.
 * The read helpers come too, so a custom bubble can render its own indicator
 * without re-deriving "presence is the boolean" and getting it wrong.
 */
export {
  PinConversationConfig,
  isConversationPinned,
  isSystemPinnedConversation,
} from "./utils/PinConversationHelper";
export {
  resolvePinSaveFeatures,
  refreshPinSaveFeatures,
  getPinSaveFeatures,
  resetPinSaveFeatures,
  PIN_SAVE_FEATURES_DISABLED,
} from "./utils/PinSaveFeatureGates";

export {
  PinSaveConfig,
  isPinned,
  isSaved,
  isSystemPin,
  SYSTEM_PINNER,
} from "./utils/PinSaveHelper";

export { getCometChatTranslation, getCurrentLanguage} from "./resources/CometChatLocalizeNew/LocalizationManager";
export { useLocalizedDate } from "./helper/useLocalizedDateHook";
export { LocalizedDateHelper } from "./helper/LocalizedDateHelper";
export { useCometChatTranslation } from "./resources/CometChatLocalizeNew/useCometChatTranslationHook";
export {getLastSeenTime} from "./helper/helperFunctions";

// Composer helper utilities for shared functionality between message composers
export {
  // Agentic user helpers
  isAgenticUser,
  deriveHideButton,
  deriveDisableFeature,
  applyAgenticSendDelay,
  trackAgenticParentMessageId,
  getParentMessageId,
  // Reply message helpers
  setQuotedMessageSafe,
  getReplyMessageId,
  hasActiveReply,
  handleReplyOnSend,
  // Send button state helpers
  isSendButtonDisabled,
  getSendButtonTint,
  // Message creation helpers
  createTextMessage,
  createMediaMessage,
  // Mention helpers
  parseMentionKey,
  calcDeletionRange,
  collectOverlappingMentions,
  shiftRemainingMentionKeys,
  // Utility helpers
  generateMessageMuid,
  isTextEmpty,
  getMessageIdSafe,
} from "./helper/composerHelpers";

export type {
  ReplyMessageState,
  MessagePreviewState,
  AgenticSendDelayConfig,
  AgenticParentMessageConfig,
  ReplyMessageSendConfig,
  SendButtonStateConfig,
  CreateTextMessageConfig,
  CreateMediaMessageConfig,
  MentionOverlap,
} from "./helper/composerHelpers";