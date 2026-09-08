import { ImageSourcePropType, ImageStyle, TextStyle, ViewStyle } from "react-native";
import { JSX } from "react";
import { CometChatTheme } from "../theme/type";

/**
 * Style type for the CometChatSavedMessages component (design doc §6.7).
 *
 * Every value maps to a SEMANTIC theme token rather than a literal, so light and
 * dark are two calls to the same builder and an integrator retheming the kit gets
 * this surface for free.
 *
 * `itemStyle` is intentionally ABSENT. These rows are conversation rows and take
 * their chrome from `theme.conversationStyles.itemStyle` — the same tokens the
 * conversation list uses — so that the two surfaces cannot drift apart. Giving this
 * component its own copy would guarantee they eventually do.
 */
export type SavedMessagesStyle = {
  /** Root container. */
  containerStyle: ViewStyle;

  /** Header: title on the left, close affordance on the right. */
  headerContainerStyle: ViewStyle;
  titleStyle: TextStyle;
  closeButtonIconStyle: ImageStyle;
  closeButtonIcon?: ImageSourcePropType | JSX.Element;

  /** Type glyph in the row subtitle (image / video / audio / file / sticker …). */
  previewIconStyle: ImageStyle;
  previewIconContainerStyle: ViewStyle;

  /** Glyph in the long-press menu (Unsave). */
  menuIconStyle: ImageStyle;

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

export const getSavedMessagesStyleLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): SavedMessagesStyle => ({
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
  previewIconStyle: {
    tintColor: color.iconSecondary,
    height: spacing.spacing.s4,
    width: spacing.spacing.s4,
  },
  previewIconContainerStyle: {
    marginRight: spacing.margin.m1,
  },
  menuIconStyle: {
    tintColor: color.iconSecondary,
    height: spacing.spacing.s6,
    width: spacing.spacing.s6,
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
 * Dark delegates to light — see the note in CometChatPinnedMessages/style.ts. Every
 * value here resolves from a semantic token and `color` is already the dark palette,
 * so there is no dark-only override to apply.
 */
export const getSavedMessagesStyleDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): SavedMessagesStyle => getSavedMessagesStyleLight(color, spacing, typography);
