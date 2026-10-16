/**
 * Which of a message's link previews to show.
 *
 * The server scans the raw text and returns a preview for every address it finds, in order, with
 * no idea what the text means. Taking `links[0]` therefore showed a card for an address the link
 * never opens: `[www.google.com](https://drive…)` got a Google card although it opens Drive, and
 * `` `https://google.com` `` — code, not a link — still got a card.
 *
 * A preview is shown for a DESTINATION: a markdown link's address, or a bare address outside code
 * and outside a link label. Label and code addresses are never destinations. The server reports
 * an address after redirects and can keep a stray `)` from markdown, so addresses are compared
 * loosely, and a preview that matches nothing is still shown when the text has a destination (it
 * is most likely that destination, redirected) — just never one known to be a label or code.
 */
import { markdownLinkPattern, urlPattern } from "../constants/textPatterns";

/** A link-preview entry as the extension delivers it (url, title, image, favicon, description…). */
type Preview = Record<string, any>;

const count = (s: string, ch: string) => s.split(ch).length - 1;

/**
 * Drops trailing `)` that have no matching `(`. The server's scanner does not stop at markdown
 * punctuation, so `[Mercury](…/Mercury_(planet))` comes back as `…/Mercury_(planet))` — a card
 * that shows, and opens, an address that does not exist.
 */
export const trimStrayParens = (url: string): string => {
  let u = (url || "").trim();
  while (u.endsWith(")") && count(u, ")") > count(u, "(")) u = u.slice(0, -1);
  return u;
};

/** Loose form for comparing addresses: no scheme, no `www.`, no trailing `/`, no stray `)`. */
export const normalizePreviewUrl = (url: string): string =>
  trimStrayParens(url).toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

const addressesIn = (text: string): string[] => text.match(new RegExp(urlPattern, "gi")) || [];

/** What the text links to (destinations) and addresses it only shows as a label or code (excluded). */
function classify(text: string | undefined | null) {
  const destinations: string[] = [];
  const notDestinations: string[] = [];
  let rest = text || "";

  rest = rest.replace(/```[\s\S]*?```|`[^`\n]*`/g, (code) => {
    // The fences aren't word boundaries for urlPattern (`https://a.com` read as "https://a"): blank them.
    notDestinations.push(...addressesIn(code.replace(/`/g, " ")));
    return " ";
  });
  rest = rest.replace(new RegExp(markdownLinkPattern, "g"), (_m, label: string, address: string) => {
    notDestinations.push(...addressesIn(label));
    destinations.push(address);
    return " ";
  });
  destinations.push(...addressesIn(rest));

  const wanted = new Set(destinations.map(normalizePreviewUrl));
  const excluded = new Set(notDestinations.map(normalizePreviewUrl).filter((u) => !wanted.has(u)));
  return { wanted, excluded };
}

/** The single card to stand for a message (list row type, search thumbnail). */
export function selectLinkPreview<T extends Preview>(links: T[] | undefined | null, text: string | undefined | null): T | undefined {
  if (!links || links.length === 0) return undefined;
  const { wanted, excluded } = classify(text);
  const exact = links.find((link) => link?.url && wanted.has(normalizePreviewUrl(link.url)));
  if (exact) return exact;

  // Nothing in the text is a destination, but some addresses are code or labels: no card.
  if (wanted.size === 0 && excluded.size > 0) return undefined;
  return links.find((link) => !link?.url || !excluded.has(normalizePreviewUrl(link.url)));
}

/**
 * Every card the bubble shows: one per destination, in the server's order — like React UI Kit's
 * selectDestinationPreviews. `https://www.google.com and https://www.facebook.com` gets both cards.
 */
export function selectLinkPreviews<T extends Preview>(links: T[] | undefined | null, text: string | undefined | null): T[] {
  if (!links || links.length === 0) return [];
  const { wanted, excluded } = classify(text);
  if (wanted.size === 0 && excluded.size > 0) return [];
  // One card per site: the server can return the same page twice (the label's
  // http://www.x.com and the link's https://www.x.com). Keep one, in first-seen
  // order, preferring https — the card opens its url.
  const kept: T[] = [];
  const slot = new Map<string, number>();
  for (const link of links) {
    if (!link?.url) { kept.push(link); continue; }
    if (excluded.has(normalizePreviewUrl(link.url))) continue;
    const key = siteKey(link.url);
    const i = slot.get(key);
    if (i === undefined) { slot.set(key, kept.length); kept.push(link); }
    else if (/^https:/i.test(link.url) && !/^https:/i.test(kept[i].url)) kept[i] = link;
  }
  return kept;
}

/** Dedup key: scheme and `www.` dropped, host lowercased, path kept as is (paths are case-sensitive). */
function siteKey(url: string): string {
  const u = trimStrayParens(url).replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/\/+$/, "");
  const cut = u.search(/[/?#]/);
  const host = (cut < 0 ? u : u.slice(0, cut)).toLowerCase().replace(/^www\./, "");
  return host + (cut < 0 ? "" : u.slice(cut));
}

/** The card image: empty when the server sent none, or only the site's favicon. */
export function previewImage(image?: string | null, favicon?: string | null): string {
  return !image || image === favicon ? "" : image;
}
