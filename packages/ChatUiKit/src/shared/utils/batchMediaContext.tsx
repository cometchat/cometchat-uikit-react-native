import { createContext } from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';

// ---------------------------------------------------------------------------
// §8.2 — Batch-spanning fullscreen viewer.
//
// After the §7 fan-out, a batch's images and videos live on SEPARATE messages
// (one Images message + one Videos message sharing metadata.batchId). Tapping a
// tile should open a pager over the WHOLE batch's image+video set, not just the
// tapped message's. The message list is the only layer that can see sibling
// messages, so it provides this lookup via context; a media bubble consumes it
// and falls back to its own attachments when no provider is present (e.g. threads).
// ---------------------------------------------------------------------------

export interface BatchMediaResult {
  /** Union of image+video attachments across the batch, in batchIndex order. */
  items: CometChat.Attachment[];
  /** Index in `items` where the queried message's own media begins. */
  offsetForMessage: number;
}

export interface BatchMediaContextValue {
  /**
   * Returns the batch-spanning image+video list for `message`, or null when the
   * message is not part of a multi-message batch (caller should use its own media).
   */
  getBatchImageVideoItems: (message: CometChat.MediaMessage) => BatchMediaResult | null;
}

export const CometChatBatchMediaContext = createContext<BatchMediaContextValue | null>(null);
