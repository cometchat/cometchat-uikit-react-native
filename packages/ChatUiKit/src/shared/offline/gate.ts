/**
 * OfflineGate: the one place the kit asks the Chat SDK whether offline support is on
 * (README §3.1, UIK-GATE-01).
 *
 * Every offline-dependent decision calls {@link isOfflineOn} once, at the moment of the decision
 * (one fetch, one send, one reconnect event, one Retry tap), and passes the answer down that
 * operation. Nothing stores it: the SDK can switch offline off mid-session (kill switch) or on at
 * the next login, and the next operation must see the new value.
 *
 * The kit ships TypeScript source that customers type-check against whatever SDK they pinned
 * (`"main": "src/index"`, SDK peer `"*"`), and SDKs before the offline release have none of these
 * members. So every offline SDK member is reached through the untyped {@link offlineSdk} accessor
 * and feature-detected; on an SDK without them `isOfflineOn()` answers `false` and the kit runs
 * today's code.
 *
 * @internal
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";

/** Untyped view of the SDK's static surface (never name an offline SDK type in kit source). */
export function offlineSdk(): any {
  return CometChat as any;
}

/** Whether the installed SDK has a static function called `name`. */
export function hasSdkFunction(name: string): boolean {
  try {
    return typeof offlineSdk()?.[name] === "function";
  } catch {
    return false;
  }
}

/**
 * Whether the installed SDK is one the kit runs offline on: Chat SDK 4.2.1 or later.
 *
 * Published 4.2.0 already has `isOfflineEnabled` and the rest of the offline surface, so
 * feature-detecting that alone would run offline fully on against it, without the 4.2.1 fixes
 * the kit relies on. The floor therefore also needs `OfflineCacheResetReason.SCHEMA_RESET`,
 * which first ships in 4.2.1. On an older SDK the kit runs online only, as with 4.1.x.
 */
export function hasOfflineSdk(): boolean {
  try {
    const sdk = offlineSdk();
    return (
      typeof sdk?.isOfflineEnabled === "function" &&
      sdk?.OfflineCacheResetReason?.SCHEMA_RESET === "SCHEMA_RESET"
    );
  } catch {
    return false;
  }
}

/**
 * `CometChat.isOfflineEnabled()`; `false` when the SDK is older than the offline floor
 * ({@link hasOfflineSdk}), has no such method, or the call throws.
 */
export function isOfflineOn(): boolean {
  try {
    if (!hasOfflineSdk()) return false;
    return offlineSdk().isOfflineEnabled() === true;
  } catch {
    return false;
  }
}

/** `CometChat.getMediaCachingMode()`, or `"OFF"` when unknown. */
export function mediaCachingMode(): string {
  try {
    const sdk = offlineSdk();
    if (typeof sdk?.getMediaCachingMode !== "function") return "OFF";
    const mode = sdk.getMediaCachingMode();
    return typeof mode === "string" ? mode : "OFF";
  } catch {
    return "OFF";
  }
}

/**
 * Whether the SDK's realtime connection is up: `true` / `false` from
 * `CometChat.getConnectionStatus()` (`"connected"` or not), `undefined` when the SDK does not say.
 * Used only on the offline path, to know a pending callback is the only answer a send will get
 * for now (a send queued behind an earlier unsent message in its chat, SDK R77).
 */
export function sdkConnected(): boolean | undefined {
  try {
    const sdk = offlineSdk();
    if (typeof sdk?.getConnectionStatus !== "function") return undefined;
    const status = sdk.getConnectionStatus();
    return typeof status === "string" ? status === "connected" : undefined;
  } catch {
    return undefined;
  }
}
