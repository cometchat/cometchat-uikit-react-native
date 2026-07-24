import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  DEFAULT_MAX_ATTACHMENT_COUNT,
  DEFAULT_MAX_FILE_SIZE,
} from '../modals/AttachmentPickerConfiguration';

export interface FileUploadLimits {
  /** Max number of attachments per message (server `file.count.max`). */
  fileCountMax: number;
  /** Max size **PER FILE**, in bytes (server `file.size.max`). NOT a combined/batch
   *  total — size is validated per file (design doc §6.1). */
  fileSizeMax: number;
}

/**
 * Ultimate fallback when the SDK getter is unavailable (older SDK) or errors.
 * Kept in parity with the SDK's own DEFAULT_VALUES (10 files / 100 MB per file).
 */
const DEFAULTS: FileUploadLimits = {
  fileCountMax: DEFAULT_MAX_ATTACHMENT_COUNT,
  fileSizeMax: DEFAULT_MAX_FILE_SIZE,
};

// Server limits don't change mid-session, so memoize the single fetch.
let cached: Promise<FileUploadLimits> | null = null;

/**
 * Server-authoritative upload limits. `fileCountMax` comes from the SDK's
 * `CometChat.getMaxAttachmentCount()` (reads `file.count.max` from cached app settings — the
 * same source the SDK's own validation uses, so UIKit and SDK can't disagree on count).
 * `fileSizeMax` has NO public SDK getter — the SDK enforces `file.size.max` internally — so it
 * stays on the DEFAULT here; it feeds only the "X MB" rejection toast, never enforcement.
 * `fileSizeMax` is PER FILE. Never rejects — resolves to DEFAULTS if the getter is missing
 * (older SDK) or fails. Memoized for the session.
 */
export function getFileUploadLimits(): Promise<FileUploadLimits> {
  if (!cached) {
    const getCount = (CometChat as unknown as {
      getMaxAttachmentCount?: () => Promise<number>;
    }).getMaxAttachmentCount;
    cached =
      typeof getCount === 'function'
        ? getCount()
            .then((count) => ({
              fileCountMax: count || DEFAULTS.fileCountMax,
              fileSizeMax: DEFAULTS.fileSizeMax,
            }))
            .catch(() => DEFAULTS)
        : Promise.resolve(DEFAULTS);
  }
  return cached;
}

/**
 * React hook for render-time access to the upload limits (e.g. a "N / max"
 * capacity hint). Returns DEFAULTS until the async fetch resolves.
 */
export function useFileUploadLimits(): FileUploadLimits {
  const [limits, setLimits] = useState<FileUploadLimits>(DEFAULTS);
  useEffect(() => {
    let alive = true;
    getFileUploadLimits().then((l) => {
      if (alive) setLimits(l);
    });
    return () => {
      alive = false;
    };
  }, []);
  return limits;
}

/**
 * Effective limit = tighten-only: a developer override may only make the limit
 * SMALLER than the server value, never larger (`min(dev, server)`).
 */
export function clampToServer(devValue: number | undefined, serverValue: number): number {
  return devValue == null ? serverValue : Math.min(devValue, serverValue);
}

/**
 * Gate a freshly picked/pasted batch by COUNT: if the pick would exceed the remaining slots, REJECT
 * THE WHOLE PICK (drop all of it) and toast; otherwise accept it in full. Reject-all (NOT trim-to-N)
 * is deliberate — each pick is atomic, so we never silently keep some of the user's chosen files and
 * drop others (which the user didn't choose). The media picker already hard-caps selection natively;
 * this gate is the enforcement for the pickers the OS can't cap (documents/audio) and the paste path.
 *
 * Per-file SIZE is NOT checked here — the SDK is the single source of truth for it. An oversized file
 * is staged, then the SDK rejects it with ERR_FILE_SIZE_EXCEEDED → the composer's onFileRejected marks
 * the tile "Upload failed" and shows the size toast. Shared by the compact + full composers' picker AND
 * paste paths so the count logic can't silently re-diverge (it had drifted into three copies).
 *
 * `t` returns the raw template (we interpolate with `.replace`); `showToast` shows one line.
 */
export function acceptPickedAttachments<T>(
  files: T[],
  opts: { maxCount: number; existingCount: number },
  notify: { showToast: (msg: string) => void; t: (key: string) => string }
): T[] {
  const { maxCount, existingCount } = opts;
  const { showToast, t } = notify;

  const remaining = Math.max(0, maxCount - existingCount);
  if (files.length > remaining) {
    // Over the limit → drop the ENTIRE pick (already-staged files are untouched).
    showToast(t('ATTACHMENT_COUNT_EXCEEDED').replace('{max}', String(maxCount)));
    return [];
  }
  return files;
}

/**
 * Toast explaining WHY an attachment was rejected — shown when the user taps the errored tile (we
 * don't auto-toast on rejection, to avoid spam when several files fail). Maps the SDK error code to a
 * friendly, named message; size is the common case and gets the server's exact per-file max. Shared
 * by both composers so the mapping stays in one place.
 */
export async function toastAttachmentRejection(
  att: { file: { name: string }; errorCode?: string },
  notify: { showToast: (msg: string) => void; t: (key: string) => string }
): Promise<void> {
  const { showToast, t } = notify;
  const code = att.errorCode;

  // Too big — show the server's exact per-file size cap.
  if (code === 'ERR_FILE_SIZE_EXCEEDED') {
    const { fileSizeMax } = await getFileUploadLimits();
    showToast(
      t('ATTACHMENT_SIZE_EXCEEDED')
        .replace('{max}', `${Math.round(fileSizeMax / 1024 / 1024)} MB`)
    );
    return;
  }

  // Server declined this specific file at presign — a disallowed content type (e.g. .md).
  // The presign endpoint enforces the app's allowed-file-type policy per file, so both the generic
  // rejection AND the permission/policy denial for a picked file mean "this file type isn't allowed".
  if (code === 'ERR_PRESIGN_REJECTED' || code === 'ERR_PERMISSION_DENIED') {
    showToast(t('UNSUPPORTED_FILE_TYPE'));
    return;
  }

  // Account-level billing denial → uploads aren't available on this plan (not a per-file-type issue).
  if (code === 'ERR_BILLING') {
    showToast(t('ATTACHMENT_UPLOAD_UNAVAILABLE'));
    return;
  }

  // Couldn't read the file / its size.
  if (code === 'ERR_INVALID_FILE_OBJECT') {
    showToast(t('ATTACHMENT_SIZE_UNKNOWN').replace('{name}', att.file.name));
    return;
  }

  showToast(t('ATTACHMENT_UPLOAD_FAILED'));
}
