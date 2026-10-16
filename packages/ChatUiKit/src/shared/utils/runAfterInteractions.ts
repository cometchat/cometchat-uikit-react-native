import { Platform } from "react-native";

/**
 * Stand-in for `InteractionManager.runAfterInteractions`, which React Native 0.87 removed
 * (touching it throws in dev and is `undefined` in release).
 *
 * - RN < 0.82: `InteractionManager` still waits for running animations and navigation
 *   transitions, so it is used as before and apps on older RN keep the exact old timing.
 * - RN >= 0.82: it had already stopped honouring interaction handles, so all it did was
 *   defer the callback past the current JS turn. That is what `setTimeout(task, 0)` does,
 *   without touching the removed module. `requestIdleCallback` is deliberately not used: it
 *   can hold the callback back for a long time, and these call sites move the caret or clear
 *   the input right after an edit.
 */
const rnVersion = Platform.constants?.reactNativeVersion;
const hasLegacyInteractionManager =
  !!rnVersion && rnVersion.major === 0 && rnVersion.minor < 82;

export function runAfterInteractions(task: () => void): void {
  if (hasLegacyInteractionManager) {
    // Required lazily: on RN 0.87 even reading this export throws.
    require("react-native").InteractionManager.runAfterInteractions(task);
    return;
  }
  setTimeout(task, 0);
}
