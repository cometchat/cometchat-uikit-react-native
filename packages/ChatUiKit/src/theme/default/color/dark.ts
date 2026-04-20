import { Color } from "./light";

const primaryColor = "#6852D6";

const extendedPrimaryColors = {
  extendedPrimary50: "#15102B",
  extendedPrimary100: "#1D173C",
  extendedPrimary200: "#251E4D",
  extendedPrimary300: "#2E245E",
  extendedPrimary400: "#362B6F",
  extendedPrimary500: "#3E3180",
  extendedPrimary600: "#473892",
  extendedPrimary700: "#4F3EA3",
  extendedPrimary800: "#5745B4",
  extendedPrimary900: "#7460D9",
};

const neutralColors = {
  neutral50: "#141414",
  neutral100: "#1A1A1A",
  neutral200: "#272727",
  neutral300: "#383838",
  neutral400: "#4C4C4C",
  neutral500: "#858585",
  neutral600: "#989898",
  neutral700: "#A8A8A8",
  neutral800: "#C8C8C8",
  neutral900: "#FFFFFF",
};

const alertColors = {
  info: "#0D66BF",
  warning: "#D08D04",
  success: "#0B9F5D",
  error: "#C73C3E",
};

const staticColors = {
  staticBlack: "#141414",
  staticWhite: "#FFFFFF",
};

const overlayColors = {
  overlayLight: neutralColors.neutral300,
  overlayCodeBlock: "rgba(255, 255, 255, 0.20)",
  overlayCodeBlockBorder: "rgba(255, 255, 255, 0.30)",
};

export const defaultColorDark: Color = {
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
