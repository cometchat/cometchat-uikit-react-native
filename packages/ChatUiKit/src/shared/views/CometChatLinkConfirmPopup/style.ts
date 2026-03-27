import { StyleSheet, TextStyle, ViewStyle } from "react-native";
import { CometChatTheme } from "../../../theme/type";
import { deepMerge } from "../../helper/helperFunctions";

export type LinkConfirmPopupStyle = {
  overlayStyle: ViewStyle;
  containerStyle: ViewStyle;
  titleTextStyle: TextStyle;
  urlTextStyle: TextStyle;
  inputStyle: TextStyle;
  buttonRowStyle: ViewStyle;
  cancelButtonStyle: ViewStyle;
  cancelButtonTextStyle: TextStyle;
  confirmButtonStyle: ViewStyle;
  confirmButtonTextStyle: TextStyle;
  removeButtonStyle: ViewStyle;
  removeButtonTextStyle: TextStyle;
  confirmSectionStyle: ViewStyle;
  confirmSectionDividerStyle: ViewStyle;
};

export const getLinkConfirmPopupStyleLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): LinkConfirmPopupStyle => {
  return StyleSheet.create({
    overlayStyle: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
    },
    containerStyle: {
      backgroundColor: color.background1,
      borderWidth: 1,
      borderColor: color.borderLight,
      borderRadius: spacing.radius.r4,
      padding: spacing.padding.p6,
      width: "85%",
      maxWidth: 400,
      gap: spacing.padding.p3,
      shadowColor: "#101828",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 8,
    },
    titleTextStyle: {
      color: color.textPrimary,
      ...typography.heading2.medium,
    },
    urlTextStyle: {
      color: color.textHighlight,
      ...typography.body.regular,
    },
    inputStyle: {
      borderBottomWidth: 1,
      borderBottomColor: color.borderDefault,
      paddingVertical: spacing.padding.p2,
      color: color.textPrimary,
      ...typography.body.regular,
    },
    buttonRowStyle: {
      flexDirection: "row",
      gap: spacing.padding.p2,
      paddingTop: spacing.padding.p3,
    },
    cancelButtonStyle: {
      flex: 1,
      height: spacing.spacing.s10,
      borderWidth: 1,
      borderColor: color.borderDark,
      borderRadius: spacing.radius.r2,
      justifyContent: "center",
      alignItems: "center",
    },
    cancelButtonTextStyle: {
      color: color.textPrimary,
      ...typography.button.medium,
    },
    confirmButtonStyle: {
      flex: 1,
      height: spacing.spacing.s10,
      backgroundColor: color.primary,
      borderRadius: spacing.radius.r2,
      justifyContent: "center",
      alignItems: "center",
    },
    confirmButtonTextStyle: {
      color: color.primaryButtonIcon,
      ...typography.button.medium,
    },
    removeButtonStyle: {
      flex: 1,
      height: spacing.spacing.s10,
      backgroundColor: color.error,
      borderRadius: spacing.radius.r2,
      justifyContent: "center",
      alignItems: "center",
    },
    removeButtonTextStyle: {
      color: color.primaryButtonIcon,
      ...typography.button.medium,
    },
    confirmSectionStyle: {
      gap: spacing.padding.p2,
    },
    confirmSectionDividerStyle: {
      borderTopWidth: 1,
      borderTopColor: color.borderLight,
    },
  });
};

export const getLinkConfirmPopupStyleDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): LinkConfirmPopupStyle => {
  return <LinkConfirmPopupStyle>(
    deepMerge(getLinkConfirmPopupStyleLight(color, spacing, typography), {
      containerStyle: {
        backgroundColor: color.background2,
      },
    })
  );
};
