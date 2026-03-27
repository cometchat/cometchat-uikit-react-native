/**
 * Shared helper functions for CometChat message composers.
 * These utilities are used by both CometChatMessageComposer and CometChatSingleLineMessageComposer
 * to ensure consistent behavior and maintainability.
 * 
 * DESIGN PRINCIPLE: All composer functionality should be extracted into reusable helpers
 * to ensure feature parity and plug-and-play compatibility between composers.
 * 
 * @module composerHelpers
 */

//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';

// ============================================================================
// AGENTIC USER HELPERS
// ============================================================================

/**
 * Check if a user is an agentic user (AI agent).
 * Agentic users have the role '@agentic' and require special handling:
 * - Auto-hide certain buttons (attachment, stickers, voice recording)
 * - Disable typing events and mentions
 * - Apply send button delay
 * - Track parent message ID for threaded conversations
 * 
 * @param user - The CometChat user object to check
 * @returns True if the user has role '@agentic'
 */
export const isAgenticUser = (user?: CometChat.User): boolean => {
  return user?.getRole?.() === '@agentic';
};

/**
 * Derive button visibility based on agentic user status and prop value.
 * When user is agentic, buttons are automatically hidden regardless of prop values.
 * 
 * @param isAgentic - Whether the user is an agentic user
 * @param propValue - The prop value for hiding the button
 * @returns True if the button should be hidden
 */
export const deriveHideButton = (isAgentic: boolean, propValue?: boolean): boolean => {
  return isAgentic ? true : (propValue ?? false);
};

/**
 * Derive feature disabled state based on agentic user status and prop value.
 * When user is agentic, features are automatically disabled regardless of prop values.
 * 
 * @param isAgentic - Whether the user is an agentic user
 * @param propValue - The prop value for disabling the feature
 * @returns True if the feature should be disabled
 */
export const deriveDisableFeature = (isAgentic: boolean, propValue?: boolean): boolean => {
  return isAgentic ? true : (propValue ?? false);
};

/**
 * Configuration for agentic user send button delay.
 */
export interface AgenticSendDelayConfig {
  /** Whether the user is agentic */
  isAgentic: boolean;
  /** Current delay state setter */
  setDelayState: (value: boolean) => void;
  /** Timer ref for cleanup */
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  /** Delay duration in milliseconds (default: 1000) */
  delayMs?: number;
}

/**
 * Apply send button delay for agentic users.
 * Prevents rapid-fire messages to AI agents by disabling send button for 1 second.
 * 
 * @param config - Configuration for the delay
 */
export const applyAgenticSendDelay = (config: AgenticSendDelayConfig): void => {
  const { isAgentic, setDelayState, timerRef, delayMs = 1000 } = config;
  
  if (!isAgentic) return;
  
  setDelayState(true);
  
  if (timerRef.current) {
    clearTimeout(timerRef.current);
  }
  
  timerRef.current = setTimeout(() => {
    setDelayState(false);
  }, delayMs);
};

/**
 * Configuration for tracking parent message ID for agentic users.
 */
export interface AgenticParentMessageConfig {
  /** Whether the user is agentic */
  isAgentic: boolean;
  /** Parent message ID from props (if provided) */
  parentMessageIdProp?: number;
  /** Ref to store tracked parent message ID */
  parentMessageIdRef: React.MutableRefObject<number | null>;
  /** The sent message object */
  message: any;
}

/**
 * Track parent message ID for agentic users.
 * For the first message sent to an agentic user without a parentMessageId prop,
 * stores the message ID as the parent for subsequent messages.
 * 
 * @param config - Configuration for parent message tracking
 * @returns The message ID if it was stored, null otherwise
 */
export const trackAgenticParentMessageId = (config: AgenticParentMessageConfig): number | null => {
  const { isAgentic, parentMessageIdProp, parentMessageIdRef, message } = config;
  
  if (!isAgentic || parentMessageIdProp || !message?.getId) {
    return null;
  }
  
  const messageId = typeof message.getId() === 'string' 
    ? Number(message.getId()) 
    : message.getId();
  
  if (!isNaN(messageId) && !parentMessageIdRef.current) {
    parentMessageIdRef.current = messageId;
    return messageId;
  }
  
  return null;
};

/**
 * Get the parent message ID to use for a message.
 * Prioritizes prop value, then tracked value for agentic users.
 * 
 * @param parentMessageIdProp - Parent message ID from props
 * @param isAgentic - Whether the user is agentic
 * @param parentMessageIdRef - Ref containing tracked parent message ID
 * @returns The parent message ID to use, or null if none
 */
export const getParentMessageId = (
  parentMessageIdProp?: number,
  isAgentic?: boolean,
  parentMessageIdRef?: React.MutableRefObject<number | null>
): number | null => {
  if (parentMessageIdProp) {
    return parentMessageIdProp;
  }
  if (isAgentic && parentMessageIdRef?.current) {
    return parentMessageIdRef.current;
  }
  return null;
};

// ============================================================================
// REPLY MESSAGE HELPERS
// ============================================================================

/**
 * Interface for reply message state used by composers.
 */
export interface ReplyMessageState {
  message: any;
  mode: string;
}

/**
 * Interface for message preview state used by composers (edit mode).
 */
export interface MessagePreviewState {
  message: any;
  mode: string;
}

/**
 * Get the reply message ID from a reply message state.
 * 
 * @param replyMessage - The reply message state
 * @returns The message ID or null if not available
 */
export const getReplyMessageId = (replyMessage: ReplyMessageState | null): number | null => {
  return replyMessage?.message?.getId?.() ?? null;
};

/**
 * Check if a reply message is active.
 * 
 * @param replyMessage - The reply message state
 * @returns True if there is an active reply message
 */
export const hasActiveReply = (replyMessage: ReplyMessageState | null): boolean => {
  return replyMessage !== null && replyMessage.message !== null;
};

/**
 * Set quoted message on a CometChat message for reply functionality.
 * Uses SDK's built-in quoted message functionality with error handling.
 * 
 * @param message - The message to set the quoted message on (TextMessage or MediaMessage)
 * @param replyMessage - The original message being replied to
 * @param replyMessageId - The ID of the original message
 * @returns True if quoted message was set successfully, false otherwise
 */
export const setQuotedMessageSafe = (
  message: CometChat.TextMessage | CometChat.MediaMessage,
  replyMessage: any,
  replyMessageId: number | string
): boolean => {
  try {
    if (typeof (message as any).setQuotedMessage === 'function') {
      (message as any).setQuotedMessage(replyMessage);
    }
    if (typeof (message as any).setQuotedMessageId === 'function') {
      (message as any).setQuotedMessageId(replyMessageId);
    }
    return true;
  } catch (error) {
    // Silently handle errors - quoted message is optional
    return false;
  }
};

/**
 * Configuration for handling reply message on send.
 */
export interface ReplyMessageSendConfig {
  /** The message being sent */
  message: CometChat.TextMessage | CometChat.MediaMessage;
  /** Current reply message state */
  replyMessage: ReplyMessageState | null;
  /** Callback to clear reply state after handling */
  clearReplyState?: () => void;
}

/**
 * Handle reply message when sending a message.
 * Sets quoted message if reply is active and optionally clears reply state.
 * 
 * @param config - Configuration for reply handling
 * @returns True if quoted message was set, false otherwise
 */
export const handleReplyOnSend = (config: ReplyMessageSendConfig): boolean => {
  const { message, replyMessage, clearReplyState } = config;
  
  const replyMessageId = getReplyMessageId(replyMessage);
  
  if (replyMessageId && replyMessage?.message) {
    const success = setQuotedMessageSafe(message, replyMessage.message, replyMessageId);
    
    if (clearReplyState) {
      clearReplyState();
    }
    
    return success;
  }
  
  return false;
};

// ============================================================================
// SEND BUTTON STATE HELPERS
// ============================================================================

/**
 * Configuration for determining send button disabled state.
 */
export interface SendButtonStateConfig {
  /** Current input text */
  inputText: string;
  /** Whether streaming is active (for agentic users) */
  isStreaming?: boolean;
  /** Whether send button delay is active (for agentic users) */
  isSendButtonDelayed?: boolean;
  /** Whether in edit mode */
  isEditMode?: boolean;
}

/**
 * Determine if send button should be disabled.
 * Considers input text, streaming state, and delay state.
 * 
 * @param config - Configuration for send button state
 * @returns True if send button should be disabled
 */
export const isSendButtonDisabled = (config: SendButtonStateConfig): boolean => {
  const { inputText, isStreaming = false, isSendButtonDelayed = false, isEditMode = false } = config;
  
  // In edit mode, only check if text is empty
  if (isEditMode) {
    return inputText.trim().length === 0;
  }
  
  return isStreaming || inputText.trim().length === 0 || isSendButtonDelayed;
};

/**
 * Get send button tint color based on disabled state.
 * 
 * @param isDisabled - Whether the button is disabled
 * @param activeTint - Tint color when active
 * @param inactiveTint - Tint color when inactive
 * @returns The appropriate tint color
 */
export const getSendButtonTint = (
  isDisabled: boolean,
  activeTint: string,
  inactiveTint: string
): string => {
  return isDisabled ? inactiveTint : activeTint;
};

// ============================================================================
// MESSAGE CREATION HELPERS
// ============================================================================

/**
 * Configuration for creating a text message.
 */
export interface CreateTextMessageConfig {
  /** Receiver ID (user UID or group GUID) */
  receiverId: string;
  /** Message text */
  text: string;
  /** Receiver type ('user' or 'group') */
  receiverType: string;
  /** Logged in user */
  sender: CometChat.User;
  /** Receiver (user or group) */
  receiver: CometChat.User | CometChat.Group;
  /** Message unique ID */
  muid: string;
  /** Parent message ID for threaded messages */
  parentMessageId?: number | null;
}

/**
 * Create a text message with common configuration.
 * 
 * @param config - Configuration for the text message
 * @returns Configured TextMessage object
 */
export const createTextMessage = (config: CreateTextMessageConfig): CometChat.TextMessage => {
  const { receiverId, text, receiverType, sender, receiver, muid, parentMessageId } = config;
  
  const textMessage = new CometChat.TextMessage(receiverId, text, receiverType);
  
  textMessage.setSender(sender);
  textMessage.setReceiver(receiver);
  textMessage.setMuid(muid);
  
  if (parentMessageId) {
    textMessage.setParentMessageId(parentMessageId);
  }
  
  return textMessage;
};

/**
 * Configuration for creating a media message.
 */
export interface CreateMediaMessageConfig {
  /** Receiver ID (user UID or group GUID) */
  receiverId: string;
  /** Media file */
  file: any;
  /** Media type (image, video, audio, file) */
  mediaType: string;
  /** Receiver type ('user' or 'group') */
  receiverType: string;
  /** Logged in user */
  sender: CometChat.User;
  /** Receiver (user or group) */
  receiver: CometChat.User | CometChat.Group;
  /** Message unique ID */
  muid: string;
  /** Parent message ID for threaded messages */
  parentMessageId?: number | null;
}

/**
 * Create a media message with common configuration.
 * 
 * @param config - Configuration for the media message
 * @returns Configured MediaMessage object
 */
export const createMediaMessage = (config: CreateMediaMessageConfig): CometChat.MediaMessage => {
  const { receiverId, file, mediaType, receiverType, sender, receiver, muid, parentMessageId } = config;
  
  const mediaMessage = new CometChat.MediaMessage(receiverId, file, mediaType, receiverType);
  
  mediaMessage.setSender(sender);
  mediaMessage.setReceiver(receiver);
  mediaMessage.setMuid(muid);
  
  if (parentMessageId) {
    mediaMessage.setParentMessageId(parentMessageId);
  }
  
  return mediaMessage;
};

// ============================================================================
// MENTION HELPERS
// ============================================================================

/**
 * Interface for mention overlap detection.
 */
export interface MentionOverlap {
  key: string;
  value: any;
  start: number;
  end: number;
}

/**
 * Parse a mention key string into start/end positions.
 * Mention keys are in format "start_end".
 * 
 * @param key - The mention key string
 * @returns Object with start and end positions, or undefined if invalid
 */
export const parseMentionKey = (key: string): { start: number; end: number } | undefined => {
  const [startStr, endStr] = key.split('_');
  const start = Number(startStr);
  const end = Number(endStr);
  
  const isValid = Number.isFinite(start) && Number.isFinite(end);
  
  if (!isValid && __DEV__) {
    console.warn(`Invalid mention key: "${key}" (expected "start_end")`);
  }
  
  return isValid ? { start, end } : undefined;
};

/**
 * Calculate the deletion range based on selection and deletion length.
 * 
 * @param selection - Current selection with start and end positions
 * @param deletionLength - Number of characters being deleted
 * @returns The range of text being deleted
 */
export const calcDeletionRange = (
  selection: { start: number; end: number },
  deletionLength: number
): { start: number; end: number } => {
  return selection.start === selection.end
    ? { start: Math.max(0, selection.start - deletionLength), end: selection.start }
    : { start: selection.start, end: selection.end };
};

/**
 * Collect all mentions that overlap with a deletion range.
 * 
 * @param range - The deletion range
 * @param mentionMap - Map of mention keys to mention data
 * @returns Array of overlapping mentions sorted by start position
 */
export const collectOverlappingMentions = <T>(
  range: { start: number; end: number },
  mentionMap: Map<string, T>
): MentionOverlap[] => {
  const overlaps: MentionOverlap[] = [];
  
  mentionMap.forEach((value, key) => {
    const mentionRange = parseMentionKey(key);
    if (!mentionRange) return;
    
    const { start, end } = mentionRange;
    if (range.start < end && range.end > start) {
      overlaps.push({ key, value, start, end });
    }
  });
  
  overlaps.sort((a, b) => a.start - b.start);
  return overlaps;
};

/**
 * Shift remaining mention keys after deletion.
 * Updates mention positions to account for removed text.
 * 
 * @param map - The mention map to update
 * @param shiftStart - Position after which to shift
 * @param delta - Amount to shift (negative for deletion)
 */
export const shiftRemainingMentionKeys = <T>(
  map: Map<string, T>,
  shiftStart: number,
  delta: number
): void => {
  if (delta === 0) return;
  
  const shifted = new Map<string, T>();
  
  map.forEach((val, key) => {
    const range = parseMentionKey(key);
    if (!range) return;
    
    const { start, end } = range;
    if (start > shiftStart) {
      shifted.set(`${start + delta}_${end + delta}`, val);
    } else {
      shifted.set(key, val);
    }
  });
  
  map.clear();
  shifted.forEach((v, k) => map.set(k, v));
};

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Generate a unique message ID using Unix timestamp in milliseconds.
 * 
 * @returns Unique message ID string
 */
export const generateMessageMuid = (): string => {
  return String(Date.now());
};

/**
 * Check if text is empty or contains only whitespace.
 * 
 * @param text - The text to check
 * @returns True if text is empty or whitespace only
 */
export const isTextEmpty = (text: string): boolean => {
  return text.trim().length === 0;
};

/**
 * Safely get message ID from a message object.
 * Handles both string and number ID types.
 * 
 * @param message - The message object
 * @returns The message ID as a number, or null if not available
 */
export const getMessageIdSafe = (message: any): number | null => {
  if (!message?.getId) return null;
  
  const id = message.getId();
  const numId = typeof id === 'string' ? Number(id) : id;
  
  return isNaN(numId) ? null : numId;
};
