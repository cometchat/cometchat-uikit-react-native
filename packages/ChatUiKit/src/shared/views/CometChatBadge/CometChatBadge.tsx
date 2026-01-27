import React, { useMemo } from "react";
import { Text, View, Dimensions } from "react-native";
import { useTheme } from "../../../theme";
import { deepMerge } from "../../helper/helperFunctions";
import { BadgeStyle } from "./styles";

/**
 * Props for the CometChatBadge component.
 */
export interface CometChatBadgeProps {
  /**
   * The count to display on the badge.
   * If the count exceeds 999, it will be shown as "999+".
   */
  count: number | string;
  /**
   * Custom style for the badge.
   */
  style?: Partial<BadgeStyle>;
}

/**
 * CometChatBadge component renders the unread message count as a badge.
 *
 * This component returns a badge with custom styling that displays the number of unread messages.
 *
 * Props for the component.
 * The rendered badge element or null if count is 0.
 */
export const CometChatBadge = (props: CometChatBadgeProps) => {
  const { style = {}, count = 0 } = props;
  const theme = useTheme();

  // Merge the theme's badge style with any custom styles provided.
  const badgeStyle = useMemo(() => {
    return deepMerge(theme.badgeStyle, style ?? {});
  }, [theme.badgeStyle, style]);

  // Convert count to text, formatting as "999+" if count is greater than 999.
  const countText: string = useMemo(() => {
    if (Number.isInteger(count)) {
      if ((count as number) === 0) return "";
      if ((count as number) > 999) return "999+";
      return (count as number).toString();
    }
    return count.toString();
  }, [count]);

  // If count is zero or an empty string, do not render the badge.
  if (countText.length === 0) return null;

  const fontScale = Dimensions.get('window').fontScale;
  const badgeSize = 25 * fontScale;

  return (
    <View style={[badgeStyle.containerStyle, { width: badgeSize, height: badgeSize }]}>
      <Text style={[badgeStyle.textStyle]} numberOfLines={1} adjustsFontSizeToFit={true}>{countText}</Text>
    </View>
  );
};