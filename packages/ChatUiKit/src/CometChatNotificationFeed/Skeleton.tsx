/**
 * Skeleton.tsx
 *
 * Simple loading indicator for CometChatNotificationFeed.
 * Shows a centered ActivityIndicator with "Loading..." text
 * while initial data is being fetched.
 * Matches Figma: node-id=8257:16800 (Loading indicator)
 */

import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "../theme";
import { getCometChatTranslation } from "../shared/resources/CometChatLocalizeNew/LocalizationManager";

const t = getCometChatTranslation();

export const Skeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.color.background2,
      }}
    >
      <View style={{ alignItems: "center", gap: 16 }}>
        <ActivityIndicator size="large" color={theme.color.primary} />
        <Text
          style={{
            color: theme.color.textSecondary,
            ...theme.typography.body.medium,
            textAlign: "center",
          }}
        >
          {t("LOADING")}
        </Text>
      </View>
    </View>
  );
};
