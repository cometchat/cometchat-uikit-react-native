import { CometChat } from '@cometchat/chat-sdk-react-native';
import { SelectedAttachment } from '../modals/SelectedAttachment';
import { linkUploadedVideo } from '../utils/videoThumbnail';
import { isOfflineOn, offlineSdk } from '../offline/gate';

type CometChatException = InstanceType<typeof CometChat.CometChatException>;

/**
 * SDK default upload concurrency is 1 (sequential). We keep 3 to preserve the prior UX — the DD
 * allows raising it (ideally network-aware). This is a single knob handed to the request's batch,
 * NOT a UIKit-side queue.
 */
const UPLOAD_CONCURRENCY = 3;

/**
 * The full outcome of a batch, delivered to `onAllComplete`. Reports all three buckets so the caller
 * sees the complete picture (e.g. 10 enqueued → 7 succeeded, 3 rejected).
 */
export interface UploadBatchResult {
  /** Uploaded OK — same set as the `completedAttachments` getter used by the send button. */
  succeeded: { fileId: string; attachment: CometChat.Attachment }[];
  /** Transient transfer failures — retryable (onFileFailure). */
  failed:    { fileId: string; error: CometChatException }[];
  /** Hard rejections — not retryable (onFileError: size / plan / presign denial). */
  rejected:  { fileId: string; error: CometChatException }[];
}

/** The destination of one batch: (receiver, type, thread parent) — the durable batch's identity. */
export interface UploadTarget {
  receiver?: string;
  receiverType?: string;
  parentMessageId?: string | number;
}

function hasParent(parentMessageId: unknown): parentMessageId is string | number {
  return parentMessageId !== undefined && parentMessageId !== null && parentMessageId !== '' && parentMessageId !== 0;
}

export type UploadQueueCallbacks = {
  onProgress:     (fileId: string, percent: number) => void;
  onFileComplete: (fileId: string, attachment: CometChat.Attachment) => void;
  onFileFailed:   (fileId: string, error: CometChatException) => void;
  onFileRejected: (fileId: string, error: CometChatException) => void;
  /** Fires each time the batch drains (idempotent — re-fires on each drain). Carries the full outcome. */
  onAllComplete:  (result: UploadBatchResult) => void;
};

/**
 * Thin renderer over ONE SDK upload request/batch (DD §5). `CometChat.createUploadFileRequest`
 * returns a stateful request that owns the queue, bounded concurrency, per-file state, and
 * completion bookkeeping — all explicit UIKit Non-goals in the DD. This service just:
 *   - lazily creates ONE request on the first pick (scoped to the target conversation) and ADDs
 *     later picks to the same batch (`request.uploadAttachment(...)`),
 *   - forwards the request's per-file events to the composer's callbacks,
 *   - maps tray actions to the request (`removeAttachment` / `clearAll`, retry = re-upload same id).
 *
 * The SDK now takes a CALLER-supplied `fileId` per file, so we pass the composer's tile id
 * (`SelectedAttachment.fileId`) straight through — every event echoes that same id back, so there is
 * no SDK-id ↔ tile-id translation layer anymore.
 */
export class UploadQueueService {
  private callbacks: UploadQueueCallbacks;
  private listener: InstanceType<typeof CometChat.UploadFileListener>;
  // ONE request/batch for the whole tray; null until the first enqueue creates it.
  private request: CometChat.UploadFileRequest | null = null;
  // Successes only — the set the send button reads. Keyed by tile id (== SDK fileId).
  private completed = new Map<string, CometChat.Attachment>();
  // Local uri of each enqueued VIDEO, so its upload can be linked to a local thumbnail.
  private localVideoUris = new Map<string, string>();
  // Offline ON only: files restored from the SDK's durable batch (BEH-UPLOAD-14). Their picker
  // handles are gone, so a retry streams the SDK's own copy (`retryAttachment`).
  private restoredIds = new Set<string>();
  // Bumped on every detach / destroy so a restore that lands late is dropped.
  private restoreToken = 0;

  // Kept for signature compatibility; the request API no longer exposes a presign buffer knob.
  constructor(callbacks: UploadQueueCallbacks, _opts?: { presignBufferMs?: number }) {
    this.callbacks = callbacks;
    // fileId === tile id: every callback's fileId is exactly the composer's tile id — no translation.
    this.listener = new CometChat.UploadFileListener({
      onFileProgress: (fileId: string, _loaded: number, _total: number, percent: number) => {
        this.callbacks.onProgress(fileId, Math.min(100, Math.max(0, Math.round(percent))));
      },
      onFileUploaded: (fileId: string, att: CometChat.Attachment) => {
        this.completed.set(fileId, att);
        linkUploadedVideo(att?.getUrl?.(), this.localVideoUris.get(fileId));
        this.callbacks.onFileComplete(fileId, att);
      },
      onFileFailure: (fileId: string, error: CometChatException) => {
        this.completed.delete(fileId);
        this.callbacks.onFileFailed(fileId, error);
      },
      onFileError: (fileId: string, error: CometChatException) => {
        this.completed.delete(fileId);
        this.callbacks.onFileRejected(fileId, error);
      },
      // Re-fires on every drain and always reflects the WHOLE batch (DD §5.3.1). fileIds are already
      // tile ids, so forward the buckets straight through.
      onComplete: (result: CometChat.UploadResult) => {
        this.callbacks.onAllComplete({
          succeeded: result.successful,
          failed:    result.failed,
          rejected:  result.rejected,
        });
      },
    });
  }

  /**
   * @param target the conversation the upload is for. `createUploadFileRequest(receiverId, receiverType)`
   *   captures it and sends it in the presign call for RBAC/SBAC authorization. `receiver` = the uid
   *   (1:1) or guid (group); `receiverType` = 'user' | 'group' (CometChat.RECEIVER_TYPE.*). Read from the
   *   composer's conversation refs at enqueue time; only the first enqueue creates the request (the batch
   *   is fixed to one destination), later picks add to the same batch.
   */
  enqueue(attachment: SelectedAttachment, target?: UploadTarget): void {
    const { fileId, file } = attachment;
    if (file.type?.startsWith('video/')) this.localVideoUris.set(fileId, file.uri);
    if (!this.request) {
      this.request = CometChat.createUploadFileRequest(target?.receiver ?? '', target?.receiverType ?? '');
      this.request.setConcurrency(UPLOAD_CONCURRENCY);
      // Offline ON: the thread parent is part of the durable batch's identity, so a thread
      // composer never adopts the main chat's batch (UIT-UP-02). Offline OFF: today's request.
      if (hasParent(target?.parentMessageId) && isOfflineOn()) {
        (this.request as any).setParentMessageId?.(target!.parentMessageId);
      }
    }
    // Pass the tile id as the SDK fileId, and the per-call listener (deduped into the batch's listener
    // set) so this one listener drives every file's events + the whole-batch onComplete.
    this.request.uploadAttachment(
      fileId,
      { uri: file.uri, name: file.name, type: file.type, size: file.size },
      this.listener,
    );
  }

  dequeue(tileId: string): void {
    // Aborts an in-flight upload or drops an already-uploaded file — either way its slot frees.
    this.request?.removeAttachment(tileId);
    this.completed.delete(tileId);
    this.localVideoUris.delete(tileId);
  }

  retry(tileId: string, file: SelectedAttachment): void {
    // DD §12/§13 — retry = re-upload the SAME fileId through the request (re-presigns if needed).
    this.completed.delete(tileId);
    // A restored tile has no live file: the SDK streams its own copy (offline ON only).
    if (this.restoredIds.has(tileId) && typeof (this.request as any)?.retryAttachment === 'function') {
      (this.request as any).retryAttachment(tileId, this.listener);
      return;
    }
    this.request?.uploadAttachment(
      tileId,
      { uri: file.file.uri, name: file.file.name, type: file.file.type, size: file.file.size },
      this.listener,
    );
  }

  cancelAll(): void {
    this.restoreToken++;
    this.request?.clearAll();
    this.request = null;
    this.completed.clear();
    this.localVideoUris.clear();
    this.restoredIds.clear();
  }

  /**
   * Let go of the batch WITHOUT clearing it: the SDK keeps it (offline ON) so the tray can be
   * restored when the user comes back to this chat. Nothing is aborted or deleted.
   */
  detach(): void {
    this.restoreToken++;
    this.request = null;
    this.completed.clear();
    this.localVideoUris.clear();
    this.restoredIds.clear();
  }

  /**
   * The composer leaves its (receiver, type, parent) triple — chat switch or unmount. The gate is
   * read now: offline ON detaches (the batch survives for restore, BEH-UPLOAD-14); offline OFF
   * destroys the batch exactly as today (`cancelAll`, UIT-OFF-08).
   */
  leave(): void {
    if (isOfflineOn()) this.detach();
    else this.cancelAll();
  }

  /**
   * BEH-UPLOAD-14 restore, offline ON only: read back the durable batch of `target`
   * (`getExistingUploadFileRequest`) and return the tray's tiles, keyed by the SDK fileId:
   * `UPLOADED` → done, `REJECTED` → rejected, anything else → failed with retry. Nothing uploads
   * as a result. Resolves `null` (and changes nothing) with offline off, on an SDK without the
   * call, when there is no batch, when the tray already has a request (the user picked), or when
   * the composer moved on before the answer.
   */
  async restore(target: UploadTarget): Promise<SelectedAttachment[] | null> {
    if (this.request || !target?.receiver || !target?.receiverType || !isOfflineOn()) return null;
    const sdk = offlineSdk();
    if (typeof sdk?.getExistingUploadFileRequest !== 'function') return null;
    const token = ++this.restoreToken;
    let restored: any;
    try {
      restored = await sdk.getExistingUploadFileRequest(
        target.receiver,
        target.receiverType,
        hasParent(target.parentMessageId) ? target.parentMessageId : undefined,
      );
    } catch {
      return null;
    }
    if (!restored || token !== this.restoreToken || this.request) return null;
    const read = typeof restored.getItems === 'function' ? restored.getItems : restored.getFiles;
    const items: any[] = typeof read === 'function' ? read.call(restored) : [];
    if (!Array.isArray(items) || items.length === 0) return null;
    this.request = restored;
    return items
      .filter((item) => item && typeof item.fileId === 'string' && item.fileId)
      .map((item) => {
        const fileId: string = item.fileId;
        this.restoredIds.add(fileId);
        const state = String(item.state ?? '');
        const attachment = item.attachment;
        const file = {
          uri: item.localCopyPath ?? item.localUri ?? attachment?.getUrl?.() ?? '',
          name: item.name ?? attachment?.getName?.() ?? '',
          type: item.mimeType ?? attachment?.getMimeType?.() ?? '',
          size: Number(item.size ?? attachment?.getSize?.() ?? 0) || 0,
        };
        if (state === 'UPLOADED' && attachment) {
          this.completed.set(fileId, attachment);
          return { fileId, file, uploadState: 'COMPLETED', uploadProgress: 100, uploadedAttachment: attachment } as SelectedAttachment;
        }
        if (state === 'REJECTED') {
          const code = item.error?.code ?? item.error?.getCode?.();
          return { fileId, file, uploadState: 'REJECTED', uploadProgress: 0, errorKey: 'ATTACHMENT_UPLOAD_UNAVAILABLE', errorCode: code, rawError: item.error } as SelectedAttachment;
        }
        // FAILED, or a file still in flight when the app died: retryable, never resumed by itself.
        return { fileId, file, uploadState: 'FAILED', uploadProgress: 0, errorKey: 'UPLOAD_FAILED', rawError: item.error } as SelectedAttachment;
      });
  }

  get completedAttachments(): CometChat.Attachment[] {
    return Array.from(this.completed.values());
  }

  /**
   * The SDK's batch id for the current upload request (DD §5.3 — the app carries it as
   * `metadata.batchId` to tie the fanned-out per-kind messages together). `undefined` before the
   * first enqueue or after `cancelAll`, so read it BEFORE releasing the request. Callers fall back
   * to their own id when it's undefined.
   */
  get batchId(): string | undefined {
    return this.request?.getBatchId();
  }
}
