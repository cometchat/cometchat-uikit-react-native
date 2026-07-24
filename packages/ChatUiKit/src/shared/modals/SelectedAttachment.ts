import { CometChat } from '@cometchat/chat-sdk-react-native';
import { UploadState } from './UploadState';

/**
 * Represents a single file in the pre-send attachment strip.
 * Lives only in the composer — discarded after the message is sent or cancelled.
 */
export interface SelectedAttachment {
  /** Caller-assigned UUID. Matches FileUploadInput.fileId sent to CometChat.uploadFiles(). */
  fileId: string;

  /** Local file reference from the picker. */
  file: {
    uri: string;   // file:// (iOS) or content:// (Android)
    name: string;  // original filename with extension
    type: string;  // MIME type e.g. "image/jpeg"
    size: number;  // bytes
  };

  /** Current upload lifecycle state — drives strip item UI and send gate. */
  uploadState: UploadState;

  /** Upload progress 0–100. Only meaningful when uploadState === 'UPLOADING'. */
  uploadProgress: number;

  /** Populated when uploadState === 'COMPLETED'. Contains the CDN URL for the sent message. */
  uploadedAttachment?: CometChat.Attachment;

  /** Localization key shown in the strip item error label (e.g. 'UPLOAD_FAILED', 'FILE_TOO_LARGE'). */
  errorKey?: string;

  /** SDK upload error CODE for a rejected file (e.g. 'ERR_FILE_SIZE_EXCEEDED'). Not shown inline —
   *  resolved to a reason toast when the user taps the errored tile. */
  errorCode?: string;

  /** Full SDK error object for a failed/rejected file (debug — logged when the tile is tapped). */
  rawError?: any;

  /** Video duration in whole seconds, read once at staging (react-native-video `onLoad`). Written
   *  into the attachment metadata on send so the receiver's bubble shows the duration chip.
   *  `undefined` = not yet probed; `0` = probed but no valid duration (chip omitted). */
  durationSeconds?: number;

}

/**
 * Single source of truth for the `{ uri, name, type, size }` object handed to the upload queue.
 * Gallery, document picker, and clipboard/paste all route through this so the object shape AND
 * value types are IDENTICAL regardless of source (pickers expose `type`, paste exposes `mimeType`;
 * both normalize to `type`; `size` is always coerced to a real number). Prevents per-source drift.
 */
export function toAttachmentFile(src: {
  uri: string;
  name?: string;
  type?: string;
  mimeType?: string;
  size?: number;
}): SelectedAttachment['file'] {
  return {
    uri: src.uri,
    name: src.name ?? 'file',
    type: src.type ?? src.mimeType ?? 'application/octet-stream',
    size: Number(src.size) || 0,
  };
}
