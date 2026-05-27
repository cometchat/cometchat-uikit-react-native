import {
  ColorValue,
  ImageSourcePropType,
  ImageStyle,
  TextStyle,
  ViewStyle,
} from "react-native";
import { deepMerge } from "../shared/helper/helperFunctions";
import { CometChatTheme } from "../theme/type";
import { DeepPartial } from "../shared/helper/types";
import { JSX } from "react";

/**
 * Style type for the CometChatNotificationFeed component.
 * Covers: container, header, filter chips, timestamp headers,
 * card container, unread indicator, skeleton, and state views.
 */
export type NotificationFeedStyle = {
  /** Root container */
  containerStyle: ViewStyle;

  /** Header */
  headerContainerStyle: ViewStyle;
  titleStyle: TextStyle;
  backButtonIconStyle: ImageStyle;
  backButtonIcon?: ImageSourcePropType | JSX.Element;

  /** Filter Chips */
  chipsContainerStyle: ViewStyle;
  chipActiveStyle: {
    containerStyle: ViewStyle;
    textStyle: TextStyle;
  };
  chipInactiveStyle: {
    containerStyle: ViewStyle;
    textStyle: TextStyle;
  };
  chipBadgeStyle: {
    containerStyle: ViewStyle;
    textStyle: TextStyle;
  };
  chipInactiveBadgeStyle: {
    containerStyle: ViewStyle;
    textStyle: TextStyle;
  };

  /** Timestamp Section Headers */
  sectionHeaderStyle: {
    containerStyle: ViewStyle;
    textStyle: TextStyle;
  };

  /** Per-item header: Category label + Timestamp */
  itemHeaderStyle: {
    containerStyle: ViewStyle;
    categoryTextStyle: TextStyle;
    timestampTextStyle: TextStyle;
  };

  /** Feed Item Card Container */
  cardContainerStyle: ViewStyle;
  cardBorderColor: ColorValue;
  cardBorderRadius: number;
  cardBorderWidth: number;

  /** Unread Indicator */
  unreadIndicatorStyle: ViewStyle;
  unreadIndicatorColor: ColorValue;

  /** Skeleton / Loading */
  skeletonStyle: {
    linearGradientColors: [string, string];
    shimmerBackgroundColor: ColorValue;
    shimmerOpacity: number;
    speed: number;
    containerBackgroundColor: ColorValue;
  };

  /** Empty State */
  emptyStateStyle: {
    containerStyle: ViewStyle;
    titleStyle: TextStyle;
    subTitleStyle: TextStyle;
    icon?: ImageSourcePropType | JSX.Element;
    iconStyle?: ImageStyle;
    iconContainerStyle?: ViewStyle;
  };

  /** Error State */
  errorStateStyle: {
    containerStyle: ViewStyle;
    titleStyle: TextStyle;
    subTitleStyle: TextStyle;
    icon?: ImageSourcePropType | JSX.Element;
    iconStyle?: ImageStyle;
    iconContainerStyle?: ViewStyle;
  };

  /** Separator between items */
  separatorStyle: ViewStyle;
};

export const getNotificationFeedStyleLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): DeepPartial<NotificationFeedStyle> => {
  return {
    containerStyle: {
      flex: 1,
      backgroundColor: color.background2,
    },

    headerContainerStyle: {
      paddingHorizontal: spacing.padding.p4,
      paddingVertical: spacing.padding.p3,
      borderBottomColor: color.borderDefault,
      borderBottomWidth: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    titleStyle: {
      color: color.textPrimary,
      ...typography.heading2.bold,
    },
    backButtonIconStyle: {
      tintColor: color.iconPrimary,
      height: spacing.spacing.s6,
      width: spacing.spacing.s6,
    },

    chipsContainerStyle: {
      paddingHorizontal: spacing.padding.p4,
      paddingVertical: spacing.padding.p2,
      flexDirection: "row",
      gap: spacing.spacing.s2,
    },
    chipActiveStyle: {
      containerStyle: {
        backgroundColor: color.primary,
        borderRadius: spacing.radius.max,
        paddingHorizontal: spacing.padding.p3,
        paddingVertical: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.spacing.s2,
      },
      textStyle: {
        color: color.textWhite,
        ...typography.body.medium,
        fontWeight: "600",
        textAlign: "center",
      },
    },
    chipInactiveStyle: {
      containerStyle: {
        backgroundColor: color.background2,
        borderRadius: spacing.radius.max,
        borderWidth: 1,
        borderColor: color.borderDefault,
        paddingHorizontal: spacing.padding.p3,
        paddingVertical: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.spacing.s2,
      },
      textStyle: {
        color: color.textTertiary,
        ...typography.body.medium,
        fontWeight: "600",
        textAlign: "center",
      },
    },
    chipBadgeStyle: {
      containerStyle: {
        backgroundColor: color.extendedPrimary50,
        borderRadius: spacing.radius.max,
        borderWidth: 1,
        borderColor: color.extendedPrimary200,
        paddingHorizontal: spacing.spacing.s2,
        paddingVertical: 2,
        alignItems: "center",
        justifyContent: "center",
      },
      textStyle: {
        color: color.primary,
        ...typography.caption1.medium,
        textAlign: "center",
      },
    },
    chipInactiveBadgeStyle: {
      containerStyle: {
        backgroundColor: color.neutral700,
        borderRadius: spacing.radius.max,
        paddingHorizontal: spacing.spacing.s2,
        paddingVertical: 2,
        alignItems: "center",
        justifyContent: "center",
      },
      textStyle: {
        color: color.textWhite,
        ...typography.caption1.medium,
        textAlign: "center",
      },
    },

    sectionHeaderStyle: {
      containerStyle: {
        paddingHorizontal: spacing.padding.p4,
        paddingVertical: spacing.padding.p2,
        backgroundColor: color.background2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      textStyle: {
        color: color.textSecondary,
        ...typography.caption1.regular,
      },
    },

    itemHeaderStyle: {
      containerStyle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.padding.p4,
        paddingTop: spacing.padding.p3,
        paddingBottom: spacing.padding.p1,
      },
      categoryTextStyle: {
        color: color.textSecondary,
        ...typography.caption1.regular,
      },
      timestampTextStyle: {
        color: color.textSecondary,
        ...typography.caption1.regular,
      },
    },

    cardContainerStyle: {
      marginHorizontal: spacing.margin.m4,
      marginVertical: spacing.margin.m1,
      borderRadius: spacing.radius.r3,
      backgroundColor: color.background1,
      overflow: "hidden",
    },
    cardBorderColor: color.borderLight,
    cardBorderRadius: spacing.radius.r3,
    cardBorderWidth: 1,

    unreadIndicatorStyle: {
      width: spacing.spacing.s2,
      height: spacing.spacing.s2,
      borderRadius: spacing.radius.max,
      position: "absolute",
      top: spacing.spacing.s3,
      left: spacing.spacing.s2,
    },
    unreadIndicatorColor: color.primary,

    skeletonStyle: {
      linearGradientColors: ["#E8E8E8", "#F5F5F5"] as [string, string],
      shimmerBackgroundColor: color.staticBlack,
      shimmerOpacity: 0.01,
      speed: 1,
      containerBackgroundColor: color.background2,
    },

    emptyStateStyle: {
      containerStyle: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.padding.p4,
        gap: spacing.spacing.s5,
      },
      titleStyle: {
        color: color.textPrimary,
        ...typography.heading3.bold,
        textAlign: "center",
      },
      subTitleStyle: {
        color: color.textTertiary,
        textAlign: "center",
        ...typography.body.regular,
      },
    },

    errorStateStyle: {
      containerStyle: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.padding.p8,
      },
      titleStyle: {
        color: color.textPrimary,
        ...typography.heading3.bold,
        marginBottom: spacing.margin.m1,
      },
      subTitleStyle: {
        color: color.textSecondary,
        textAlign: "center",
        ...typography.body.regular,
      },
    },

    separatorStyle: {
      height: 1,
      backgroundColor: color.borderLight,
      marginHorizontal: spacing.margin.m4,
    },
  };
};

export const getNotificationFeedStyleDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): DeepPartial<NotificationFeedStyle> => {
  return deepMerge(getNotificationFeedStyleLight(color, spacing, typography), {
    skeletonStyle: {
      linearGradientColors: ["#383838", "#272727"] as [string, string],
      shimmerBackgroundColor: color.staticWhite,
      shimmerOpacity: 0.01,
      speed: 1,
      containerBackgroundColor: color.background2,
    },
  });
};
