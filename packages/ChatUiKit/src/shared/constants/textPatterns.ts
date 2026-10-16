/**
 * The link/email/phone patterns, kept in their OWN module with no imports.
 *
 * They live here rather than in UIKitConstants because that file imports the Chat SDK on its
 * first line. Anything that pulls a pattern from it also pulls the SDK, which reads native
 * modules at load — enough to break any consumer (and any test) that does not have the whole
 * SDK available. MarkdownUtils needs `urlPattern` and is exactly that kind of leaf.
 *
 * UIKitConstants re-exports these, so existing imports keep working.
 */
export const wordBoundary = {
  start: `(?:^|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
  end: `(?=$|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
};

export const emailPattern =
  wordBoundary.start + `[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}` + wordBoundary.end;

// A URL character, excluding parentheses — those only count in balanced pairs (below).
const urlChar = `[-\\w;/?:@&=+$\\|\\_.!~*\\|'\\[\\]%#,☺]`;
const urlParens = `\\(${urlChar}*\\)`;
// A URL path: ends on a word char, `/`, `#`, or a balanced `(…)`. A lone `)` could never be the
// last character, so https://en.wikipedia.org/wiki/Mercury_(planet) linked without its `)` and
// opened a page that does not exist — while "(see https://example.com/page)" must still leave
// the sentence's own `)` outside the link. Balanced pairs satisfy both.
const urlPath = `(?:${urlChar}|${urlParens})*(?:[\\w/#]|${urlParens})`;

export const urlPattern =
  `((https?://|ftp://|www\\.|pic\\.)${urlPath}` +
  `|[a-zA-Z][a-zA-Z0-9]*[-a-zA-Z0-9]*(?:\\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\\.[a-zA-Z]{2,}(?:[:/]${urlPath})?)` +
  wordBoundary.end;

/**
 * A markdown link `[label](address)`. Group 1 is the label, group 2 the address.
 *
 * The address may contain one level of balanced parentheses, so a Wikipedia-style
 * `[Mercury](https://en.wikipedia.org/wiki/Mercury_(planet))` keeps its `(planet)` and only the
 * final `)` closes the link. The old `[^)]+` stopped at the first `)`, opening `…Mercury_(planet`.
 */
export const markdownLinkPattern = `\\[([^\\]]+)\\]\\(((?:[^()]|\\([^()]*\\))+)\\)`;

export const phoneNumPattern =
  wordBoundary.start +
  `(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)` +
  wordBoundary.end;
