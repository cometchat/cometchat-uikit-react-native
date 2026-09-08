/**
 * Server-owned gates for Pin Message, Save Message and Pin Conversation.
 *
 * WHY THIS IS IN THE KIT: these three are not integrator preferences, they are app settings —
 * the server decides whether the plan has them and, for pin-conversation, whether ops has mapped
 * the flag for that app at all. Until now the kit shipped the switches (PinSaveConfig,
 * PinConversationConfig) but never asked the server, so every integrator had to know to do it
 * themselves. The sample app did; nobody else would. The two failure modes both look like bugs:
 * leave them off and the features silently never appear, or hardcode them on and the options
 * render on an app whose flag is unmapped, where every tap toasts "this feature isn't available".
 *
 * The kit already owns exactly this kind of state for conversation update settings — fetched on
 * login and re-fetched on every reconnection so a dashboard change lands without a restart. This
 * follows that precedent rather than inventing a second pattern, and mirrors what the React UI Kit
 * does in its own `pinSaveFeatures` module.
 *
 * Thread subscription is deliberately NOT here: no server flag exists for it in the SDK, so it
 * stays a genuine integrator opt-in via ThreadSubscriptionConfig.
 *
 * @module PinSaveFeatureGates
 */
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { PinSaveConfig } from "./PinSaveHelper";
import { PinConversationConfig } from "./PinConversationHelper";

/** Resolved state of the three server flags. */
export interface PinSaveFeatureFlags {
  pinMessage: boolean;
  saveMessage: boolean;
  pinConversation: boolean;
}

/**
 * Everything off — the value before resolution completes, and after any failure.
 *
 * Off is the safe direction: a hidden option is a missing feature, a shown one the server refuses
 * is a broken feature. Only the second generates support tickets.
 */
export const PIN_SAVE_FEATURES_DISABLED: PinSaveFeatureFlags = Object.freeze({
  pinMessage: false,
  saveMessage: false,
  pinConversation: false,
});

let cached: PinSaveFeatureFlags | null = null;
let inFlight: Promise<PinSaveFeatureFlags> | null = null;
/**
 * Bumped by reset(). A resolution records the epoch it started under and only commits if that
 * epoch is still current, so a logout→login fast enough to overlap an in-flight read cannot have
 * the older result land last and apply the previous app's flags to the new session.
 */
let epoch = 0;

type FlagMethod =
  | "isPinMessageEnabled"
  | "isSaveMessageEnabled"
  | "isPinConversationEnabled";

/**
 * Ask the SDK for one flag, treating every failure as "off".
 *
 * The typeof check is not defensive noise: these methods ship with the pin/save SDK, and a kit
 * running against an older build would otherwise throw on a missing function rather than simply
 * not offering the feature.
 */
const resolveFlag = async (name: FlagMethod): Promise<boolean> => {
  const fn = (CometChat as unknown as Record<string, unknown>)[name];
  if (typeof fn !== "function") return false;
  try {
    return !!(await (fn as () => Promise<boolean>).call(CometChat));
  } catch {
    return false;
  }
};

/** Push resolved flags into the switches the components actually read. */
const applyToConfigs = (flags: PinSaveFeatureFlags): void => {
  PinSaveConfig.enablePin(flags.pinMessage);
  PinSaveConfig.enableSave(flags.saveMessage);
  PinConversationConfig.enable(flags.pinConversation);
};

/**
 * Resolve all three flags and apply them, asking the SDK at most once per session.
 *
 * Concurrent callers share the in-flight promise — several components mounting at once resolve
 * together rather than firing three reads each.
 */
export async function resolvePinSaveFeatures(): Promise<PinSaveFeatureFlags> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  const startedAt = epoch;
  inFlight = Promise.all([
    resolveFlag("isPinMessageEnabled"),
    resolveFlag("isSaveMessageEnabled"),
    resolveFlag("isPinConversationEnabled"),
  ])
    .then(([pinMessage, saveMessage, pinConversation]) => {
      const resolved: PinSaveFeatureFlags = { pinMessage, saveMessage, pinConversation };
      if (startedAt === epoch) {
        cached = resolved;
        applyToConfigs(resolved);
      }
      return cached ?? resolved;
    })
    .catch(() => PIN_SAVE_FEATURES_DISABLED)
    .finally(() => {
      if (startedAt === epoch) inFlight = null;
    });

  return inFlight;
}

/**
 * Re-read the flags mid-session, for a reconnection.
 *
 * Deliberately does NOT clear the applied values first. Clearing then re-reading would leave a
 * window where the options vanish and come back, which looks like a glitch; the previous answer
 * stays in force until a newer one actually arrives.
 */
/**
 * Pull the app settings from the SERVER, replacing the SDK's cached copy.
 *
 * The SDK reads settings through a cache that is populated once and only re-fetched when it
 * is empty, so everything derived from it — the three feature flags AND the pin/save caps —
 * is frozen at whatever the app was configured with when this session logged in. The public
 * `getAppSettings()` is the one call that goes to the network and writes that cache back.
 *
 * Guarded on the method existing: an older SDK build must degrade to the stale-but-working
 * behaviour rather than throwing inside a reconnect handler.
 */
const refreshAppSettings = async (): Promise<void> => {
  const fetchSettings = (CometChat as unknown as Record<string, unknown>).getAppSettings;
  if (typeof fetchSettings !== "function") return;
  try {
    await (fetchSettings as () => Promise<unknown>).call(CometChat);
  } catch {
    // Offline, or the endpoint refused. The cached settings stay in place, which is exactly
    // the behaviour this function is improving on — never worse than not having tried.
  }
};

/**
 * Re-ask the server, discarding everything already known.
 *
 * Refreshes the app settings FIRST (ENG-38180). Without that this only re-read the SDK's
 * cache and could never return a different answer than the last resolution — a flag or a cap
 * changed in the dashboard reached the client only after a full logout and login.
 *
 * The caps ride along for free: `getPinMessageLimit()` / `getSaveMessageLimit()` read the
 * same cache, so once it is refreshed the "you can only pin N messages" toast starts quoting
 * the current N. That is why the limit is NOT refreshed on the error path itself — doing it
 * here means the number is already correct by the time anything needs to print it, with no
 * network round trip standing between the user's tap and the toast.
 */
export async function refreshPinSaveFeatures(): Promise<PinSaveFeatureFlags> {
  await refreshAppSettings();
  cached = null;
  inFlight = null;
  return resolvePinSaveFeatures();
}

/** Last resolved flags. Everything-off until the first resolution lands. */
export function getPinSaveFeatures(): PinSaveFeatureFlags {
  return cached ?? PIN_SAVE_FEATURES_DISABLED;
}

/**
 * Drop the cache and turn the switches off. Called on logout: flags are per-app, and the next
 * login may be a different app entirely, so carrying them over would be worse than re-asking.
 */
export function resetPinSaveFeatures(): void {
  cached = null;
  inFlight = null;
  epoch++;
  applyToConfigs(PIN_SAVE_FEATURES_DISABLED);
}
