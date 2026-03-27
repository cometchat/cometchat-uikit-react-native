/**
 * Utility functions for markdown text processing.
 */

/**
 * Strips markdown syntax characters from text, returning clean readable content.
 *
 * Handles:
 *  - Code blocks: ```code``` → code
 *  - Inline code: `code` → code
 *  - Bold: **text** → text
 *  - Underline: __text__ → text
 *  - Strikethrough: ~~text~~ → text
 *  - Italic: _text_ → text
 *  - Blockquotes: > text → text
 *  - Bullet lists: - text → text
 *  - Numbered lists: 1. text → text
 *
 * @param text - The markdown text to strip
 * @returns Clean text without markdown syntax characters
 */
export function stripMarkdown(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Remove code block fences (``` on their own lines or inline ```)
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    return match.slice(3, -3).trim();
  });

  // 1.5. Convert markdown links [text](url) → text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 2. Remove inline code backticks (normal and escaped)
  result = result.replace(/\\`([^`]*?)\\`/g, '$1'); // escaped \`code\`
  result = result.replace(/`([^`]*)`/g, '$1');       // normal `code`

  // 3. Remove bold **text** (normal and escaped)
  result = result.replace(/\\\*\\\*(.+?)\\\*\\\*/g, '$1'); // escaped \*\*bold\*\*
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');          // normal **bold**

  // 4. Remove underline __text__ (must come before italic _ handling)
  result = result.replace(/\\__(.+?)\\__/g, '$1');  // escaped
  result = result.replace(/__(.+?)__/g, '$1');       // normal

  // 5. Remove strikethrough ~~text~~
  result = result.replace(/\\~~(.+?)\\~~/g, '$1');  // escaped
  result = result.replace(/~~(.+?)~~/g, '$1');       // normal

  // 6. Remove italic _text_
  result = result.replace(/(?<![a-zA-Z0-9])_(.+?)_(?![a-zA-Z0-9])/g, '$1');

  // 7. Remove blockquote markers at start of lines
  result = result.replace(/^>\s?/gm, '');

  // 8. Remove bullet list markers at start of lines
  result = result.replace(/^-\s/gm, '');

  // 9. Remove numbered list markers at start of lines
  result = result.replace(/^\d+\.\s/gm, '');

  // 10. Remove any remaining backslash escapes (e.g., \* \_ \` \~)
  result = result.replace(/\\([*_`~>\\])/g, '$1');

  return result;
}


/**
 * Result from preparePreviewText with metadata about detected block types.
 */
export interface PreviewTextResult {
  text: string;
  isBlockquote: boolean;
  /** First line of a fenced code block (if the first rich block is a code block) */
  codeBlockFirstLine: string | null;
  /** Display prefix for list items (e.g. "1. " or "- ") — kept separate so the
   *  formatter won't re-parse the text as a block element. */
  listPrefix: string | null;
}

/**
 * Prepare message text for compact single-line preview display.
 * Detects the FIRST block-level element and returns only its first line.
 * Priority: blockquote > code block > ordered list > bullet list > plain text
 * Everything after the first block element is discarded.
 *
 * For list items and blockquotes, the returned `text` contains ONLY the item
 * content (no `> `, `- `, or `1. ` prefix) so the formatter won't re-parse
 * it as a block element. The `listPrefix` field carries the display prefix.
 */
export function preparePreviewText(text: string): PreviewTextResult {
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length === 0) continue;

    // Blockquote
    if (trimmed.startsWith('> ') || trimmed.startsWith('▎ ')) {
      return { text: trimmed.substring(2), isBlockquote: true, codeBlockFirstLine: null, listPrefix: null };
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const afterOpen = trimmed.substring(3);
      const closeIdx = afterOpen.indexOf('```');
      let firstLine: string;
      if (closeIdx > 0) {
        firstLine = afterOpen.substring(0, closeIdx).trim();
      } else {
        firstLine = '';
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim().startsWith('```')) break;
          if (lines[j].trim().length > 0) { firstLine = lines[j].trim(); break; }
        }
      }
      return { text: '', isBlockquote: false, codeBlockFirstLine: firstLine, listPrefix: null };
    }

    // Ordered list — content only, prefix in listPrefix
    const orderedMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
    if (orderedMatch) {
      return { text: orderedMatch[2].trim(), isBlockquote: false, codeBlockFirstLine: null, listPrefix: `${orderedMatch[1]}. ` };
    }

    // Bullet list — content only, prefix in listPrefix
    if (trimmed.startsWith('- ')) {
      return { text: trimmed.substring(2).trim(), isBlockquote: false, codeBlockFirstLine: null, listPrefix: '- ' };
    }

    // Plain text — collapse any inline code blocks
    let result = lines[i];
    result = result.replace(/```\n?([\s\S]*?)```/g, (_m, c: string) => {
      const fl = c.split('\n')[0].trim();
      return fl ? '`' + fl + '..' + '`' : '';
    });
    return { text: result.trim(), isBlockquote: false, codeBlockFirstLine: null, listPrefix: null };
  }

  return { text: text.trim(), isBlockquote: false, codeBlockFirstLine: null, listPrefix: null };
}
