/**
 * Pure, native-free helpers for CometChatMediaViewer — extracted so the pager/index logic can be
 * property-tested without importing react-native / react-native-video (repo convention: test pure
 * logic, not rendered components).
 */

export function isVideoMime(mime: string): boolean {
  return mime.startsWith('video/');
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

/** Keep an index inside [0, len-1] so an out-of-range startIndex never lands on a blank page (PR review). */
export function clampIndex(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(i, len - 1));
}

/**
 * Swipe-to-page result: a left-swipe (dx ≤ -threshold) advances, a right-swipe (dx ≥ threshold)
 * retreats, both clamped to [0, total-1]. A sub-threshold swipe (or one at an edge) returns the
 * clamped current index, i.e. no page change.
 */
export function nextIndexForSwipe(dx: number, current: number, total: number, threshold = 40): number {
  if (dx <= -threshold) return clampIndex(current + 1, total);
  if (dx >= threshold) return clampIndex(current - 1, total);
  return clampIndex(current, total);
}
