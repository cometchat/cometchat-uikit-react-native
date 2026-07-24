/**
 * Cross-bubble audio coordinator — makes audio playback behave like WhatsApp: only ONE clip
 * plays at a time, and starting/resuming a clip pauses whatever else was playing AT ITS CURRENT
 * POSITION (so it can be resumed from where it left off), across BOTH the recorded voice-note
 * bubble and the shared/gallery audio bubble.
 *
 * The native SoundPlayer is a single instance, so it physically plays one clip; this coordinator
 * keeps every bubble's UI in sync with that reality. A bubble that is about to (re)play announces
 * its url; every other bubble reacts by pausing-in-place. Announce runs synchronously BEFORE the
 * native play() call, so the others are already paused when the native stop/replace happens.
 */
type Listener = (activeUrl: string) => void;

const listeners = new Set<Listener>();

export const audioPlaybackCoordinator = {
  /** Subscribe a bubble; returns an unsubscribe fn. */
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  /** Announce that `activeUrl` is (re)starting — every OTHER bubble pauses in place. */
  announcePlay(activeUrl: string): void {
    listeners.forEach((fn) => fn(activeUrl));
  },
};
