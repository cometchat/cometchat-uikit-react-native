import { StyleSheet, ViewStyle } from "react-native";
import { CometChatTheme } from "../../../theme/type";

export const Styles = (theme: CometChatTheme) => {
  return StyleSheet.create({
    editPreviewContainerStyle: {
      borderRadius: theme.spacing.radius.r2,
      padding: theme.spacing.padding.p2,
      marginBottom: theme.spacing.margin.m1,
      backgroundColor: theme.color.background3,
      borderWidth: theme.spacing.spacing.s0_5 / 2,
      borderColor: theme.color.borderDefault,
    },
    previewHeadingStyle: {
      marginBottom: 5,
      paddingTop: 5,
    },
    previewTitleStyle: {
      color: theme.color.textPrimary,
      letterSpacing: 0.5,
      ...theme.typography.body.regular
    },

    previewSubTitleStyle: {
      color: theme.color.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 5,
      ...theme.typography.caption1.regular
    },
    previewCloseStyle: {
      position: "absolute",
      top: 5,
      right: 5,
      width: 16,
      height: 16
    },
    previewCloseIconStyle: {
      width: 16,
      height: 16,
      tintColor: theme.color.iconPrimary
    },
  });
};
