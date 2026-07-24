import { ColorValue } from "react-native";

const primaryColor = "#6852D6";

const extendedPrimaryColors = {
  extendedPrimary50: "#F9F8FD",
  extendedPrimary100: "#EDEAFA",
  extendedPrimary200: "#DCD7F6",
  extendedPrimary300: "#CCC4F1",
  extendedPrimary400: "#BBB1ED",
  extendedPrimary500: "#AA9EE8",
  extendedPrimary600: "#9A8BE4",
  extendedPrimary700: "#8978DF",
  extendedPrimary800: "#7965DB",
  extendedPrimary900: "#5D49BE",
};

const neutralColors = {
  neutral50: "#FFFFFF",
  neutral100: "#FAFAFA",
  neutral200: "#F5F5F5",
  neutral300: "#E8E8E8",
  neutral400: "#DCDCDC",
  neutral500: "#A1A1A1",
  neutral600: "#727272",
  neutral700: "#5B5B5B",
  neutral800: "#434343",
  neutral900: "#141414",
};

const alertColors = {
  info: "#0B7BEA",
  warning: "#FFAB00",
  success: "#09C26F",
  error: "#F44649",
};

const staticColors = {
  staticBlack: "#141414",
  staticWhite: "#FFFFFF",
  staticWhite35: "rgba(255, 255, 255, 0.35)", // staticWhite @ 35% (color-mix(staticWhite 35%, transparent))
};

const overlayColors = {
  overlayLight: "rgba(120, 120, 128, 0.70)",
  overlayCodeBlock: "rgba(255, 255, 255, 0.20)",
  overlayCodeBlockBorder: neutralColors.neutral300,
};

export const defaultColorLight = {
  primary: primaryColor,
  ...extendedPrimaryColors,
  ...neutralColors,
  ...alertColors,
  ...staticColors,

  background1: neutralColors.neutral50,
  background2: neutralColors.neutral100,
  background3: neutralColors.neutral200,
  background4: neutralColors.neutral300,

  borderLight: neutralColors.neutral200,
  borderDefault: neutralColors.neutral300,
  borderDark: neutralColors.neutral400,
  borderHighlight: primaryColor,

  textPrimary: neutralColors.neutral900,
  textSecondary: neutralColors.neutral600,
  textTertiary: neutralColors.neutral500,
  textDisabled: neutralColors.neutral400,
  textWhite: neutralColors.neutral50,
  textHighlight: primaryColor,

  iconPrimary: neutralColors.neutral900,
  iconSecondary: neutralColors.neutral500,
  iconTertiary: neutralColors.neutral400,
  iconWhite: neutralColors.neutral50,
  iconHighlight: primaryColor,

  primaryButtonBackground: primaryColor,
  primaryButtonIcon: staticColors.staticWhite,
  primaryButtonText: staticColors.staticWhite,
  secondaryButtonBackground: neutralColors.neutral900,
  secondaryButtonIcon: neutralColors.neutral900,
  secondaryButtonText: neutralColors.neutral900,
  linkBackground: alertColors.info,
  fabButtonBackground: primaryColor,
  fabButtonIcon: staticColors.staticWhite,

  whiteHover: neutralColors.neutral100,
  whitePressed: neutralColors.neutral300,

  sendBubbleBackground: primaryColor,
  sendBubbleText: staticColors.staticWhite,
  sendBubbleTextHighlight: staticColors.staticWhite,
  sendBubbleLink: staticColors.staticWhite,
  sendBubbleTimestamp: staticColors.staticWhite,
  sendBubbleIcon: staticColors.staticWhite,
  sendBubbleTrack: staticColors.staticWhite35, // unfilled seek-bar track on the send bubble

  receiveBubbleBackground: neutralColors.neutral300,
  receiveBubbleText: neutralColors.neutral900,
  receiveBubbleTextHighlight: primaryColor,
  receiveBubbleLink: alertColors.info,
  receiveBubbleTimestamp: neutralColors.neutral600,
  receiveBubbleIcon: primaryColor,

  // Reply preview inline code background
  previewInlineCodeBackground: overlayColors.overlayLight,
  // Reply preview code block background
  previewCodeBlockBackground: overlayColors.overlayCodeBlock,
  // Reply preview code block border
  previewCodeBlockBorder: overlayColors.overlayCodeBlockBorder,

  // Media overlays — dark scrims that sit ON TOP of image/video content, so they stay dark in BOTH
  // themes (a light scrim over media reads wrong). Tokenized here so every media/attachment surface
  // pulls the same values instead of hardcoding them per component.
  mediaScrim: "#0D0D0D",                    // opaque fill behind a video cell / poster
  mediaOverlay: "rgba(0, 0, 0, 0.6)",       // play-button circle, "+N" overflow scrim, batch-count overlay
  mediaDurationChip: "rgba(0, 0, 0, 0.72)", // duration pill (darker for text legibility)
  mediaErrorOverlay: "rgba(0, 0, 0, 0.45)", // dim for an errored media tile
};
type EachColorValue<T extends typeof defaultColorLight> = {
  [P in keyof T]: ColorValue;
};

export type Color = EachColorValue<typeof defaultColorLight>;
