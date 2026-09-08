/**
 * Rich-text wire grammar — the on-the-wire representation of inline styles that
 * both the composer (which *produces* it while editing) and the rich-text
 * formatter (which *renders* it in the bubble) must agree on.
 *
 * This module is deliberately neutral: it belongs to neither side. The formatter
 * is swappable/developer-supplied, so the composer must not import from it (or
 * vice-versa) — both import the grammar from here instead, so the token spec
 * lives in exactly one place and the two sides can never drift.
 *
 * Currently the only value-carrying inline style: text colour `<color=#rrggbb>…</color>`.
 */

/** Opening tag prefix, e.g. `<color=#ff0000>`. */
export const COLOR_OPEN_TAG = '<color=';
/** Closing tag. */
export const COLOR_CLOSE_TAG = '</color>';

/**
 * Valid colour attribute: `#rgb` or `#rrggbb` (case-insensitive).
 * Anchored and non-global on purpose — a /g regex keeps lastIndex between
 * .test() calls, which would silently let every other value through.
 * 8-digit `#rrggbbaa` is rejected deliberately: a transparent run is an
 * invisible-message vector.
 */
export const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Expands `#rgb` to `#rrggbb` and lowercases. Native always reports the active
 * colour as 6-digit, so a 3-digit swatch would never compare equal to it.
 */
export const normalizeHex = (hex: string): string => {
  const lower = hex.toLowerCase();
  if (lower.length !== 4) return lower;
  return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`;
};

/** Builds the opening tag for a hex colour, e.g. `openColorTag('#f00')` → `<color=#f00>`. */
export const openColorTag = (hex: string): string => `${COLOR_OPEN_TAG}${hex}>`;

/** Boundaries of a well-formed `<color=…>…</color>` run. */
export interface ColorTagMatch {
  /** Validated, lowercased hex attribute. */
  hex: string;
  /** Index of the run's first content character (just after `>`). */
  contentStart: number;
  /** Index of the matching close tag (exclusive end of content). */
  contentEnd: number;
  /** Index just past the whole run (after `</color>`). */
  endIndex: number;
}

/**
 * Given `openIdx` pointing at a `<color=` open tag, return the run's boundaries,
 * or `null` if the tag is malformed (no `>`), carries an invalid hex, or is
 * unterminated. Depth-aware: `<color=#a>x<color=#b>y</color>z</color>` captures
 * the whole outer run instead of stopping at the inner close tag.
 */
export function matchColorTagAt(text: string, openIdx: number): ColorTagMatch | null {
  const lower = text.toLowerCase();
  if (!lower.startsWith(COLOR_OPEN_TAG, openIdx)) return null;

  const attrStart = openIdx + COLOR_OPEN_TAG.length;
  const attrEnd = text.indexOf('>', attrStart);
  if (attrEnd < 0) return null;

  const hex = text.substring(attrStart, attrEnd).trim().toLowerCase();
  if (!HEX_COLOR_REGEX.test(hex)) return null;

  const contentStart = attrEnd + 1;
  let depth = 1;
  let cursor = contentStart;
  let contentEnd = -1;

  while (cursor < lower.length) {
    const nextClose = lower.indexOf(COLOR_CLOSE_TAG, cursor);
    if (nextClose < 0) break;
    const nextOpen = lower.indexOf(COLOR_OPEN_TAG, cursor);
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth++;
      cursor = nextOpen + COLOR_OPEN_TAG.length;
      continue;
    }
    depth--;
    if (depth === 0) {
      contentEnd = nextClose;
      break;
    }
    cursor = nextClose + COLOR_CLOSE_TAG.length;
  }

  if (contentEnd < 0) return null;
  return { hex, contentStart, contentEnd, endIndex: contentEnd + COLOR_CLOSE_TAG.length };
}

/**
 * Find the first well-formed `<color=…>…</color>` run at or after `from`.
 * Malformed, unterminated, or empty runs are skipped so one bad token can't
 * disable colour for the rest of the text. Returns `null` if none.
 */
export function findColorTag(
  text: string,
  from = 0
): (ColorTagMatch & { startIndex: number }) | null {
  const lower = text.toLowerCase();
  let searchFrom = from;

  while (searchFrom < lower.length) {
    const openIdx = lower.indexOf(COLOR_OPEN_TAG, searchFrom);
    if (openIdx < 0) return null;

    const match = matchColorTagAt(text, openIdx);
    if (!match) {
      // Malformed / invalid hex / unterminated — skip past this open tag.
      searchFrom = openIdx + COLOR_OPEN_TAG.length;
      continue;
    }
    if (match.contentEnd === match.contentStart) {
      // Empty run — skip the whole thing and keep scanning.
      searchFrom = match.endIndex;
      continue;
    }
    return { ...match, startIndex: openIdx };
  }
  return null;
}

/**
 * Strips every `<color=…>` / `</color>` token, leaving the content. Used by the
 * plain-text surfaces (search subtitles, AI history) that render raw strings and
 * would otherwise show the markup to users.
 *
 * Deliberately removes tags even when unbalanced — a half-written token must never
 * be shown to a user, and this is a display-only path.
 */
export function stripColorTags(text: string): string {
  if (!text) return text;
  if (text.toLowerCase().indexOf(COLOR_OPEN_TAG) < 0 &&
      text.toLowerCase().indexOf(COLOR_CLOSE_TAG) < 0) {
    return text;
  }
  let out = '';
  let cursor = 0;
  const lower = text.toLowerCase();

  while (cursor < text.length) {
    const openIdx = lower.indexOf(COLOR_OPEN_TAG, cursor);
    const closeIdx = lower.indexOf(COLOR_CLOSE_TAG, cursor);

    // Whichever token comes first (either may be absent).
    const next = openIdx < 0 ? closeIdx : closeIdx < 0 ? openIdx : Math.min(openIdx, closeIdx);
    if (next < 0) break;

    out += text.substring(cursor, next);
    if (next === closeIdx && (openIdx < 0 || closeIdx < openIdx)) {
      cursor = next + COLOR_CLOSE_TAG.length;
    } else {
      // Drop through to the tag's `>`; if there is none the rest is malformed markup.
      const attrEnd = text.indexOf('>', next + COLOR_OPEN_TAG.length);
      if (attrEnd < 0) return out;
      cursor = attrEnd + 1;
    }
  }
  return out + text.substring(cursor);
}
