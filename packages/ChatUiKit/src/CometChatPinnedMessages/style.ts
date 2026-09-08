import { ImageSourcePropType, ImageStyle, TextStyle, ViewStyle } from "react-native";
import { JSX } from "react";
import { CometChatTheme } from "../theme/type";

/**
 * Style type for the CometChatPinnedMessages component (design doc §6.7).
 *
 * Every value maps to a SEMANTIC theme token rather than a literal, so light and
 * dark are two calls to the same builder and an integrator retheming the kit gets
 * this surface for free.
 */
export type PinnedMessagesStyle = {
  /** Root container. */
  containerStyle: ViewStyle;

  /** Header: title on the left, close affordance on the right. */
  headerContainerStyle: ViewStyle;
  titleStyle: TextStyle;
  closeButtonIconStyle: ImageStyle;
  closeButtonIcon?: ImageSourcePropType | JSX.Element;

  /** One pinned message row: the sender line above, the bubble below. */
  itemStyle: {
    containerStyle: ViewStyle;
    /** Avatar + name + date row that sits above the bubble. */
    headerContainerStyle: ViewStyle;
    avatarStyle: CometChatTheme["avatarStyle"];
    senderNameStyle: TextStyle;
    separatorStyle: TextStyle;
    dateStyle: Partial<CometChatTheme["dateStyles"]>;
    /** Bookmark shown when a pinned message is ALSO saved by this viewer. */
    savedIndicatorStyle: ImageStyle;
    savedIndicatorContainerStyle: ViewStyle;
    /** Left inset that lines the bubble up under the sender name. */
    bubbleContainerStyle: ViewStyle;
  };

  /** Empty and error states. */
  emptyStateStyle: {
    /** Centres the whole block in the space the list would have filled. */
    containerStyle: ViewStyle;
    titleStyle: TextStyle;
    subTitleStyle: TextStyle;
    iconStyle: ImageStyle;
  };
  errorStateStyle: {
    containerStyle: ViewStyle;
    titleStyle: TextStyle;
    subTitleStyle: TextStyle;
    iconStyle: ImageStyle;
  };
};

export const getPinnedMessagesStyleLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): PinnedMessagesStyle => ({
  containerStyle: {
    flex: 1,
    backgroundColor: color.background1,
  },
  // Mirrors the Group Info / User Info header: a leading back arrow, then the title. Those
  // screens are the reference for every full-screen view in the app, so the paddings and the
  // heading1.bold title are copied rather than re-invented.
  headerContainerStyle: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.padding.p4,
    paddingLeft: spacing.padding.p2,
    paddingBottom: spacing.padding.p2,
  },
  titleStyle: {
    ...typography.heading1.bold,
    color: color.textPrimary,
    paddingLeft: spacing.padding.p1,
  },
  closeButtonIconStyle: {
    tintColor: color.iconPrimary,
    height: spacing.spacing.s6,
    width: spacing.spacing.s6,
  },
  itemStyle: {
    containerStyle: {
      paddingHorizontal: spacing.padding.p4,
      paddingVertical: spacing.padding.p3,
    },
    headerContainerStyle: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.margin.m1,
    },
    avatarStyle: {
      containerStyle: {
        height: spacing.spacing.s8,
        width: spacing.spacing.s8,
      },
      // The font has to come down WITH the circle (ENG-38886).
      //
      // The theme sizes initials at heading2.bold (20px) for its own 48px avatar. This row uses
      // a 32px one, and two capitals at 20px do not fit inside it — which left the whole thing
      // resting on `adjustsFontSizeToFit`. That prop shrinks text differently on iOS than on
      // Android, so the initials came out clipped and mis-centred on iOS only, while Android
      // looked fine and hid the problem.
      //
      // body.bold (14px) keeps roughly the same letter-to-circle ratio the theme uses at 48px,
      // so the text fits on its own and the auto-shrink never has to do anything.
      textStyle: {
        ...typography.body.bold,
        // heading2.bold brings a 28px lineHeight with it; left in place it pushes two 14px
        // capitals off-centre inside a 32px circle.
        lineHeight: undefined,
      },
    },
    senderNameStyle: {
      ...typography.body.medium,
      color: color.textHighlight,
      marginLeft: spacing.margin.m2,
    },
    separatorStyle: {
      ...typography.caption1.regular,
      color: color.textSecondary,
      marginHorizontal: spacing.margin.m1,
    },
    dateStyle: {
      textStyle: {
        ...typography.caption1.regular,
        color: color.textSecondary,
      },
    },
    savedIndicatorStyle: {
      tintColor: color.iconSecondary,
      height: 14,
      width: 14,
    },
    savedIndicatorContainerStyle: {
      marginLeft: spacing.margin.m1,
    },
    bubbleContainerStyle: {
      // Lines the bubble up under the sender name rather than the avatar.
      marginLeft: spacing.spacing.s10,
    },
  },
  emptyStateStyle: {
    containerStyle: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.padding.p8,
      gap: spacing.spacing.s2,
    },
    titleStyle: {
      ...typography.heading4.bold,
      color: color.textPrimary,
      textAlign: "center",
    },
    subTitleStyle: {
      ...typography.body.regular,
      color: color.textSecondary,
      textAlign: "center",
    },
    iconStyle: {
      tintColor: color.iconSecondary,
      // 120, not a spacing token: these glyphs sit in a 24x24 viewBox but only fill ~54% of its
      // width, so the BOX has to be far larger than the mark you want to see. The design's
      // bookmark measures 66x80 against a 16px title, and 66 / 0.54 ≈ 120. Using s14 (56) drew
      // a 30x37 mark — less than half the intended size.
      height: 120,
      width: 120,
      marginBottom: spacing.margin.m3,
    },
  },
  // Same layout as the empty state, because it fills the same hole. The icon needs no
  // size compensation: `error-state` is a purpose-built 120x120 illustration that fills
  // its viewBox, unlike the glyphs above. 120 is also what the conversation list asks
  // for (`margin.m15 << 1`), so the two error screens come out identical.
  errorStateStyle: {
    containerStyle: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.padding.p8,
    },
    titleStyle: {
      ...typography.heading4.bold,
      color: color.textPrimary,
      textAlign: "center",
    },
    subTitleStyle: {
      ...typography.body.regular,
      color: color.textSecondary,
      textAlign: "center",
    },
    iconStyle: {
      height: 120,
      width: 120,
      marginBottom: spacing.margin.m3,
    },
  },
});

/**
 * Dark delegates to light, deliberately.
 *
 * The kit's convention is `dark = deepMerge(light(...), <dark-only overrides>)`, and
 * those overrides exist only where a value CANNOT come from a token — the skeleton
 * gradient literals in CometChatUsers, for instance. Every value here resolves from
 * a semantic token, and `color` is already the dark palette by the time it arrives,
 * so there is nothing left to override. An empty deepMerge would say the same thing
 * with more ceremony.
 */
export const getPinnedMessagesStyleDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): PinnedMessagesStyle => getPinnedMessagesStyleLight(color, spacing, typography);
