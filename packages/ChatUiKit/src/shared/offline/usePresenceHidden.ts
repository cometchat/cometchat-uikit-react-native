/**
 * Presence is hidden while the SDK is not connected, offline ON only: no "Online" subtitle, no
 * green dot, no typing text. With offline off it is always `false`, so every screen is today's.
 * The kit's re-fetch on reconnect restores the user / list; this only re-renders on the change.
 *
 * Read the gate at the moment of the render, never store it (UIK-GATE-01). The connection state
 * comes from the SDK at mount, then follows the hub's connected / disconnected events.
 *
 * @internal
 */
import { useEffect, useState } from "react";
import { isOfflineOn, sdkConnected } from "./gate";
import { OfflineHub } from "./OfflineHub";

/** Whether presence must not be shown right now. */
export function isPresenceHidden(): boolean {
  return isOfflineOn() && sdkConnected() === false;
}

/** Re-renders the caller when the connection changes; `true` while presence must stay hidden. */
export function usePresenceHidden(): boolean {
  // A counter, not the answer: the answer is read from the SDK at render, after the gate.
  const [, setTick] = useState(0);
  const [offlineAtMount] = useState(() => isOfflineOn());
  useEffect(() => {
    if (!offlineAtMount) return;
    const hub = OfflineHub.getInstance();
    const bump = () => setTick((n) => n + 1);
    const subscriptions = [hub.connected$.subscribe(bump), hub.disconnected$.subscribe(bump)];
    return () => subscriptions.forEach((s) => s.unsubscribe());
  }, [offlineAtMount]);
  return isPresenceHidden();
}
