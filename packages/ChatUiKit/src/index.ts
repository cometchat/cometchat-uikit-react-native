/// <reference path="./imageresolver.d.ts" />

import {
  ActionItemInterface,
  AdditionalParams,
  AudioWaveformVisualizerProps,
  //Add Call events here already exposed in Calls
  //Framework
  ChatConfigurator,
  CometChatActionSheet,
  CometChatAudioBubble,
  CometChatAudioBubbleInterface,
  CometChatAvatar,
  CometChatBadge,
  CometChatBottomSheet,
  CometChatBottomSheetInterface,
  CometChatConfirmDialog,
  CometChatReportDialog,
  CometChatConfirmDialogInterface,
  CometChatConversationEvents,
  //Utils
  CometChatConversationUtils,
  CometChatDate,
  CometChatDateInterface,
  CometChatEmojiKeyboard,
  CometChatFileBubble,
  CometChatFileBubbleInterface,
  CometChatGroupsEvents,
  CometChatImageBubble,
  CometChatImageBubbleInterface,
  CometChatInlineAudioRecorder,
  CometChatInlineAudioRecorderProps,
  CometChatInlineAudioRecorderStyle,
  CometChatListActionsInterface,
  //View
  CometChatListItem,
  CometChatListItemInterface,
  CometChatListStylesInterface,
  //Resources
  CometChatMediaRecorder,
  CometChatMediaRecorderInterface,
  CometChatMentionsFormatter,
  CometChatMessageComposerAction,
  CometChatMessageInputInterface,
  CometChatMessageOption,
  CometChatMessagePreview,
  CometChatMessageTemplate,
  CometChatQuickReactions,
  CometChatReactionList,
  CometChatReactionListInterface,
  CometChatReactions,
  CometChatReactionsInterface,
  CometChatSoundManager,
  CometChatStatusIndicator,
  CometChatStatusIndicatorInterface,
  CometChatSuggestionList,
  CometChatSuggestionListInterface,
  CometChatTextBubble,
  CometChatTextBubbleInterface,
  CometChatTextFormatter,
  //Events
  CometChatUIEventHandler,
  CometChatUIEvents,
  //CometChatUIKit
  CometChatUIKit,
  CometChatUIKitHelper,
  CometChatUiKitConstants,
  CometChatUrlsFormatter,
  CometChatRichTextFormatter,
  RichTextStyle,
  CometChatVideoBubble,
  CometChatVideoBubbleInterface,
  ConversationType,
  DataSource,
  DataSourceDecorator,
  ExtensionsDataSource,
  MentionTextStyle,
  MessageBubbleAlignmentType,
  MessageDataSource,
  MessageEvents,
  MessageListAlignmentType,
  MessageTimeAlignmentType,
  RecorderState,
  SelectionMode,
  SuggestionItem,
  UIKitSettings,
  UseAudioRecorderReturn,
  WaveformStyle,
  messageStatus,
  ThreadSubscriptionConfig,
  applyIncomingReply,
  applyEditedMessage,
  applySentMessage,
  applyOwnIncomingMessage,
  isThreadSubscribed,
  stampThreadSubscribed,
  toggleThreadSubscription,
  Icon,
  MenuItemInterface,
  getCometChatTranslation,
  getCurrentLanguage,
  // Pin & Save. PinSaveConfig is the opt-in gate — without it on the PUBLIC
  // barrel the feature cannot be switched on by an integrator at all.
  //
  // The three SERVER-owned flags behind it are resolved by the kit itself, at login and on
  // every reconnect (see PinSaveFeatureGates). These are exported so an integrator can read
  // the resolved state or force a re-read after flipping a flag in the dashboard.
  PinSaveConfig,
  PinConversationConfig,
  resolvePinSaveFeatures,
  refreshPinSaveFeatures,
  getPinSaveFeatures,
  resetPinSaveFeatures,
  isConversationPinned,
  isSystemPinnedConversation,
  isPinned,
  isSaved,
  isSystemPin,
  SYSTEM_PINNER,
} from "./shared";

import { stopStreamingForRunId, startStreamingForRunId, streamingState$, getStreamSpeed, setAIAssistantTools, setQueueCompletionCallback, removeQueueCompletionCallback, IStreamData,QueueCompletionCallback,checkAndTriggerQueueCompletion, getAIAssistantTools, handleWebsocketMessage, messageStream, notifyStreamRenderComplete, onConnected, onConnectionError, onDisconnected, setStreamSpeed, storeAIAssistantMessage, streamConnection$ } from "./shared/services/stream-message.service";

import  { StreamMessage}  from "./shared/modals/StreamMessage";
import {CometChatAIAssistantTools} from "./shared/modals/CometChatAIAssistantTools";

import {
  CometChatUsers,
  CometChatUsersActionsInterface,
  CometChatUsersInterface,
} from "./CometChatUsers";

import { CometChatGroups, CometChatGroupsInterface } from "./CometChatGroups";

import {
  CometChatConversations,
  ConversationInterface
} from "./CometChatConversations";

import {
  CometChatNotificationFeed,
  CometChatNotificationFeedInterface,
} from "./CometChatNotificationFeed";

import { CometChatGroupMembers, CometChatGroupMembersInterface } from "./CometChatGroupMembers";

import {
  CometChatMessageInformation,
  CometChatMessageInformationInterface,
} from "./CometChatMessageInformation";
import {
  CometChatSavedMessages,
  CometChatSavedMessagesInterface,
} from "./CometChatSavedMessages";
import {
  CometChatPinnedMessages,
  CometChatPinnedMessagesInterface,
} from "./CometChatPinnedMessages";

import {
  CometChatMessageList,
  CometChatMessageListActionsInterface,
  CometChatMessageListProps,
} from "./CometChatMessageList";

import {
  CometChatMessageComposer,
  CometChatMessageComposerInterface,
} from "./CometChatMessageComposer";

import {
  CometChatCompactMessageComposer,
  CometChatCompactMessageComposerInterface,
  SingleLineMessageComposerStyleInterface,
  ComposerInputHandle,
} from "./CometChatCompactMessageComposer";

import { CometChatAIAssistantChatHistory } from "./CometChatAIAssistantChatHistory";
import CometChatConversationStarter from "./shared/views/CometChatConversationStarter/CometChatConversationStarter";
import CometChatSmartReplies from "./shared/views/CometChatSmartReplies/CometChatSmartReplies";
import CometChatConversationSummary from "./shared/views/CometChatConversationSummary/CometChatConversationSummary";
import type { CometChatConversationStarterProps } from "./shared/views/CometChatConversationStarter/CometChatConversationStarter";
import type { CometChatSmartRepliesProps } from "./shared/views/CometChatSmartReplies/CometChatSmartReplies";
import type { CometChatConversationSummaryProps } from "./shared/views/CometChatConversationSummary/CometChatConversationSummary";

import { CometChatThreadHeader, CometChatThreadHeaderInterface } from "./CometChatThreadHeader";

import { CometChatSearch } from "./CometChatSearch";

import {
  CallButtonStyle,
  CallUIEvents,
  CallingExtension,
  CallingExtensionDecorator,
  CallingPackage,
  CometChatMeetCallBubble,
  CometChatCallButtonConfiguration,
  CometChatCallButtonConfigurationInterface,
  CometChatCallButtons,
  CometChatCallButtonsInterface,
  CometChatCallLogs,
  CometChatCallLogsConfigurationInterface,
  CometChatIncomingCall,
  CometChatOngoingCall,
  CometChatOutgoingCall,
} from "./calls";

import {
  CollaborativeDocumentExtension,
  CollaborativeWhiteboardExtension,
  CometChatCollaborativeDocumentBubble,
  CometChatCollaborativeWhiteBoardBubble,
  CometChatCreatePoll,
  CometChatCreatePollInterface,
  CometChatStickerBubble,
  CometChatStickerBubbleInterface,
  ExtensionConstants,
  LinkPreviewBubble,
  LinkPreviewBubbleInterface,
  LinkPreviewExtension,
  MessageTranslationBubble,
  MessageTranslationExtension,
  PollsConfigurationInterface,
  PollsExtension,
  StickerConfigurationInterface,
  StickersExtension,
  ThumbnailGenerationExtension,
} from "./extensions";

import { CometChatMessageListProps as CometChatMessageListInterface } from "./CometChatMessageList";
import { CometChatTheme } from "./theme/type";
import { getLastSeenTime } from "./shared";
export {
  CallUIEvents,
  CallingExtension,
  CallingExtensionDecorator,
  CallingPackage,
  //
  ChatConfigurator,
  CollaborativeDocumentExtension,
  CollaborativeWhiteboardExtension,
  //
  CometChatActionSheet,
  CometChatAudioBubble,
  CometChatAvatar,
  CometChatBadge,
  CometChatBottomSheet,
  CometChatMeetCallBubble,
  CometChatCallButtonConfiguration,
  /* Call Buttons */
  CometChatCallButtons,
  /*Call Logs */
  CometChatCallLogs,
  CometChatCollaborativeDocumentBubble,
  CometChatCollaborativeWhiteBoardBubble,
  CometChatConfirmDialog,
  CometChatReportDialog,
  CometChatConversationEvents,
  //
  CometChatConversationUtils,
  CometChatConversations,
  CometChatNotificationFeed,
  CometChatCreatePoll,
  CometChatDate,
  /* Reactions */
  /* Emoji Keyboard */
  CometChatEmojiKeyboard,
  CometChatFileBubble,
  CometChatGroups,
  CometChatGroupsEvents,
  CometChatGroupMembers,
  CometChatAIAssistantChatHistory,
  CometChatConversationStarter,
  CometChatSmartReplies,
  CometChatConversationSummary,
  CometChatImageBubble,
  CometChatIncomingCall,
  CometChatInlineAudioRecorder,
  //
  //
  CometChatListItem,
  //
  CometChatMediaRecorder,
  /* Emoji Keyboard */
  /* Text Formatters */
  CometChatMentionsFormatter,
  CometChatMessageComposer,
  CometChatCompactMessageComposer,
  CometChatMessageInformation,
  CometChatSavedMessages,
  CometChatPinnedMessages,
  CometChatMessageList,
  CometChatMessagePreview,
  CometChatMessageTemplate,
  CometChatOngoingCall,
  //
  CometChatOutgoingCall,
  CometChatQuickReactions,
  CometChatReactionList,
  /*Call Logs */
  /* Reactions */
  CometChatReactions,
  CometChatSoundManager,
  CometChatStatusIndicator,
  CometChatStickerBubble,
  CometChatSuggestionList,
  CometChatTextBubble,
  CometChatTextFormatter,
  CometChatThreadHeader,
  CometChatSearch,
  CometChatUIEventHandler,
  CometChatUIEvents,
  CometChatUIKit,
  CometChatUIKitHelper,
  CometChatUiKitConstants,
  CometChatUrlsFormatter,
  CometChatRichTextFormatter,
  RichTextStyle,
  CometChatUsers,
  CometChatVideoBubble,
  DataSourceDecorator,
  ExtensionConstants,
  ExtensionsDataSource,
  LinkPreviewBubble,
  LinkPreviewExtension,
  MentionTextStyle,
  MessageDataSource,
  MessageEvents,
  MessageTranslationBubble,
  MessageTranslationExtension,
  PollsExtension,
  StickersExtension,
  SuggestionItem,
  ThumbnailGenerationExtension,
  UIKitSettings,
  messageStatus,
  ThreadSubscriptionConfig,
  applyIncomingReply,
  applySentMessage,
  isThreadSubscribed,
  stampThreadSubscribed,
  toggleThreadSubscription,
  Icon,
  getCometChatTranslation,
  getCurrentLanguage,
  // Pin & Save — the opt-in gate plus the read helpers for custom bubbles.
  PinSaveConfig,
  PinConversationConfig,
  resolvePinSaveFeatures,
  refreshPinSaveFeatures,
  getPinSaveFeatures,
  resetPinSaveFeatures,
  isConversationPinned,
  isSystemPinnedConversation,
  isPinned,
  isSaved,
  isSystemPin,
  SYSTEM_PINNER,
  CometChatAIAssistantTools,
  type CometChatConversationStarterProps,
  type CometChatSmartRepliesProps,
  type CometChatConversationSummaryProps,
  StreamMessage,
  stopStreamingForRunId,
  startStreamingForRunId,
  streamingState$,
  getStreamSpeed,
  setAIAssistantTools,
  setQueueCompletionCallback,
  removeQueueCompletionCallback,
  type IStreamData,
  type QueueCompletionCallback,
  checkAndTriggerQueueCompletion,
  getAIAssistantTools,
  handleWebsocketMessage,
  messageStream,
  notifyStreamRenderComplete,
  onConnected,
  onConnectionError,
  onDisconnected,
  setStreamSpeed,
  storeAIAssistantMessage,
  streamConnection$
};
export { CometChatThemeProvider, useTheme } from "./theme";

// Multiple Attachment Support — public exports (PR review B1)
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
} from "./shared";
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
} from "./shared";

export {CometChatI18nProvider,useCometChatTranslation} from "./shared/resources/CometChatLocalizeNew"
export {localizedDateHelperInstance,LocalizedDateHelper} from "./shared/helper/LocalizedDateHelper"
export { useLocalizedDate } from "./shared/helper/useLocalizedDateHook";

export { CometChatMessageHeader } from "./CometChatMessageHeader";
export {getLastSeenTime}

export type {
  CometChatMessageComposerAction,
  CallButtonStyle,
  CometChatGroupsInterface,
  CometChatGroupMembersInterface,
  CometChatFileBubbleInterface,
  CometChatImageBubbleInterface,
  CometChatInlineAudioRecorderProps,
  CometChatInlineAudioRecorderStyle,
  CometChatListActionsInterface,
  CometChatListItemInterface,
  CometChatListStylesInterface,
  CometChatMessageInformationInterface,
  CometChatSavedMessagesInterface,
  CometChatPinnedMessagesInterface,
  CometChatMessageInputInterface,
  CometChatMessageListActionsInterface,
  CometChatMessageListInterface,
  CometChatMessageComposerInterface,
  CometChatCompactMessageComposerInterface,
  SingleLineMessageComposerStyleInterface,
  ComposerInputHandle,
  CometChatMessageOption,
  ActionItemInterface,
  AdditionalParams,
  AudioWaveformVisualizerProps,
  SelectionMode,
  CometChatReactionsInterface,
  CometChatReactionListInterface,
  CometChatMediaRecorderInterface,
  CometChatDateInterface,
  CometChatCreatePollInterface,
  CometChatConfirmDialogInterface,
  CometChatCallLogsConfigurationInterface,
  CometChatCallButtonsInterface,
  CometChatCallButtonConfigurationInterface,
  CometChatBottomSheetInterface,
  CometChatAudioBubbleInterface,
  CometChatStatusIndicatorInterface,
  CometChatStickerBubbleInterface,
  CometChatSuggestionListInterface,
  CometChatTextBubbleInterface,
  CometChatThreadHeaderInterface,
  CometChatUsersActionsInterface,
  CometChatUsersInterface,
  CometChatVideoBubbleInterface,
  ConversationInterface,
  CometChatNotificationFeedInterface,
  LinkPreviewBubbleInterface,
  PollsConfigurationInterface,
  RecorderState,
  StickerConfigurationInterface,
  ConversationType,
  DataSource,
  MessageListAlignmentType,
  MessageTimeAlignmentType,
  MessageBubbleAlignmentType,
  UseAudioRecorderReturn,
  WaveformStyle,
  CometChatTheme,
  MenuItemInterface
};

// Rich Text Editor
export { default as RichTextEditor } from './CometChatRichTextEditor';
export type {
  RichTextEditorRef,
  ContentChangeEvent,
  ActiveStylesState,
  RichTextEditorProps,
  RichTextEditorPropsExtended,
} from './CometChatRichTextEditor';
export type {
  Selection,
  StyleRange,
  Block,
  BlockType,
  TextAlignment,
  EditorVariant,
  ToolbarOption,
  SelectionChangeEvent,
  InlineStyleKey,
  RichTextEditorRef as RichTextEditorRefType,
} from './CometChatRichTextEditor/types';
