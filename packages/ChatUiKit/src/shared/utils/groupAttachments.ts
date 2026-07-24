import { CometChat } from '@cometchat/chat-sdk-react-native';

export interface AttachmentGroups {
  mediaAttachments: CometChat.Attachment[];
  audioAttachments: CometChat.Attachment[];
  fileAttachments: CometChat.Attachment[];
}

const EMPTY: AttachmentGroups = { mediaAttachments: [], audioAttachments: [], fileAttachments: [] };

/**
 * True when a message carries MORE THAN ONE attachment. After the §7 fan-out a message
 * is single-kind (all images / all videos / all audio / all files), so this is the
 * dispatch predicate the content-view routers use to pick the per-type multi-attachment
 * bubble (ImagesBubble / VideosBubble / AudiosBubble / FilesBubble) over the legacy
 * single-attachment bubble. It is NOT a distinct wire/SDK type — the coarse message type
 * stays `image` / `video` / `audio` / `file`.
 */
export function isGalleryMessage(message: CometChat.MediaMessage): boolean {
  const atts = message?.getAttachments?.() ?? [];
  return Array.isArray(atts) && atts.length > 1;
}

function getAttachmentsFromMetadata(
  message: CometChat.MediaMessage
): CometChat.Attachment[] {
  const meta = message.getMetadata?.() as Record<string, unknown> | null;
  if (!meta || !Array.isArray(meta.attachments)) return [];

  // Filter out any null/undefined/non-object entries before constructing Attachment instances
  // (a deleted message's metadata may contain malformed attachment data)
  const validItems = (meta.attachments as unknown[]).filter(
    (a): a is Record<string, unknown> => a != null && typeof a === 'object'
  );
  if (validItems.length === 0) return [];

  // Reconstruct Attachment objects from the plain-object fallback in metadata
  const list = validItems.map((a) => new CometChat.Attachment(a));
  return list;
}

export function groupAttachments(
  message: CometChat.MediaMessage
): AttachmentGroups {
  // Guard: deleted messages or action messages may not have attachment data
  if (!message || message.getDeletedBy?.()) return EMPTY;

  try {
    // Primary path: SDK-native data.attachments (set via setAttachments / server response)
    let attachments: CometChat.Attachment[] = message.getAttachments?.() ?? [];

    if (attachments.length === 0) {
      const meta = message.getMetadata?.() as Record<string, unknown> | null;
      const metaList =
        meta?.attachments && Array.isArray(meta.attachments) && meta.attachments.length > 0
          ? getAttachmentsFromMetadata(message)
          : [];

      if (metaList.length > 0) {
        attachments = metaList;
      } else {
        // Last resort: single attachment from the primary message data slot
        const single = message.getAttachment?.();
        attachments = single ? [single] : [];
      }
    } else {
      // Filter out any Attachment instances that have no URL (malformed SDK response)
      attachments = attachments.filter(att => att != null && typeof att.getUrl === 'function');
    }

    const isVisual = (a: CometChat.Attachment) => {
      const mime = a.getMimeType?.() ?? '';
      return mime.startsWith('image/') || mime.startsWith('video/');
    };

    const isAudio = (a: CometChat.Attachment) =>
      (a.getMimeType?.() ?? '').startsWith('audio/');

    // Decision 4.5 — preserve pick/insertion order within the media grid (no videos-first
    // sort). getAttachments() already reflects the order the attachments were added.
    const mediaAttachments = attachments.filter(isVisual);
    // TODO (decision 3.2/4.1, blocked by 8.6 audio-tile design): picked audio should live
    // IN the media grid, not as a standalone section. Kept separate until the tile design lands.
    const audioAttachments = attachments.filter(isAudio);
    // Decision 4.8 — files are always their own section at the bottom, regardless of pick order.
    const fileAttachments = attachments.filter((a) => !isVisual(a) && !isAudio(a));

    return { mediaAttachments, audioAttachments, fileAttachments };
  } catch {
    // Never crash the conversation list or message list over attachment parsing
    return EMPTY;
  }
}
