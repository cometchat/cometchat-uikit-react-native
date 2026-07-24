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
}

const { CometChatClipboardModule } = NativeModules;
export default CometChatClipboardModule as NativeCometChatClipboardModuleSpec | undefined;
