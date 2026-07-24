import { CometChat } from '@cometchat/chat-sdk-react-native';
import { MessageTypeConstants } from '../constants/UIKitConstants';

export interface AttachmentKindGroup {
  /** The `MediaMessage` type for this group's fanned-out message. */
  type: string;
  attachments: CometChat.Attachment[];
}

/**
 * Design doc §7 fan-out — partition completed attachments into per-kind groups in the
 * fixed display order **Images → Videos → Audios → Files**, one group per non-empty kind.
 * Each group becomes ONE `MediaMessage` on send.
 *
 * Audio routing (§7/§8.1a): **picker audio is its own `type=audio` group** (NO
 * `audioType` metadata), so a picked/shared audio file renders with the WhatsApp-style
 * headphone+filename bubble (`CometChatAudiosBubble`) — NOT a file card. Recorder voice
 * notes are a separate send flow tagged `audioType="voice_note"` (rendered by the WAVEFORM
 * bubble, `CometChatVoiceNoteBubble` / `CometChatAudioBubble`); they never appear in the
 * tray, so no voice-note group is produced here.
 */
export function partitionAttachmentsByKind(
  attachments: CometChat.Attachment[]
): AttachmentKindGroup[] {
  const image: CometChat.Attachment[] = [];
  const video: CometChat.Attachment[] = [];
  const audio: CometChat.Attachment[] = [];
  const file: CometChat.Attachment[] = [];

  for (const a of attachments) {
    const mime = a.getMimeType?.() ?? '';
    if (mime.startsWith('image/')) image.push(a);
    else if (mime.startsWith('video/')) video.push(a);
    else if (mime.startsWith('audio/')) audio.push(a); // picker audio → audio player bubble
    else file.push(a); // documents + everything else → files
  }

  return [
    { type: MessageTypeConstants.image, attachments: image },
    { type: MessageTypeConstants.video, attachments: video },
    { type: MessageTypeConstants.audio, attachments: audio },
    { type: MessageTypeConstants.file, attachments: file },
  ].filter((g) => g.attachments.length > 0);
}
