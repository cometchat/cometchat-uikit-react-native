import { CallingExtension } from "../../calls";
import { ExtensionsDataSource } from "../framework";

/**
 * Offline settings handed through to the Chat SDK's `OfflineConfig` (README §4). The kit's own
 * structural type, so it never names an SDK type an older SDK lacks; an SDK `OfflineConfig`
 * instance is accepted as is. The kit never reads it back: it asks the SDK
 * (`CometChat.isOfflineEnabled()`) at each decision instead.
 */
export interface UIKitOfflineSettings {
  /** Turn offline messaging on. Default `false`. */
  enabled?: boolean;
  [option: string]: unknown;
}

export type UIKitSettings = {
  appId: string;
  region: string;
  authKey?: string;
  subscriptionType?: "NONE" | "ALL_USERS" | "ROLES" | "FRIENDS";
  autoEstablishSocketConnection?: boolean;
  overrideAdminHost?: string;
  overrideClientHost?: string;
  deviceToken?: string;
  googleApiKey?: string;
  disableCalling?: boolean;
  extensions?: ExtensionsDataSource[];
  roles?: string[];
  callingExtension?: CallingExtension;
  /**
   * Offline messaging (Chat SDK 4.2.1 or later). `true`, an options object, or an SDK
   * `OfflineConfig`. Absent ⇒ offline off and the kit behaves exactly as before. Ignored by an
   * SDK below 4.2.1, which the kit runs online only.
   */
  offline?: boolean | UIKitOfflineSettings | object;
};

export function UIKitSettings({
  appId = "xxxxxxxxxx",
  region = "xx",
  authKey = "xxxxxxxxxxxxxxxxxxxxx",
  subscriptionType,
  autoEstablishSocketConnection,
  overrideAdminHost,
  overrideClientHost,
  deviceToken,
  googleApiKey,
  disableCalling,
  extensions,
  roles,
  callingExtension,
  offline,
}: UIKitSettings): UIKitSettings {
  return {
    appId,
    region,
    authKey,
    subscriptionType,
    autoEstablishSocketConnection,
    overrideAdminHost,
    overrideClientHost,
    deviceToken,
    googleApiKey,
    disableCalling,
    extensions,
    roles,
    callingExtension,
    offline,
  };
}
