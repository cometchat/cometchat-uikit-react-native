import { useReducer, useEffect, useRef, useCallback, useMemo } from 'react';
import { NativeModules, Platform, PermissionsAndroid, Alert, Linking, NativeEventEmitter } from 'react-native';
import {
  RecorderAction,
  RecorderReducerState,
  UseAudioRecorderReturn,
  AudioSegment,
} from './types';

// Create event emitter for FileManager
const FileManagerEmitter = new NativeEventEmitter(NativeModules.FileManager);

/**
 * Initial state for the audio recorder reducer.
 * @validates Requirements 9.1, 11.7
 */
const initialState: RecorderReducerState = {
  state: 'idle',
  duration: 0,
  currentPosition: 0,
  filePath: null,
  error: null,
  amplitudes: [],
  segments: [],
  isPreviewMode: false,
};

/**
 * Reducer function for managing audio recorder state.
 * Implements predictable state management with valid state transitions.
 * 
 * @validates Requirements 9.1, 9.2, 9.5, 11.7
 */
function recorderReducer(
  state: RecorderReducerState,
  action: RecorderAction
): RecorderReducerState {
  switch (action.type) {
    case 'START_RECORDING':
      // Only allow starting recording from idle or error states
      if (state.state !== 'idle' && state.state !== 'error') return state;
      return {
        ...state,
        state: 'recording',
        error: null,
        amplitudes: [],
        duration: 0,
        currentPosition: 0,
        segments: [],
      };

    case 'PAUSE_RECORDING':
      if (state.state !== 'recording') return state;
      return {
        ...state,
        state: 'paused',
      };

    case 'RESUME_RECORDING':
      if (state.state !== 'paused') return state;
      return {
        ...state,
        state: 'recording',
      };

    case 'STOP_RECORDING':
      if (state.state !== 'recording' && state.state !== 'paused') return state;
      return {
        ...state,
        state: 'completed',
        filePath: action.filePath,
      };

    case 'START_PLAYBACK':
      if (state.state !== 'completed' && state.state !== 'paused') return state;
      return {
        ...state,
        state: 'playing',
        currentPosition: 0,
        isPreviewMode: state.state === 'paused', // Track if we started from paused (preview mode)
      };

    case 'PAUSE_PLAYBACK':
      if (state.state !== 'playing') return state;
      return {
        ...state,
        // Return to paused if we were in preview mode, otherwise completed
        state: state.isPreviewMode ? 'paused' : 'completed',
        isPreviewMode: false,
      };

    case 'RESUME_PLAYBACK':
      if (state.state !== 'completed') return state;
      return {
        ...state,
        state: 'playing',
        isPreviewMode: false,
      };

    case 'PLAYBACK_COMPLETE':
      if (state.state !== 'playing') return state;
      return {
        ...state,
        // Return to paused if we were in preview mode, otherwise completed
        state: state.isPreviewMode ? 'paused' : 'completed',
        currentPosition: state.duration,
        isPreviewMode: false,
      };

    case 'SEEK':
      return {
        ...state,
        currentPosition: action.position,
      };

    case 'UPDATE_DURATION':
      return {
        ...state,
        duration: action.duration,
      };

    case 'UPDATE_POSITION':
      return {
        ...state,
        currentPosition: action.position,
      };

    case 'ADD_AMPLITUDE':
      return {
        ...state,
        amplitudes: [...state.amplitudes, action.amplitude],
      };

    case 'SET_ERROR':
      return {
        ...state,
        state: 'error',
        error: action.error,
      };

    case 'RESET':
      return initialState;

    // Segment-related actions
    case 'FINALIZE_SEGMENT':
      return {
        ...state,
        segments: [...state.segments, action.segment],
      };

    case 'START_NEW_SEGMENT':
      return {
        ...state,
        state: 'recording',
      };

    case 'CLEAR_SEGMENTS':
      return {
        ...state,
        segments: [],
      };

    default:
      return state;
  }
}

/**
 * Custom hook for managing audio recording and playback.
 * Wraps the FileManager native module with React state management.
 * 
 * Features:
 * - State management with useReducer for predictable state transitions
 * - Duration timer that increments during recording
 * - Simulated amplitude generation for waveform visualization
 * - Cleanup on unmount to release native resources
 * 
 * @validates Requirements 9.1, 9.2, 9.3, 10.1, 10.5
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [reducerState, dispatch] = useReducer(recorderReducer, initialState);
  
  // Refs for timers and intervals
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const amplitudeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  
  // Seek operation tracking to prevent race conditions
  const seekOperationIdRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const seekDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeekRef = useRef<{ progress: number; operationId: number } | null>(null);
  
  // Debug: Track last requested seek position to detect unexpected resets
  const lastRequestedPositionRef = useRef<number>(0);
  const lastRequestedProgressRef = useRef<number>(0);

  /**
   * Cleanup function to release all native audio resources.
   * Called on unmount and when canceling recording.
   * 
   * @validates Requirements 10.5
   */
  const cleanup = useCallback(() => {
    // Clear all timers
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (amplitudeTimerRef.current) {
      clearInterval(amplitudeTimerRef.current);
      amplitudeTimerRef.current = null;
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (seekDebounceTimerRef.current) {
      clearTimeout(seekDebounceTimerRef.current);
      seekDebounceTimerRef.current = null;
    }

    // Release native resources
    NativeModules.FileManager.releaseMediaResources(() => {
      // Resources released
    });
  }, []);

  /**
   * Cleanup on unmount.
   * @validates Requirements 10.5
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  /**
   * Duration timer effect - increments duration during recording state.
   * Uses wall-clock time (Date.now()) for accurate duration tracking,
   * combined with a preserved offset for pause/resume support.
   * 
   * @validates Requirements 1.4, 3.1
   */
  const timerValueRef = useRef<number>(0);
  const segmentStartTimeRef = useRef<number>(0);
  /** Duration accumulated before the current active recording segment started. */
  const offsetAtSegmentStartRef = useRef<number>(0);
  /** Timestamp captured at the moment the user initiates a pause, before the async native call. */
  const pauseRequestedAtRef = useRef<number>(0);
  
  useEffect(() => {
    if (reducerState.state === 'recording') {
      // Capture wall-clock start and the offset accumulated so far
      segmentStartTimeRef.current = Date.now();
      offsetAtSegmentStartRef.current = timerValueRef.current;
      pauseRequestedAtRef.current = 0;

      // Tick every 500ms, compute elapsed from Date.now() for accuracy
      durationTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - segmentStartTimeRef.current;
        const totalMs = offsetAtSegmentStartRef.current + elapsed;
        timerValueRef.current = totalMs;
        dispatch({ type: 'UPDATE_DURATION', duration: totalMs });
      }, 500);
    } else if (reducerState.state === 'paused') {
      // Paused -> stop interval, snap to exact elapsed time
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (segmentStartTimeRef.current > 0) {
        // Use the timestamp from when pause was requested (before the async native call)
        // to avoid overcounting the time the native call took to complete.
        const pauseTime = pauseRequestedAtRef.current > 0
          ? pauseRequestedAtRef.current
          : Date.now();
        const elapsed = pauseTime - segmentStartTimeRef.current;
        timerValueRef.current = offsetAtSegmentStartRef.current + Math.max(0, elapsed);
        dispatch({ type: 'UPDATE_DURATION', duration: timerValueRef.current });
        segmentStartTimeRef.current = 0;
        pauseRequestedAtRef.current = 0;
      }
    } else if (reducerState.state === 'idle') {
      // Reset everything
      timerValueRef.current = 0;
      segmentStartTimeRef.current = 0;
      offsetAtSegmentStartRef.current = 0;
      pauseRequestedAtRef.current = 0;
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    } else {
      // For other states (completed, playing, error), just stop the interval
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [reducerState.state]);

  /**
   * Amplitude listening effect - receives real-time amplitude data from native module.
   * The native module streams audio amplitude values (0.0 to 1.0) during recording.
   * Uses WhatsApp-style amplitude processing for natural waveform visualization.
   * 
   * @validates Requirements 2.1, 2.5
   */
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    
    if (reducerState.state === 'recording') {
      // Listen for native amplitude events
      subscription = FileManagerEmitter.addListener('audioAmplitude', (event: { amplitude: number }) => {
        const amplitude = event.amplitude;
        
        // WhatsApp-style amplitude processing:
        // - Use the raw amplitude directly (already normalized 0-1 from native)
        // - Apply minimal amplification to make quiet sounds visible
        // - Keep the natural variation for authentic waveform look
        
        // Minimum floor so bars are always visible, max cap at 1.0
        // Use a gentler curve: sqrt for low values, linear for higher
        let visualAmplitude: number;
        if (amplitude < 0.05) {
          // Very quiet - show minimal bar
          visualAmplitude = 0.1 + amplitude * 2;
        } else if (amplitude < 0.3) {
          // Quiet to moderate - gentle boost
          visualAmplitude = 0.2 + amplitude * 1.5;
        } else {
          // Moderate to loud - mostly linear
          visualAmplitude = 0.35 + amplitude * 0.65;
        }
        
        // Clamp to valid range
        const clampedAmplitude = Math.max(0.1, Math.min(1.0, visualAmplitude));
        
        dispatch({ type: 'ADD_AMPLITUDE', amplitude: clampedAmplitude });
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [reducerState.state]);

  /**
   * Playback position timer effect - updates current position during playback.
   * Uses native getPlaybackPosition for accurate sync with actual audio playback.
   * Also updates duration from native to ensure waveform matches actual audio length.
   * Ignores position updates during active seeking to prevent race conditions.
   * 
   * @validates Requirements 4.3
   */
  useEffect(() => {
    let statusSubscription: { remove: () => void } | null = null;
    
    if (reducerState.state === 'playing') {
      // Listen for playback complete event from native
      statusSubscription = FileManagerEmitter.addListener('status', (event: { state: string }) => {
        // Ignore playback complete during seeking - it might be stale
        if (event.state === 'playbackComplete' && !isSeekingRef.current) {
          dispatch({ type: 'PLAYBACK_COMPLETE' });
          if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
          }
        }
      });
      
      // Poll native for actual playback position and duration
      playbackTimerRef.current = setInterval(() => {
        // Skip position updates during active seeking to prevent race conditions
        if (isSeekingRef.current) {
          return;
        }
        
        NativeModules.FileManager.getPlaybackPosition((result: string) => {
          // Double-check we're not seeking when the callback returns
          if (isSeekingRef.current) {
            return;
          }
          
          try {
            const response = JSON.parse(result);
            if (response.success && typeof response.position === 'number') {
              const position = response.position;
              const nativeDuration = response.duration;
              
              // Update duration from native if available and different
              // This ensures waveform matches actual audio length
              if (typeof nativeDuration === 'number' && nativeDuration > 0 && nativeDuration !== reducerState.duration) {
                dispatch({ type: 'UPDATE_DURATION', duration: nativeDuration });
              }
              
              // Use native duration for completion check if available
              const effectiveDuration = (typeof nativeDuration === 'number' && nativeDuration > 0) 
                ? nativeDuration 
                : reducerState.duration;
              
              // Check if playback is complete (only if not seeking)
              if (position >= effectiveDuration && !isSeekingRef.current) {
                dispatch({ type: 'PLAYBACK_COMPLETE' });
                if (playbackTimerRef.current) {
                  clearInterval(playbackTimerRef.current);
                  playbackTimerRef.current = null;
                }
              } else {
                dispatch({ type: 'UPDATE_POSITION', position });
              }
            }
          } catch (e) {
            // Fallback to time-based estimation if native call fails
          }
        });
      }, 100);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      if (statusSubscription) {
        statusSubscription.remove();
      }
    };
  }, [reducerState.state, reducerState.duration]);

  /**
   * Check and request microphone permission.
   * Reuses existing permission handling patterns from CometChatMediaRecorder.
   * 
   * @validates Requirements 10.4
   */
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS handles permission in native module
      return true;
    }

    // Android permission check
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );

    if (hasPermission) {
      return true;
    }

    // Request permission
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  /**
   * Show permission alert with option to open settings.
   */
  const showPermissionAlert = useCallback(() => {
    Alert.alert(
      '',
      'Microphone permission is required to record audio. Please enable it in settings.',
      [
        {
          style: 'cancel',
          text: 'Cancel',
        },
        {
          style: 'default',
          text: 'Settings',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ]
    );
  }, []);

  /**
   * Start recording audio.
   * Wraps FileManager.startRecording native call.
   * 
   * @validates Requirements 10.1
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const hasPermission = await checkMicrophonePermission();
      
      if (!hasPermission) {
        showPermissionAlert();
        dispatch({ type: 'SET_ERROR', error: 'Microphone permission denied' });
        return;
      }

      // Reset state for new recording
      pausedDurationRef.current = 0;
      recordingStartTimeRef.current = 0;
      // Reset timer value for new recording
      timerValueRef.current = 0;
      segmentStartTimeRef.current = 0;
      offsetAtSegmentStartRef.current = 0;
      pauseRequestedAtRef.current = 0;

      return new Promise((resolve, reject) => {
        NativeModules.FileManager.startRecording((result: string) => {
          try {
            const response = JSON.parse(result);
            
            if (response.granted === false) {
              showPermissionAlert();
              dispatch({ type: 'SET_ERROR', error: 'Microphone permission denied' });
              reject(new Error('Microphone permission denied'));
              return;
            }

            if (response.success === false) {
              dispatch({ type: 'SET_ERROR', error: response.error || 'Failed to start recording' });
              reject(new Error(response.error || 'Failed to start recording'));
              return;
            }

            dispatch({ type: 'START_RECORDING' });
            resolve();
          } catch (parseError) {
            // If parsing fails, assume success (some platforms return non-JSON)
            dispatch({ type: 'START_RECORDING' });
            resolve();
          }
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  }, [checkMicrophonePermission, showPermissionAlert, reducerState.state]);

  /**
   * Pause recording.
   * Wraps FileManager.finalizeSegment native call for segment-based recording.
   * This finalizes the current segment so it can be previewed.
   * Note: Android API < 24 does not support true pause.
   * 
   * @validates Requirements 10.1, 10.3, 11.1
   */
  const pauseRecording = useCallback(async (): Promise<void> => {
    if (reducerState.state !== 'recording') {
      return;
    }

    // Capture the exact moment pause was requested, before the async native call.
    // This prevents the timer from overcounting while the native call completes.
    pauseRequestedAtRef.current = Date.now();

    // Stop the duration timer immediately so it doesn't keep ticking
    // while the async native call completes.
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    try {
      // Save current amplitudes for this segment
      const currentAmplitudes = [...reducerState.amplitudes];
      const segmentDuration = reducerState.duration - getTotalSegmentsDuration();
      
      return new Promise((resolve, reject) => {
        NativeModules.FileManager.finalizeSegment((result: string) => {
          try {
            const response = JSON.parse(result);
            
            if (response.success === false) {
              // Fallback to legacy pause
              NativeModules.FileManager.pauseRecording()
                .then(() => {
                  pausedDurationRef.current = reducerState.duration;
                  dispatch({ type: 'PAUSE_RECORDING' });
                  resolve();
                })
                .catch((err: Error) => {
                  dispatch({ type: 'SET_ERROR', error: err.message });
                  reject(err);
                });
              return;
            }
            
            // Create segment from finalized recording
            const segment: AudioSegment = {
              id: `segment-${Date.now()}`,
              filePath: response.segmentPath,
              duration: segmentDuration > 0 ? segmentDuration : (response.duration * 1000) || 0,
              amplitudes: currentAmplitudes.slice(
                reducerState.segments.reduce((acc, s) => acc + s.amplitudes.length, 0)
              ),
              createdAt: Date.now(),
            };
            
            dispatch({ type: 'FINALIZE_SEGMENT', segment });
            pausedDurationRef.current = reducerState.duration;
            dispatch({ type: 'PAUSE_RECORDING' });
            resolve();
          } catch (parseError) {
            // Fallback to legacy pause
            NativeModules.FileManager.pauseRecording()
              .then(() => {
                pausedDurationRef.current = reducerState.duration;
                dispatch({ type: 'PAUSE_RECORDING' });
                resolve();
              })
              .catch((err: Error) => {
                dispatch({ type: 'SET_ERROR', error: err.message });
                reject(err);
              });
          }
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause recording';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  }, [reducerState.state, reducerState.duration, reducerState.amplitudes, reducerState.segments]);

  /**
   * Helper function to get total duration of all finalized segments.
   */
  const getTotalSegmentsDuration = useCallback((): number => {
    return reducerState.segments.reduce((acc, segment) => acc + segment.duration, 0);
  }, [reducerState.segments]);

  /**
   * Resume recording.
   * Wraps FileManager.resumeRecording native call.
   * 
   * @validates Requirements 10.1, 10.3
   */
  const resumeRecording = useCallback(async (): Promise<void> => {
    if (reducerState.state !== 'paused') {
      return;
    }

    try {
      await NativeModules.FileManager.resumeRecording();
      
      // Reset the recording start time for the new segment
      recordingStartTimeRef.current = Date.now();
      
      dispatch({ type: 'RESUME_RECORDING' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume recording';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  }, [reducerState.state]);

  /**
   * Continue recording by starting a new segment.
   * This is the WhatsApp-style flow: pause -> preview -> continue recording.
   * Creates a new audio file for the next segment.
   * 
   * @validates Requirements 11.2, 3.5
   */
  const continueRecording = useCallback(async (): Promise<void> => {
    if (reducerState.state !== 'paused') {
      return;
    }

    try {
      return new Promise((resolve, reject) => {
        NativeModules.FileManager.startNewSegment((result: string) => {
          try {
            const response = JSON.parse(result);
            
            if (response.success === false) {
              // Fallback to legacy resume
              NativeModules.FileManager.resumeRecording()
                .then(() => {
                  recordingStartTimeRef.current = Date.now();
                  dispatch({ type: 'RESUME_RECORDING' });
                  resolve();
                })
                .catch((err: Error) => {
                  dispatch({ type: 'SET_ERROR', error: err.message });
                  reject(err);
                });
              return;
            }
            
            // Reset the recording start time for the new segment
            recordingStartTimeRef.current = Date.now();
            
            dispatch({ type: 'START_NEW_SEGMENT' });
            resolve();
          } catch (parseError) {
            // Fallback to legacy resume
            NativeModules.FileManager.resumeRecording()
              .then(() => {
                recordingStartTimeRef.current = Date.now();
                dispatch({ type: 'RESUME_RECORDING' });
                resolve();
              })
              .catch((err: Error) => {
                dispatch({ type: 'SET_ERROR', error: err.message });
                reject(err);
              });
          }
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to continue recording';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  }, [reducerState.state, reducerState.segments.length]);

  /**
   * Stop recording and finalize all segments.
   * If multiple segments exist, merges them into a single audio file.
   * Wraps FileManager.releaseMediaResources and mergeSegments native calls.
   * 
   * @validates Requirements 10.1, 11.4
   */
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (reducerState.state !== 'recording' && reducerState.state !== 'paused') {
      return null;
    }

    // Calculate final duration before stopping
    let finalDuration = reducerState.duration;
    if (reducerState.state === 'recording' && recordingStartTimeRef.current > 0) {
      finalDuration = pausedDurationRef.current + (Date.now() - recordingStartTimeRef.current);
    }

    return new Promise((resolve) => {
      NativeModules.FileManager.releaseMediaResources((result: string) => {
        try {
          const response = JSON.parse(result);
          
          let filePath = response.file || response.path || null;
          
          // Check if we have multiple segments to merge
          const allSegmentPaths = [...reducerState.segments.map(s => s.filePath)];
          if (filePath && reducerState.state === 'recording') {
            // Add the current recording as the last segment
            allSegmentPaths.push(filePath);
          }
          
          if (allSegmentPaths.length > 1) {
            // Merge all segments
            NativeModules.FileManager.mergeSegments(allSegmentPaths, (mergeResult: string) => {
              try {
                const mergeResponse = JSON.parse(mergeResult);
                if (mergeResponse.success && mergeResponse.mergedPath) {
                  filePath = mergeResponse.mergedPath;
                }
              } catch (mergeParseError) {
                // Keep original filePath
              }
              
              finishStopRecording(filePath, finalDuration, response, resolve);
            });
          } else {
            finishStopRecording(filePath, finalDuration, response, resolve);
          }
        } catch (parseError) {
          dispatch({ type: 'SET_ERROR', error: 'Failed to parse recording result' });
          resolve(null);
        }
      });
    });
  }, [reducerState.state, reducerState.duration, reducerState.segments]);

  /**
   * Helper function to finish stop recording process.
   */
  const finishStopRecording = useCallback((
    filePath: string | null,
    finalDuration: number,
    response: { duration?: number },
    resolve: (value: string | null) => void
  ) => {
    if (filePath) {
      // Update duration from native if available (iOS provides this)
      if (response.duration && response.duration > 0) {
        const nativeDuration = response.duration * 1000;
        dispatch({ type: 'UPDATE_DURATION', duration: nativeDuration });
      } else {
        // Use our calculated duration
        dispatch({ type: 'UPDATE_DURATION', duration: finalDuration });
      }
      dispatch({ type: 'STOP_RECORDING', filePath });
      resolve(filePath);
    } else {
      dispatch({ type: 'SET_ERROR', error: 'No file path returned' });
      resolve(null);
    }
  }, []);

  /**
   * Start playback of recorded audio.
   * Wraps FileManager.playAudio native call.
   * 
   * @validates Requirements 10.1
   */
  const startPlayback = useCallback(async (): Promise<void> => {
    if (reducerState.state !== 'completed') {
      return;
    }

    if (!reducerState.filePath) {
      return;
    }

    return new Promise((resolve, reject) => {
      NativeModules.FileManager.playAudio((result: string) => {
        try {
          const response = JSON.parse(result);
          
          if (response.success === false) {
            dispatch({ type: 'SET_ERROR', error: response.error || 'Failed to start playback' });
            reject(new Error(response.error || 'Failed to start playback'));
            return;
          }

          // Reset tracking refs since we're starting from 0
          lastRequestedPositionRef.current = 0;
          lastRequestedProgressRef.current = 0;
          
          dispatch({ type: 'START_PLAYBACK' });
          resolve();
        } catch (parseError) {
          // Assume success if parsing fails
          dispatch({ type: 'START_PLAYBACK' });
          resolve();
        }
      });
    });
  }, [reducerState.state, reducerState.filePath]);

  /**
   * Start playback preview while paused.
   * Plays the finalized segments without stopping the recording session.
   * For multiple segments, merges them first for gapless playback.
   * This allows the user to preview what they've recorded while still being able to continue.
   * 
   * @validates Requirements 3.4, 4.1
   */
  const startPlaybackPreview = useCallback(async (): Promise<void> => {
    if (reducerState.state !== 'paused') {
      return;
    }

    // Get all segment paths to play
    const segmentPaths = reducerState.segments.map(s => s.filePath);

    if (segmentPaths.length === 0) {
      return;
    }

    // Reset tracking refs since we're starting from 0
    lastRequestedPositionRef.current = 0;
    lastRequestedProgressRef.current = 0;

    return new Promise((resolve, reject) => {
      if (segmentPaths.length === 1) {
        // Single segment - use playAudio directly with the segment path
        NativeModules.FileManager.playAudio((result: string) => {
          try {
            const response = JSON.parse(result);
            if (response.success === false) {
              dispatch({ type: 'SET_ERROR', error: response.error || 'Failed to start playback' });
              reject(new Error(response.error || 'Failed to start playback'));
              return;
            }
            dispatch({ type: 'START_PLAYBACK' });
            resolve();
          } catch (parseError) {
            dispatch({ type: 'START_PLAYBACK' });
            resolve();
          }
        });
      } else {
        // Multiple segments - merge first for gapless playback, then play
        NativeModules.FileManager.mergeSegments(segmentPaths, (mergeResult: string) => {
          try {
            const mergeResponse = JSON.parse(mergeResult);
            if (mergeResponse.success && mergeResponse.mergedPath) {
              // Play the merged file
              NativeModules.FileManager.playAudio((playResult: string) => {
                try {
                  const playResponse = JSON.parse(playResult);
                  if (playResponse.success === false) {
                    dispatch({ type: 'SET_ERROR', error: playResponse.error || 'Failed to start playback' });
                    reject(new Error(playResponse.error || 'Failed to start playback'));
                    return;
                  }
                  dispatch({ type: 'START_PLAYBACK' });
                  resolve();
                } catch (parseError) {
                  dispatch({ type: 'START_PLAYBACK' });
                  resolve();
                }
              });
            } else {
              // Fallback to sequential playback if merge fails
              NativeModules.FileManager.playSegments(segmentPaths, (result: string) => {
                try {
                  const response = JSON.parse(result);
                  if (response.success === false) {
                    dispatch({ type: 'SET_ERROR', error: response.error || 'Failed to start playback' });
                    reject(new Error(response.error || 'Failed to start playback'));
                    return;
                  }
                  dispatch({ type: 'START_PLAYBACK' });
                  resolve();
                } catch (parseError) {
                  dispatch({ type: 'START_PLAYBACK' });
                  resolve();
                }
              });
            }
          } catch (parseError) {
            // Fallback to sequential playback
            NativeModules.FileManager.playSegments(segmentPaths, (result: string) => {
              dispatch({ type: 'START_PLAYBACK' });
              resolve();
            });
          }
        });
      }
    });
  }, [reducerState.state, reducerState.segments]);

  /**
   * Pause playback.
   * Wraps FileManager.pausePlaying native call.
   * 
   * @validates Requirements 10.1
   */
  const pausePlayback = useCallback(async (): Promise<void> => {
    if (reducerState.state !== 'playing') {
      return;
    }

    return new Promise((resolve) => {
      NativeModules.FileManager.pausePlaying((result: string) => {
        dispatch({ type: 'PAUSE_PLAYBACK' });
        resolve();
      });
    });
  }, [reducerState.state]);

  /**
   * Resume playback.
   * Wraps FileManager.resumePlaying native call.
   * Now works on both iOS and Android for instant resume from paused position.
   * 
   * @validates Requirements 10.1
   */
  const resumePlayback = useCallback(async (): Promise<void> => {
    if (reducerState.state !== 'completed') {
      return;
    }

    return new Promise((resolve) => {
      // Both iOS and Android now support resumePlaying for instant resume
      NativeModules.FileManager.resumePlaying((result: string) => {
        dispatch({ type: 'RESUME_PLAYBACK' });
        resolve();
      });
    });
  }, [reducerState.state]);

  /**
   * Seek to a specific position in the recording.
   * Position is expressed as a progress value from 0.0 to 1.0.
   * Calls native seekTo for actual audio seeking during playback.
   * Uses debouncing and operation tracking to prevent race conditions.
   * 
   * @validates Requirements 5.1, 5.2, 5.3
   */
  const seekTo = useCallback(async (progress: number): Promise<void> => {
    // Clamp progress to valid range
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const position = Math.floor(clampedProgress * reducerState.duration);
    
    // Track last requested position for reset detection
    lastRequestedPositionRef.current = position;
    lastRequestedProgressRef.current = clampedProgress;
    
    // Increment operation ID to track this seek
    const operationId = ++seekOperationIdRef.current;
    isSeekingRef.current = true;
    
    // Update UI position immediately for smooth feedback
    dispatch({ type: 'SEEK', position });
    
    // If currently playing, debounce the native seek call
    if (reducerState.state === 'playing') {
      // Clear any pending debounced seek
      if (seekDebounceTimerRef.current) {
        clearTimeout(seekDebounceTimerRef.current);
      }
      
      // Store the pending seek
      pendingSeekRef.current = { progress: clampedProgress, operationId };
      
      // Debounce the actual native call by 100ms
      return new Promise((resolve) => {
        seekDebounceTimerRef.current = setTimeout(() => {
          // Check if this is still the latest seek operation
          if (operationId !== seekOperationIdRef.current) {
            resolve();
            return;
          }
          
          const finalPosition = Math.floor(clampedProgress * reducerState.duration);
          
          NativeModules.FileManager.seekTo(finalPosition, (result: string) => {
            // Only clear seeking flag if this is still the latest operation
            if (operationId === seekOperationIdRef.current) {
              // Clear seeking flag immediately since native has confirmed seek is complete
              isSeekingRef.current = false;
              pendingSeekRef.current = null;
            }
            resolve();
          });
        }, 100);
      });
    }
    
    // Not playing, just update position and clear seeking flag
    setTimeout(() => {
      if (operationId === seekOperationIdRef.current) {
        isSeekingRef.current = false;
      }
    }, 50);
  }, [reducerState.duration, reducerState.state]);

  /**
   * Seek and start playback from a specific position.
   * Used when tapping on waveform in preview/paused mode.
   * Uses debouncing and operation tracking to prevent race conditions.
   * 
   * @validates Requirements 5.1, 5.2
   */
  const seekAndPlay = useCallback(async (progress: number): Promise<void> => {
    // Clamp progress to valid range
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const position = Math.floor(clampedProgress * reducerState.duration);
    
    // Track last requested position for reset detection
    lastRequestedPositionRef.current = position;
    lastRequestedProgressRef.current = clampedProgress;
    
    // Increment operation ID to track this seek
    const operationId = ++seekOperationIdRef.current;
    isSeekingRef.current = true;
    
    // Update UI position immediately
    dispatch({ type: 'SEEK', position });
    
    // Clear any pending debounced seek
    if (seekDebounceTimerRef.current) {
      clearTimeout(seekDebounceTimerRef.current);
      seekDebounceTimerRef.current = null;
    }
    
    // For single segment in completed state, use playFromPosition with debouncing
    if (reducerState.state === 'completed' && reducerState.filePath) {
      // Store the pending seek
      pendingSeekRef.current = { progress: clampedProgress, operationId };
      
      return new Promise((resolve, reject) => {
        // Debounce by 150ms to allow rapid taps to settle
        seekDebounceTimerRef.current = setTimeout(() => {
          // Check if this is still the latest seek operation
          if (operationId !== seekOperationIdRef.current) {
            isSeekingRef.current = false;
            resolve();
            return;
          }
          
          const finalPosition = Math.floor(clampedProgress * reducerState.duration);
          
          NativeModules.FileManager.playFromPosition(finalPosition, (result: string) => {
            // Check if this is still the latest operation before updating state
            if (operationId !== seekOperationIdRef.current) {
              resolve();
              return;
            }
            
            try {
              const response = JSON.parse(result);
              if (response.success) {
                dispatch({ type: 'START_PLAYBACK' });
                // Clear seeking flag immediately since native has confirmed seek is complete
                isSeekingRef.current = false;
                pendingSeekRef.current = null;
                resolve();
              } else {
                isSeekingRef.current = false;
                pendingSeekRef.current = null;
                reject(new Error(response.error));
              }
            } catch (e) {
              dispatch({ type: 'START_PLAYBACK' });
              isSeekingRef.current = false;
              pendingSeekRef.current = null;
              resolve();
            }
          });
        }, 150);
      });
    }
    
    // For preview mode (paused with segments), merge segments first then play from position
    if (reducerState.state === 'paused' && reducerState.segments.length > 0) {
      const segmentPaths = reducerState.segments.map(s => s.filePath);
      const finalPosition = Math.floor(clampedProgress * reducerState.duration);
      
      // Store the pending seek
      pendingSeekRef.current = { progress: clampedProgress, operationId };
      
      return new Promise((resolve, reject) => {
        // Debounce by 150ms to allow rapid taps to settle
        seekDebounceTimerRef.current = setTimeout(() => {
          // Check if this is still the latest seek operation
          if (operationId !== seekOperationIdRef.current) {
            isSeekingRef.current = false;
            resolve();
            return;
          }
          
          const seekPosition = Math.floor(clampedProgress * reducerState.duration);
          
          if (segmentPaths.length === 1) {
            // Single segment - play directly from position
            NativeModules.FileManager.playFromPosition(seekPosition, (result: string) => {
              if (operationId !== seekOperationIdRef.current) {
                resolve();
                return;
              }
              try {
                const response = JSON.parse(result);
                if (response.success) {
                  dispatch({ type: 'START_PLAYBACK' });
                  // Clear seeking flag immediately since native has confirmed seek is complete
                  isSeekingRef.current = false;
                  pendingSeekRef.current = null;
                  resolve();
                } else {
                  isSeekingRef.current = false;
                  pendingSeekRef.current = null;
                  reject(new Error(response.error));
                }
              } catch (e) {
                dispatch({ type: 'START_PLAYBACK' });
                isSeekingRef.current = false;
                pendingSeekRef.current = null;
                resolve();
              }
            });
          } else {
            // Multiple segments - merge first, then play from position
            NativeModules.FileManager.mergeSegments(segmentPaths, (mergeResult: string) => {
              if (operationId !== seekOperationIdRef.current) {
                resolve();
                return;
              }
              try {
                const mergeResponse = JSON.parse(mergeResult);
                if (mergeResponse.success && mergeResponse.mergedPath) {
                  // Now play from the requested position
                  NativeModules.FileManager.playFromPosition(seekPosition, (playResult: string) => {
                    if (operationId !== seekOperationIdRef.current) {
                      resolve();
                      return;
                    }
                    try {
                      const playResponse = JSON.parse(playResult);
                      if (playResponse.success) {
                        dispatch({ type: 'START_PLAYBACK' });
                        // Clear seeking flag immediately since native has confirmed seek is complete
                        isSeekingRef.current = false;
                        pendingSeekRef.current = null;
                        resolve();
                      } else {
                        isSeekingRef.current = false;
                        pendingSeekRef.current = null;
                        reject(new Error(playResponse.error));
                      }
                    } catch (e) {
                      dispatch({ type: 'START_PLAYBACK' });
                      isSeekingRef.current = false;
                      pendingSeekRef.current = null;
                      resolve();
                    }
                  });
                } else {
                  // Merge failed, fall back to starting from beginning
                  isSeekingRef.current = false;
                  pendingSeekRef.current = null;
                  // Reset the last requested position since we're starting from 0
                  lastRequestedPositionRef.current = 0;
                  lastRequestedProgressRef.current = 0;
                  NativeModules.FileManager.playSegments(segmentPaths, (result: string) => {
                    dispatch({ type: 'START_PLAYBACK' });
                    resolve();
                  });
                }
              } catch (e) {
                // Merge parse error, fall back to starting from beginning
                isSeekingRef.current = false;
                pendingSeekRef.current = null;
                lastRequestedPositionRef.current = 0;
                lastRequestedProgressRef.current = 0;
                NativeModules.FileManager.playSegments(segmentPaths, (result: string) => {
                  dispatch({ type: 'START_PLAYBACK' });
                  resolve();
                });
              }
            });
          }
        }, 150);
      });
    }
    
    // Clear seeking flag for other cases
    isSeekingRef.current = false;
    pendingSeekRef.current = null;
  }, [reducerState.state, reducerState.duration, reducerState.filePath, reducerState.segments]);

  /**
   * Cancel recording and cleanup all resources.
   * Deletes all segment files and releases native resources.
   * 
   * @validates Requirements 7.2, 7.4, 10.5, 11.5
   */
  const cancel = useCallback(async (): Promise<void> => {
    // Clear all timers
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (amplitudeTimerRef.current) {
      clearInterval(amplitudeTimerRef.current);
      amplitudeTimerRef.current = null;
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (seekDebounceTimerRef.current) {
      clearTimeout(seekDebounceTimerRef.current);
      seekDebounceTimerRef.current = null;
    }

    // Reset refs
    pausedDurationRef.current = 0;
    recordingStartTimeRef.current = 0;
    timerValueRef.current = 0;
    segmentStartTimeRef.current = 0;
    offsetAtSegmentStartRef.current = 0;
    pauseRequestedAtRef.current = 0;
    seekOperationIdRef.current = 0;
    isSeekingRef.current = false;
    pendingSeekRef.current = null;
    lastRequestedPositionRef.current = 0;
    lastRequestedProgressRef.current = 0;

    // Delete all segment files if any
    const segmentPaths = reducerState.segments.map(s => s.filePath);
    if (segmentPaths.length > 0) {
      return new Promise((resolve) => {
        NativeModules.FileManager.deleteSegments(segmentPaths, (deleteSegmentsResult: string) => {
          // Also delete the main file and release resources
          NativeModules.FileManager.deleteFile((deleteResult: string) => {
            NativeModules.FileManager.releaseMediaResources((releaseResult: string) => {
              dispatch({ type: 'CLEAR_SEGMENTS' });
              dispatch({ type: 'RESET' });
              resolve();
            });
          });
        });
      });
    }

    // No segments, just delete the main file
    return new Promise((resolve) => {
      NativeModules.FileManager.deleteFile((deleteResult: string) => {
        // Release media resources
        NativeModules.FileManager.releaseMediaResources((releaseResult: string) => {
          dispatch({ type: 'RESET' });
          resolve();
        });
      });
    });
  }, [reducerState.state, reducerState.filePath, reducerState.segments]);

  /**
   * Computed properties for state checks.
   * @validates Requirements 9.3, 11.7
   */
  const isRecording = useMemo(() => reducerState.state === 'recording', [reducerState.state]);
  const isPaused = useMemo(() => reducerState.state === 'paused', [reducerState.state]);
  const isPlaying = useMemo(() => reducerState.state === 'playing', [reducerState.state]);
  const isCompleted = useMemo(() => reducerState.state === 'completed', [reducerState.state]);
  const hasRecording = useMemo(() => reducerState.duration > 0, [reducerState.duration]);
  const hasMultipleSegments = useMemo(() => reducerState.segments.length > 1, [reducerState.segments.length]);
  const canContinueRecording = useMemo(() => reducerState.state === 'paused', [reducerState.state]);

  return {
    // State
    state: reducerState.state,
    duration: reducerState.duration,
    currentPosition: reducerState.currentPosition,
    filePath: reducerState.filePath,
    error: reducerState.error,
    amplitudes: reducerState.amplitudes,
    segments: reducerState.segments,
    hasMultipleSegments,

    // Actions
    startRecording,
    pauseRecording,
    resumeRecording,
    continueRecording,
    stopRecording,
    startPlayback,
    startPlaybackPreview,
    pausePlayback,
    resumePlayback,
    seekTo,
    seekAndPlay,
    cancel,

    // Computed properties
    isRecording,
    isPaused,
    isPlaying,
    isCompleted,
    hasRecording,
    canContinueRecording,
  };
}
