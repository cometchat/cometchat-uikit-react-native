import { StickerKeyboardStyle, StickerKeyboardStyleInterface } from "./StickerKeyboardStyle";
import { CometChat } from "@cometchat/chat-sdk-react-native";

/**
 * @class StickerKeyboardConfiguration
 * @description StickerKeyboardConfiguration class is used for defining the StickerKeyboard templates.
 * @param {Function} onPress
 * @param {Object} style
 */

class StickerKeyboardConfiguration {
  onPress: (item: CometChat.CustomMessage) => void
  style: StickerKeyboardStyleInterface
  constructor({ onPress = null, style = new StickerKeyboardStyle({}) }) {
    this.onPress = onPress;
    this.style = new StickerKeyboardStyle(style ?? {});
  }
}

export { StickerKeyboardConfiguration };
