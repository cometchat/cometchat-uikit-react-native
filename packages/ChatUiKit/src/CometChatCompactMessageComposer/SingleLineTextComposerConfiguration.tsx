import { ImageSourcePropType, ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { SingleLineMessageComposerStyleInterface } from './CometChatCompactMessageComposer';
import { MessageComposerStyle } from '../CometChatMessageComposer/styles';
import {
  DEFAULT_MIN_HEIGHT,
  DEFAULT_MAX_LINES,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_PADDING_VERTICAL,
  calculateMaxHeightFromLines,
} from './heightUtils';

/**
 * Default values for CometChatSingleLineMessageComposer
 * 
 * This configuration file documents all default values used by the component.
 * These defaults are applied when props are not explicitly provided.
 */

/**
 * Default prop values for CometChatSingleLineMessageComposer
 */
export const SingleLineMessageComposerDefaults = {
  /**
   * Position of auxiliary buttons
   * @default 'right'
   */
  auxiliaryButtonsAlignment: 'right' as 'left' | 'right',

  /**
   * Whether to hide auxiliary buttons
   * @default false
   */
  hideAuxiliaryButton: false,

  /**
   * Whether to disable typing indicator events
   * @default false
   */
  disableTypingEvents: false,

  /**
   * Whether to disable sound on message send
   * Note: Disabled by default for single-line composer (unlike MessageComposer)
   * @default true
   */
  disableSoundForMessages: true,

  /**
   * Whether to disable mentions functionality
   * @default false
   */
  disableMentions: false,

  /**
   * Whether to hide voice recording button
   * @default false
   */
  hideVoiceRecording: false,

  /**
   * Image quality for camera captures (1-100)
   * @default 20
   */
  imageQuality: 20,

  /**
   * Placeholder text localization key
   * Uses localize('ENTER_YOUR_MESSAGE_HERE') at runtime
   */
  placeholderTextKey: 'ENTER_YOUR_MESSAGE_HERE',

  /**
   * Maximum number of lines before scrolling is enabled
   * @default 5
   */
  maxLines: DEFAULT_MAX_LINES,

  /**
   * Minimum height for the input in pixels
   * @default 40 (single line height)
   */
  minInputHeight: DEFAULT_MIN_HEIGHT,

  /**
   * Maximum height for the input in pixels (calculated from maxLines by default)
   * Overrides maxLines if explicitly provided
   * @default calculated from maxLines (5 * 24 + 12 * 2 = 144)
   */
  maxInputHeight: calculateMaxHeightFromLines(DEFAULT_MAX_LINES, DEFAULT_LINE_HEIGHT, DEFAULT_PADDING_VERTICAL),
};

/**
 * Default style values for CometChatSingleLineMessageComposer
 * These are applied using theme palette values at runtime
 */
export const SingleLineMessageComposerStyleDefaults = {
  /**
   * Container border radius
   * @default 8
   */
  borderRadius: 8,

  /**
   * Container border width
   * @default 1
   */
  borderWidth: 1,

  /**
   * Input background color
   * @default 'transparent'
   */
  inputBackgroundColor: 'transparent',

  /**
   * Minimum height for the text input (for auto-expand mode)
   * @default 40
   */
  minHeight: DEFAULT_MIN_HEIGHT,

  /**
   * Maximum height for the text input (for auto-expand mode)
   * @default calculated from maxLines (5 * 24 + 12 * 2 = 144)
   */
  maxHeight: calculateMaxHeightFromLines(DEFAULT_MAX_LINES, DEFAULT_LINE_HEIGHT, DEFAULT_PADDING_VERTICAL),

  /**
   * Line height for text (used in maxLines calculation)
   * @default 24
   */
  lineHeight: DEFAULT_LINE_HEIGHT,
};

/**
 * Theme-dependent style defaults (v5 pattern)
 * These functions return the default values based on the current theme.
 * 
 * V5 uses theme.color instead of theme.palette:
 * - theme.color.background1 instead of theme.palette.getBackgroundColor()
 * - theme.color.borderLight instead of theme.palette.getAccent100()
 * - theme.color.textPrimary instead of theme.palette.getAccent()
 * - theme.color.textTertiary instead of theme.palette.getAccent500()
 * - theme.color.primary instead of theme.palette.getPrimary()
 * - theme.color.iconTertiary instead of theme.palette.getAccent400()
 * - theme.color.iconSecondary instead of theme.palette.getAccent500()
 */
export const getThemeStyleDefaults = (theme: any): Partial<MessageComposerStyle> => ({
  /**
   * Container background color
   * @default theme.color.background1
   */
  containerStyle: {
    backgroundColor: theme.color?.background1,
  } as ViewStyle,

  /**
   * Message input styles derived from theme
   */
  messageInputStyles: {
    containerStyle: {
      borderColor: theme.color?.borderLight,
    } as ViewStyle,
    textStyle: {
      color: theme.color?.textPrimary,
    } as TextStyle,
    placeHolderTextColor: theme.color?.textTertiary,
    dividerStyle: {
      backgroundColor: theme.color?.borderLight,
    } as ViewStyle,
  },

  /**
   * Attachment icon style
   */
  attachmentIconStyle: {
    tintColor: theme.color?.iconSecondary,
  } as ImageStyle,
});

/**
 * Layout defaults from styles.ts
 * These are fixed pixel values used in the component layout
 */
export const SingleLineMessageComposerLayoutDefaults = {
  /**
   * Outer wrapper padding
   */
  wrapper: {
    paddingTop: 0,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },

  /**
   * Input row padding and gap
   */
  inputRow: {
    padding: 12,
    gap: 12,
  },

  /**
   * Right icons container gap
   */
  rightIconsGap: 16,

  /**
   * Icon dimensions
   */
  iconSize: {
    height: 24,
    width: 24,
  },

  /**
   * Text input font settings
   */
  textInput: {
    fontSize: 14,
    lineHeight: 16.8, // 14 * 1.2
  },

  /**
   * Separator height
   */
  separatorHeight: 1,
};

/**
 * Configuration interface for CometChatSingleLineMessageComposer
 */
export interface SingleLineMessageComposerConfigurationInterface {
  /**
   * Position of auxiliary buttons
   */
  auxiliaryButtonsAlignment?: 'left' | 'right';

  /**
   * Whether to hide auxiliary buttons
   */
  hideAuxiliaryButton?: boolean;

  /**
   * Whether to hide all auxiliary buttons (alias for hideAuxiliaryButton)
   */
  hideAuxiliaryButtons?: boolean;

  /**
   * Whether to disable typing indicator events
   */
  disableTypingEvents?: boolean;

  /**
   * Whether to disable sound on message send
   */
  disableSoundForMessages?: boolean;

  /**
   * Whether to disable mentions functionality
   */
  disableMentions?: boolean;

  /**
   * Whether to hide voice recording button
   */
  hideVoiceRecording?: boolean;

  /**
   * Whether to hide the attachment button
   */
  hideAttachmentButton?: boolean;

  /**
   * Whether to hide the stickers button
   */
  hideStickersButton?: boolean;

  /**
   * Whether to hide the send button
   */
  hideSendButton?: boolean;

  /**
   * Image quality for camera captures (1-100)
   */
  imageQuality?: number;

  /**
   * Placeholder text for the input
   */
  placeHolderText?: string;

  /**
   * Initial text for the composer
   */
  initialComposertext?: string;

  /**
   * Custom styles for the composer
   */
  style?: SingleLineMessageComposerStyleInterface;

  /**
   * Custom icon for the send button
   */
  sendButtonIcon?: ImageSourcePropType;

  /**
   * Custom icon for attachments
   */
  attachmentIcon?: ImageSourcePropType;

  /**
   * Custom icon for voice recording
   */
  voiceRecordingIconURL?: string;

  /**
   * Maximum number of lines before scrolling is enabled.
   * @default 5
   */
  maxLines?: number;

  /**
   * Minimum height for the input in pixels.
   * @default 40 (single line height)
   */
  minInputHeight?: number;

  /**
   * Maximum height for the input in pixels.
   * Overrides maxLines if both are provided.
   */
  maxInputHeight?: number;

  /**
   * Whether to disable the @all mention suggestion
   */
  disableMentionAll?: boolean;

  /**
   * Custom label for the group-wide mention
   */
  mentionAllLabel?: string;

  /**
   * Hide camera option in attachment menu
   */
  hideCameraOption?: boolean;

  /**
   * Hide image attachment option
   */
  hideImageAttachmentOption?: boolean;

  /**
   * Hide video attachment option
   */
  hideVideoAttachmentOption?: boolean;

  /**
   * Hide audio attachment option
   */
  hideAudioAttachmentOption?: boolean;

  /**
   * Hide file attachment option
   */
  hideFileAttachmentOption?: boolean;

  /**
   * Hide polls attachment option
   */
  hidePollsAttachmentOption?: boolean;

  /**
   * Hide collaborative document option
   */
  hideCollaborativeDocumentOption?: boolean;

  /**
   * Hide collaborative whiteboard option
   */
  hideCollaborativeWhiteboardOption?: boolean;
}

/**
 * Configuration class for CometChatSingleLineMessageComposer
 * 
 * Use this class to create a configuration object with custom defaults
 * that can be passed to the component.
 */
export class SingleLineMessageComposerConfiguration implements SingleLineMessageComposerConfigurationInterface {
  /**
   * Position of auxiliary buttons
   */
  auxiliaryButtonsAlignment?: 'left' | 'right';

  /**
   * Whether to hide auxiliary buttons
   */
  hideAuxiliaryButton?: boolean;

  /**
   * Whether to hide all auxiliary buttons (alias for hideAuxiliaryButton)
   */
  hideAuxiliaryButtons?: boolean;

  /**
   * Whether to disable typing indicator events
   */
  disableTypingEvents?: boolean;

  /**
   * Whether to disable sound on message send
   */
  disableSoundForMessages?: boolean;

  /**
   * Whether to disable mentions functionality
   */
  disableMentions?: boolean;

  /**
   * Whether to hide voice recording button
   */
  hideVoiceRecording?: boolean;

  /**
   * Whether to hide the attachment button
   */
  hideAttachmentButton?: boolean;

  /**
   * Whether to hide the stickers button
   */
  hideStickersButton?: boolean;

  /**
   * Whether to hide the send button
   */
  hideSendButton?: boolean;

  /**
   * Image quality for camera captures (1-100)
   */
  imageQuality?: number;

  /**
   * Placeholder text for the input
   */
  placeHolderText?: string;

  /**
   * Initial text for the composer
   */
  initialComposertext?: string;

  /**
   * Custom styles for the composer
   */
  style?: SingleLineMessageComposerStyleInterface;

  /**
   * Custom icon for the send button
   */
  sendButtonIcon?: ImageSourcePropType;

  /**
   * Custom icon for attachments
   */
  attachmentIcon?: ImageSourcePropType;

  /**
   * Custom icon for voice recording
   */
  voiceRecordingIconURL?: string;

  /**
   * Maximum number of lines before scrolling is enabled.
   * @default 5
   */
  maxLines?: number;

  /**
   * Minimum height for the input in pixels.
   * @default 40 (single line height)
   */
  minInputHeight?: number;

  /**
   * Maximum height for the input in pixels.
   * Overrides maxLines if both are provided.
   */
  maxInputHeight?: number;

  /**
   * Whether to disable the @all mention suggestion
   */
  disableMentionAll?: boolean;

  /**
   * Custom label for the group-wide mention
   */
  mentionAllLabel?: string;

  /**
   * Hide camera option in attachment menu
   */
  hideCameraOption?: boolean;

  /**
   * Hide image attachment option
   */
  hideImageAttachmentOption?: boolean;

  /**
   * Hide video attachment option
   */
  hideVideoAttachmentOption?: boolean;

  /**
   * Hide audio attachment option
   */
  hideAudioAttachmentOption?: boolean;

  /**
   * Hide file attachment option
   */
  hideFileAttachmentOption?: boolean;

  /**
   * Hide polls attachment option
   */
  hidePollsAttachmentOption?: boolean;

  /**
   * Hide collaborative document option
   */
  hideCollaborativeDocumentOption?: boolean;

  /**
   * Hide collaborative whiteboard option
   */
  hideCollaborativeWhiteboardOption?: boolean;

  constructor(config: Partial<SingleLineMessageComposerConfigurationInterface> = {}) {
    Object.assign(this, config);
  }

  /**
   * Create a configuration with all defaults explicitly set
   */
  static withDefaults(): SingleLineMessageComposerConfiguration {
    return new SingleLineMessageComposerConfiguration({
      auxiliaryButtonsAlignment: SingleLineMessageComposerDefaults.auxiliaryButtonsAlignment,
      hideAuxiliaryButton: SingleLineMessageComposerDefaults.hideAuxiliaryButton,
      disableTypingEvents: SingleLineMessageComposerDefaults.disableTypingEvents,
      disableSoundForMessages: SingleLineMessageComposerDefaults.disableSoundForMessages,
      disableMentions: SingleLineMessageComposerDefaults.disableMentions,
      hideVoiceRecording: SingleLineMessageComposerDefaults.hideVoiceRecording,
      imageQuality: SingleLineMessageComposerDefaults.imageQuality,
      maxLines: SingleLineMessageComposerDefaults.maxLines,
      minInputHeight: SingleLineMessageComposerDefaults.minInputHeight,
      maxInputHeight: SingleLineMessageComposerDefaults.maxInputHeight,
    });
  }
}
