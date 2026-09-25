import { CometChatTextFormatter } from "./CometChatTextFormatter";

/**
 * Runs every formatter's `formatRawText` over a message's stored text, in the order the
 * consumer supplied them, before any built-in parsing sees it.
 *
 * Every surface that displays message text calls this first, so a consumer's own wire token
 * renders the same way in a bubble, a conversation row, a preview, a search result and a
 * caption — the guarantee the web and Android kits already give.
 *
 * A formatter that throws is skipped instead of taking the surface down with it: a bad regex
 * in a consumer's formatter must never blank a conversation row.
 */
export function applyRawFormatters(
  text: string,
  formatters?: Array<CometChatTextFormatter>
): string {
  if (!text || !formatters?.length) return text;

  let formatted = text;
  for (const formatter of formatters) {
    try {
      const next = formatter.formatRawText?.(formatted);
      // A consumer writing JS can return anything; only a string is usable here.
      if (typeof next === "string") formatted = next;
    } catch {
      // Keep the text as it was and let the remaining formatters run.
    }
  }
  return formatted;
}
