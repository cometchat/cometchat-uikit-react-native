/**
 * CometChatInlineAudioRecorder - Public Exports
 * 
 * This module exports the inline audio recorder component and its associated types
 * for use in the CometChat React Native UI Kit.
 * 
 * @validates Requirements 8.3
 */

// Main component exports
export { CometChatInlineAudioRecorder, formatDuration } from './CometChatInlineAudioRecorder';
export { default } from './CometChatInlineAudioRecorder';

// Type exports
export type {
  CometChatInlineAudioRecorderProps,
  CometChatInlineAudioRecorderStyle,
  AudioWaveformVisualizerProps,
  WaveformStyle,
  ButtonStyle,
  RecorderState,
  UseAudioRecorderReturn,
} from './types';

// Style exports
export {
  getInlineAudioRecorderStyle,
  getInlineAudioRecorderStyleLight,
  getInlineAudioRecorderStyleDark,
} from './style';

// Internal component exports (for advanced usage)
export { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
export { useAudioRecorder } from './useAudioRecorder';
