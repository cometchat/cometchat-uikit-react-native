import { getCallButtonStyle } from "../../calls/CometChatCallButtons/style";
import { getCallLogsItemStyle, getCallLogsStyleLight, getCallLogsStyleDark } from "../../calls/CometChatCallLogs/style";
import { getIncomingCallStyle } from "../../calls/CometChatIncomingCall/style";
import { getOutgoingCallStyle } from "../../calls/CometChatOutgoingCall";
import {
  getConversationStyleDark,
  getConversationStyleLight,
} from "../../CometChatConversations/style";
import {
  getNotificationFeedStyleDark,
  getNotificationFeedStyleLight,
} from "../../CometChatNotificationFeed/style";
import {
  getGroupMemberStyleDark,
  getGroupMemberStyleLight,
} from "../../CometChatGroupMembers/style";
import { getGroupListStyleLight, getUserGroupStyleDark } from "../../CometChatGroups/GroupsStyle";
import { getComposerStyle } from "../../CometChatMessageComposer/styles";
import { getMessageHeaderStyle } from "../../CometChatMessageHeader/styles";
import {
  getMessageInormationListStyleDark,
  getMessageInormationListStyleLight,
} from "../../CometChatMessageInformation/styles";
import {
  getMessageListStylesDark,
  getMessageListStylesLight,
} from "../../CometChatMessageList/style";
import {
  getThreadHeaderStyleDark,
  getThreadHeaderStyleLight,
} from "../../CometChatThreadHeader/style";
import { getUserListStyleDark, getUserListStyleLight } from "../../CometChatUsers/style";
import { getAvatarStyle } from "../../shared/views/CometChatAvatar/styles";
import { getBadgeStyle } from "../../shared/views/CometChatBadge";
import {
  getConfirmDialogStyleDark,
  getConfirmDialogStyleLight,
} from "../../shared/views/CometChatConfirmDialog/style";
import { getDateStyleDark, getDateStyleLight } from "../../shared/views/CometChatDate";
import {
  getQuickReactionStyleDark,
  getQuickReactionStyleLight,
} from "../../shared/views/CometChatQuickReactions/QuickReactionsStyle";
import {
  getReactionListStyleDark,
  getReactionListStyleLight,
} from "../../shared/views/CometChatReactionList/ReactionListStyle";
import { getMessageReceiptStyle } from "../../shared/views/CometChatReceipt/style";
import { getStatusIndicatorStyles } from "../../shared/views/CometChatStatusIndicator/styles";
import {
  getMentionsListStyleDark,
  getMentionsListStyleLight,
} from "../../shared/views/CometChatSuggestionList/style";
import { ActionSheetStyle, CometChatTheme } from "../type";
import { defaultColorDark } from "./color/dark";
import { defaultColorLight } from "./color/light";
import { defaultSpacing } from "./spacing";
import { defaultTypography } from "./typography";
import { DeepPartial } from "../../shared/helper/types";
import { getMediaRecorderStyle } from "../../shared/views/CometChatMediaRecorder/style";
import { getDateSeparatorStyleDark, getDateSeparatorStyleLight } from "../../shared/views/CometChatDateSeperator";
import { getReportDialogStyleDark, getReportDialogStyleLight } from "../../shared/views/CometChatReportDialog/style";

const getActionSheetStyle = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): ActionSheetStyle => {
  return {
    optionsItemStyle: {
      containerStyle: {
        paddingVertical: spacing.padding.p3,
        paddingHorizontal: spacing.padding.p8,
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

const getAIOptionsStyle = (
  color: CometChatTheme["color"],
  spacing: CometChatTheme["spacing"],
  typography: CometChatTheme["typography"]
): ActionSheetStyle => {
  return {
    optionsItemStyle: {
      containerStyle: {
        padding: spacing.padding.p4,
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

export const lightThemeMaker = (
  spacing: CometChatTheme["spacing"],
  color: CometChatTheme["color"],
  typography: CometChatTheme["typography"]
): DeepPartial<CometChatTheme> => {
  return {
    mode:'light',
    spacing: spacing,
    color: color,
    typography: typography,
    avatarStyle: getAvatarStyle(color, spacing, typography),
    receiptStyles: getMessageReceiptStyle(color, spacing, typography),
    statusIndicatorStyle: getStatusIndicatorStyles(color, spacing, typography),
    badgeStyle: getBadgeStyle(color, spacing, typography),
    dateStyles: getDateStyleLight(color, spacing, typography),
    dateSeparatorStyles: getDateSeparatorStyleLight(color, spacing, typography),
    conversationStyles: getConversationStyleLight(color, spacing, typography),
    notificationFeedStyles: getNotificationFeedStyleLight(color, spacing, typography),
    confirmDialogStyles: getConfirmDialogStyleLight(color, spacing, typography),
    reportDialogStyles: getReportDialogStyleLight(color, spacing, typography),
    messageHeaderStyles: getMessageHeaderStyle(color, spacing, typography),
    messageComposerStyles: getComposerStyle(color, spacing, typography),
    userStyles: getUserListStyleLight(color, spacing, typography),
    groupStyles: getGroupListStyleLight(color, spacing, typography),
    groupMemberStyle: getGroupMemberStyleLight(color, spacing, typography),
    callButtonStyles: getCallButtonStyle(color, spacing, typography),
    messageListStyles: getMessageListStylesLight(color, spacing, typography),
    reactionListStyles: getReactionListStyleLight(color, spacing, typography),
    messageInformationStyles: getMessageInormationListStyleLight(color, spacing, typography),
    actionSheetStyle: getActionSheetStyle(color, spacing, typography),
    mentionsListStyle: getMentionsListStyleLight(color, spacing, typography),
    threadHeaderStyles: getThreadHeaderStyleLight(color, spacing, typography),
    aiOptionsStyle: getAIOptionsStyle(color, spacing, typography),
    quickReactionStyle: getQuickReactionStyleLight(color, spacing, typography),
    outgoingCallStyle: getOutgoingCallStyle(color, spacing, typography),
    incomingCallStyle: getIncomingCallStyle(color, spacing, typography),
    callLogsStyles: getCallLogsStyleLight(color, spacing, typography),
    callLogsItemStyle: getCallLogsItemStyle(color, spacing, typography),
    mediaRecorderStyle: getMediaRecorderStyle(color, spacing, typography),
  };
};

export const darkThemeMaker = (
  spacing: CometChatTheme["spacing"],
  color: CometChatTheme["color"],
  typography: CometChatTheme["typography"]
): DeepPartial<CometChatTheme> => {
  return {
    mode:'dark',
    spacing: spacing,
    color: color,
    typography: typography,
    avatarStyle: getAvatarStyle(color, spacing, typography),
    receiptStyles: getMessageReceiptStyle(color, spacing, typography),
    statusIndicatorStyle: getStatusIndicatorStyles(color, spacing, typography),
    badgeStyle: getBadgeStyle(color, spacing, typography),
    dateStyles: getDateStyleDark(color, spacing, typography),
    dateSeparatorStyles: getDateSeparatorStyleDark(color, spacing, typography),
    conversationStyles: getConversationStyleDark(color, spacing, typography),
    notificationFeedStyles: getNotificationFeedStyleDark(color, spacing, typography),
    confirmDialogStyles: getConfirmDialogStyleDark(color, spacing, typography),
    reportDialogStyles: getReportDialogStyleDark(color, spacing, typography),
    messageHeaderStyles: getMessageHeaderStyle(color, spacing, typography),
    messageComposerStyles: getComposerStyle(color, spacing, typography),
    userStyles: getUserListStyleDark(color, spacing, typography),
    groupMemberStyle: getGroupMemberStyleDark(color, spacing, typography),
    groupStyles: getUserGroupStyleDark(color, spacing, typography),
    callButtonStyles: getCallButtonStyle(color, spacing, typography),
    messageListStyles: getMessageListStylesDark(color, spacing, typography),
    reactionListStyles: getReactionListStyleDark(color, spacing, typography),
    messageInformationStyles: getMessageInormationListStyleDark(color, spacing, typography),
    actionSheetStyle: getActionSheetStyle(color, spacing, typography),
    mentionsListStyle: getMentionsListStyleDark(color, spacing, typography),
    threadHeaderStyles: getThreadHeaderStyleDark(color, spacing, typography),
    aiOptionsStyle: getAIOptionsStyle(color, spacing, typography),
    quickReactionStyle: getQuickReactionStyleDark(color, spacing, typography),
    outgoingCallStyle: getOutgoingCallStyle(color, spacing, typography),
    incomingCallStyle: getIncomingCallStyle(color, spacing, typography),
    callLogsStyles: getCallLogsStyleDark(color, spacing, typography),
    callLogsItemStyle: getCallLogsItemStyle(color, spacing, typography),
    mediaRecorderStyle: getMediaRecorderStyle(color, spacing, typography),
  };
};

export const defaultLightTheme: DeepPartial<CometChatTheme> = lightThemeMaker(
  defaultSpacing,
  defaultColorLight,
  defaultTypography
);
export const defaultDarkTheme: DeepPartial<CometChatTheme> = darkThemeMaker(
  defaultSpacing,
  defaultColorDark,
  defaultTypography
);
