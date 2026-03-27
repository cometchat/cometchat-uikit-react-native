import { ImageSourcePropType, ImageStyle, TextStyle, ViewStyle } from "react-native";
import { JSX } from "react";

/**
 * RecorderState union type representing all possible states of the inline audio recorder.
 * 
 * States:
 * - idle: Initial state, no recording in progress
 * - recording: Actively recording audio
 * - paused: Recording is paused, can be resumed
 * - completed: Recording finished, ready for playback or send
 * - playing: Playing back the recorded audio
 * - error: An error occurred during recording or playback
 * 
 * @validates Requirements 9.1
 */
export type RecorderState = 
  | 'idle'
  | 'recording'
  | 'paused'
  | 'completed'
  | 'playing'
  | 'error';

/**
 * Represents a single audio segment in segment-based recording.
 * Each segment is a separate audio file that can be previewed and merged.
 * 
 * @validates Requirements 11.7
 */
export interface AudioSegment {
  /** Unique identifier for the segment */
  id: string;
  /** File path to the segment audio file */
  filePath: string;
  /** Duration of this segment in milliseconds */
  duration: number;
  /** Amplitude values recorded during this segment */
  amplitudes: number[];
  /** Timestamp when segment was created */
  createdAt: number;
}

/**
 * State for managing multiple audio segments.
 * Used for WhatsApp-style preview-while-paused functionality.
 * 
 * @validates Requirements 11.7
 */
export interface SegmentManagerState {
  /** List of all recorded segments */
  segments: AudioSegment[];
  /** Currently recording segment (null if not recording) */
  currentSegment: AudioSegment | null;
  /** Total duration across all segments */
  totalDuration: number;
  /** Combined amplitudes from all segments for waveform display */
  allAmplitudes: number[];
}

/**
 * Style configuration for individual buttons in the recorder.
 * 
 * @validates Requirements 8.3
 */
export interface ButtonStyle {
  /** Icon tint color */
  iconColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Icon size */
  iconSize?: number;
  /** Custom icon */
  icon?: JSX.Element | ImageSourcePropType;
  /** Icon image style */
  iconStyle?: ImageStyle;
  /** Container style */
  containerStyle?: ViewStyle;
}

/**
 * Style configuration for the waveform visualizer.
 * 
 * @validates Requirements 8.3
 */
export interface WaveformStyle {
  /** Color for bars during recording */
  recordingBarColor?: string;
  /** Color for played portion during playback */
  playedBarColor?: string;
  /** Color for unplayed portion during playback */
  unplayedBarColor?: string;
  /** Width of each bar */
  barWidth?: number;
  /** Spacing between bars */
  barSpacing?: number;
  /** Minimum bar height */
  minBarHeight?: number;
  /** Maximum bar height */
  maxBarHeight?: number;
  /** Container height */
  height?: number;
  /** Container style */
  containerStyle?: ViewStyle;
}

/**
 * Style configuration for the CometChatInlineAudioRecorder component.
 * Supports theming through CometChatThemeHelper for default styling.
 * 
 * @validates Requirements 8.3, 8.4
 */
export interface CometChatInlineAudioRecorderStyle {
  /** Container background color */
  backgroundColor?: string;
  /** Container border style */
  border?: ViewStyle;
  /** Container border radius */
  borderRadius?: number;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Waveform style configuration */
  waveformStyle?: WaveformStyle;
  /** Duration text style */
  durationTextStyle?: TextStyle;
  /** Delete button style */
  deleteButtonStyle?: ButtonStyle;
  /** Send button style */
  sendButtonStyle?: ButtonStyle;
  /** Record/Play button style */
  recordPlayButtonStyle?: ButtonStyle;
  /** Pause button style */
  pauseButtonStyle?: ButtonStyle;
  /** Mic button style */
  micButtonStyle?: ButtonStyle;
  /** Recording indicator color (red pulsing dot) */
  recordingIndicatorColor?: string;
}

/**
 * Props for the AudioWaveformVisualizer component.
 * Displays animated waveform bars during recording and playback.
 * 
 * @validates Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 4.2, 5.1, 5.2, 5.3, 5.5
 */
export interface AudioWaveformVisualizerProps {
  /** Whether waveform should animate (during recording) */
  isAnimating: boolean;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Playback progress (0.0 to 1.0) */
  playbackProgress: number;
  /** Amplitude values for visualization */
  amplitudes: number[];
  /** Callback when user taps/drags to seek (called on release) */
  onSeek?: (progress: number) => void;
  /** Callback when user starts dragging (for smooth UI updates) */
  onSeekStart?: (progress: number) => void;
  /** Callback when user finishes dragging (for smooth UI updates) */
  onSeekEnd?: (progress: number) => void;
  /** Whether seeking is allowed (disabled during recording) */
  allowSeeking: boolean;
  /** Style configuration */
  style?: WaveformStyle;
}

/**
 * Props for the CometChatInlineAudioRecorder component.
 * Main component that orchestrates the inline recording experience.
 * 
 * @validates Requirements 1.1, 1.2, 1.5, 3.2, 6.1, 6.2, 7.1, 7.3, 8.2, 8.3, 8.5
 */
export interface CometChatInlineAudioRecorderProps {
  /** Callback when user sends the recorded audio */
  onSubmit: (filePath: string) => void;
  /** Callback when user cancels/deletes the recording */
  onCancel: () => void;
  /** Custom style configuration */
  style?: CometChatInlineAudioRecorderStyle;
  /** Custom delete button icon */
  deleteIcon?: JSX.Element | ImageSourcePropType;
  /** Custom send button icon */
  sendIcon?: JSX.Element | ImageSourcePropType;
  /** Custom record/play button icon */
  recordIcon?: JSX.Element | ImageSourcePropType;
  /** Custom pause button icon */
  pauseIcon?: JSX.Element | ImageSourcePropType;
  /** Custom mic button icon */
  micIcon?: JSX.Element | ImageSourcePropType;
  /** Custom play button icon */
  playIcon?: JSX.Element | ImageSourcePropType;
}

/**
 * Return type for the useAudioRecorder custom hook.
 * Encapsulates all recording logic and native module interaction.
 * 
 * @validates Requirements 9.1, 9.2, 9.3, 10.1, 10.5, 11.7
 */
export interface UseAudioRecorderReturn {
  /** Current recorder state */
  state: RecorderState;
  /** Current recording/playback duration in milliseconds */
  duration: number;
  /** Current playback position in milliseconds */
  currentPosition: number;
  /** Recorded file path (available after recording stops) */
  filePath: string | null;
  /** Error message if any */
  error: string | null;
  /** Amplitude values for waveform visualization */
  amplitudes: number[];
  /** List of recorded segments */
  segments: AudioSegment[];
  /** Whether there are multiple segments (user has paused and continued) */
  hasMultipleSegments: boolean;
  /** Start recording */
  startRecording: () => Promise<void>;
  /** Pause recording (finalizes current segment for preview) */
  pauseRecording: () => Promise<void>;
  /** Resume recording (legacy - use continueRecording for segment-based) */
  resumeRecording: () => Promise<void>;
  /** Continue recording (starts new segment after pause) */
  continueRecording: () => Promise<void>;
  /** Stop recording and finalize all segments */
  stopRecording: () => Promise<string | null>;
  /** Start playback of all segments */
  startPlayback: () => Promise<void>;
  /** Start playback preview while paused (plays segments without stopping recording) */
  startPlaybackPreview: () => Promise<void>;
  /** Pause playback */
  pausePlayback: () => Promise<void>;
  /** Resume playback */
  resumePlayback: () => Promise<void>;
  /** Seek to position (0.0 to 1.0) */
  seekTo: (progress: number) => Promise<void>;
  /** Seek to position and start playback (for waveform tap) */
  seekAndPlay: (progress: number) => Promise<void>;
  /** Cancel and cleanup all segments */
  cancel: () => Promise<void>;
  /** Computed state check: is currently recording */
  isRecording: boolean;
  /** Computed state check: is currently paused */
  isPaused: boolean;
  /** Computed state check: is currently playing */
  isPlaying: boolean;
  /** Computed state check: recording is completed */
  isCompleted: boolean;
  /** Computed state check: has a recording (duration > 0) */
  hasRecording: boolean;
  /** Can continue recording (in paused state) */
  canContinueRecording: boolean;
}

/**
 * Action types for the useAudioRecorder reducer.
 * Used for predictable state management across child components.
 * 
 * @validates Requirements 9.5, 11.7
 */
export type RecorderAction =
  | { type: 'START_RECORDING' }
  | { type: 'PAUSE_RECORDING' }
  | { type: 'RESUME_RECORDING' }
  | { type: 'STOP_RECORDING'; filePath: string }
  | { type: 'START_PLAYBACK' }
  | { type: 'PAUSE_PLAYBACK' }
  | { type: 'RESUME_PLAYBACK' }
  | { type: 'PLAYBACK_COMPLETE' }
  | { type: 'SEEK'; position: number }
  | { type: 'UPDATE_DURATION'; duration: number }
  | { type: 'UPDATE_POSITION'; position: number }
  | { type: 'ADD_AMPLITUDE'; amplitude: number }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' }
  // Segment-related actions
  | { type: 'FINALIZE_SEGMENT'; segment: AudioSegment }
  | { type: 'START_NEW_SEGMENT' }
  | { type: 'CLEAR_SEGMENTS' };

/**
 * State shape for the useAudioRecorder reducer.
 * 
 * @validates Requirements 9.1, 9.3, 11.7
 */
export interface RecorderReducerState {
  /** Current recorder state */
  state: RecorderState;
  /** Current recording/playback duration in milliseconds */
  duration: number;
  /** Current playback position in milliseconds */
  currentPosition: number;
  /** Recorded file path */
  filePath: string | null;
  /** Error message if any */
  error: string | null;
  /** Amplitude values for waveform visualization */
  amplitudes: number[];
  /** List of recorded segments */
  segments: AudioSegment[];
  /** Whether we're in preview mode (playing from paused state) */
  isPreviewMode?: boolean;
}
