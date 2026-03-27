import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme';
import { Icon } from '../../icons/Icon';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { useAudioRecorder } from './useAudioRecorder';
import { getInlineAudioRecorderStyle } from './style';
import {
  CometChatInlineAudioRecorderProps,
} from './types';

/**
 * Formats duration in milliseconds to MM:SS format.
 * 
 * @param durationMs - Duration in milliseconds
 * @returns Formatted string in MM:SS format
 * @validates Requirements 1.4, 4.3
 */
export function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return '00:00';
  }
  
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  
  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * CometChatInlineAudioRecorder component provides an inline audio recording
 * experience within the message composer area.
 * 
 * Features:
 * - UI Layout: Delete | Record/Play | Waveform | Duration | Pause/Mic | Send
 * - Red pulsing dot indicator during active recording
 * - Waveform visualization with amplitude bars
 * - Duration display in MM:SS format
 * - Button state logic based on recorder state
 * 
 * @validates Requirements 1.1, 1.2, 1.5, 3.2, 8.2
 */
export const CometChatInlineAudioRecorder: React.FC<CometChatInlineAudioRecorderProps> = ({
  onSubmit,
  onCancel,
  style,
  deleteIcon,
  sendIcon,
  recordIcon,
  pauseIcon,
  micIcon,
  playIcon,
}) => {
  const theme = useTheme();
  const recorder = useAudioRecorder();
  
  // Animation value for the pulsing recording indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Local state for smooth drag feedback - updates immediately without waiting for native
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  
  // Merge styles with defaults using the style.ts function
  // Uses CometChatThemeHelper pattern for default colors
  const mergedStyle = useMemo(() => {
    return getInlineAudioRecorderStyle(
      theme.color,
      theme.spacing,
      theme.typography,
      style
    );
  }, [theme, style]);

  // Start recording automatically when component mounts
  useEffect(() => {
    recorder.startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pulsing animation for recording indicator
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (recorder.isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [recorder.isRecording, pulseAnim]);

  /**
   * Handle delete button press.
   * Cancels recording and calls onCancel callback.
   * @validates Requirements 7.1, 7.3
   */
  const handleDelete = useCallback(async () => {
    await recorder.cancel();
    onCancel();
  }, [recorder, onCancel]);

  /**
   * Handle send button press.
   * Stops any active recording or playback and sends the audio file.
   * @validates Requirements 6.1, 6.2
   */
  const handleSend = useCallback(async () => {
    let filePath = recorder.filePath;
    
    // Stop playback if currently playing
    if (recorder.isPlaying) {
      await recorder.pausePlayback();
    }
    
    // If still recording or paused (recording paused), stop recording first
    if (recorder.isRecording || recorder.isPaused) {
      filePath = await recorder.stopRecording();
    }
    
    if (filePath) {
      onSubmit(filePath);
    }
  }, [recorder, onSubmit]);

  /**
   * Handle record/play button press.
   * - If playing: pause playback
   * - If paused: start playback (preview recorded segments)
   * - If completed: resume playback if position > 0, otherwise start from beginning
   * @validates Requirements 4.1, 4.5, 3.4
   */
  const handleRecordPlayPress = useCallback(async () => {
    if (recorder.isPlaying) {
      // Pause playback
      await recorder.pausePlayback();
    } else if (recorder.isPaused && recorder.hasRecording) {
      // WhatsApp-style: Preview recorded segments while paused
      await recorder.startPlaybackPreview();
    } else if (recorder.isCompleted) {
      // If we have a position (paused mid-playback), resume from there
      // Otherwise start from the beginning
      if (recorder.currentPosition > 0 && recorder.currentPosition < recorder.duration) {
        // Resume playback from current position - instant since player is already prepared
        await recorder.resumePlayback();
      } else {
        // Start playback from beginning
        await recorder.startPlayback();
      }
    }
  }, [recorder]);

  /**
   * Handle pause/mic/stop button press.
   * - Recording: pause recording (finalize segment)
   * - Paused: continue recording (start new segment) - WhatsApp-style
   * @validates Requirements 3.1, 3.4, 3.5
   */
  const handlePauseMicPress = useCallback(async () => {
    if (recorder.isRecording) {
      // Pause recording (finalize current segment)
      await recorder.pauseRecording();
    } else if (recorder.isPaused) {
      // Continue recording (start new segment) - WhatsApp-style flow
      await recorder.continueRecording();
    }
  }, [recorder]);

  /**
   * Handle seek in waveform.
   * In preview/paused mode or completed mode, tapping starts playback from that position.
   * @validates Requirements 5.1, 5.2
   */
  const handleSeek = useCallback(async (progress: number) => {
    // If playing, just seek to the position
    if (recorder.isPlaying) {
      await recorder.seekTo(progress);
      return;
    }
    
    // If paused (preview mode) or completed, seek and start playback
    if (recorder.isPaused || recorder.isCompleted) {
      await recorder.seekAndPlay(progress);
    }
  }, [recorder]);

  /**
   * Handle seek start - called when user starts dragging the waveform.
   * Updates local state for smooth visual feedback.
   * @validates Requirements 5.1
   */
  const handleSeekStart = useCallback((progress: number) => {
    setIsDragging(true);
    setDragProgress(progress);
  }, []);

  /**
   * Handle seek end - called when user finishes dragging the waveform.
   * Clears local drag state.
   * @validates Requirements 5.1
   */
  const handleSeekEnd = useCallback((progress: number) => {
    setIsDragging(false);
    setDragProgress(progress);
  }, []);

  /**
   * Calculate playback progress for waveform visualization.
   * Uses drag progress during dragging for smooth visual feedback.
   */
  const playbackProgress = useMemo(() => {
    // During dragging, use local drag progress for smooth visual feedback
    if (isDragging) {
      return dragProgress;
    }
    if (recorder.duration <= 0) return 0;
    return recorder.currentPosition / recorder.duration;
  }, [isDragging, dragProgress, recorder.currentPosition, recorder.duration]);

  /**
   * Determine which duration to display.
   * Shows drag position during dragging, playback position during playing, 
   * recording duration otherwise.
   * @validates Requirements 1.4, 4.3
   */
  const displayDuration = useMemo(() => {
    // During dragging, show the position based on drag progress
    if (isDragging) {
      const dragPosition = Math.floor(dragProgress * recorder.duration);
      return formatDuration(dragPosition);
    }
    if (recorder.isPlaying) {
      return formatDuration(recorder.currentPosition);
    }
    return formatDuration(recorder.duration);
  }, [isDragging, dragProgress, recorder.isPlaying, recorder.currentPosition, recorder.duration]);

  /**
   * Determine if seeking is allowed.
   * Seeking is disabled during active recording.
   * @validates Requirements 5.5
   */
  const allowSeeking = useMemo(() => {
    return !recorder.isRecording && recorder.hasRecording;
  }, [recorder.isRecording, recorder.hasRecording]);

  /**
   * Determine if send button should be enabled.
   * Only enabled when a recording exists.
   * @validates Requirements 6.5
   */
  const isSendEnabled = recorder.hasRecording;

  /**
   * Render the recording indicator (red pulsing dot).
   * Shown during active recording state.
   * @validates Requirements 1.2
   */
  const renderRecordingIndicator = () => {
    if (!recorder.isRecording) return null;
    
    return (
      <Animated.View
        style={[
          styles.recordingIndicator,
          {
            backgroundColor: mergedStyle.recordingIndicatorColor,
            opacity: pulseAnim,
          },
        ]}
      />
    );
  };

  /**
   * Render the record/play button.
   * - Recording: shows recording indicator (red dot)
   * - Paused: shows play icon (to preview recording) - WhatsApp-style
   * - Completed: shows play icon
   * - Playing: shows pause icon
   * @validates Requirements 3.2, 3.4, 4.1
   */
  const renderRecordPlayButton = () => {
    // During active recording, show the recording indicator
    if (recorder.isRecording) {
      return (
        <View style={styles.buttonContainer}>
          {renderRecordingIndicator()}
        </View>
      );
    }

    // When paused (recording paused), show play icon for preview - WhatsApp-style
    if (recorder.isPaused && recorder.hasRecording) {
      return (
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={handleRecordPlayPress}
        >
          <Icon
            name="play-arrow-fill"
            height={mergedStyle.recordPlayButtonStyle?.iconSize}
            width={mergedStyle.recordPlayButtonStyle?.iconSize}
            color={mergedStyle.recordPlayButtonStyle?.iconColor}
            icon={playIcon || recordIcon}
          />
        </TouchableOpacity>
      );
    }

    // Completed or playing state - show play/pause
    const isPauseState = recorder.isPlaying;
    
    let iconName: 'play-arrow-fill' | 'pause-fill' = 'play-arrow-fill';
    let iconColor = mergedStyle.recordPlayButtonStyle?.iconColor;
    let customIcon = playIcon || recordIcon;
    
    if (isPauseState) {
      iconName = 'pause-fill';
      iconColor = mergedStyle.pauseButtonStyle?.iconColor;
      customIcon = pauseIcon;
    }

    // Enable button only when completed (has recording and file is finalized)
    const isEnabled = recorder.isCompleted || recorder.isPlaying;

    return (
      <TouchableOpacity
        style={[styles.buttonContainer, !isEnabled && styles.buttonDisabled]}
        onPress={handleRecordPlayPress}
        disabled={!isEnabled}
      >
        <Icon
          name={iconName}
          height={mergedStyle.recordPlayButtonStyle?.iconSize}
          width={mergedStyle.recordPlayButtonStyle?.iconSize}
          color={iconColor}
          icon={customIcon}
        />
      </TouchableOpacity>
    );
  };

  /**
   * Render the pause/mic button.
   * - Recording: shows pause icon (to pause recording)
   * - Paused: shows mic icon (to continue recording) - WhatsApp-style
   * - Completed/Playing: hidden (empty space)
   * @validates Requirements 1.5, 3.2, 3.5
   */
  const renderPauseMicButton = () => {
    // Only show during recording or paused states
    if (!recorder.isRecording && !recorder.isPaused) {
      return <View style={styles.buttonContainer} />;
    }

    // Recording state: show pause icon
    if (recorder.isRecording) {
      return (
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={handlePauseMicPress}
        >
          <Icon
            name="pause-fill"
            height={mergedStyle.pauseButtonStyle?.iconSize}
            width={mergedStyle.pauseButtonStyle?.iconSize}
            color={mergedStyle.pauseButtonStyle?.iconColor}
            icon={pauseIcon}
          />
        </TouchableOpacity>
      );
    }

    // Paused state: show mic icon (to continue recording) - WhatsApp-style
    return (
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={handlePauseMicPress}
      >
        <Icon
          name="mic-fill"
          height={mergedStyle.micButtonStyle?.iconSize}
          width={mergedStyle.micButtonStyle?.iconSize}
          color={mergedStyle.micButtonStyle?.iconColor}
          icon={micIcon}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: mergedStyle.backgroundColor,
          borderRadius: mergedStyle.borderRadius,
        },
        mergedStyle.containerStyle,
        mergedStyle.border,
      ]}
    >
      {/* Delete Button */}
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={handleDelete}
      >
        <Icon
          name="delete-fill"
          height={mergedStyle.deleteButtonStyle?.iconSize}
          width={mergedStyle.deleteButtonStyle?.iconSize}
          color={mergedStyle.deleteButtonStyle?.iconColor}
          icon={deleteIcon}
        />
      </TouchableOpacity>

      {/* Record/Play Button */}
      {renderRecordPlayButton()}

      {/* Waveform Visualizer */}
      <View style={styles.waveformContainer}>
        <AudioWaveformVisualizer
          isAnimating={recorder.isRecording}
          isPlaying={recorder.isPlaying}
          playbackProgress={playbackProgress}
          amplitudes={recorder.amplitudes}
          onSeek={handleSeek}
          onSeekStart={handleSeekStart}
          onSeekEnd={handleSeekEnd}
          allowSeeking={allowSeeking}
          style={mergedStyle.waveformStyle}
        />
      </View>

      {/* Duration Display */}
      <Text style={[styles.duration, mergedStyle.durationTextStyle]}>
        {displayDuration}
      </Text>

      {/* Pause/Mic Button */}
      {renderPauseMicButton()}

      {/* Send Button — circular style matching the composer send button */}
      <TouchableOpacity
        style={[
          styles.sendButtonCircle,
          {
            backgroundColor: isSendEnabled
              ? (theme.color.primary as string)
              : (theme.color.background4 as string),
          },
          !isSendEnabled && styles.buttonDisabled,
        ]}
        onPress={handleSend}
        disabled={!isSendEnabled}
      >
        <Icon
          name="send-fill"
          height={mergedStyle.sendButtonStyle?.iconSize ?? 20}
          width={mergedStyle.sendButtonStyle?.iconSize ?? 20}
          color={
            isSendEnabled
              ? (theme.color.primaryButtonIcon as string)
              : (theme.color.iconSecondary as string)
          }
          icon={sendIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
    minHeight: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  waveformContainer: {
    flex: 1,
  },
  duration: {
    // Gap handles spacing between elements
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sendButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CometChatInlineAudioRecorder;
