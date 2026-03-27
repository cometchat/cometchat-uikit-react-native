import {
  ColorValue,
  ImageSourcePropType,
  ImageStyle,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import { ActionSheetStyle, CometChatTheme } from "../theme/type";
import { DeepPartial } from "../shared/helper/types";
import { JSX } from "react";

/**
 * Constants for auto-expanding TextInput height calculations.
 * These are exported for use in component logic and style calculations.
 *
 * @see heightUtils.ts for calculation functions
 */
export const MIN_INPUT_HEIGHT = 24;
export const DEFAULT_LINE_HEIGHT = 24;

export const Style = StyleSheet.create({
  // Outer wrapper with padding (matches Figma: pb-8, px-8)
  wrapper: {
    paddingTop: 0,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  // Main container with border and rounded corners (matches Figma: Base_Message Composer)
  container: {
    flexDirection: 'column',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // Input row with icons and text input (matches Figma: Top Field)
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  // Expanded input row variant - icons align to top when input is expanded
  expandedInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  // Left icons container (matches Figma: Icons left)
  leftIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  // Left icons container - top aligned for expanded state
  leftIconsContainerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
    paddingTop: 0,
  },
  // Right icons container with spacing (matches Figma: Icons right - gap 16px)
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 16,
  },
  // Right icons container - top aligned for expanded state
  rightIconsContainerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 12,
    paddingTop: 0,
    gap: 16,
  },
  // Text input - flex to fill available space (matches Figma: Placeholder)
  textInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: DEFAULT_LINE_HEIGHT,
    padding: 0,
    margin: 0,
    minHeight: MIN_INPUT_HEIGHT,
  },
  // Text input for auto-expand mode - supports dynamic height
  textInputAutoExpand: {
    flex: 1,
    fontSize: 14,
    lineHeight: DEFAULT_LINE_HEIGHT,
    padding: 0,
    margin: 0,
    minHeight: MIN_INPUT_HEIGHT,
    textAlignVertical: 'top',
  },
  // Icon button touchable area
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
    minHeight: 24,
  },
  // ImageButton base style
  imageButtonBase: {
    minWidth: 24,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Icon size (matches Figma: 24x24)
  icon: {
    height: 24,
    width: 24,
    minHeight: 24,
    minWidth: 24,
  },
  // Separator line (matches Figma: Seprator)
  separator: {
    height: 1,
    width: '100%',
  },
  // Auxiliary container for custom buttons
  auxiliaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Live reaction styles
  liveReactionStyle: {
    alignItems: 'flex-end',
  },
  liveReactionBtnStyle: {
    height: 24,
    width: 24,
    resizeMode: 'stretch',
  },
  // Legacy aliases for backward compatibility
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    height: 24,
    width: 24,
  },
  // Mention suggestion list container
  mentionListContainer: {
    borderTopWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 0,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  // Mention limit warning container
  mentionLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 5,
    paddingLeft: 5,
    borderTopWidth: 1,
  },
  // Mention limit icon
  mentionLimitIcon: {
    height: 20,
    width: 20,
  },
  // Mention limit text
  mentionLimitText: {
    marginLeft: 5,
  },
});

const getAttachmentOptionsStyle = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): ActionSheetStyle => {
  return {
    optionsItemStyle: {
      containerStyle: {
        paddingVertical: spacing.padding.p3,
        paddingHorizontal: spacing.padding.p4,
        backgroundColor: color.background1,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      },
      titleStyle: {
        ...typography.body.regular,
        color: color.textPrimary,
        paddingLeft: spacing.padding.p1,
      },
      iconStyle: {
        height: 24,
        width: 24,
      },
      iconContainerStyle: {},
    },
  };
};

export type SingleLineComposerStyle = {
  containerStyle: ViewStyle;
  sendIcon?: ImageSourcePropType | JSX.Element;
  sendIconStyle: ImageStyle;
  sendIconContainerStyle: ViewStyle;
  attachmentIcon?: ImageSourcePropType | JSX.Element;
  attachmentIconStyle: ImageStyle;
  voiceRecordingIcon: ImageSourcePropType | JSX.Element;
  voiceRecordingIconStyle: ImageStyle;
  messageInputStyles: {
    containerStyle: ViewStyle;
    textStyle: TextStyle;
    placeHolderTextColor?: ColorValue | undefined;
    dividerStyle: ViewStyle;
  };
  mentionsStyle: CometChatTheme["mentionsStyle"];
  stickerIcon: {
    active: ImageSourcePropType | JSX.Element;
    inactive: ImageSourcePropType | JSX.Element;
  };
  stickerIconStyle: {
    active: ImageStyle;
    inactive: ImageStyle;
  };
  mediaRecorderStyle: CometChatTheme["mediaRecorderStyle"];
  attachmentOptionsStyles: ActionSheetStyle;
};

export const getSingleLineComposerStyle = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): DeepPartial<SingleLineComposerStyle> => {
  return {
    containerStyle: {
      backgroundColor: color.background3,
      width: "100%",
    },
    messageInputStyles: {
      containerStyle: {
        borderRadius: spacing.radius.r2,
        borderWidth: spacing.spacing.s0_5 / 2,
        borderColor: color.borderDefault,
        backgroundColor: color.background1,
      },
      textStyle: {
        padding: spacing.padding.p3,
        paddingBottom: spacing.padding.p2,
        color: color.textPrimary,
        maxHeight: spacing.spacing.s20,
        ...typography.body.regular,
      },
      placeHolderTextColor: color.textTertiary,
      dividerStyle: {
        height: 1,
        backgroundColor: color.borderLight,
        marginVertical: spacing.margin.m1,
      },
    },
    attachmentIconStyle: {
      tintColor: color.iconSecondary,
      height: spacing.spacing.s6,
      width: spacing.spacing.s6,
    },
    voiceRecordingIconStyle: {
      tintColor: color.iconSecondary,
      height: spacing.spacing.s6,
      width: spacing.spacing.s6,
    },
    mentionsStyle: {
      textStyle: {
        ...typography.body.regular,
        color: color.textHighlight,
      },
      selfTextStyle: {
        ...typography.body.regular,
        color: color.warning,
      },
    },
    stickerIconStyle: {
      inactive: {
        tintColor: color.iconSecondary,
      },
      active: {
        tintColor: color.primary,
      },
    },
    attachmentOptionsStyles: getAttachmentOptionsStyle(color, spacing, typography),
  };
};
