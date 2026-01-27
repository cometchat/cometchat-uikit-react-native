import { StyleSheet, TextStyle, ViewStyle } from "react-native";
import { CometChatTheme } from "../../../theme/type";

export type NewMessageIndicatorStyle = {
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  lineStyle?: ViewStyle;
};

export const getNewMessageIndicatorStyle = (
  theme: CometChatTheme
): NewMessageIndicatorStyle => {
  return StyleSheet.create({
    containerStyle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 8,
      width: "100%",
    },
    textStyle: {
      color: theme.color.error,
      ...theme.typography.caption1.medium,
      marginHorizontal: 8,
    },
    lineStyle: {
      flex: 1,
      height: 1,
      backgroundColor: theme.color.error,
      opacity: 0.5,
    },
  });
};
