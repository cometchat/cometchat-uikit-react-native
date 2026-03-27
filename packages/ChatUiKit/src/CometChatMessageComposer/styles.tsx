import {
  ColorValue,
  ImageSourcePropType,
  ImageStyle,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import { ActionSheetStyle, CometChatTheme } from "../theme/type";
import { DeepPartial } from "../shared/helper/types";
import { JSX } from "react";

export const Style = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  padding: {
    paddingStart: 8,
    paddingEnd: 8,
  },
  buttonContainerStyle: {
    justifyContent: "space-between",
  },
  rowDirection: {
    flexDirection: "row",
  },
  imageStyle: {},
});

const getAttachmentOptionsStyle = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): ActionSheetStyle => {
  return {
    optionsItemStyle: {
      containerStyle: {
        paddingVertical: spacing.padding.p3,
        paddingHorizontal: spacing.padding.p4,
        backgroundColor: color.background1,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      },
      titleStyle: {
        ...typography.body.regular,
        color: color.textPrimary,
        paddingLeft: spacing.padding.p1,
      },
      iconStyle: {
        height: 24,
        width: 24,
      },
      iconContainerStyle: {},
    },
  };
};

export type MessageComposerStyle = {
  containerStyle: ViewStyle;
  sendIcon?: ImageSourcePropType | JSX.Element;
  sendIconStyle: ImageStyle;
  sendIconContainerStyle: ViewStyle;
  attachmentIcon?: ImageSourcePropType | JSX.Element;
  attachmentIconStyle: ImageStyle;
  voiceRecordingIcon: ImageSourcePropType | JSX.Element;
  voiceRecordingIconStyle: ImageStyle;
  messageInputStyles: {
    containerStyle: ViewStyle;
    textStyle: TextStyle;
    placeHolderTextColor?: ColorValue | undefined;
    dividerStyle: ViewStyle;
  };
  mentionsStyle: CometChatTheme["mentionsStyle"];
  stickerIcon: {
    active: ImageSourcePropType | JSX.Element;
    inactive: ImageSourcePropType | JSX.Element;
  };
  stickerIconStyle: {
    active: ImageStyle;
    inactive: ImageStyle;
  };
  mediaRecorderStyle: CometChatTheme["mediaRecorderStyle"];
  attachmentOptionsStyles: ActionSheetStyle;
};

export const getComposerStyle = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): DeepPartial<MessageComposerStyle> => {
  return {
    containerStyle: {
      backgroundColor: color.background3,
      width: "100%",
    },
    messageInputStyles: {
      containerStyle: {
        borderRadius: spacing.radius.r2,
        borderWidth: spacing.spacing.s0_5 / 2,
        borderColor: color.borderDefault,
        backgroundColor: color.background1,
        borderTopWidth:0,
      },
      textStyle: {
        padding: spacing.padding.p3,
        paddingBottom: spacing.padding.p2,
        color: color.textPrimary,
        maxHeight: spacing.spacing.s20,
        ...typography.body.regular,
      },
      placeHolderTextColor: color.textTertiary,
      dividerStyle: {
        height: 1,
        backgroundColor: color.borderLight,
        marginVertical: spacing.margin.m1,
      },
    },
    attachmentIconStyle: {
      tintColor: color.iconSecondary,
      height: spacing.spacing.s6,
      width: spacing.spacing.s6,
    },
    voiceRecordingIconStyle: {
      tintColor: color.iconSecondary,
      height: spacing.spacing.s6,
      width: spacing.spacing.s6,
    },
    mentionsStyle: {
      textStyle: {
        ...typography.body.regular,
        color: color.textHighlight,
      },
      selfTextStyle: {
        ...typography.body.regular,
        color: color.warning,
      },
    },
    stickerIconStyle: {
      inactive: {
        tintColor: color.iconSecondary,
      },
      active: {
        tintColor: color.primary,
      },
    },
    attachmentOptionsStyles: getAttachmentOptionsStyle(color, spacing, typography),
  };
};
