import { NativeModules } from 'react-native';

export interface ClipboardImageResult {
  uri: string;
  mimeType: string;
  size: number;
  name: string;
}

interface NativeCometChatClipboardModuleSpec {
  hasImageInClipboard(): Promise<boolean>;
  getClipboardImage(): Promise<ClipboardImageResult | null>;
  /**
   * Copies `plain` to the system clipboard for every app, and `wire` under a private
   * representation only our composer reads back — so inline colour survives a copy/paste
   * inside CometChat without leaking `<color=…>` markup to anywhere else.
   */
  setRichText(plain: string, wire: string): Promise<boolean>;
}

const { CometChatClipboardModule } = NativeModules;
export default CometChatClipboardModule as NativeCometChatClipboardModuleSpec | undefined;
