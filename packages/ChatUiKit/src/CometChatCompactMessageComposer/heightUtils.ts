/**
 * Height Calculation Utility Functions for Auto-Expanding TextInput
 *
 * These pure functions handle height calculations for the auto-expanding
 * TextInput feature in CometChatSingleLineMessageComposer.
 *
 * @module heightUtils
 */

/**
 * Default constants for height calculations
 */
export const DEFAULT_MIN_HEIGHT = 24;
export const DEFAULT_MAX_HEIGHT = 200;
export const DEFAULT_LINE_HEIGHT = 24;
export const DEFAULT_MAX_LINES = 5;
export const DEFAULT_PADDING_VERTICAL = 12;

/**
 * Pure function to calculate the target input height.
 * Clamps the content height between minHeight and maxHeight.
 *
 * @param contentHeight - The actual content height from onContentSizeChange
 * @param minHeight - Minimum allowed height (must be positive)
 * @param maxHeight - Maximum allowed height (must be >= minHeight)
 * @returns The clamped height value
 *
 * @example
 * // Content fits within bounds
 * calculateInputHeight(100, 40, 200) // returns 100
 *
 * // Content exceeds max
 * calculateInputHeight(250, 40, 200) // returns 200
 *
 * // Content below min
 * calculateInputHeight(20, 40, 200) // returns 40
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */
export function calculateInputHeight(
  contentHeight: number,
  minHeight: number,
  maxHeight: number
): number {
  // Input validation: handle negative or zero values
  const validContentHeight = Math.max(0, contentHeight);
  const validMinHeight = Math.max(1, minHeight);
  // Ensure maxHeight is at least minHeight
  const validMaxHeight = Math.max(validMinHeight, maxHeight);

  // Clamp content height between min and max
  return Math.min(Math.max(validContentHeight, validMinHeight), validMaxHeight);
}

/**
 * Pure function to calculate max height from maxLines.
 * Computes the maximum height based on number of lines, line height, and padding.
 *
 * @param maxLines - Number of lines (must be positive, defaults to DEFAULT_MAX_LINES)
 * @param lineHeight - Height per line in pixels (must be positive)
 * @param paddingVertical - Vertical padding in pixels (must be non-negative)
 * @returns Maximum height in pixels
 *
 * @example
 * // 5 lines with 24px line height and 12px padding
 * calculateMaxHeightFromLines(5, 24, 12) // returns 144 (5 * 24 + 12 * 2)
 *
 * **Validates: Requirements 2.3**
 */
export function calculateMaxHeightFromLines(
  maxLines: number,
  lineHeight: number,
  paddingVertical: number
): number {
  // Input validation: handle negative or zero values
  const validMaxLines = Math.max(1, maxLines);
  const validLineHeight = Math.max(1, lineHeight);
  const validPaddingVertical = Math.max(0, paddingVertical);

  return validMaxLines * validLineHeight + validPaddingVertical * 2;
}

/**
 * Pure function to determine icon alignment based on expansion state.
 * Returns 'flex-start' (top alignment) when expanded, 'center' when collapsed.
 *
 * @param currentHeight - Current input height in pixels
 * @param minHeight - Minimum (single-line) height in pixels
 * @returns 'flex-start' when expanded (height > minHeight), 'center' when collapsed
 *
 * @example
 * // Expanded state (height > minHeight)
 * getIconAlignment(100, 40) // returns 'flex-start'
 *
 * // Collapsed state (height === minHeight)
 * getIconAlignment(40, 40) // returns 'center'
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */
export function getIconAlignment(
  currentHeight: number,
  minHeight: number
): 'flex-start' | 'center' {
  // Input validation: handle negative or zero values
  const validCurrentHeight = Math.max(0, currentHeight);
  const validMinHeight = Math.max(1, minHeight);

  return validCurrentHeight > validMinHeight ? 'flex-start' : 'center';
}

/**
 * Configuration options for resolving effective max height.
 */
export interface MaxHeightConfig {
  /**
   * Maximum number of lines before scrolling is enabled.
   * Used to calculate maxHeight if maxHeight is not explicitly provided.
   */
  maxLines?: number;
  /**
   * Maximum height in pixels. Takes precedence over maxLines if provided.
   */
  maxHeight?: number;
  /**
   * Line height for text (used in maxLines calculation).
   * @default DEFAULT_LINE_HEIGHT
   */
  lineHeight?: number;
  /**
   * Vertical padding (used in maxLines calculation).
   * @default DEFAULT_PADDING_VERTICAL
   */
  paddingVertical?: number;
}

/**
 * Pure function to resolve the effective maximum height based on configuration.
 * When both maxLines and maxHeight are provided, maxHeight takes precedence.
 *
 * @param config - Configuration object with maxLines and/or maxHeight
 * @returns The effective maximum height in pixels
 *
 * @example
 * // maxHeight takes precedence over maxLines
 * resolveEffectiveMaxHeight({ maxLines: 5, maxHeight: 100 }) // returns 100
 *
 * // maxLines is used when maxHeight is not provided
 * resolveEffectiveMaxHeight({ maxLines: 5 }) // returns 144 (5 * 24 + 12 * 2)
 *
 * // Default values when neither is provided
 * resolveEffectiveMaxHeight({}) // returns DEFAULT_MAX_HEIGHT
 *
 * **Validates: Requirements 2.2, 2.3**
 */
export function resolveEffectiveMaxHeight(config: MaxHeightConfig): number {
  const {
    maxLines,
    maxHeight,
    lineHeight = DEFAULT_LINE_HEIGHT,
    paddingVertical = DEFAULT_PADDING_VERTICAL,
  } = config;

  // If maxHeight is explicitly provided (not undefined), it takes precedence
  if (maxHeight !== undefined) {
    // Validate maxHeight: must be positive
    return Math.max(1, maxHeight);
  }

  // If maxLines is provided, calculate maxHeight from it
  if (maxLines !== undefined) {
    return calculateMaxHeightFromLines(maxLines, lineHeight, paddingVertical);
  }

  // Default: use DEFAULT_MAX_HEIGHT
  return DEFAULT_MAX_HEIGHT;
}

/**
 * Pure function to determine if height state should be updated.
 * Returns true only when the new calculated height differs from the current height.
 * This optimization prevents unnecessary re-renders when height doesn't change.
 *
 * @param newHeight - The newly calculated height from content size change
 * @param currentHeight - The current height state value
 * @returns true if height should be updated, false otherwise
 *
 * @example
 * // Height changed - should update
 * shouldUpdateHeight(100, 40) // returns true
 *
 * // Height unchanged - should not update
 * shouldUpdateHeight(40, 40) // returns false
 *
 * // Floating point comparison with tolerance
 * shouldUpdateHeight(40.0001, 40) // returns false (within tolerance)
 *
 * **Validates: Requirements 7.2**
 */
export function shouldUpdateHeight(newHeight: number, currentHeight: number): boolean {
  // Use a small tolerance for floating point comparison to avoid
  // unnecessary updates due to floating point precision issues
  const TOLERANCE = 0.001;
  return Math.abs(newHeight - currentHeight) > TOLERANCE;
}
