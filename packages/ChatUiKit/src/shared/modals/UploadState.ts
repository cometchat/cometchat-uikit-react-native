/**
 * Tracks the lifecycle of a single file in the pre-send attachment strip.
 *
 * NONE      — Selected from picker; queued but no XHR started yet.
 * UPLOADING — Active XHR to S3 in progress; uploadProgress is meaningful.
 * COMPLETED — S3 returned 204; uploadedAttachment is populated.
 * FAILED    — Transient failure (network/S3); errorKey is set; user can RETRY.
 * REJECTED  — Permanent rejection (size limit, RBAC, billing); user must REMOVE.
 */
export type UploadState = 'NONE' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
