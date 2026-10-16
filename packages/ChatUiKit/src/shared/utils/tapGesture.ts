import { GestureResponderEvent } from 'react-native';

// Same tolerances as React Native's Pressability: a touch is still a tap within 10pt of where it started.
export const TAP_SLOP = 10;
// A longer hold is a long-press (the bubble's message options), not a tap.
export const TAP_MAX_MS = 500;

export interface TouchStart {
  x: number;
  y: number;
  at: number;
}

export const touchStartOf = (e: GestureResponderEvent, now = Date.now()): TouchStart => ({
  x: e.nativeEvent.pageX,
  y: e.nativeEvent.pageY,
  at: now,
});

export const movedBeyondSlop = (start: TouchStart, e: GestureResponderEvent): boolean =>
  Math.abs(e.nativeEvent.pageX - start.x) > TAP_SLOP || Math.abs(e.nativeEvent.pageY - start.y) > TAP_SLOP;

export const isTapDuration = (start: TouchStart, now = Date.now()): boolean => now - start.at < TAP_MAX_MS;
