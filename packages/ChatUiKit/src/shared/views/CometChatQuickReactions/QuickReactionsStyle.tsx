import { CometChatTheme } from "../../../theme/type";

export const getQuickReactionStyleLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): CometChatTheme["quickReactionStyle"] => {
  return {
    containerStyle: {
      backgroundColor: color.background1,
      paddingVertical: spacing.padding.p2,
      // borderWidth: 1,
      // borderColor: color.borderLight,
      flexDirection: 'row',
      gap: spacing.padding.p2,
      justifyContent: 'space-evenly',
    },
    emojiContainerStyle: {
      backgroundColor: color.background3,
      borderRadius: spacing.radius.max,
      minHeight: 40,
      minWidth: 40,
      justifyContent: 'center',
      alignItems: 'center',
    }
  };
};

export const getQuickReactionStyleDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): CometChatTheme["quickReactionStyle"] => {
  return getQuickReactionStyleLight(color, spacing, typography);
};
