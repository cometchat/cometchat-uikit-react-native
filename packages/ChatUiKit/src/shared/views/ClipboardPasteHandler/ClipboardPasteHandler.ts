import Clipboard from '@react-native-clipboard/clipboard';
import NativeCometChatClipboardModule from './NativeCometChatClipboardModule';
import type { ClipboardImageResult } from './NativeCometChatClipboardModule';
import { stripColorTags } from '../../formatters/richTextWireFormat';

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
  copyMessageText(raw: string): void {
    const plain = stripColorTags(raw);
    if (!NativeCometChatClipboardModule?.setRichText) {
      Clipboard.setString(plain);
      return;
    }
    NativeCometChatClipboardModule.setRichText(plain, raw).catch(() => {
      Clipboard.setString(plain);
    });
  },
};
