import Clipboard from '@react-native-clipboard/clipboard';
import NativeCometChatClipboardModule from './NativeCometChatClipboardModule';
import type { ClipboardImageResult } from './NativeCometChatClipboardModule';
import { stripMarkdown } from '../../utils/MarkdownUtils';
import { applyRawFormatters } from '../../formatters/applyRawFormatters';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';

export type { ClipboardImageResult };

export const ClipboardPasteHandler = {
  isAvailable(): boolean {
    return !!NativeCometChatClipboardModule;
  },

  async hasImage(): Promise<boolean> {
    if (!NativeCometChatClipboardModule) return false;
    try {
      return await NativeCometChatClipboardModule.hasImageInClipboard();
    } catch {
      return false;
    }
  },

  async getImage(): Promise<ClipboardImageResult | null> {
    if (!NativeCometChatClipboardModule) return null;
    try {
      return await NativeCometChatClipboardModule.getClipboardImage();
    } catch {
      return null;
    }
  },

  /**
   * Copies message text, preserving inline colour for a paste back into our own composer.
   *
   * Every app gets the plain text with the wire format stripped; only our editor reads the
   * private representation, so `<color=…>` markup can never leak into Notes, mail or another
   * chat app. Falls back to a plain copy when the native module is unavailable — the text
   * still lands on the clipboard, just without colour.
   */
  copyMessageText(raw: string, textFormatters?: Array<CometChatTextFormatter>): void {
    // A consumer's own wire token is rewritten into UI Kit markup first. Without this the strip below
    // does not recognise it, so the token leaks verbatim into Notes or another chat app, and pasting
    // back into our own composer brings it in as literal text instead of styled text.
    const wire = applyRawFormatters(raw, textFormatters);
    // stripMarkdown, not stripColorTags: colour was the only case anyone checked, so `<u>`, `<b>`,
    // `<i>`, `<s>` and every markdown marker went to Notes and mail verbatim — QA saw
    // `<u>fbebf</u>` pasted from a message that read "fbebf" on screen. stripMarkdown removes HTML
    // tags and markdown AND colour, and unlike stripRichText it keeps line breaks, which a copied
    // multi-line message must retain.
    const plain = stripMarkdown(wire);
    if (!NativeCometChatClipboardModule?.setRichText) {
      Clipboard.setString(plain);
      return;
    }
    NativeCometChatClipboardModule.setRichText(plain, wire).catch(() => {
      Clipboard.setString(plain);
    });
  },
};
