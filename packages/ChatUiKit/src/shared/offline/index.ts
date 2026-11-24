/**
 * Internal entry point of the kit's offline support. Not part of the public API: integrators get
 * `UIKitSettings.offline`, the additive events and `hideOfflineNotices` only.
 *
 * @internal
 */
import { hasOfflineSdk, offlineSdk } from "./gate";
import { clearPlayableShims } from "./media";
import { OfflineHub } from "./OfflineHub";

let mediaCleanupWired = false;

/**
 * Start the hub after the SDK's own init resolved (both init entry points call this). Idempotent.
 * `user` is the restored session's user, if any, so a later user switch is recognised.
 */
export function startOfflineSupport(user?: any): void {
  const hub = OfflineHub.getInstance();
  hub.start();
  if (!mediaCleanupWired) {
    mediaCleanupWired = true;
    // Playable copies are per session: gone on logout, user switch and cache reset.
    hub.session$.subscribe(() => {
      clearPlayableShims();
    });
  }
  if (user) hub.onLogin(user);
}

/**
 * Hand `UIKitSettings.offline` to the SDK's AppSettingsBuilder, untouched in meaning: an SDK
 * `OfflineConfig` instance as is, `true`/an options object through `OfflineConfig.fromJson`.
 * Nothing happens when the setting is absent or the SDK has no offline support.
 */
export function applyOfflineSetting(appSettingsBuilder: any, setting: unknown): void {
  if (setting === undefined || setting === null) return;
  try {
    // Below the kit's SDK floor the config must not reach the SDK: 4.2.0 has setOfflineConfig,
    // so it would queue and cache while the kit's screens act online (the half-on state).
    if (!hasOfflineSdk()) {
      // The peer stays `"*"` on purpose (see `gate.ts`), so an app can pair this kit with an SDK
      // that has no offline support and keep working online. Asking for offline on such an SDK
      // then did nothing at all and said nothing, which reads as the kit ignoring the setting.
      // `__DEV__` keeps this out of release bundles.
      if (__DEV__) {
        console.warn(
          "[CometChatUIKit] `offline` was set, but offline support needs Chat SDK React Native " +
            "4.2.1 or later. The kit is running online only. Upgrade " +
            "@cometchat/chat-sdk-react-native to 4.2.1+ to enable it."
        );
      }
      return;
    }
    if (typeof appSettingsBuilder?.setOfflineConfig !== "function") return;
    if (typeof setting === "object" && typeof (setting as any).isEnabled === "function") {
      appSettingsBuilder.setOfflineConfig(setting);
      return;
    }
    const OfflineConfig = offlineSdk().OfflineConfig;
    if (typeof OfflineConfig?.fromJson === "function") {
      appSettingsBuilder.setOfflineConfig(OfflineConfig.fromJson(setting));
    } else if (typeof setting === "boolean" && typeof appSettingsBuilder.offline === "function") {
      appSettingsBuilder.offline(setting);
    }
  } catch (e) {
    console.warn("[CometChatUIKit] offline setting was not applied", e);
  }
}

/** Before the SDK's init: only what must already be listening when the SDK starts (see the hub). */
export function prepareOfflineSupport(): void {
  OfflineHub.getInstance().listenForStartAnnouncements();
}

export { OfflineHub } from "./OfflineHub";
export { isOfflineOn } from "./gate";
