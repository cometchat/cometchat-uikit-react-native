/**
 * For a screen that holds rows of its own, outside `CometChatList` and the message list: run
 * `onEnded` when the session ends (logout, user switch, cache reset; UIK-LIFE-01), so nothing of it
 * shows afterwards. Only a screen that opened with offline on reacts: the hub's login listener also
 * hears a logout with offline off, and that screen stays today's.
 *
 * @internal
 */
import { useEffect, useRef } from "react";
import { isOfflineOn } from "./gate";
import { OfflineHub } from "./OfflineHub";

export function useOfflineSessionEnded(onEnded: () => void): void {
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  useEffect(() => {
    const usedOffline = isOfflineOn();
    if (!usedOffline) return;
    const subscription = OfflineHub.getInstance().session$.subscribe(() => onEndedRef.current());
    return () => subscription.unsubscribe();
  }, []);
}
