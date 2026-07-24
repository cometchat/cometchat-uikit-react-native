import { Platform } from "react-native";
import {
  getAudioBubbleStyleLight,
  getAudioBubbleStyleDark,
} from "../shared/views/CometChatAudioBubble";
import {
  getFileBubbleStyleLight,
  getFileBubbleStyleDark,
} from "../shared/views/CometChatFileBubble";
import { ActionSheetStyle, CometChatTheme } from "../theme/type";
import { getStickerStyleLight, getStickerStyleDark } from "../extensions/Stickers/style";
import {
  getCollabBubbleStyleDark,
  getCollabBubbleStyleLight,
} from "../extensions/CollaborativeBubble/style";
import {
  getVideoBubbleStylesDark,
  getVideoBubbleStylesLight,
} from "../shared/views/CometChatVideoBubble/style";
import { getPollBubbleStyleDark, getPollBubbleStyleLight } from "../extensions/Polls/style";
import {
  getReactionsStyleDark,
  getReactionsStyleLight,
} from "../shared/views/CometChatReactions/style";
import {
  getLinkPreviewBubbleStyleDark,
  getLinkPreviewBubbleStyleLight,
} from "../extensions/LinkPreview/style";
import {
  getGroupCallBubbleStyle,
  getCallActionBubbleStyle,
} from "../calls/CometChatCallBubble/styles";
import { getDeletedBubbleStyle } from "../shared/views/CometChatDeletedBubble";
import {
  getMessageInormationListStyleDark,
  getMessageInormationListStyleLight,
} from "../CometChatMessageInformation/styles";

const groupActionBubbleStyles = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): CometChatTheme["groupActionBubbleStyles"] => {
  return {
    containerStyle: {
      paddingHorizontal: spacing.padding.p3,
      paddingVertical: spacing.padding.p1,
      borderRadius: spacing.radius.max,
      backgroundColor: color.background2,
      borderWidth: 1,
      borderColor: color.borderDefault,
    },
    textStyle: {
      ...typography.caption1.regular,
      color: color.textSecondary,
      textAlign: "center",
    },
  };
};

const getMessageOptionsStyle = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): ActionSheetStyle => {
  return {
    optionsItemStyle: {
      containerStyle: {
        paddingVertical: spacing.padding.p3,
        paddingHorizontal: spacing.padding.p6,
        backgroundColor: color.background1,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      },
      titleStyle: {
        ...typography.body.regular,
        color: color.textPrimary,
      },
      iconStyle: {
        height: 24,
        width: 24,
      },
      iconContainerStyle: {},
    },
  };
};

export const getMessageListStylesLight = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): CometChatTheme["messageListStyles"] => {
  return {
    containerStyle: {
      backgroundColor: color.background3,
      flex: 1,
    },
    scrollToBottomButtonStyle: {
      containerStyle: {
        position: "absolute",
        zIndex: 1,
        paddingVertical: spacing.padding.p3,
        paddingHorizontal: spacing.padding.p3,
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: color.background1,
        right: 10,
        bottom: 2,
        gap: spacing.padding.p1,
        borderRadius: spacing.radius.max,
        ...(Platform.OS == "ios"
          ? {
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.2,
              shadowRadius: 16,
            }
          : {
              elevation: 4,
            }),
      },
      iconContainerStyle: {},
      iconStyle: {
        height: 24,
        width: 24,
        tintColor: color.iconSecondary,
      },
      unreadCountBadgeStyle: {
        containerStyle: {
          height: 20,
          minWidth: 20,
          maxWidth: 40,
          backgroundColor: color.primary,
          borderRadius: spacing.radius.r5,
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p1,
        },
        textStyle: {
          ...typography.caption1.regular,
          textAlign: "center",
          color: color.primaryButtonIcon,
        },
      },
    },
    emptyStateStyle: {
      containerStyle: {
        backgroundColor: color.background2,
        marginTop: spacing.margin.m0,
        height: "100%",
        width: "100%",
      },
    },
    errorStateStyle: {
      containerStyle: {
        backgroundColor: color.background2,
        marginTop: spacing.margin.m0,
        height: "100%",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: "10%",
      },
      iconContainerStyle: {
        marginBottom: spacing.margin.m5,
      },
      titleStyle: {
        color: color.textPrimary,
        ...typography.heading3.bold,
        marginBottom: spacing.margin.m1,
      },
      subtitleStyle: {
        color: color.textSecondary,
        textAlign: "center",
        ...typography.body.regular,
      },
    },
    dateSeparatorStyle: {
      containerStyle: {
        borderColor: color.borderDark,
        backgroundColor: color.background2,
        ...(Platform.OS == "ios"
          ? {
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.2,
              shadowRadius: 30,
            }
          : {
              elevation: 2,
            }),
      },
      textStyle: {
        textAlign: "center",
      },
    },
    incomingMessageBubbleStyles: {
      containerStyle: {
        padding: spacing.padding.p3,
        paddingBottom: spacing.padding.p0,
        backgroundColor: color.receiveBubbleBackground,
        borderRadius: spacing.radius.r3,
        alignSelf: "flex-start",
        minWidth: 90,
      },
      dateStyles: {
        containerStyle: {
          paddingTop: spacing.padding.p2,
          paddingBottom: spacing.padding.p2,
          paddingLeft: spacing.padding.p1,
        },
        textStyle: {
          color: color.receiveBubbleTimestamp,
          ...typography.caption2.regular,
          textAlign: "right",
          textTransform: "lowercase",
        },
      },
      textBubbleStyles: {
        textStyle: {
          fontFamily: typography.fontFamily,
          color: color.receiveBubbleText,
          ...typography.body.regular,
          //lineHeight: 16.8,
        },
        translatedTextStyle: {
          fontFamily: typography.fontFamily,
          color: color.receiveBubbleText,
          ...typography.body.regular,
          lineHeight: 16.8,
        },
        translatedTextContainerStyle: {
          marginBottom: spacing.margin.m1,
        },
        translatedTextDividerStyle: {
          height: 0.8,
          backgroundColor: color.iconSecondary,
          marginVertical: spacing.margin.m3,
        },
        mentionsStyle: {
          textStyle: {
            ...typography.body.bold,
            color: color.receiveBubbleTextHighlight,
          },
          selfTextStyle: {
            ...typography.body.bold,
            color: color.warning,
          },
        },
      },
      imageBubbleStyles: {
        containerStyle: {
          // Figma: padding 4px top/right/left, 0 bottom — leaves a thin bubble-color
          // frame around the media; the timestamp row sits flush under the grid.
          paddingTop: spacing.padding.p1,
          paddingRight: spacing.padding.p1,
          paddingBottom: spacing.padding.p0,
          paddingLeft: spacing.padding.p1,
          borderRadius: spacing.radius.r3,
          alignSelf: "flex-start",
        },
        imageStyle: {
          borderRadius: spacing.radius.r2,
          backgroundColor: color.background3,
          height: 232,
          width: 232,
        },
        dateReceiptContainerStyle: {
          // Figma: 2px gap between the media grid and the timestamp row.
          paddingTop: spacing.padding.p0_5,
          paddingRight: spacing.padding.p1,
          paddingBottom: spacing.padding.p1,
        },
      },
      assistantBubbleStyles: {
        containerStyle: {
          backgroundColor: "transparent",
          borderRadius: spacing.radius.r3,
          minWidth: 90,
          alignSelf: "flex-start",
          marginTop: -16,
        },
        textStyle: {
          fontFamily: typography.fontFamily,
          color: color.receiveBubbleText,
          ...typography.body.regular,
        },
        placeholderTextStyle: {
          fontFamily: typography.fontFamily,
          color: color.receiveBubbleText,
          ...typography.body.regular,
          opacity: 0.6,
        },
        copyButtonStyle: {
          backgroundColor: color.primary,
          padding: spacing.padding.p1,
          borderRadius: spacing.radius.r1,
        },
        errorContainerStyle: {
          backgroundColor: color.error,
          padding: spacing.padding.p2,
          borderRadius: spacing.radius.r2,
          marginTop: spacing.margin.m1,
        },
        errorTextStyle: {
          color: color.background1,
          fontFamily: typography.fontFamily,
          ...typography.caption1.regular,
        },
      },
      audioBubbleStyles: getAudioBubbleStyleLight(color, spacing, typography)
        .incomingAudioBubbleStyle,
      fileBubbleStyles: getFileBubbleStyleLight(color, spacing, typography).incomingFileBubbleStyle,
      threadedMessageStyles: {
        containerStyle: {
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: spacing.spacing.s1,
          marginTop: spacing.spacing.s1,
          paddingVertical: spacing.spacing.s0_5,
          paddingHorizontal: spacing.spacing.s1,
        },
        indicatorTextStyle: {
          ...typography.caption1.regular,
          textAlign: "right",
          color: color.neutral900,
          lineHeight: 12,
          paddingTop: spacing.padding.p0_5,
        },
        iconStyle: {
          height: 16,
          width: 16,
        },
        unreadCountStyle: {
          containerStyle: {
            height: 16,
            minWidth: 16,
            maxWidth: 40,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            borderRadius: spacing.radius.r5,
            backgroundColor: color.primary,
            paddingTop: 1,
            paddingRight: spacing.padding.p1,
            paddingBottom: 3,
            paddingLeft: spacing.padding.p1,
          },
          textStyle: {
            ...typography.caption2.regular,
            color: color.staticWhite,
          },
        },
      },
      avatarStyle: {
        containerStyle: {
          height: 32,
          width: 32,
        },
        textStyle: {
          textAlign: "center",
          textAlignVertical: "center",
          fontSize: typography.heading4.bold.fontSize,
          color: color.primaryButtonIcon,
          fontFamily: typography.fontFamily,
          ...typography.heading4.bold,
        },
        imageStyle: {
          height: "100%",
          width: "100%",
        },
      },
      senderNameTextStyles: {
        color: color.receiveBubbleTextHighlight,
        ...typography.caption1.regular,
      },
      stickerBubbleStyles: getStickerStyleLight(color, spacing, typography),
      collaborativeBubbleStyles: getCollabBubbleStyleLight(color, spacing, typography)
        .incomingBubbleStyle,
      meetCallBubbleStyles: getGroupCallBubbleStyle(color, spacing, typography).incomingBubbleStyle,
      videoBubbleStyles: getVideoBubbleStylesLight(color, spacing, typography).incomingBubbleStyle,
      pollBubbleStyles: getPollBubbleStyleLight(color, spacing, typography).incomingBubbleStyle,
      reactionStyles: getReactionsStyleLight(color, spacing, typography).incomingBubbleStyle,
      linkPreviewBubbleStyles: getLinkPreviewBubbleStyleLight(color, spacing, typography)
        .incomingBubbleStyle,
      deletedBubbleStyles: getDeletedBubbleStyle(color, spacing, typography).incomingBubbleStyle,
    },
    outgoingMessageBubbleStyles: {
      containerStyle: {
        padding: spacing.padding.p3,
        paddingBottom: spacing.padding.p0,
        backgroundColor: color.sendBubbleBackground,
        borderRadius: spacing.radius.r3,
        minWidth: 90,
      },
      moderationStyle: {
        containerStyle: {
          backgroundColor: "#F9EAEF",
          paddingVertical: 6,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          flexDirection: "row",
          alignItems: "center",
        },
        textStyle: {
          color: color?.error,
          ...typography?.body?.regular,
          flexShrink: 1,
          paddingHorizontal: 2,
          alignSelf: "center",
        },
        iconTintColor: color?.error,
      },
      dateStyles: {
        containerStyle: {
          paddingTop: spacing.padding.p2,
          paddingBottom: spacing.padding.p2,
          paddingHorizontal: spacing.padding.p1,
        },
        textStyle: {
          color: color.sendBubbleTimestamp,
          ...typography.caption2.regular,
          textAlign: "right",
          textTransform: "lowercase",
        },
      },
      receiptStyles: {
        sentIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.iconSecondary,
        },
        waitIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.iconSecondary,
        },
        deliveredIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.iconSecondary,
        },
        readIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.success,
        },
        errorIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.error,
        },
      },
      textBubbleStyles: {
        textStyle: {
          fontFamily: typography.fontFamily,
          color: color.sendBubbleText,
          ...typography.body.regular,
          //lineHeight: 16.8,
        },
        translatedTextStyle: {
          fontFamily: typography.fontFamily,
          color: color.sendBubbleText,
          ...typography.body.regular,
          lineHeight: 16.8,
        },
        translatedTextContainerStyle: {
          marginBottom: spacing.margin.m1,
        },
        translatedTextDividerStyle: {
          height: 0.8,
          backgroundColor: color.iconSecondary,
          marginVertical: spacing.margin.m3,
        },
        mentionsStyle: {
          textStyle: {
            ...typography.body.bold,
            color: color.sendBubbleTextHighlight,
          },
          selfTextStyle: {
            ...typography.body.bold,
            color: color.warning,
          },
        },
      },
      imageBubbleStyles: {
        containerStyle: {
          // Figma: padding 4px top/right/left, 0 bottom — leaves a thin bubble-color
          // frame around the media; the timestamp row sits flush under the grid.
          paddingTop: spacing.padding.p1,
          paddingRight: spacing.padding.p1,
          paddingBottom: spacing.padding.p0,
          paddingLeft: spacing.padding.p1,
          borderRadius: spacing.radius.r3,
          overflow: "hidden",
        },
        imageStyle: {
          borderRadius: spacing.radius.r2,
          backgroundColor: color.background3,
          height: 232,
          width: '100%',
          minWidth: 232,
        },
        dateReceiptContainerStyle: {
          // Figma: 2px gap between the media grid and the timestamp row.
          paddingTop: spacing.padding.p0_5,
          paddingRight: spacing.padding.p1,
          paddingBottom: spacing.padding.p1,
        },
      },
      audioBubbleStyles: getAudioBubbleStyleLight(color, spacing, typography)
        .outgoingAudioBubbleStyle,
      fileBubbleStyles: getFileBubbleStyleLight(color, spacing, typography).outgoingFileBubbleStyle,
      threadedMessageStyles: {
        containerStyle: {
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: spacing.spacing.s1,
          marginTop: spacing.spacing.s1,
          paddingVertical: spacing.spacing.s0_5,
          paddingHorizontal: spacing.spacing.s1,
        },
        indicatorTextStyle: {
          ...typography.caption1.regular,
          textAlign: "right",
          color: color.neutral900,
          lineHeight: 12,
          paddingTop: spacing.padding.p0_5,
        },
        iconStyle: {
          height: 16,
          width: 16,
        },
        unreadCountStyle: {
          containerStyle: {
            height: 16,
            minWidth: 16,
            maxWidth: 40,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            borderRadius: spacing.radius.r5,
            backgroundColor: color.primary,
            paddingTop: 1,
            paddingRight: spacing.padding.p1,
            paddingBottom: 3,
            paddingLeft: spacing.padding.p1,
          },
          textStyle: {
            ...typography.caption2.regular,
            color: color.staticWhite,
          },
        },
      },
      avatarStyle: {
        containerStyle: {
          height: 32,
          width: 32,
        },
        textStyle: {
          textAlign: "center",
          textAlignVertical: "center",
          fontSize: typography.heading4.bold.fontSize,
          color: color.primaryButtonIcon,
          fontFamily: typography.fontFamily,
          ...typography.heading4.bold,
        },
        imageStyle: {
          height: "100%",
          width: "100%",
        },
      },
      senderNameTextStyles: {
        color: color.receiveBubbleTextHighlight,
        ...typography.caption1.regular,
      },
      stickerBubbleStyles: getStickerStyleLight(color, spacing, typography),
      collaborativeBubbleStyles: getCollabBubbleStyleLight(color, spacing, typography)
        .outgoingBubbleStyle,
      meetCallBubbleStyles: getGroupCallBubbleStyle(color, spacing, typography).outgoingBubbleStyle,
      videoBubbleStyles: getVideoBubbleStylesLight(color, spacing, typography).outgoingBubbleStyle,
      pollBubbleStyles: getPollBubbleStyleLight(color, spacing, typography).outgoingBubbleStyle,
      reactionStyles: getReactionsStyleLight(color, spacing, typography).outgoingBubbleStyle,
      linkPreviewBubbleStyles: getLinkPreviewBubbleStyleLight(color, spacing, typography)
        .outgoingBubbleStyle,
      deletedBubbleStyles: getDeletedBubbleStyle(color, spacing, typography).outgoingBubbleStyle,
    },
    groupActionBubbleStyles: groupActionBubbleStyles(color, spacing, typography),
    messageInformationStyles: getMessageInormationListStyleLight(color, spacing, typography),
    messageOptionsStyles: getMessageOptionsStyle(color, spacing, typography),
    callActionBubbleStyles: getCallActionBubbleStyle(color, spacing, typography),
  };
};

export const getMessageListStylesDark = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): CometChatTheme["messageListStyles"] => {
  return {
    containerStyle: {
      backgroundColor: color.background3,
      flex: 1,
    },
    scrollToBottomButtonStyle: {
      containerStyle: {
        position: "absolute",
        zIndex: 1,
        paddingVertical: spacing.padding.p3,
        paddingHorizontal: spacing.padding.p3,
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: color.background3,
        right: 10,
        bottom: 2,
        gap: spacing.padding.p1,
        borderRadius: spacing.radius.max,
        borderWidth: 1,
        borderColor: color.borderDefault,
        ...(Platform.OS == "ios"
          ? {
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.2,
              shadowRadius: 16,
            }
          : {
              elevation: 4,
            }),
      },
      iconContainerStyle: {},
      iconStyle: {
        height: 24,
        width: 24,
        tintColor: color.iconSecondary,
      },
      unreadCountBadgeStyle: {
        containerStyle: {
          height: 20,
          minWidth: 20,
          maxWidth: 40,
          backgroundColor: color.primary,
          borderRadius: spacing.radius.r5,
          paddingVertical: spacing.padding.p0_5,
          paddingHorizontal: spacing.padding.p1,
        },
        textStyle: {
          ...typography.caption1.regular,
          textAlign: "center",
          color: color.primaryButtonIcon,
        },
      },
    },
    emptyStateStyle: {
      containerStyle: {
        backgroundColor: color.background2,
        marginTop: spacing.margin.m0,
        height: "100%",
        width: "100%",
      },
    },
    errorStateStyle: {
      containerStyle: {
        backgroundColor: color.background2,
        marginTop: spacing.margin.m0,
        height: "100%",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: "10%",
      },
      iconContainerStyle: {
        marginBottom: spacing.margin.m5,
      },
      titleStyle: {
        color: color.textPrimary,
        ...typography.heading3.bold,
        marginBottom: spacing.margin.m1,
      },
      subtitleStyle: {
        color: color.textSecondary,
        textAlign: "center",
        ...typography.body.regular,
      },
    },
    dateSeparatorStyle: {
      containerStyle: {
        borderColor: color.borderDark,
        backgroundColor: color.staticBlack,
        ...(Platform.OS == "ios"
          ? {
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.2,
              shadowRadius: 30,
            }
          : {
              elevation: 2,
            }),
      },
      textStyle: {
        textAlign: "center",
      },
    },
    incomingMessageBubbleStyles: {
      containerStyle: {
        padding: spacing.padding.p3,
        paddingBottom: spacing.padding.p0,
        backgroundColor: color.receiveBubbleBackground,
        borderRadius: spacing.radius.r3,
        alignSelf: "flex-start",
        minWidth: 90,
      },
      dateStyles: {
        containerStyle: {
          paddingTop: spacing.padding.p2,
          paddingBottom: spacing.padding.p2,
          paddingLeft: spacing.padding.p1,
        },
        textStyle: {
          color: color.receiveBubbleTimestamp,
          ...typography.caption2.regular,
          textAlign: "right",
          textTransform: "lowercase",
        },
      },
      textBubbleStyles: {
        textStyle: {
          fontFamily: typography.fontFamily,
          color: color.receiveBubbleText,
          ...typography.body.regular,
          //lineHeight: 16.8,
        },
        translatedTextStyle: {
          fontFamily: typography.fontFamily,
          color: color.receiveBubbleText,
          ...typography.body.regular,
          lineHeight: 16.8,
        },
        translatedTextContainerStyle: {
          marginBottom: spacing.margin.m1,
        },
        translatedTextDividerStyle: {
          height: 0.8,
          backgroundColor: color.iconSecondary,
          marginVertical: spacing.margin.m3,
        },
        mentionsStyle: {
          textStyle: {
            ...typography.body.bold,
            color: color.receiveBubbleTextHighlight,
          },
          selfTextStyle: {
            ...typography.body.bold,
            color: color.warning,
          },
        },
      },
      imageBubbleStyles: {
        containerStyle: {
          // Figma: padding 4px top/right/left, 0 bottom — leaves a thin bubble-color
          // frame around the media; the timestamp row sits flush under the grid.
          paddingTop: spacing.padding.p1,
          paddingRight: spacing.padding.p1,
          paddingBottom: spacing.padding.p0,
          paddingLeft: spacing.padding.p1,
          borderRadius: spacing.radius.r3,
          alignSelf: "flex-start",
        },
        imageStyle: {
          borderRadius: spacing.radius.r2,
          backgroundColor: color.background3,
          height: 232,
          width: 232,
        },
        dateReceiptContainerStyle: {
          // Figma: 2px gap between the media grid and the timestamp row.
          paddingTop: spacing.padding.p0_5,
          paddingRight: spacing.padding.p1,
          paddingBottom: spacing.padding.p1,
        },
      },
      assistantBubbleStyles: {
        containerStyle: {
          backgroundColor: "transparent",
          borderRadius: spacing.radius.r3,
          minWidth: 90,
          alignSelf: "flex-start",
          marginTop: -14,
        },
        textStyle: {
          fontFamily: typography.fontFamily,
          color: color.receiveBubbleText,
          ...typography.body.regular,
        },
        placeholderTextStyle: {
          fontFamily: typography.fontFamily,
          color: color.receiveBubbleText,
          ...typography.body.regular,
          opacity: 0.6,
        },
        copyButtonStyle: {
          backgroundColor: color.primary,
          padding: spacing.padding.p1,
          borderRadius: spacing.radius.r1,
        },
        errorContainerStyle: {
          backgroundColor: color.error,
          padding: spacing.padding.p2,
          borderRadius: spacing.radius.r2,
          marginTop: spacing.margin.m1,
        },
        errorTextStyle: {
          color: color.background1,
          fontFamily: typography.fontFamily,
          ...typography.caption1.regular,
        },
      },
      audioBubbleStyles: getAudioBubbleStyleDark(color, spacing, typography)
        .incomingAudioBubbleStyle,
      fileBubbleStyles: getFileBubbleStyleDark(color, spacing, typography).incomingFileBubbleStyle,
      stickerBubbleStyles: getStickerStyleDark(color, spacing, typography),
      collaborativeBubbleStyles: getCollabBubbleStyleDark(color, spacing, typography)
        .incomingBubbleStyle,
      meetCallBubbleStyles: getGroupCallBubbleStyle(color, spacing, typography).incomingBubbleStyle,
      videoBubbleStyles: getVideoBubbleStylesDark(color, spacing, typography).incomingBubbleStyle,
      pollBubbleStyles: getPollBubbleStyleDark(color, spacing, typography).incomingBubbleStyle,
      reactionStyles: getReactionsStyleDark(color, spacing, typography).incomingBubbleStyle,
      linkPreviewBubbleStyles: getLinkPreviewBubbleStyleDark(color, spacing, typography)
        .incomingBubbleStyle,
      threadedMessageStyles: {
        containerStyle: {
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: spacing.spacing.s1,
          marginTop: spacing.spacing.s1,
          paddingVertical: spacing.spacing.s0_5,
          paddingHorizontal: spacing.spacing.s1,
        },
        indicatorTextStyle: {
          ...typography.caption1.regular,
          textAlign: "right",
          color: color.staticWhite,
          lineHeight: 12,
          paddingTop: spacing.padding.p0_5,
        },
        iconStyle: {
          height: 16,
          width: 16,
        },
        unreadCountStyle: {
          containerStyle: {
            height: 16,
            minWidth: 16,
            maxWidth: 40,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            borderRadius: spacing.radius.r5,
            backgroundColor: color.primary,
            paddingTop: 1,
            paddingRight: spacing.padding.p1,
            paddingBottom: 3,
            paddingLeft: spacing.padding.p1,
          },
          textStyle: {
            ...typography.caption2.regular,
            color: color.staticWhite,
          },
        },
      },
      deletedBubbleStyles: getDeletedBubbleStyle(color, spacing, typography).incomingBubbleStyle,
      avatarStyle: {
        containerStyle: {
          height: 32,
          width: 32,
        },
        textStyle: {
          textAlign: "center",
          textAlignVertical: "center",
          fontSize: typography.heading4.bold.fontSize,
          color: color.primaryButtonIcon,
          fontFamily: typography.fontFamily,
          ...typography.heading4.bold,
        },
        imageStyle: {
          height: "100%",
          width: "100%",
        },
      },
      senderNameTextStyles: {
        color: color.receiveBubbleTextHighlight,
        ...typography.caption1.regular,
      },
    },
    outgoingMessageBubbleStyles: {
      containerStyle: {
        padding: spacing.padding.p3,
        paddingBottom: spacing.padding.p0,
        backgroundColor: color.sendBubbleBackground,
        borderRadius: spacing.radius.r3,
        minWidth: 90,
      },
      moderationStyle: {
        containerStyle: {
          backgroundColor: "#3A0C05",
          paddingVertical: 6,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          flexDirection: "row",
          alignItems: "center",
          overflow: 'hidden',
        },
        textStyle: {
          color: color?.error,
          ...typography?.body?.regular,
          flexShrink: 1,
          paddingHorizontal: 2,
          alignSelf: "center",
        },
        iconTintColor: color?.error,
      },
      dateStyles: {
        containerStyle: {
          paddingTop: spacing.padding.p2,
          paddingBottom: spacing.padding.p2,
          paddingHorizontal: spacing.padding.p1,
        },
        textStyle: {
          color: color.sendBubbleTimestamp,
          ...typography.caption2.regular,
          textAlign: "right",
          textTransform: "lowercase",
        },
      },
      receiptStyles: {
        sentIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.iconSecondary,
        },
        waitIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.iconSecondary,
        },
        deliveredIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.iconSecondary,
        },
        readIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.success,
        },
        errorIconStyle: {
          marginTop: spacing.margin.m1,
          marginBottom: spacing.margin.m1,
          tintColor: color.error,
        },
      },
      textBubbleStyles: {
        textStyle: {
          fontFamily: typography.fontFamily,
          color: color.sendBubbleText,
          ...typography.body.regular,
          //lineHeight: 16.8,
        },
        translatedTextStyle: {
          fontFamily: typography.fontFamily,
          color: color.sendBubbleText,
          ...typography.body.regular,
          lineHeight: 16.8,
        },
        translatedTextContainerStyle: {
          marginBottom: spacing.margin.m1,
        },
        translatedTextDividerStyle: {
          height: 0.8,
          backgroundColor: color.iconSecondary,
          marginVertical: spacing.margin.m3,
        },
        mentionsStyle: {
          textStyle: {
            ...typography.body.bold,
            color: color.sendBubbleTextHighlight,
          },
          selfTextStyle: {
            ...typography.body.bold,
            color: color.warning,
          },
        },
      },
      imageBubbleStyles: {
        containerStyle: {
          // Figma: padding 4px top/right/left, 0 bottom — leaves a thin bubble-color
          // frame around the media; the timestamp row sits flush under the grid.
          paddingTop: spacing.padding.p1,
          paddingRight: spacing.padding.p1,
          paddingBottom: spacing.padding.p0,
          paddingLeft: spacing.padding.p1,
          borderRadius: spacing.radius.r3,
          overflow: "hidden",
        },
        imageStyle: {
          borderRadius: spacing.radius.r2,
          backgroundColor: color.background3,
          height: 232,
          width: '100%',
          minWidth: 232,
        },
        dateReceiptContainerStyle: {
          // Figma: 2px gap between the media grid and the timestamp row.
          paddingTop: spacing.padding.p0_5,
          paddingRight: spacing.padding.p1,
          paddingBottom: spacing.padding.p1,
        },
      },
      audioBubbleStyles: getAudioBubbleStyleDark(color, spacing, typography)
        .outgoingAudioBubbleStyle,
      fileBubbleStyles: getFileBubbleStyleDark(color, spacing, typography).outgoingFileBubbleStyle,
      stickerBubbleStyles: getStickerStyleDark(color, spacing, typography),
      collaborativeBubbleStyles: getCollabBubbleStyleDark(color, spacing, typography)
        .outgoingBubbleStyle,
      meetCallBubbleStyles: getGroupCallBubbleStyle(color, spacing, typography).outgoingBubbleStyle,
      videoBubbleStyles: getVideoBubbleStylesDark(color, spacing, typography).outgoingBubbleStyle,
      pollBubbleStyles: getPollBubbleStyleDark(color, spacing, typography).outgoingBubbleStyle,
      reactionStyles: getReactionsStyleDark(color, spacing, typography).outgoingBubbleStyle,
      linkPreviewBubbleStyles: getLinkPreviewBubbleStyleDark(color, spacing, typography)
        .outgoingBubbleStyle,
      threadedMessageStyles: {
        containerStyle: {
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: spacing.spacing.s1,
          marginTop: spacing.spacing.s1,
          paddingVertical: spacing.spacing.s0_5,
          paddingHorizontal: spacing.spacing.s1,
        },
        indicatorTextStyle: {
          ...typography.caption1.regular,
          textAlign: "right",
          color: color.staticWhite,
          lineHeight: 12,
          paddingTop: spacing.padding.p0_5,
        },
        iconStyle: {
          height: 16,
          width: 16,
        },
        unreadCountStyle: {
          containerStyle: {
            height: 16,
            minWidth: 16,
            maxWidth: 40,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            borderRadius: spacing.radius.r5,
            backgroundColor: color.primary,
            paddingTop: 1,
            paddingRight: spacing.padding.p1,
            paddingBottom: 3,
            paddingLeft: spacing.padding.p1,
          },
          textStyle: {
            ...typography.caption2.regular,
            color: color.staticWhite,
          },
        },
      },
      avatarStyle: {
        containerStyle: {
          height: 32,
          width: 32,
        },
        textStyle: {
          textAlign: "center",
          textAlignVertical: "center",
          fontSize: typography.heading4.bold.fontSize,
          color: color.primaryButtonIcon,
          fontFamily: typography.fontFamily,
          ...typography.heading4.bold,
        },
        imageStyle: {
          height: "100%",
          width: "100%",
        },
      },
      senderNameTextStyles: {
        color: color.receiveBubbleTextHighlight,
        ...typography.caption1.regular,
      },
      deletedBubbleStyles: getDeletedBubbleStyle(color, spacing, typography).outgoingBubbleStyle,
    },
    groupActionBubbleStyles: groupActionBubbleStyles(color, spacing, typography),
    messageInformationStyles: getMessageInormationListStyleDark(color, spacing, typography),
    messageOptionsStyles: getMessageOptionsStyle(color, spacing, typography),
    callActionBubbleStyles: getCallActionBubbleStyle(color, spacing, typography),
  };
};
