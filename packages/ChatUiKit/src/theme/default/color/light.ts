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
};
type EachColorValue<T extends typeof defaultColorLight> = {
  [P in keyof T]: ColorValue;
};

export type Color = EachColorValue<typeof defaultColorLight>;
