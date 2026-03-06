import { CometChatTheme } from "../../../theme/type";
import { deepMerge } from "../../helper/helperFunctions";
import { DeepPartial } from "../../helper/types";

export const getReactionsStyleLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): {
  incomingBubbleStyle: DeepPartial<CometChatTheme["messageBubbleReactionStyles"]>;
  outgoingBubbleStyle: DeepPartial<CometChatTheme["messageBubbleReactionStyles"]>;
} => {
  return {
    incomingBubbleStyle: {
      reactionContainerStyle: {
        marginTop: -3,
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        // Allow reactions row to wrap when system font size causes overflow
        flexWrap: "wrap",
      },
      emojiStyle: {
        containerStyle: {
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p2,
          // Use minHeight instead of fixed height so the container grows
          minHeight: 24,
          backgroundColor: color.background1,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          borderWidth: 1,
          borderColor: color.borderDark,
        },
        emojitextStyle: { ...typography.button.regular, color: color.textPrimary },
        emojiCountTextStyle: { ...typography.caption1.regular, color: color.textPrimary },
      },
      activeEmojiStyle: {
        containerStyle: {
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p2,
          // Use minHeight instead of fixed height so the container grows
          // when system font/display size is increased (accessibility)
          minHeight: 24,
          backgroundColor: color.extendedPrimary100,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          borderWidth: 1,
          borderColor: color.borderDark,
        },
        emojitextStyle: { ...typography.button.regular, color: color.textPrimary },
        emojiCountTextStyle: { ...typography.caption1.regular, color: color.textPrimary },
      },
      extraReactionStyle: {
        containerStyle: {
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p2,
          // Use minHeight instead of fixed height so the container grows
          // when system font/display size is increased (accessibility)
          minHeight: 24,
          backgroundColor: color.background1,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          borderWidth: 1,
          borderColor: color.borderDark,
        },
        countTextStyle: { ...typography.caption1.regular, color: color.textPrimary },
        activeContainerStyle: {
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p2,
          // Use minHeight instead of fixed height so the container grows
          // when system font/display size is increased (accessibility)
          minHeight: 24,
          backgroundColor: color.extendedPrimary100,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          borderWidth: 1,
          borderColor: color.borderDark,
        },
        activeCountTextStyle: { ...typography.caption1.regular, color: color.textPrimary },
      },
    },
    outgoingBubbleStyle: {
      reactionContainerStyle: {
        marginTop: -3,
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        // Allow reactions row to wrap when system font size causes overflow
        flexWrap: "wrap",
      },
      emojiStyle: {
        containerStyle: {
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p2,
          // Use minHeight instead of fixed height so the container grows
          // when system font/display size is increased (accessibility)
          minHeight: 24,
          backgroundColor: color.background1,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          borderWidth: 1,
          borderColor: color.borderDark,
        },
        emojitextStyle: { ...typography.button.regular, color: color.textPrimary },
        emojiCountTextStyle: { ...typography.caption1.regular, color: color.textPrimary },
      },
      activeEmojiStyle: {
        containerStyle: {
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p2,
          // Use minHeight instead of fixed height so the container grows
          // when system font/display size is increased (accessibility)
          minHeight: 24,
          backgroundColor: color.extendedPrimary100,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          borderWidth: 1,
          borderColor: color.borderDark,
        },
        emojitextStyle: { ...typography.button.regular, color: color.textPrimary },
        emojiCountTextStyle: { ...typography.caption1.regular, color: color.textPrimary },
      },
      extraReactionStyle: {
        containerStyle: {
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p2,
          // Use minHeight instead of fixed height so the container grows
          // when system font/display size is increased (accessibility)
          minHeight: 24,
          backgroundColor: color.background1,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          borderWidth: 1,
          borderColor: color.borderDark,
        },
        countTextStyle: { ...typography.caption1.regular, color: color.textPrimary },
        activeContainerStyle: {
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p2,
          // Use minHeight instead of fixed height so the container grows
          // when system font/display size is increased (accessibility)
          minHeight: 24,
          backgroundColor: color.extendedPrimary100,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          borderWidth: 1,
          borderColor: color.borderDark,
        },
        activeCountTextStyle: { ...typography.caption1.regular, color: color.textPrimary },
      },
    },
  };
};

export const getReactionsStyleDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): {
  incomingBubbleStyle: DeepPartial<CometChatTheme["messageBubbleReactionStyles"]>;
  outgoingBubbleStyle: DeepPartial<CometChatTheme["messageBubbleReactionStyles"]>;
} => {
  return deepMerge(getReactionsStyleLight(color, spacing, typography)!,  {
    incomingBubbleStyle: {
      emojiStyle: {
        containerStyle: {
          borderColor: color.borderLight,
        },
      },
      activeEmojiStyle: {
        containerStyle: {
          borderColor: color.borderLight,
        },
      },
      extraReactionStyle: {
        containerStyle: {
          borderColor: color.borderLight
        },
        activeContainerStyle: {
          borderColor: color.borderLight
        },
      },
    },
    outgoingBubbleStyle: {
      emojiStyle: {
        containerStyle: {
          borderColor: color.borderLight
        },
      },
      activeEmojiStyle: {
        containerStyle: {
          borderColor: color.borderLight
        },
      },
      extraReactionStyle: {
        containerStyle: {
          borderColor: color.borderLight
        },
        activeContainerStyle: {
          borderColor: color.borderLight
        },
      },
    },
  });
};
