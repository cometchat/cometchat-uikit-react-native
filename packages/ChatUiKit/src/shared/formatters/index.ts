import { CometChatMentionsFormatter, MentionTextStyle } from "./CometChatMentionsFormatter";
import { CometChatTextFormatter } from "./CometChatTextFormatter";
import { CometChatUrlsFormatter } from "./CometChatUrlsFormatter";
import { CometChatRichTextFormatter, RichTextStyle } from "./CometChatRichTextFormatter";

export {
  CometChatMentionsFormatter,
  CometChatTextFormatter,
  CometChatUrlsFormatter,
  CometChatRichTextFormatter,
  MentionTextStyle,
  RichTextStyle,
};

// Rich-text wire grammar — shared by the composer (producer) and formatter (renderer).
// Exported so a custom formatter can render the same tokens the built-in one does.
export {
  COLOR_OPEN_TAG,
  COLOR_CLOSE_TAG,
  HEX_COLOR_REGEX,
  normalizeHex,
  openColorTag,
  matchColorTagAt,
  findColorTag,
  stripColorTags,
} from "./richTextWireFormat";
export type { ColorTagMatch } from "./richTextWireFormat";
