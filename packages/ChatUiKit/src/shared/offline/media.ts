/**
 * Media on the offline (ON) path (README §3.8, UIK-MEDIA-01): an attachment's source is the
 * SDK's cached copy (`attachment.getLocalPath()`, stamped by the SDK on cached messages) when it
 * has one, else its URL, as today. With offline off, or the SDK's media caching OFF, the URL is
 * returned untouched and nothing else runs: no lookup, no timer, no file.
 *
 * The kit keeps no media cache of its own. The single exception is the per-session "playable"
 * shim: the SDK stores cached files without an extension and AVFoundation will not play a video
 * or audio file without one, so the kit copies such a file once, with the right extension, into
 * `Caches/cometchat-offline-playable/<uid>/`. The folder is wiped on the first shim of a process
 * (so a previous session's copies never survive) and on logout, user switch and cache reset.
 * `react-native-fs` is an optional peer; without it the cached path is used as is.
 *
 * @internal
 */
import { isOfflineOn, mediaCachingMode, offlineSdk, sdkConnected } from "./gate";
import { OfflineHub } from "./OfflineHub";

/** Whether media should come from the SDK's cache for this render. */
export function shouldUseCachedMedia(): boolean {
  return isOfflineOn() && mediaCachingMode() !== "OFF";
}

function toFileUri(path: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) return path;
  return path.startsWith("/") ? `file://${path}` : path;
}

/** The SDK's cached file for an attachment, as a URI, or `""`. */
export function cachedPathOf(attachment: any): string {
  try {
    const local = attachment?.getLocalPath?.();
    return typeof local === "string" && local ? toFileUri(local) : "";
  } catch {
    return "";
  }
}

/**
 * The source for an attachment: with offline off this is exactly `attachment.getUrl()`; on the ON
 * path the SDK's cached copy wins over the URL.
 */
export function offlineAttachmentUri(attachment: any): string {
  if (!shouldUseCachedMedia()) return attachment?.getUrl?.();
  return cachedPathOf(attachment) || attachment?.getUrl?.();
}

/**
 * Media the device has no copy of and cannot reach now (offline ON, not connected): the bubble
 * shows "Available when online" (AC-12.3). `false` with offline off and with media caching off.
 */
export function isMediaOutOfReach(attachment: any): boolean {
  return shouldUseCachedMedia() && !cachedPathOf(attachment) && sdkConnected() === false;
}

/**
 * What Download / Share / "Download all" act on (BEH-MEDIA-18). With offline off, or media caching
 * off: the URL, exactly as before. On the ON path: the saved local file when there is one (never
 * re-fetched), else the URL while connected, else `unavailable` (show "Available when online").
 */
export type MediaActionSource =
  | { kind: "remote"; uri: string }
  | { kind: "local"; uri: string }
  | { kind: "unavailable" };

export function mediaActionSource(attachment: any): MediaActionSource {
  if (!shouldUseCachedMedia()) return { kind: "remote", uri: attachment?.getUrl?.() };
  const local = cachedPathOf(attachment);
  if (local) return { kind: "local", uri: local };
  if (sdkConnected() === false) return { kind: "unavailable" };
  return { kind: "remote", uri: attachment?.getUrl?.() };
}

/** Raise the kit's "Available when online" notice for a Download / Share that cannot proceed. */
export function notifyMediaUnavailable(): void {
  try {
    OfflineHub.getInstance().notify({ kind: "media_available_when_online" });
  } catch {
    /* no hub: nothing to show */
  }
}

/**
 * "Download all": each attachment goes to `download` as its saved local file when offline support is
 * on and it has one, else as its URL; one with neither (offline, no copy) is skipped and the
 * "Available when online" notice is raised once. With offline off every URL is passed, as before.
 */
export function downloadAttachments(attachments: any[], download: (uri: string, name: string) => void): void {
  let unavailable = false;
  attachments.forEach((attachment) => {
    const source = mediaActionSource(attachment);
    if (source.kind === "unavailable") {
      unavailable = true;
      return;
    }
    download(source.uri, attachment.getName());
  });
  if (unavailable) notifyMediaUnavailable();
}

/**
 * A tap on media the device has no copy of, online: ask the SDK to download and cache it. Its media
 * listener reports the file (the bubble re-resolves through `useOfflineMediaUri`). A no-op with
 * offline off, media caching off, offline, or when a copy exists. Never throws or rejects.
 */
export function requestMediaDownload(attachment: any): boolean {
  if (!shouldUseCachedMedia() || cachedPathOf(attachment) || sdkConnected() === false) return false;
  const sdk = offlineSdk();
  if (typeof sdk?.downloadMedia !== "function") return false;
  // One download per item at a time: further touches while it runs do not ask again.
  const key = downloadKeyOf(attachment);
  if (downloadsInFlight.has(key)) return true;
  try {
    const result: any = sdk.downloadMedia(attachment);
    if (result && typeof result.then === "function") {
      downloadsInFlight.add(key);
      const done = () => downloadsInFlight.delete(key);
      result.then(done, done);
    }
    return true;
  } catch {
    return false;
  }
}

const downloadsInFlight = new Set<unknown>();

function downloadKeyOf(attachment: any): unknown {
  let url: unknown;
  try {
    url = attachment?.getUrl?.() ?? attachment?.url;
  } catch {
    url = undefined;
  }
  return typeof url === "string" && url ? url : attachment;
}

// ── Playable shim ───────────────────────────────────────────────────────────

const SHIM_FOLDER = "cometchat-offline-playable";
// The one-time wipe of stale copies, shared: every caller waits for it, so a copy made by one
// bubble is never deleted by another bubble's still-running wipe.
let shimRootClear: Promise<void> | null = null;
let shimsCreated = false;

const EXTENSION_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/webm": "webm",
  "video/3gpp": "3gp",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
};

function loadFs(): any {
  try {
    // Optional peer: Metro treats a try-wrapped require as an optional dependency.
    const fs = require("react-native-fs");
    return fs?.default ?? fs;
  } catch {
    return null;
  }
}

function hasExtension(path: string): boolean {
  const last = path.split("?")[0].split("/").pop() ?? "";
  return /\.[a-z0-9]{2,5}$/i.test(last);
}

function hashOf(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function safeSegment(value: string): string {
  return (value || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Extension for a playable copy: from the attachment's own extension or mime type. */
export function playableExtensionOf(attachment: any): string {
  const ext = String(attachment?.getExtension?.() ?? "").replace(/^\./, "").toLowerCase();
  if (/^[a-z0-9]{2,5}$/.test(ext)) return ext;
  const mime = String(attachment?.getMimeType?.() ?? "").toLowerCase();
  return EXTENSION_BY_MIME[mime] ?? "";
}

/**
 * A URI AVFoundation can play for the cached copy of `attachment`, or the cached URI as is when no
 * copy is needed or possible. Only called on the ON path, with a cached path in hand.
 */
export async function playableUri(cachedUri: string, attachment: any, uid: string): Promise<string> {
  if (!cachedUri.startsWith("file://") || hasExtension(cachedUri)) return cachedUri;
  const ext = playableExtensionOf(attachment);
  const fs = loadFs();
  if (!ext || !fs?.CachesDirectoryPath) return cachedUri;
  try {
    const root = `${fs.CachesDirectoryPath}/${SHIM_FOLDER}`;
    if (!shimRootClear) {
      shimRootClear = (async () => {
        if (await fs.exists(root)) await fs.unlink(root);
      })().catch((e) => console.warn("[CometChatUIKit] could not remove stale playable copies", e));
    }
    await shimRootClear;
    const dir = `${root}/${safeSegment(uid)}`;
    const source = cachedUri.replace(/^file:\/\//, "");
    const target = `${dir}/${hashOf(source)}.${ext}`;
    if (!(await fs.exists(target))) {
      await fs.mkdir(dir);
      await fs.copyFile(source, target);
    }
    shimsCreated = true;
    return `file://${target}`;
  } catch (e) {
    console.warn("[CometChatUIKit] playable copy failed; using the cached file", e);
    return cachedUri;
  }
}

/** Delete every playable copy (logout, user switch, cache reset). No-op if none was made. */
export async function clearPlayableShims(): Promise<void> {
  if (!shimsCreated) return;
  shimsCreated = false;
  const fs = loadFs();
  if (!fs?.CachesDirectoryPath) return;
  try {
    const root = `${fs.CachesDirectoryPath}/${SHIM_FOLDER}`;
    if (await fs.exists(root)) await fs.unlink(root);
  } catch (e) {
    console.warn("[CometChatUIKit] could not remove playable copies", e);
  }
}

/** Tests only. */
export function resetMediaShimStateForTests(): void {
  shimRootClear = null;
  shimsCreated = false;
  downloadsInFlight.clear();
}
