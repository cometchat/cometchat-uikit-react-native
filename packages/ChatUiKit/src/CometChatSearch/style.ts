import {
  ColorValue,
  ImageSourcePropType,
  ImageStyle,
  TextStyle,
  ViewStyle,
} from "react-native";
import { deepMerge } from "../shared/helper/helperFunctions";
import { AvatarStyle, getAvatarStyle } from "../shared/views/CometChatAvatar";
import { BadgeStyle } from "../shared/views/CometChatBadge";
import { DateStyle } from "../shared/views/CometChatDate";
import { CometChatTheme } from "../theme/type";
import { DeepPartial } from "../shared/helper/types";
import { JSX } from "react";
import { BorderStyle } from "../shared/base/BorderStyle";

export type SearchStyle = {
  containerStyle: ViewStyle;
  headerStyle: ViewStyle;
  backButtonStyle: ViewStyle;
  backButtonIcon?: ImageSourcePropType | JSX.Element;
  backButtonIconStyle: ImageStyle;
  searchContainerStyle: ViewStyle;
  searchInputContainerStyle: ViewStyle;
  searchInputStyle: TextStyle;
  searchIconStyle: ImageStyle;
  clearButtonStyle: ViewStyle;
  clearButtonIconStyle: ImageStyle;
  filtersContainerStyle: ViewStyle;
  filtersContentStyle: ViewStyle;
  filterButtonStyle: ViewStyle;
  filterButtonActiveStyle: ViewStyle;
  filterButtonContentStyle: ViewStyle;
  filterButtonIconStyle: ImageStyle;
  filterButtonIconActiveStyle: ImageStyle;
  filterButtonTextStyle: TextStyle;
  filterButtonTextActiveStyle: TextStyle;
  emptyStateStyle: {
    containerStyle: ViewStyle;
    titleStyle: TextStyle;
    subtitleStyle: TextStyle;
    iconContainerStyle?: ViewStyle;
    iconStyle?: ImageStyle;
    icon?: ImageSourcePropType | JSX.Element;
  };
  errorStateStyle: {
    containerStyle: ViewStyle;
    titleStyle: TextStyle;
    subtitleStyle: TextStyle;
    iconContainerStyle?: ViewStyle;
    iconStyle?: ImageStyle;
    icon?: ImageSourcePropType | JSX.Element;
  };
  resultsContainerStyle: ViewStyle;
  sectionTitleStyle: TextStyle;
  seeMoreButtonStyle: ViewStyle;
  seeMoreTextStyle: TextStyle;
  conversationItemStyle: {
    containerStyle: ViewStyle;
    contentStyle: ViewStyle;
    titleStyle: TextStyle;
    subtitleStyle: TextStyle;
    avatarStyle: AvatarStyle;
    trailingContainerStyle: ViewStyle;
    badgeStyle: Partial<BadgeStyle>;
    dateStyle: Partial<DateStyle>;
  };
  messageItemStyle: {
    containerStyle: ViewStyle;
    contentStyle: ViewStyle;
    textContainerStyle: ViewStyle;
    titleStyle: TextStyle;
    subtitleStyle: TextStyle;
    iconContainerStyle: ViewStyle;
    trailingContainerStyle: ViewStyle;
    previewContainerStyle: ViewStyle;
    previewImageStyle: ImageStyle;
    previewVideoStyle: ViewStyle;
    videoPlayIconStyle: ViewStyle;
    audioPreviewStyle: ViewStyle;
    filePreviewStyle: ViewStyle;
    linkPreviewImageStyle: ImageStyle;
  };
  skeletonStyle: {
    linearGradientColors: [string, string];
    shimmerBackgroundColor: ColorValue;
    shimmerOpacity: number;
    speed: number;
    containerBackgroundColor: ColorValue;
  };
};

export const getSearchStyleLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): DeepPartial<SearchStyle> => {
  return {
    containerStyle: {
      flex: 1,
      backgroundColor: color.background1,
      marginVertical: spacing.margin.m3,
    },
    headerStyle: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.padding.p4,
      paddingVertical: spacing.padding.p2,
      backgroundColor: color.background1,
    },
    backButtonStyle: {
      width: spacing.spacing.s10,
      height: spacing.spacing.s10,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.margin.m2,
    },
    backButtonIconStyle: {
      tintColor: color.iconSecondary,
      width: spacing.spacing.s6,
      height: spacing.spacing.s6,
    },
    searchContainerStyle: {
      flex: 1,
    },
    searchInputContainerStyle: {
      backgroundColor: color.background3,
      borderRadius: spacing.radius.max,
      borderColor:color.borderDefault,
      borderWidth:1,
      paddingHorizontal: spacing.padding.p3,
      flexDirection: "row",
      alignItems: "center",
      height: spacing.spacing.s12,
    },
    searchInputStyle: {
      flex: 1,
      ...typography.heading4.regular,
      color: color.textPrimary,
      paddingVertical: spacing.padding.p1,
    },
    searchIconStyle: {
      tintColor: color.iconSecondary,
      width: spacing.spacing.s6,
      height: spacing.spacing.s6,
    },
    clearButtonStyle: {
      width: spacing.spacing.s6,
      height: spacing.spacing.s6,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: spacing.margin.m2,
    },
    clearButtonIconStyle: {
      tintColor: color.iconSecondary,
      width: spacing.spacing.s4,
      height: spacing.spacing.s4,
    },
    filtersContainerStyle: {
      paddingVertical: spacing.padding.p2,
      paddingHorizontal: spacing.padding.p4,
      backgroundColor: color.background1,
    },
    filtersContentStyle: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
    },
    filterButtonStyle: {
      paddingHorizontal: spacing.padding.p3,
      paddingVertical: spacing.padding.p2,
      marginRight: spacing.margin.m2,
      marginBottom: spacing.margin.m2,
      backgroundColor: color.background3,
      borderRadius: spacing.radius.r5,
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    filterButtonActiveStyle: {
      backgroundColor: color.neutral900,
      borderColor: color.neutral800,
    },
    filterButtonContentStyle: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spacing.s1,
    },
    filterButtonIconStyle: {
      width: 16,
      height: 16,
      tintColor: color.textSecondary,
    },
    filterButtonIconActiveStyle: {
      tintColor: color.staticWhite,
    },
    filterButtonTextStyle: {
      ...typography.body.regular,
      color: color.textSecondary,
    },
    filterButtonTextActiveStyle: {
      color: color.textWhite,
    },
    emptyStateStyle: {
      containerStyle: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.padding.p8,
      },
      titleStyle: {
        ...typography.heading2.bold,
        color: color.textPrimary,
        marginBottom: spacing.margin.m2,
        textAlign: "center",
      },
      subtitleStyle: {
        ...typography.body.regular,
        color: color.textSecondary,
        textAlign: "center",
      },
      iconContainerStyle: {
        marginBottom: spacing.margin.m5,
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
        ...typography.heading2.bold,
        color: color.textPrimary,
        marginBottom: spacing.margin.m2,
        textAlign: "center",
      },
      subtitleStyle: {
        ...typography.body.regular,
        color: color.textSecondary,
        textAlign: "center",
      },
      iconContainerStyle: {
        marginBottom: spacing.margin.m5,
      },
    },
    resultsContainerStyle: {
      flex: 1,
      backgroundColor: color.background1,
    },
    sectionTitleStyle: {
      ...typography.caption1.medium,
      color: color.textTertiary,
      paddingTop: spacing.padding.p4,
    },
    seeMoreButtonStyle: {
      paddingVertical: spacing.padding.p2,
      alignItems: 'flex-start',
    },
    seeMoreTextStyle: {
      ...typography.body.medium,
      color: color.primary,
    },
    conversationItemStyle: {
      containerStyle: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.padding.p3,
      },
      contentStyle: {
        flex: 1,
        marginLeft: spacing.margin.m3,
      },
      titleStyle: {
        ...typography.heading4.medium,
        color: color.textPrimary,
        marginBottom: spacing.margin.m1,
      },
      subtitleStyle: {
        ...typography.body.regular,
        color: color.textSecondary,
      },
      avatarStyle: getAvatarStyle(color, spacing, typography),
      trailingContainerStyle: {
        alignItems: "flex-end",
        justifyContent: "flex-start",
        marginLeft: spacing.margin.m2,
        minHeight: spacing.spacing.s12,
      },
      badgeStyle: {
        containerStyle: {
          backgroundColor: color.primary,
          borderRadius: spacing.radius.max,
          minWidth: spacing.spacing.s5,
          maxWidth: spacing.spacing.s12,
          height: spacing.spacing.s5,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: spacing.spacing.s1,
          paddingVertical: spacing.spacing.s0_5,
          alignSelf: "flex-end",
        },
      },
      dateStyle: {},
    },
    messageItemStyle: {
      containerStyle: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.padding.p3,
      },
      contentStyle: {
        flex: 1,
        maxWidth: '80%',
      },
      textContainerStyle: {
        flex: 1,
        minHeight: 80,
        maxWidth: '100%',
      },
      titleStyle: {
        ...typography.caption1.medium,
        color: color.textSecondary,
        marginBottom: spacing.margin.m0_5,
      },
      subtitleStyle: {
        ...typography.body.regular,
        color: color.textPrimary,
        width: '90%',
      },
      iconContainerStyle: {
        marginRight: spacing.margin.m3,
        alignItems: "center",
        justifyContent: "center",
      },
      trailingContainerStyle: {
        alignItems: "flex-end",
        justifyContent: "flex-start",
        marginLeft: spacing.margin.m2,
        minHeight: spacing.spacing.s12,
      },
      previewContainerStyle: {
        width: 80,
        height: 80,
        position: "relative",
        justifyContent: "center",
        alignItems: "flex-end",
      },
      previewImageStyle: {
        width: 80,
        height: 80,
        borderRadius: spacing.radius.r2,
        backgroundColor: color.background3,
      },
      previewVideoStyle: {
        width: 80,
        height: 80,
        borderRadius: spacing.radius.r2,
        backgroundColor: color.background3,
        overflow: "hidden",
      },
      videoPlayIconStyle: {
        position: "absolute",
        top: 28,
        left: 28,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: spacing.radius.r3,
        width: spacing.spacing.s6,
        height: spacing.spacing.s6,
        justifyContent: "center",
        alignItems: "center",
      },
      audioPreviewStyle: {
        width: spacing.spacing.s12,
        height: spacing.spacing.s12,
        backgroundColor: color.background3,
        borderRadius: spacing.radius.r2,
        justifyContent: "center",
        alignItems: "center",
      },
      filePreviewStyle: {
        width: spacing.spacing.s12,
        height: spacing.spacing.s12,
        backgroundColor: color.background3,
        borderRadius: spacing.radius.r2,
        justifyContent: "center",
        alignItems: "center",
      },
      linkPreviewImageStyle: {
        width: spacing.spacing.s12,
        height: spacing.spacing.s12,
        borderRadius: spacing.radius.r2,
      },
    },
    skeletonStyle: {
      linearGradientColors: ["#E8E8E8", "#F5F5F5"] as [string, string],
      shimmerBackgroundColor: color.staticBlack,
      shimmerOpacity: 0.01,
      speed: 1,
      containerBackgroundColor: color.background1,
    },
  };
};

export const getSearchStyleDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): DeepPartial<SearchStyle> => {
  return deepMerge(getSearchStyleLight(color, spacing, typography), {
    // Dark theme specific overrides can be added here if needed
    // Currently, the light theme uses proper color tokens that adapt to dark mode
  });
};