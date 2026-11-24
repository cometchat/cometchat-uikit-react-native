/**
 * The composer tray on the offline (ON) path, for both composers (README §3.8, UIK-UPLOAD-01,
 * UIK-LIFE-01): restores the tray of this (receiver, type, thread parent) once it has settled
 * (BEH-UPLOAD-14), and clears it with the session. Done tiles stay done, interrupted ones come back
 * failed with retry; nothing uploads by itself. A pick made meanwhile wins. With offline off the
 * restore resolves null and the session event changes nothing: that tray is today's.
 *
 * @internal
 */
import { MutableRefObject, useEffect, useRef } from "react";
import type { SelectedAttachment } from "../modals/SelectedAttachment";
import type { UploadQueueService, UploadTarget } from "../services/UploadQueueService";
import { isOfflineOn } from "./gate";
import { OfflineHub } from "./OfflineHub";

export function useOfflineUploadTray(
  uploadQueue: UploadQueueService,
  target: UploadTarget,
  trayRef: MutableRefObject<SelectedAttachment[]>,
  setTray: (tiles: SelectedAttachment[]) => void
): void {
  const { receiver, receiverType, parentMessageId } = target;
  const usedOfflineRef = useRef(false);

  useEffect(() => {
    if (!receiver || !receiverType) return;
    usedOfflineRef.current = usedOfflineRef.current || isOfflineOn();
    let current = true;
    uploadQueue
      .restore({ receiver, receiverType, parentMessageId })
      .then((tiles) => {
        if (!current || !tiles || tiles.length === 0 || trayRef.current.length > 0) return;
        trayRef.current = tiles;
        setTray(tiles);
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [receiver, receiverType, parentMessageId, uploadQueue, trayRef, setTray]);

  useEffect(() => {
    // Logout, user switch or cache reset. The SDK owns the batch; only the screen lets go of it.
    const subscription = OfflineHub.getInstance().session$.subscribe(() => {
      if (!usedOfflineRef.current) return;
      uploadQueue.detach();
      trayRef.current = [];
      setTray([]);
    });
    return () => subscription.unsubscribe();
  }, [uploadQueue, trayRef, setTray]);
}

/**
 * Offline ON: moving to another thread parent in the same chat detaches the batch (the SDK keeps
 * it for a restore, BEH-UPLOAD-14) and empties the tray, so the previous thread's tiles are not
 * shown or sent here. Call it before `useOfflineUploadTray`. Offline OFF: nothing changes.
 *
 * @internal
 */
export function useOfflineThreadTrayReset(
  uploadQueue: UploadQueueService,
  parentMessageId: UploadTarget["parentMessageId"],
  trayRef: MutableRefObject<SelectedAttachment[]>,
  setTray: (tiles: SelectedAttachment[]) => void
): void {
  const parentRef = useRef(parentMessageId);
  useEffect(() => {
    if (String(parentRef.current ?? "") === String(parentMessageId ?? "")) return;
    parentRef.current = parentMessageId;
    if (!isOfflineOn()) return;
    uploadQueue.detach();
    trayRef.current = [];
    setTray([]);
  }, [parentMessageId, uploadQueue, trayRef, setTray]);
}
