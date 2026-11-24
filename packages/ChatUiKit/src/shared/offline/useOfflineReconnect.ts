/**
 * For a screen that holds a list of its own, outside `CometChatList` and the message list: run
 * `onConnected` each time the SDK's connection comes back (D83 rule 4: a list that shows its error
 * view because the device was offline reloads once by itself on reconnect). Only a screen that
 * opened with offline on listens; with offline off it never runs, so those screens stay today's.
 * Each reconnect reads the gate again, so a kill switch that turned offline off since the screen
 * opened stops the reload (Android `OfflineReconnectRefill.onConnected`).
 *
 * @internal
 */
import { useEffect, useRef } from "react";
import { isOfflineOn } from "./gate";
import { OfflineHub } from "./OfflineHub";

export function useOfflineReconnect(onConnected: () => void): void {
  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;
  useEffect(() => {
    if (!isOfflineOn()) return;
    const subscription = OfflineHub.getInstance().connected$.subscribe(() => {
      if (isOfflineOn()) onConnectedRef.current();
    });
    return () => subscription.unsubscribe();
  }, []);
}
