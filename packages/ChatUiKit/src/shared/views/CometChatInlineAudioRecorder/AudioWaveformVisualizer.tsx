import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../../theme';
import { AudioWaveformVisualizerProps, WaveformStyle } from './types';

/**
 * Default style values for the waveform visualizer.
 * Matches Figma design: thin rounded pill bars with compact spacing
 */
const DEFAULT_STYLE: Required<WaveformStyle> = {
  recordingBarColor: '#6852D6', // Purple primary - will be overridden by theme
  playedBarColor: '#6852D6', // Purple primary - will be overridden by theme
  unplayedBarColor: '#A1A1A1', // Neutral-500 grey
  barWidth: 2,        // Figma: 2px width
  barSpacing: 2.694,  // Figma: ~2.694px gap between bars
  minBarHeight: 2,    // Figma: 2px minimum height
  maxBarHeight: 16,   // Figma: 16px maximum height
  height: 24,         // Figma: 24px container height
  containerStyle: {},
};

/**
 * Normalizes an amplitude value to the range [0.0, 1.0].
 * Handles edge cases like negative values and values > 1.
 * 
 * @param amplitude - Raw amplitude value
 * @returns Normalized amplitude in range [0.0, 1.0]
 * @validates Requirements 2.3
 */
export function normalizeAmplitude(amplitude: number): number {
  // Handle edge cases
  if (!Number.isFinite(amplitude)) {
    return 0;
  }
  // Clamp to [0, 1] range
  return Math.max(0, Math.min(1, amplitude));
}

/**
 * Amplifies low amplitude values for better visual response.
 * WhatsApp-style: more natural variation, less aggressive amplification.
 * Quiet sounds show small bars, loud sounds show tall bars.
 * 
 * @param normalizedAmplitude - Amplitude value already normalized to [0, 1]
 * @returns Amplified amplitude in range [0.0, 1.0]
 * @validates Requirements 2.4
 */
export function amplifyAmplitude(normalizedAmplitude: number): number {
  // Handle edge cases
  if (!Number.isFinite(normalizedAmplitude) || normalizedAmplitude <= 0) {
    return 0;
  }
  if (normalizedAmplitude >= 1) {
    return 1;
  }
  
  // WhatsApp-style: Use a gentler curve that preserves natural variation
  // This creates more dynamic waveforms with visible differences between quiet and loud
  // pow(x, 0.7) gives a gentler boost than sqrt while still making quiet sounds visible
  return Math.pow(normalizedAmplitude, 0.7);
}

/**
 * Processes a raw amplitude value through normalization and amplification.
 * 
 * @param rawAmplitude - Raw amplitude value from audio source
 * @returns Processed amplitude in range [0.0, 1.0]
 * @validates Requirements 2.3, 2.4
 */
export function processAmplitude(rawAmplitude: number): number {
  const normalized = normalizeAmplitude(rawAmplitude);
  return amplifyAmplitude(normalized);
}

/**
 * Calculates seek position from touch coordinates.
 * Clamps result to [0.0, 1.0] range regardless of input.
 * 
 * @param touchX - X coordinate of touch
 * @param containerWidth - Width of the waveform container
 * @returns Seek progress in range [0.0, 1.0]
 * @validates Requirements 5.1, 5.2, 5.3
 */
export function calculateSeekPosition(touchX: number, containerWidth: number): number {
  // Handle edge cases
  if (!Number.isFinite(touchX) || !Number.isFinite(containerWidth) || containerWidth <= 0) {
    return 0;
  }
  
  // Calculate progress and clamp to [0, 1]
  const progress = touchX / containerWidth;
  return Math.max(0, Math.min(1, progress));
}

/**
 * AudioWaveformVisualizer component displays animated waveform bars
 * during recording and playback.
 * 
 * Features:
 * - Animated bars based on audio amplitude
 * - Amplitude normalization and amplification for consistent visualization
 * - Playback progress coloring (grey to purple)
 * - Touch/drag seeking support (when allowed) with smooth local state updates
 * - Scrolling effect during recording (new bars on right, scroll left)
 * 
 * @validates Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 4.2, 5.1, 5.2, 5.3, 5.5
 */
export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isAnimating,
  isPlaying: _isPlaying, // Reserved for future animation enhancements
  playbackProgress,
  amplitudes,
  onSeek,
  onSeekStart,
  onSeekEnd,
  allowSeeking,
  style,
}) => {
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const barAnimationsRef = useRef<Animated.Value[]>([]);
  
  // Local state for smooth dragging - updates immediately without waiting for native
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  
  // Merge styles with defaults and theme
  const mergedStyle = useMemo((): Required<WaveformStyle> => {
    const themeDefaults: WaveformStyle = {
      recordingBarColor: theme.color.primary as string,
      playedBarColor: theme.color.primary as string,
      unplayedBarColor: theme.color.neutral400 as string,
    };
    
    // First merge defaults with theme colors, then with user style
    const baseStyle = { ...DEFAULT_STYLE, ...themeDefaults };
    const finalStyle = { ...baseStyle, ...(style ?? {}) };
    
    return finalStyle as Required<WaveformStyle>;
  }, [theme, style]);

  // Calculate how many bars can fit in the container
  const maxBars = useMemo(() => {
    if (containerWidth <= 0) return 0;
    const totalBarWidth = mergedStyle.barWidth + mergedStyle.barSpacing;
    return Math.floor(containerWidth / totalBarWidth);
  }, [containerWidth, mergedStyle.barWidth, mergedStyle.barSpacing]);

  // Get visible amplitudes (last N amplitudes that fit in container)
  const visibleAmplitudes = useMemo(() => {
    if (maxBars <= 0) return [];
    
    // During recording, show the most recent amplitudes
    // During playback, show all stored amplitudes
    if (isAnimating) {
      // Show last maxBars amplitudes during recording
      return amplitudes.slice(-maxBars);
    } else {
      // During playback, distribute amplitudes across the container
      if (amplitudes.length === 0) return [];
      
      // If we have fewer amplitudes than bars, use what we have
      if (amplitudes.length <= maxBars) {
        return amplitudes;
      }
      
      // Sample amplitudes to fit the container
      const step = amplitudes.length / maxBars;
      const sampled: number[] = [];
      for (let i = 0; i < maxBars; i++) {
        const index = Math.floor(i * step);
        sampled.push(amplitudes[index]);
      }
      return sampled;
    }
  }, [amplitudes, maxBars, isAnimating]);

  // Initialize bar animations when visible amplitudes change
  useEffect(() => {
    const currentLength = barAnimationsRef.current.length;
    const targetLength = visibleAmplitudes.length;
    
    if (targetLength > currentLength) {
      // Add new animated values
      for (let i = currentLength; i < targetLength; i++) {
        barAnimationsRef.current.push(new Animated.Value(0));
      }
    }
    
    // Animate bars to their target heights
    visibleAmplitudes.forEach((amplitude, index) => {
      if (barAnimationsRef.current[index]) {
        const processedAmplitude = processAmplitude(amplitude);
        Animated.timing(barAnimationsRef.current[index], {
          toValue: processedAmplitude,
          duration: 100,
          useNativeDriver: false, // Height animation requires non-native driver
        }).start();
      }
    });
  }, [visibleAmplitudes]);

  // Handle layout changes to get container width
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  // Use the effective progress - local during drag, prop otherwise
  const effectiveProgress = isDragging ? localProgress : playbackProgress;

  // Ref to track dragging state for pan responder (avoids stale closure issues)
  const isDraggingRef = useRef(false);
  
  // Ref to store the initial touch position and progress for accurate delta tracking
  const gestureStartRef = useRef({ touchX: 0, progress: 0 });
  
  // Keep ref in sync with state
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Pan responder for seek gestures - smooth local updates during drag
  // Uses delta-based tracking for more accurate and smooth dragging
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => allowSeeking,
      onMoveShouldSetPanResponder: () => allowSeeking,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        if (!allowSeeking || containerWidth <= 0) return;
        
        // Use locationX which is relative to the touched view
        const touchX = event.nativeEvent.locationX;
        const progress = calculateSeekPosition(touchX, containerWidth);
        
        // Store initial position for delta-based tracking
        gestureStartRef.current = { touchX, progress };
        
        // Start dragging - use ref for immediate access in move handler
        isDraggingRef.current = true;
        setIsDragging(true);
        setLocalProgress(progress);
        
        // Notify parent that seeking started
        onSeekStart?.(progress);
      },
      onPanResponderMove: (event: GestureResponderEvent, gestureState) => {
        // Use ref instead of state to avoid stale closure
        if (!allowSeeking || !isDraggingRef.current || containerWidth <= 0) return;
        
        // Use delta-based calculation for smoother, more accurate tracking
        // gestureState.dx gives the total horizontal distance moved since gesture started
        const deltaProgress = gestureState.dx / containerWidth;
        const newProgress = Math.max(0, Math.min(1, gestureStartRef.current.progress + deltaProgress));
        
        // Update local state immediately for smooth visual feedback
        setLocalProgress(newProgress);
      },
      onPanResponderRelease: (event: GestureResponderEvent, gestureState) => {
        if (!allowSeeking || containerWidth <= 0) return;
        
        // Calculate final progress using delta
        const deltaProgress = gestureState.dx / containerWidth;
        const finalProgress = Math.max(0, Math.min(1, gestureStartRef.current.progress + deltaProgress));
        
        // End dragging
        isDraggingRef.current = false;
        setIsDragging(false);
        
        // Now call the actual seek handler (which may trigger native calls)
        onSeek?.(finalProgress);
        onSeekEnd?.(finalProgress);
      },
      onPanResponderTerminate: () => {
        // Drag was interrupted
        isDraggingRef.current = false;
        setIsDragging(false);
      },
    });
  // Only recreate when these stable dependencies change - NOT isDragging
  }, [allowSeeking, containerWidth, onSeek, onSeekStart, onSeekEnd]);

  // Calculate bar height from amplitude
  const getBarHeight = useCallback((amplitude: number): number => {
    const processed = processAmplitude(amplitude);
    const heightRange = mergedStyle.maxBarHeight - mergedStyle.minBarHeight;
    return mergedStyle.minBarHeight + (processed * heightRange);
  }, [mergedStyle.minBarHeight, mergedStyle.maxBarHeight]);

  // Determine bar color based on playback progress
  const getBarColor = useCallback((barIndex: number, totalBars: number): string => {
    if (isAnimating) {
      // During recording, all bars are recording color
      return mergedStyle.recordingBarColor;
    }
    
    if (totalBars === 0) {
      return mergedStyle.unplayedBarColor;
    }
    
    // During playback/completed, color based on progress (use effective progress for smooth drag)
    const barProgress = (barIndex + 1) / totalBars;
    if (barProgress <= effectiveProgress) {
      return mergedStyle.playedBarColor;
    }
    return mergedStyle.unplayedBarColor;
  }, [isAnimating, effectiveProgress, mergedStyle]);

  // Render bars
  const renderBars = useCallback(() => {
    if (visibleAmplitudes.length === 0) {
      // Show placeholder bars when no amplitudes
      const placeholderCount = Math.min(maxBars, 20);
      return Array.from({ length: placeholderCount }).map((_, index) => (
        <View
          key={`placeholder-${index}`}
          style={[
            styles.bar,
            {
              width: mergedStyle.barWidth,
              height: mergedStyle.minBarHeight,
              backgroundColor: mergedStyle.unplayedBarColor,
              marginHorizontal: mergedStyle.barSpacing / 2,
            },
          ]}
        />
      ));
    }

    return visibleAmplitudes.map((amplitude, index) => {
      const animatedValue = barAnimationsRef.current[index];
      const barColor = getBarColor(index, visibleAmplitudes.length);
      
      if (animatedValue) {
        // Use animated height
        const animatedHeight = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [mergedStyle.minBarHeight, mergedStyle.maxBarHeight],
        });
        
        return (
          <Animated.View
            key={`bar-${index}`}
            style={[
              styles.bar,
              {
                width: mergedStyle.barWidth,
                height: animatedHeight,
                backgroundColor: barColor,
                marginHorizontal: mergedStyle.barSpacing / 2,
              },
            ]}
          />
        );
      }
      
      // Fallback to static height
      const height = getBarHeight(amplitude);
      return (
        <View
          key={`bar-${index}`}
          style={[
            styles.bar,
            {
              width: mergedStyle.barWidth,
              height,
              backgroundColor: barColor,
              marginHorizontal: mergedStyle.barSpacing / 2,
            },
          ]}
        />
      );
    });
  }, [visibleAmplitudes, maxBars, mergedStyle, getBarColor, getBarHeight]);

  return (
    <View
      style={[
        styles.container,
        { height: mergedStyle.height },
        mergedStyle.containerStyle,
      ]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <View style={styles.barsContainer}>
        {renderBars()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bar: {
    borderRadius: 1000, // Figma: fully rounded pill shape
  },
});

export default AudioWaveformVisualizer;
