/**
 * Mention markup a user TYPED or PASTED, as opposed to a mention picked from the suggestion list.
 *
 * `<@uid:…>` / `<@all:…>` in a message's text is the only signal that a mention is real — there
 * is no other metadata for `@all`. So text a user typed that happens to look like a token was
 * sent verbatim and every platform rendered it as a live mention: `<@all:everyone> hi` became an
 * @everyone chip. The cross-platform contract (shared with the React UI Kit) is to store a typed
 * token's `<` as `&lt;` — `&lt;@all:everyone> hi` — and to show that as `<@all:everyone> hi`
 * only after mentions have been resolved, so it can never turn back into a chip.
 */

import React from "react";

const TYPED_TOKEN_REGEX = /<(@(?:uid|all):)/g;
const ESCAPED_TOKEN_REGEX = /&lt;(@(?:uid|all):)/g;

/** Escapes token-looking text a user typed: `<@all:x>` → `&lt;@all:x>`. */
export const escapeTypedMentionTokens = (text: string): string =>
  text.indexOf("<@") < 0 ? text : text.replace(TYPED_TOKEN_REGEX, "&lt;$1");

/** Display form of an escaped typed token: `&lt;@all:x>` → `<@all:x>`. Run AFTER mention parsing. */
export const unescapeTypedMentionTokens = (text: string): string =>
  text.indexOf("&lt;@") < 0 ? text : text.replace(ESCAPED_TOKEN_REGEX, "<$1");

const hasEscapedToken = (node: any): boolean => {
  if (typeof node === "string") return node.indexOf("&lt;@") >= 0;
  if (Array.isArray(node)) return node.some(hasEscapedToken);
  if (React.isValidElement(node)) return hasEscapedToken((node as React.ReactElement<any>).props.children);
  return false;
};

const unescapeTree = (node: any): any => {
  if (typeof node === "string") return unescapeTypedMentionTokens(node);
  if (Array.isArray(node)) return node.map(unescapeTree);
  if (React.isValidElement(node) && hasEscapedToken(node)) {
    const children = (node as React.ReactElement<any>).props.children;
    return React.cloneElement(node as React.ReactElement<any>, {
      children: Array.isArray(children) ? children.map(unescapeTree) : unescapeTree(children),
    });
  }
  return node;
};

/**
 * {@link unescapeTypedMentionTokens} over every string of a rendered tree. Only the branches
 * holding an escaped token are rebuilt; any other tree — nearly every message — is returned as
 * the same object, so rendering it costs nothing and changes nothing.
 */
export const unescapeTypedMentionTokensInTree = (node: any): any =>
  hasEscapedToken(node) ? unescapeTree(node) : node;

/**
 * Builds the text to send: real mentions (character ranges `"start_end"` in `text`, from the
 * composer's mention map) become their tokens, and everything the user typed between them is
 * escaped. Ranges are applied in position order, whatever order the map holds them in.
 */
export const insertMentionTokens = (
  text: string,
  mentions: Iterable<[string, { underlyingText: string }]>
): string => {
  const ranges = [...mentions]
    .map(([key, value]) => {
      const [start, end] = key.split("_").map(Number);
      return { start, end, token: value.underlyingText };
    })
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end))
    .sort((a, b) => a.start - b.start);

  let out = "";
  let last = 0;
  for (const { start, end, token } of ranges) {
    if (start < last) continue; // overlapping range — skip it rather than corrupt the text
    out += escapeTypedMentionTokens(text.substring(last, start)) + token;
    last = end;
  }
  return out + escapeTypedMentionTokens(text.substring(last));
};
