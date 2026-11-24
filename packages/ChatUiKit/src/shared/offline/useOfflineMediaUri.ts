/**
 * React adapter for {@link offlineAttachmentUri} and the playable shim (README §3.8).
 *
 * With offline off it returns `attachment.getUrl()` and does nothing else: its effect returns at
 * once (no lookup, no listener, no timer). On the ON path it starts from the SDK's cached copy (or
 * the URL), swaps in a playable copy when `playable` is set, and re-resolves when the SDK reports
 * that this message's media finished downloading.
 *
 * @internal
 */
import { useEffect, useRef, useState } from "react";
import { cachedPathOf, isMediaOutOfReach, offlineAttachmentUri, playableUri, shouldUseCachedMedia } from "./media";
import { OfflineHub } from "./OfflineHub";

function urlKeyOf(url: string): string {
  return String(url ?? "").split("?")[0];
}

export function useOfflineMediaUri(attachment: any, options: { playable?: boolean; uid?: string } = {}): string {
  const initial = offlineAttachmentUri(attachment);
  // Keyed by the attachment's URL, never by the object: a receipt, a reaction or an ack clones the
  // message and its attachments, and a clone of the same media must keep its resolved source (a
  // playing video or voice note would restart, an image would reload).
  const [resolved, setResolved] = useState<{ key: string; uri: string } | null>(null);
  const remote = attachment?.getUrl?.();
  const remoteKey = urlKeyOf(remote);
  const attachmentRef = useRef(attachment);
  attachmentRef.current = attachment;
  // The SDK's cached file as of this render: a string, so a clone with the same file changes nothing.
  const cachedNow = shouldUseCachedMedia() ? cachedPathOf(attachment) : "";

  useEffect(() => {
    // Offline off: today's URL, nothing else.
    if (!shouldUseCachedMedia()) return;
    let cancelled = false;
    const apply = (cached: string) => {
      if (!cached) return;
      if (!options.playable) {
        if (!cancelled) setResolved((prev) => (prev && prev.key === remoteKey && prev.uri === cached ? prev : { key: remoteKey, uri: cached }));
        return;
      }
      playableUri(cached, attachmentRef.current, options.uid ?? OfflineHub.getInstance().currentUid ?? "").then((uri) => {
        if (!cancelled) setResolved((prev) => (prev && prev.key === remoteKey && prev.uri === uri ? prev : { key: remoteKey, uri }));
      });
    };
    apply(cachedNow);
    const subscription = OfflineHub.getInstance().mediaReady$.subscribe((event) => {
      if (!event.localPath || urlKeyOf(event.urlKey) !== remoteKey) return;
      apply(event.localPath.startsWith("/") ? `file://${event.localPath}` : event.localPath);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [remoteKey, cachedNow, options.playable, options.uid]);

  return resolved && resolved.key === remoteKey ? resolved.uri : initial;
}

/**
 * Whether this attachment is out of reach right now (`isMediaOutOfReach`), kept current across a
 * reconnect and a finished download. Offline off: always `false`, with no subscription.
 */
export function useMediaOutOfReach(attachment: any): boolean {
  const [outOfReach, setOutOfReach] = useState(() => isMediaOutOfReach(attachment));
  const remote = attachment?.getUrl?.();
  const remoteKey = urlKeyOf(remote);
  // By URL and cached file, not object identity: a clone of the same media re-subscribes to nothing.
  const attachmentRef = useRef(attachment);
  attachmentRef.current = attachment;
  const cachedNow = shouldUseCachedMedia() ? cachedPathOf(attachment) : "";
  useEffect(() => {
    if (!shouldUseCachedMedia()) return;
    const hub = OfflineHub.getInstance();
    const update = () => setOutOfReach(isMediaOutOfReach(attachmentRef.current));
    update();
    const subscriptions = [
      hub.connected$.subscribe(update),
      hub.disconnected$.subscribe(update),
      hub.mediaReady$.subscribe((event) => {
        if (urlKeyOf(event.urlKey) === remoteKey) setOutOfReach(false);
      }),
    ];
    return () => subscriptions.forEach((s) => s.unsubscribe());
  }, [remoteKey, cachedNow]);
  return outOfReach;
}
