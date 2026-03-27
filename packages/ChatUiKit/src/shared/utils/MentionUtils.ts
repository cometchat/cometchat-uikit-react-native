/**
 * Shared mention utility functions used by both CometChatMessageComposer
 * and CometChatSingleLineMessageComposer for cursor positioning around mentions.
 */

/**
 * Check if cursor is within a mention range.
 */
export function isCursorWithinMentionRange(
  mentionRanges: Map<string, any>,
  cursorPosition: number
): boolean {
  for (const [range] of mentionRanges) {
    const [start, end] = range.split('_').map(Number);
    if (cursorPosition >= start && cursorPosition <= end) {
      return true;
    }
  }
  return false;
}

/**
 * Get the mention range boundaries if cursor is within a mention.
 * Used to snap cursor to the nearest edge (WhatsApp-style behavior).
 */
export function getMentionRangeAtCursor(
  mentionRanges: Map<string, any>,
  cursorPosition: number
): { start: number; end: number } | null {
  for (const [range] of mentionRanges) {
    const [start, end] = range.split('_').map(Number);
    if (cursorPosition >= start && cursorPosition <= end) {
      return { start, end };
    }
  }
  return null;
}
