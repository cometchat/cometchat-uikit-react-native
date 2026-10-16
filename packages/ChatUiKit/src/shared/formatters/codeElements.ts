/**
 * Elements the rich-text formatter rendered as code (inline code and code blocks).
 *
 * Code is literal: `` `https://google.com` `` must stay monospace text, but the urls formatter,
 * which runs after the rich-text formatter, walked into the code element and made the address
 * a link anyway. The rich-text formatter marks what it renders as code; the urls formatter
 * leaves marked elements alone.
 *
 * The mark is a prop, not a registry: it survives the `cloneElement` calls later formatters make,
 * and it cannot be split across two copies of this module (a symlinked kit can be bundled twice).
 * React Native only forwards a host component's known attributes, so the prop never reaches native.
 */
import React from "react";

const CODE_PROP = "ccRichTextCode";

export const markCode = (element: React.ReactElement<any>): React.ReactElement<any> =>
  React.cloneElement(element, { [CODE_PROP]: true });

export const isCode = (element: unknown): boolean =>
  React.isValidElement(element) && (element.props as any)?.[CODE_PROP] === true;
