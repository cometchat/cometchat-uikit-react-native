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

export const urlPattern =
  `((https?://|ftp://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]+[\\w/#](\\(\\))?` +
  `|[a-zA-Z][a-zA-Z0-9]*[-a-zA-Z0-9]*(?:\\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\\.[a-zA-Z]{2,}(?:[:/][-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]*[\\w/#](\\(\\))?)?)` +
  wordBoundary.end;

export const phoneNumPattern =
  wordBoundary.start +
  `(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)` +
  wordBoundary.end;
