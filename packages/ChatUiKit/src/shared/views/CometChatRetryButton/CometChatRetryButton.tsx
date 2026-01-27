import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../../theme";
import { useCometChatTranslation } from "../../resources/CometChatLocalizeNew";

/**
 * Props for the CometChatRetryButton component.
 */
export interface CometChatRetryButtonProps {
  /**
   * Callback function to execute when the retry button is pressed.
   */
  onPress: () => void;
}

/**
 * CometChatRetryButton is a reusable component that renders a styled retry button.
 * It is commonly used in error states to allow users to retry failed operations.
 *
 * @param props - The props for the component.
 * @returns The rendered retry button element.
 */
export const CometChatRetryButton = (props: CometChatRetryButtonProps) => {
  const { onPress } = props;
  const theme = useTheme();
  const { t } = useCometChatTranslation();

  const retryText = t("RETRY");

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={retryText}
      style={{
        backgroundColor: theme.color.primary,
        paddingVertical: theme.spacing.spacing.s3,
        paddingHorizontal: theme.spacing.spacing.s10,
        borderRadius: theme.spacing.radius.r2,
        marginTop: theme.spacing.spacing.s5,
      }}
    >
      <Text
        style={{
          color: theme.color.primaryButtonIcon,
          ...theme.typography.button.medium,
        }}
      >
        {retryText}
      </Text>
    </TouchableOpacity>
  );
};

