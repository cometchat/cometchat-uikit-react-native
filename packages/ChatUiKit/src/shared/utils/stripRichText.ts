/**
 * Strip rich-text formatting (HTML formatting tags + markdown markers) from a
 * string and return plain text. For compact single-line previews such as the AI
 * chat-history list, where formatting must NOT render.
 *
 * Only a whitelist of known formatting tags is removed, so legitimate text such
 * as "make a <product>" or "5 < 10" is preserved.
 */
import { stripColorTags } from "../formatters/richTextWireFormat";

export const stripRichText = (input?: string | null): string => {
  if (!input) return "";
  let text = input;

  // 0. Remove the rich-text wire format's colour tokens. These are NOT HTML, so the
  //    whitelist in step 1 does not (and must not) match them — `<color=#ff0000>` would
  //    otherwise reach users verbatim in plain-text previews.
  text = stripColorTags(text);

  // 1. Remove the HTML formatting tags the compact composer can emit — bold, italic,
  //    underline, strikethrough, link, ordered/unordered lists, blockquote, inline code
  //    and code-block, plus the structural wrappers these produce. Whitelisted (not a
  //    blanket strip) so genuine angle-bracket text like "make a <product>" survives.
  //    Replaced with a space so adjacent list items / blocks don't get word-joined; the
  //    whitespace is collapsed in step 3.
  text = text.replace(
    /<\/?(?:b|strong|i|em|u|ins|s|strike|del|a|ol|ul|li|blockquote|code|pre|p|br|div|span|font|h[1-6])\b[^>]*>/gi,
    " "
  );

  // 2. Strip markdown markers (keep inner text), covering the same set of formats in
  //    case the text carries markdown instead of / alongside HTML.
  text = text
    .replace(/```[a-z]*\s*([\s\S]*?)```/gi, "$1") // ```code block```
    .replace(/(\*\*\*|___)(.+?)\1/g, "$2")        // ***bold italic***
    .replace(/(\*\*|__)(.+?)\1/g, "$2")           // **bold** / __bold/underline__
    // *italic* / _italic_ — boundary-aware (capture the leading boundary instead of a
    // lookbehind, which Hermes/RN doesn't reliably support) so snake_case identifiers
    // like "my_var_name" and "a * b" arithmetic are left untouched.
    .replace(/(^|[^A-Za-z0-9*])\*\s*(.+?)\s*\*(?![A-Za-z0-9*])/g, "$1$2") // *italic*
    .replace(/(^|[^A-Za-z0-9_])_\s*(.+?)\s*_(?![A-Za-z0-9_])/g, "$1$2")   // _italic_
    .replace(/~~(.+?)~~/g, "$1")                  // ~~strikethrough~~
    .replace(/`([^`]+)`/g, "$1")                  // `inline code`
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");     // [label](url) -> label

  // 3. Collapse leftover whitespace into a single clean line.
  return text.replace(/\s+/g, " ").trim();
};
