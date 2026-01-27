import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../../theme";
import { deepMerge } from "../../helper/helperFunctions";
import { NewMessageIndicatorStyle, getNewMessageIndicatorStyle } from "./styles";
import { useCometChatTranslation } from "../../resources/CometChatLocalizeNew";

/**
 * Props for the CometChatNewMessageIndicator component.
 */
export interface CometChatNewMessageIndicatorInterface {
  /**
   * Custom styles for the new message indicator component.
   */
  style?: NewMessageIndicatorStyle;
  /**
   * Text to display in the indicator.
   * Default: "New Messages"
   */
  text?: string;
  /**
   * Custom component to render instead of the default indicator.
   */
  NewMessageIndicatorView?: React.ComponentType<any>;
}

/**
 * CometChatNewMessageIndicator is a component for displaying a "New Messages" separator.
 *
 * It renders a horizontal line with a text label in the center.
 * The component is fully customizable via styles or by providing a custom view.
 */
export const CometChatNewMessageIndicator = React.memo((props: CometChatNewMessageIndicatorInterface) => {
  const { style = {}, text, NewMessageIndicatorView } = props;
  const theme = useTheme();
  const { t } = useCometChatTranslation();

  // Merge default styles with any custom style overrides.
  const indicatorStyles = useMemo(() => {
    const defaultStyles = getNewMessageIndicatorStyle(theme);
    return deepMerge(defaultStyles, style);
  }, [theme, style]);

  if (NewMessageIndicatorView) {
    return <NewMessageIndicatorView {...props} />;
  }

  return (
    <View style={indicatorStyles.containerStyle}>
      <View style={indicatorStyles.lineStyle} />
      <Text style={indicatorStyles.textStyle} numberOfLines={1}>{text || t("NEW")}</Text>
      <View style={indicatorStyles.lineStyle} />
    </View>
  );
});
