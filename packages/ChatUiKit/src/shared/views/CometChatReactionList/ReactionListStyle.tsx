import { CometChatTheme } from "../../../theme/type";
import { deepMerge } from "../../helper/helperFunctions";

export const getReactionListStyleLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): CometChatTheme["reactionListStyles"] => {
  return {
    tabStyle: {
      containerStyle: {
        minHeight: 35
      },
      itemStyle: {
        paddingHorizontal: spacing.padding.p4,
        paddingVertical: spacing.padding.p2,
        flexDirection: "row",
        borderBottomWidth: spacing.spacing.s0_5,
        borderBottomColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
      },
      selectedItemStyle: {
        paddingHorizontal: spacing.padding.p4,
        paddingVertical: spacing.padding.p2,
        flexDirection: "row",
        borderBottomWidth: spacing.spacing.s0_5,
        borderBottomColor: color.primary,
        alignItems: "center",
        justifyContent: "center",
      },
      itemEmojiStyle: {
        color: color.textSecondary,
        borderColor: "transparent",
        ...typography.body.medium,
      },
      selectedItemEmojiStyle: {
        color: color.textSecondary,
        borderColor: "transparent",
        ...typography.body.medium,
      },
      itemTextStyle: {
        color: color.textSecondary,
        marginLeft: spacing.margin.m1,
        ...typography.body.medium,
      },
      selectedItemTextStyle: {
        color: color.primary,
        marginLeft: spacing.margin.m1,
        ...typography.body.medium,
      },
    },
    reactionListItemStyle: {
      containerStyle: {
        flexDirection: "row",
        gap: spacing.padding.p3,
        paddingVertical: spacing.padding.p2,
        paddingHorizontal: spacing.padding.p5,
      },
      titleStyle: {
        color: color.textPrimary,
        ...typography.body.medium,
      },
      subtitleStyle: {
        color: color.textSecondary,
        ...typography.caption1.regular,
      },
      avatarStyle: {
        containerStyle: {
          height: 32,
          width: 32,
        },
        imageStyle: {
          borderRadius: spacing.radius.max,
        },
        textStyle: {},
      },
      emojiStyle: {
        minHeight: 24,
        minWidth: 24,
        textAlign: "center",
        ...typography.heading2.regular,
      },
      titleContainerStyle: {
        alignSelf: 'center'
      },
    },
    skeletonStyle: {
      linearGradientColors: ["#E8E8E8", "#F5F5F5"] as [string, string],
      shimmerBackgroundColor: color.staticBlack,
      shimmerOpacity: 0.01,
      speed: 0.1,
    },
    errorStateStyle: {
      containerStyle: {
        marginTop: spacing.margin.m0,
        height: "95%",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: "10%",
      },
      iconContainerStyle: {
        marginBottom: spacing.margin.m5,
      },
      titleStyle: {
        color: color.textPrimary,
        ...typography.heading3.bold,
        marginBottom: spacing.margin.m1,
      },
      subtitleStyle: {
        color: color.textSecondary,
        textAlign: "center",
        ...typography.body.regular,
      },
    },
  };
};

export const getReactionListStyleDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): CometChatTheme["reactionListStyles"] => {
  return deepMerge(getReactionListStyleLight(color, spacing, typography), {
    skeletonStyle: {
      linearGradientColors: ["#383838", "#272727"] as [string, string],
      shimmerBackgroundColor: color.staticWhite,
      shimmerOpacity: 0.01,
      speed: 0.1,
    },
    errorStateStyle: {
      containerStyle: {
        marginTop: spacing.margin.m0,
        height: "95%",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: "10%",
      },
      iconContainerStyle: {
        marginBottom: spacing.margin.m5,
      },
      titleStyle: {
        color: color.textPrimary,
        ...typography.heading3.bold,
        marginBottom: spacing.margin.m1,
      },
      subtitleStyle: {
        color: color.textSecondary,
        textAlign: "center",
        ...typography.body.regular,
      },
    }
  });
};
