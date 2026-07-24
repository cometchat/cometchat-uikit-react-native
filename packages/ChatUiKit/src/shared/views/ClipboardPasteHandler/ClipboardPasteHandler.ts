import NativeCometChatClipboardModule from './NativeCometChatClipboardModule';
import type { ClipboardImageResult } from './NativeCometChatClipboardModule';

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
};
