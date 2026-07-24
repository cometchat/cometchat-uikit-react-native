import {
  ActionItemInterface,
  CometChatActionSheet,
} from "./CometChatActionSheet";
import { CometChatAudioBubble, CometChatAudioBubbleInterface } from "./CometChatAudioBubble";
import { CometChatFileBubble, CometChatFileBubbleInterface } from "./CometChatFileBubble";
import {
  CometChatImageBubble,
  CometChatImageBubbleInterface,
} from "./CometChatImageBubble";
import {
  CometChatTextBubble,
  CometChatTextBubbleInterface,
} from "./CometChatTextBubble";
import { CometChatCardBubble } from "./CometChatCardBubble";
import {
  CometChatVideoBubble,
  CometChatVideoBubbleInterface
} from "./CometChatVideoBubble";

import {
  CometChatDate,
  CometChatDateInterface,
  DateStyle,
} from "./CometChatDate";
import {
  CometChatList,
  CometChatListActionsInterface,
  CometChatListProps,
  CometChatListStylesInterface,
} from "./CometChatList";
import {
  CometChatListItem,
  CometChatListItemInterface,
} from "./CometChatListItem";
export {
  CometChatReceipt,
} from "./CometChatReceipt";

export type {
  CometChatReceiptInterface,
} from "./CometChatReceipt";

import {
  CometChatStatusIndicator,
  CometChatStatusIndicatorInterface,
} from "./CometChatStatusIndicator";

import { CometChatBottomSheet, CometChatBottomSheetInterface } from "./CometChatBottomSheet";
import {
  CometChatConfirmDialog,
  CometChatConfirmDialogInterface,
} from "./CometChatConfirmDialog";
import {
  CometChatMediaRecorder,
  CometChatMediaRecorderInterface,
} from "./CometChatMediaRecorder";
import {
  CometChatMessageInput,
  CometChatMessageInputInterface
} from "./CometChatMessageInput";

import {
  CometChatQuickReactions,
} from "./CometChatQuickReactions";
import {
  CometChatReactionList,
  CometChatReactionListInterface,
} from "./CometChatReactionList";
import {
  CometChatReactions,
  CometChatReactionsInterface,
} from "./CometChatReactions";
import {
  CometChatRetryButton,
  CometChatRetryButtonProps,
} from "./CometChatRetryButton";

import { CometChatEmojiKeyboard } from "./CometChatEmojiKeyboard";

import {
  CometChatSuggestionList,
  CometChatSuggestionListInterface,
  SuggestionItem,
} from "./CometChatSuggestionList";
import { CometChatAvatar } from "./CometChatAvatar";
import { BadgeStyle, CometChatBadge } from "./CometChatBadge";
import { MenuItemInterface } from "./CometChatTooltipMenu";
import {
  CometChatReportDialog,
  CometChatReportDialogInterface,
} from "./CometChatReportDialog";

import {
  CometChatLinkConfirmPopup,
  CometChatLinkConfirmPopupInterface,
} from "./CometChatLinkConfirmPopup";

import {
  CometChatNewMessageIndicator,
  CometChatNewMessageIndicatorInterface,
  NewMessageIndicatorStyle,
} from "./CometChatNewMessageIndicator";

import {
  CometChatInlineAudioRecorder,
  formatDuration,
  AudioWaveformVisualizer,
  useAudioRecorder,
  getInlineAudioRecorderStyle,
  getInlineAudioRecorderStyleLight,
  getInlineAudioRecorderStyleDark,
} from "./CometChatInlineAudioRecorder";

import type {
  CometChatInlineAudioRecorderProps,
  CometChatInlineAudioRecorderStyle,
  AudioWaveformVisualizerProps,
  WaveformStyle,
  RecorderState,
  UseAudioRecorderReturn,
} from "./CometChatInlineAudioRecorder";

export type {
  CometChatConfirmDialogInterface,
  CometChatReportDialogInterface,
  CometChatLinkConfirmPopupInterface,
  CometChatDateInterface,
  CometChatFileBubbleInterface,
  CometChatImageBubbleInterface,
  CometChatListActionsInterface,
  CometChatBottomSheetInterface,
  CometChatAudioBubbleInterface,
  ActionItemInterface,
  CometChatListItemInterface,
  CometChatListStylesInterface,
  CometChatMediaRecorderInterface,
  CometChatMessageInputInterface,
  CometChatReactionListInterface,
  CometChatReactionsInterface,
  CometChatRetryButtonProps,
  CometChatStatusIndicatorInterface,
  CometChatSuggestionListInterface,
  CometChatVideoBubbleInterface,
  CometChatTextBubbleInterface,
  CometChatNewMessageIndicatorInterface,
  CometChatInlineAudioRecorderProps,
  CometChatInlineAudioRecorderStyle,
  AudioWaveformVisualizerProps,
  WaveformStyle,
  RecorderState,
  UseAudioRecorderReturn,
};

export {
  CometChatActionSheet,
  CometChatAudioBubble,
  CometChatAvatar,
  CometChatBadge,
  CometChatBottomSheet,
  CometChatConfirmDialog,
  CometChatReportDialog,
  CometChatLinkConfirmPopup,
  CometChatDate,
  CometChatEmojiKeyboard,
  CometChatFileBubble,
  CometChatImageBubble,
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
  CometChatCardBubble,
  CometChatNewMessageIndicator,
  CometChatInlineAudioRecorder,
  formatDuration,
  AudioWaveformVisualizer,
  useAudioRecorder,
  getInlineAudioRecorderStyle,
  getInlineAudioRecorderStyleLight,
  getInlineAudioRecorderStyleDark,
};


export type {
  BadgeStyle,
  CometChatListProps,
  DateStyle,
  MenuItemInterface,
  NewMessageIndicatorStyle,
};

// Multiple Attachment Support — U4 (§5.0 canonical names)
export {
  CometChatAttachmentTray,
  CometChatAttachmentTile,
  CometChatAttachmentPreview,       // backward-compat alias
  CometChatAttachmentPreviewItem,   // backward-compat alias
  getAttachmentPreviewStyle,
} from './CometChatAttachmentPreview';
export type {
  CometChatAttachmentTrayProps,
  CometChatAttachmentTileProps,
  CometChatAttachmentPreviewProps,
  CometChatAttachmentPreviewItemProps,
} from './CometChatAttachmentPreview';

// Design doc §8.0 — five per-type multi-attachment bubbles (no single "GalleryBubble").
// §8.1 — image/video share one media-grid renderer.
export { CometChatImagesBubble } from './CometChatImagesBubble';
export { CometChatVideosBubble } from './CometChatVideosBubble';
// §8.6 — per-type files bubble (vertical file-card list)
export { CometChatFilesBubble } from './CometChatFilesBubble';
export type { CometChatFilesBubbleProps } from './CometChatFilesBubble';
// §8.1a — shared/picked audio-file bubble (WhatsApp-style headphone chip + filename + seek bar)
export { CometChatAudiosBubble } from './CometChatAudiosBubble';
export type { CometChatAudiosBubbleProps } from './CometChatAudiosBubble';
// §8.1a — recorded voice-note bubble (waveform player, built on the existing CometChatAudioBubble)
export { CometChatVoiceNoteBubble } from './CometChatVoiceNoteBubble';
export type { CometChatVoiceNoteBubbleProps } from './CometChatVoiceNoteBubble';

// §8.2.1 — unified image+video pager (supersedes CometChatAttachmentViewer for multi-attachment)
export { CometChatMediaViewer } from './CometChatMediaViewer';
export type { CometChatMediaViewerProps } from './CometChatMediaViewer';

export { CometChatAttachmentViewer } from './CometChatAttachmentViewer';
export type { CometChatAttachmentViewerProps } from './CometChatAttachmentViewer';