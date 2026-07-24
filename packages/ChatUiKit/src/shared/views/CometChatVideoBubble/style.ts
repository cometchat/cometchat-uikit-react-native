import { StyleSheet } from "react-native";
import { CometChatTheme } from "../../../theme/type";

export const Style = StyleSheet.create({
  playIconPosition: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export const getVideoBubbleStylesLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): {
  incomingBubbleStyle: CometChatTheme["videoBubbleStyles"];
  outgoingBubbleStyle: CometChatTheme["videoBubbleStyles"];
} => {
  return {
    incomingBubbleStyle: {
      containerStyle: {
        padding: spacing.padding.p1,
        paddingBottom: spacing.padding.p0,
        borderRadius: spacing.radius.r3,
        alignSelf: "flex-start",
      },
      imageStyle: {
        borderRadius: spacing.radius.r2,
        backgroundColor: color.background3,
        height: 140,
        width: 232,
        overflow: 'hidden'
      },
      playIconStyle: {
        height: 48,
        width: 48,
        tintColor: color.primaryButtonIcon
      },
      playIconContainerStyle: {
        //flex: 1,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: 'center',
        height: 48,
        width: 48,
        borderRadius: spacing.radius.max,
        backgroundColor: '#14141499',
        position: 'absolute',
        left: 96,
        top: 50
      },
      dateReceiptContainerStyle: {
        paddingRight: spacing.padding.p1
      }
    },
    outgoingBubbleStyle: {
      containerStyle: {
        padding: spacing.padding.p1,
        paddingBottom: spacing.padding.p0,
        borderRadius: spacing.radius.r3,
        overflow: "hidden",
      },
      imageStyle: {
        borderRadius: spacing.radius.r2,
        backgroundColor: color.background3,
        height: 140,
        width: '100%',
        minWidth: 232,
        overflow: 'hidden'
      },
      playIconStyle: {
        height: 48,
        width: 48,
        tintColor: color.primaryButtonIcon
      },
      playIconContainerStyle: {
        //flex: 1,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: 'center',
        height: 48,
        width: 48,
        borderRadius: spacing.radius.max,
        backgroundColor: '#14141499',
        position: 'absolute',
        left: 96,
        top: 50
      },
      dateReceiptContainerStyle: {
        paddingRight: spacing.padding.p1
      }
    },
  };
};

export const getVideoBubbleStylesDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): {
  incomingBubbleStyle: CometChatTheme["videoBubbleStyles"];
  outgoingBubbleStyle: CometChatTheme["videoBubbleStyles"];
} => {
  return getVideoBubbleStylesLight(color, spacing, typography);
};
