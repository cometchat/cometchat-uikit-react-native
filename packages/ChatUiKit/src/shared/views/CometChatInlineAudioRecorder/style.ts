import { CometChatTheme } from "../../../theme/type";
import { deepMerge } from "../../helper/helperFunctions";
import { CometChatInlineAudioRecorderStyle } from "./types";

/**
 * Returns the default style configuration for the CometChatInlineAudioRecorder component
 * using theme colors from CometChatThemeHelper.
 * 
 * This function provides default styling that integrates with the CometChat theme system,
 * ensuring consistent appearance across the UI Kit.
 * 
 * @param color - Theme color configuration from CometChatTheme
 * @param spacing - Theme spacing configuration from CometChatTheme
 * @param typography - Theme typography configuration from CometChatTheme
 * @returns Default style configuration for the inline audio recorder
 * 
 * @validates Requirements 8.3, 8.4
 */
export const getInlineAudioRecorderStyleLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): CometChatInlineAudioRecorderStyle => {
  return {
    backgroundColor: color.background1 as string,
    borderRadius: spacing.radius.r2,
    recordingIndicatorColor: color.error as string,
    containerStyle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 12, // Add spacing between elements to match composer layout
    },
    durationTextStyle: {
      ...typography.caption1.medium,
      color: color.textPrimary as string,
      minWidth: 45,
      textAlign: 'center',
    },
    deleteButtonStyle: {
      iconColor: color.iconSecondary as string,
      iconSize: 24,
    },
    sendButtonStyle: {
      iconColor: color.primary as string,
      iconSize: 24,
    },
    recordPlayButtonStyle: {
      iconColor: color.primary as string,
      iconSize: 24,
    },
    pauseButtonStyle: {
      iconColor: color.error as string,
      iconSize: 24,
    },
    micButtonStyle: {
      iconColor: color.primary as string,
      iconSize: 24,
    },
    waveformStyle: {
      recordingBarColor: color.primary as string,
      playedBarColor: color.primary as string,
      unplayedBarColor: color.neutral400 as string,
      barWidth: 3,
      barSpacing: 2,
      minBarHeight: 4,
      maxBarHeight: 32, // Increased to fill more vertical space
      height: 40, // Match the minInputHeight of the text input
    },
  };
};

/**
 * Returns the dark theme style configuration for the CometChatInlineAudioRecorder component.
 * 
 * This function extends the light theme styles with dark mode specific overrides,
 * using deepMerge to combine the base styles with dark mode adjustments.
 * 
 * @param color - Theme color configuration from CometChatTheme (dark mode)
 * @param spacing - Theme spacing configuration from CometChatTheme
 * @param typography - Theme typography configuration from CometChatTheme
 * @returns Dark theme style configuration for the inline audio recorder
 * 
 * @validates Requirements 8.3, 8.4
 */
export const getInlineAudioRecorderStyleDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): CometChatInlineAudioRecorderStyle => {
  return deepMerge(getInlineAudioRecorderStyleLight(color, spacing, typography), {
    backgroundColor: color.background1 as string,
    durationTextStyle: {
      color: color.textPrimary as string,
    },
    waveformStyle: {
      unplayedBarColor: color.neutral500 as string,
    },
  });
};

/**
 * Merges custom style configuration with default theme-based styles.
 * 
 * This function is the primary entry point for getting the complete style configuration
 * for the CometChatInlineAudioRecorder component. It takes the theme parameters and
 * an optional custom style prop, merging them using deepMerge to produce the final
 * style configuration.
 * 
 * Usage:
 * ```typescript
 * const theme = useTheme();
 * const mergedStyle = getInlineAudioRecorderStyle(
 *   theme.color,
 *   theme.spacing,
 *   theme.typography,
 *   customStyleProp
 * );
 * ```
 * 
 * @param color - Theme color configuration from CometChatTheme
 * @param spacing - Theme spacing configuration from CometChatTheme
 * @param typography - Theme typography configuration from CometChatTheme
 * @param customStyle - Optional custom style configuration to merge with defaults
 * @param isDarkMode - Whether to use dark mode styles (default: false)
 * @returns Complete merged style configuration for the inline audio recorder
 * 
 * @validates Requirements 8.3, 8.4
 */
export const getInlineAudioRecorderStyle = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"],
  customStyle?: CometChatInlineAudioRecorderStyle,
  isDarkMode: boolean = false
): CometChatInlineAudioRecorderStyle => {
  // Get the appropriate base style based on theme mode
  const baseStyle = isDarkMode
    ? getInlineAudioRecorderStyleDark(color, spacing, typography)
    : getInlineAudioRecorderStyleLight(color, spacing, typography);

  // If no custom style provided, return the base style
  if (!customStyle) {
    return baseStyle;
  }

  // Merge custom style with base style using deepMerge
  return deepMerge(baseStyle, customStyle);
};

export {
  getInlineAudioRecorderStyleLight as getInlineAudioRecorderStylesLight,
  getInlineAudioRecorderStyleDark as getInlineAudioRecorderStylesDark,
};
