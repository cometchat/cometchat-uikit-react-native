import { useEffect, useState } from 'react';
import { NativeModules } from 'react-native';

const { FileManager } = NativeModules;

// Long edge of the generated JPEG — tray tiles and grid cells are at most ~200pt, so this stays sharp
// on 3x screens while keeping each file a few KB.
const THUMBNAIL_MAX_SIZE = 480;

// Local video uri → its thumbnail (in flight or done), so the tray tile and the bubble share one native call.
const byLocalUri = new Map<string, Promise<string | null>>();
// Resolved thumbnails, so a component can render the thumbnail on its first frame instead of after a tick.
const resolved = new Map<string, string>();
// Uploaded video url (without the signed query string) → the local file it came from.
const localUriByRemoteUrl = new Map<string, string>();

const withoutQuery = (url: string) => url.split('?')[0];

/** First-frame JPEG of a LOCAL video file, generated natively. Resolves null when unavailable. */
export function getLocalVideoThumbnail(localUri: string): Promise<string | null> {
  const cached = byLocalUri.get(localUri);
  if (cached) return cached;
  const pending: Promise<string | null> = typeof FileManager?.getVideoThumbnail === 'function'
    ? FileManager.getVideoThumbnail(localUri, THUMBNAIL_MAX_SIZE)
        .then((thumbnailUri: string) => {
          resolved.set(localUri, thumbnailUri);
          return thumbnailUri;
        })
        .catch(() => null)
    : Promise.resolve(null);
  byLocalUri.set(localUri, pending);
  return pending;
}

/**
 * Remembers which local file an uploaded video came from, so the sender's bubble (which only knows the
 * uploaded url) can show the local thumbnail straight away. Also starts generating it.
 */
export function linkUploadedVideo(remoteUrl: string | undefined, localUri: string | undefined): void {
  if (!remoteUrl || !localUri) return;
  localUriByRemoteUrl.set(withoutQuery(remoteUrl), localUri);
  getLocalVideoThumbnail(localUri);
}

function localUriFor(source: { localUri?: string; remoteUrl?: string }): string | undefined {
  if (source.localUri) return source.localUri;
  return source.remoteUrl ? localUriByRemoteUrl.get(withoutQuery(source.remoteUrl)) : undefined;
}

/**
 * Local first-frame thumbnail for a video, by its local file uri (tray) or its uploaded url (a bubble
 * this device sent). `undefined` while generating, `null` when there is none — no local file (e.g. a
 * video received from someone else), generation failed, or the native method isn't available.
 */
export function useLocalVideoThumbnail(source: { localUri?: string; remoteUrl?: string }): string | null | undefined {
  const localUri = localUriFor(source);
  const [thumbnail, setThumbnail] = useState<string | null | undefined>(() =>
    localUri ? resolved.get(localUri) : null
  );
  useEffect(() => {
    if (!localUri) {
      setThumbnail(null);
      return;
    }
    let active = true;
    getLocalVideoThumbnail(localUri).then((uri) => {
      if (active) setThumbnail(uri);
    });
    return () => {
      active = false;
    };
  }, [localUri]);
  return thumbnail;
}
