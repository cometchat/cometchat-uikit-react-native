
// A lightweight manager to hold a pending answered call
// when the app cold-starts (killed state) and navigation / login
// are not yet ready.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingAnsweredCallPayload {
  sessionId: string;
  raw: any; // original call object (voipHandler.msg)
  storedAt: number;
}

let inMemoryPending: PendingAnsweredCallPayload | null = null;
const STORAGE_KEY = 'pendingAnsweredCall';

export async function setPendingAnsweredCall(payload: PendingAnsweredCallPayload) {
  inMemoryPending = payload;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // non-fatal
    console.log('[PendingCallManager] Failed to persist pending call', e);
  }
}

export async function consumePendingAnsweredCall(): Promise<PendingAnsweredCallPayload | null> {
  if (inMemoryPending) {
    const tmp = inMemoryPending;
    inMemoryPending = null;
    try { await AsyncStorage.removeItem(STORAGE_KEY); } catch {}
    return tmp;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      const parsed: PendingAnsweredCallPayload = JSON.parse(raw);
      inMemoryPending = null;
      return parsed;
    }
  } catch (e) {
    console.log('[PendingCallManager] Failed to read pending call', e);
  }
  return null;
}

// Optionally prune stale pending calls (e.g., older than 2 minutes)
export function isPendingStale(p: PendingAnsweredCallPayload, maxAgeMs = 2 * 60 * 1000) {
  return Date.now() - p.storedAt > maxAgeMs;
}
