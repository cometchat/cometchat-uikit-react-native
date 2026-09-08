/**
 * Utility functions for markdown text processing.
 */
import { stripColorTags } from "../formatters/richTextWireFormat";

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
 * @param keepColorTags - Keep the `<color=#rrggbb>…</color>` wire tokens instead of removing
 *   them, for sinks that render colour themselves (search previews) rather than plain text.
 * @returns Clean text without markdown syntax characters
 */
export function stripMarkdown(text: string, keepColorTags = false): string {
  if (!text) return text;

  // 0. Remove the rich-text wire format's colour tokens. Not markdown and not HTML, so no
  //    rule below matches them — without this they reach every plain-text sink verbatim
  //    (share sheet, search subtitles, previews).
  let result = keepColorTags ? text : stripColorTags(text);

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

  // 10. Strip HTML tags (e.g., <u>, <b>, <i>, <s>, <em>, <strong>, <del>, <br>, etc.)
  // Preserve CometChat mention tokens <@uid:xxx> and <@all:xxx> which look like HTML tags
  result = result.replace(/<br\s*\/?>/gi, '\n');
  // Require something that actually looks like a tag name after the `<`. The old `<[^>]+>` ate any
  // `<`…`>` pair, so ordinary prose lost text: "a < b and c > d" became "a  d". Captions and message
  // previews are user text and legitimately contain comparisons and "<3". A tag must now start with
  // a letter (optionally after `/`), which still strips <u>/<b>/<br>/<div class="x">/</strong> and
  // still leaves CometChat's <@uid:…> / <@all:…> mention tokens alone — those start with `@`.
  // `</color>` looks exactly like a closing HTML tag, so it is exempted when the caller asked
  // to keep the colour tokens (`<color=…>` never matches — `=` follows the tag name).
  result = result.replace(
    keepColorTags
      ? /<(?!\/color>)\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^>]*)?\/?>/g
      : /<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^>]*)?\/?>/g,
    ''
  );

  // 11. Remove any remaining backslash escapes (e.g., \* \_ \` \~)
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
      // `>= 0`, not `> 0`: an empty code block (six backticks) closes at offset 0. Treating it as
      // unterminated made the preview scan ON to the next line and show text that is not in the
      // code block at all (ENG-38253).
      if (closeIdx >= 0) {
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
