/**
 * Fallback max attachment count when the server `file.count.max` setting is
 * unavailable (decision 5.1). Once the SDK exposes the setting, the effective
 * limit is `min(developerValue, serverValue)` (tighten-only).
 */
export const DEFAULT_MAX_ATTACHMENT_COUNT = 10;

/**
 * PER-FILE size cap (bytes) used by the UIKit's "X MB" rejection toast (design doc §6.1 —
 * size is validated per file, never as a batch total). The SDK exposes no public size getter
 * and enforces `file.size.max` internally, so this DEFAULT is the value the UIKit shows.
 */
export const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB (per file)
