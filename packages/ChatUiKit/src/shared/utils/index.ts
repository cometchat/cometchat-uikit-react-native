import { CometChatSoundManager } from "../resources/CometChatSoundManager";
import { CometChatMessagePreview } from "./CometChatMessagePreview";
import { CometChatConversationUtils } from "./conversationUtils";
import { isCursorWithinMentionRange, getMentionRangeAtCursor } from "./MentionUtils";
import { stripMarkdown } from "./MarkdownUtils";
export {
  CometChatConversationUtils,
  CometChatMessagePreview,
  CometChatSoundManager,
  isCursorWithinMentionRange,
  getMentionRangeAtCursor,
  stripMarkdown,
};

// Multiple Attachment Support — U3
export { openMultiFileChooser } from './openMultiFileChooser';
export type { PickedFile } from './openMultiFileChooser';

// Multiple Attachment Support — U7
export { groupAttachments } from './groupAttachments';
export type { AttachmentGroups } from './groupAttachments';
