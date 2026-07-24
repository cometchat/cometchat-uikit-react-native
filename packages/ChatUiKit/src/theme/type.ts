import { ColorValue, ImageSourcePropType, ImageStyle, TextStyle, ViewStyle } from "react-native";
import { CallButtonStyle } from "../calls/CometChatCallButtons";
import { ConversationStyle } from "../CometChatConversations/style";
import { GroupMemberStyle } from "../CometChatGroupMembers/style";
import { GroupStyle } from "../CometChatGroups/GroupsStyle";
import { MessageComposerStyle } from "../CometChatMessageComposer/styles";
import { MessageHeaderStyle } from "../CometChatMessageHeader/styles";
import { UserStyle } from "../CometChatUsers/style";
import { AvatarStyle } from "../shared/views/CometChatAvatar";
import { BadgeStyle } from "../shared/views/CometChatBadge";
import { ConfirmDialogStyle } from "../shared/views/CometChatConfirmDialog/style";
import { DateStyle } from "../shared/views/CometChatDate";
import { DeletedBubbleStyle } from "../shared/views/CometChatDeletedBubble";
import { ReceiptStyles } from "../shared/views/CometChatReceipt/style";
import { StatusIndicatorStyles } from "../shared/views/CometChatStatusIndicator";
import { Color, Spacing, Typography } from "./default";
import { OutgoingCallStyle } from "../calls/CometChatOutgoingCall";
import { IncomingCallStyle } from "../calls/CometChatIncomingCall/style";
import { GroupCallBubbleStyles } from "../calls/CometChatCallBubble";
import { CallActionBubbleStyles } from "../calls/CometChatCallBubble/styles";
import { CallLogsItemStyle, CallLogsStyle } from "../calls/CometChatCallLogs/style";
import { DeepPartial } from "../shared/helper/types";
import { DateSeparatorStyle } from "../shared/views/CometChatDateSeperator/styles";
import { JSX } from "react";
import { ChatHistoryStyle } from "../CometChatAIAssistantChatHistory/style";
import { ReportDialogStyle } from "../shared/views/CometChatReportDialog/style";
import { NotificationFeedStyle } from "../CometChatNotificationFeed/style";

export type BubbleStyles = {
  containerStyle: ViewStyle;
  threadedMessageStyles: DeepPartial<CometChatTheme["threadedMessageStyles"]>;
  avatarStyle: DeepPartial<CometChatTheme["avatarStyle"]>;
  receiptStyles: DeepPartial<CometChatTheme["receiptStyles"]>;
  reactionStyles: DeepPartial<CometChatTheme["messageBubbleReactionStyles"]>;
  dateStyles: DeepPartial<CometChatTheme["dateStyles"]>;
  dateReceiptContainerStyle: ViewStyle;
  senderNameTextStyles: TextStyle;
  textBubbleStyles?: DeepPartial<CometChatTheme["textBubbleStyles"]>;
  assistantBubbleStyles?: DeepPartial<CometChatTheme["assistantBubbleStyles"]>;
  imageBubbleStyles?: DeepPartial<CometChatTheme["imageBubbleStyles"]>;
  videoBubbleStyles?: DeepPartial<CometChatTheme["videoBubbleStyles"]>;
  audioBubbleStyles?: DeepPartial<CometChatTheme["audioBubbleStyles"]>;
  deletedBubbleStyles?: DeepPartial<CometChatTheme["deletedBubbleStyles"]>;
  fileBubbleStyles?: DeepPartial<CometChatTheme["fileBubbleStyles"]>;
  collaborativeBubbleStyles?: DeepPartial<CometChatTheme["collaborativeBubbleStyles"]>;
  meetCallBubbleStyles?: DeepPartial<CometChatTheme["meetCallBubbleStyles"]>;
  stickerBubbleStyles?: DeepPartial<CometChatTheme["stickerBubbleStyles"]>;
  pollBubbleStyles?: DeepPartial<CometChatTheme["pollBubbleStyles"]>;
  linkPreviewBubbleStyles?: DeepPartial<CometChatTheme["linkPreviewBubbleStyles"]>;
};

export type OutgoingBubbleStyles = Omit<BubbleStyles, 'assistantBubbleStyles'> & {
  moderationStyle?: {
    containerStyle?: ViewStyle;
    textStyle?: TextStyle;
    iconTintColor?: ColorValue;
  };
};

export type ActionSheetStyle = {
  optionsItemStyle: {
    containerStyle: ViewStyle;
    iconStyle: ImageStyle;
    iconContainerStyle: ViewStyle;
    titleStyle: TextStyle;
  };
};

export type SuggestionListStyle = {
  containerStyle: ViewStyle;
  listItemStyle: {
    containerStyle: ViewStyle;
    titleStyle: TextStyle;
    avatarStyle: CometChatTheme["avatarStyle"];
  };
  skeletonStyle: {
    linearGradientColors: [string, string];
    shimmerBackgroundColor: ColorValue;
    shimmerOpacity: number;
    speed: number;
  };
};
export interface CometChatTheme {
  mode: string;
  spacing: Spacing;
  color: Color;
  typography: Typography;
  // buttonStyles: {
  //   containerStyle: ViewStyle;
  //   textStyle: TextStyle;
  //   imageStyle: ImageStyle;
  // };
  // iconStyles: {
  //   imageStyle: ImageStyle;
  //   imageSource: ImageSourcePropType;
  // };
  // searchInputStyles: {
  //   containerStyle: ViewStyle;
  //   textStyle: TextStyle;
  //   placeholderTextColor: TextInputProps["placeholderTextColor"];
  // };

  messageHeaderStyles: MessageHeaderStyle;
  callButtonStyles: CallButtonStyle;
  deletedBubbleStyles?: DeletedBubbleStyle;
  messageComposerStyles: DeepPartial<MessageComposerStyle>;
  userStyles: UserStyle;
  chatHistoryStyles: ChatHistoryStyle;
  groupStyles: GroupStyle;
  groupMemberStyle: GroupMemberStyle;
  //messageOptionsStyles: ActionSheetStyle;
  //attachmentOptionsStyles: ActionSheetStyle;
  actionSheetStyle: ActionSheetStyle;
  aiOptionsStyle: ActionSheetStyle;
  mentionsListStyle: SuggestionListStyle;
  outgoingCallStyle: OutgoingCallStyle;
  incomingCallStyle: IncomingCallStyle;
  callLogsItemStyle: CallLogsItemStyle;

  receiptStyles: ReceiptStyles;
  mediaRecorderStyle: {
    animationStyle: {
      innerAnimationContainerStyle: ViewStyle;
      outerAnimationContainerStyle: ViewStyle;
      animatedIconStyle?: {
        icon?: JSX.Element | ImageSourcePropType;
        iconStyle?: ImageStyle;
        containerStyle?: ViewStyle;
      };
    };
    recordIconStyle?: {
      icon?: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
      containerStyle?: ViewStyle;
    };
    playIconStyle?: {
      icon?: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
      containerStyle?: ViewStyle;
    };
    pauseIconStyle?: {
      icon?: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
      containerStyle?: ViewStyle;
    };
    deleteIconStyle?: {
      icon?: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
      containerStyle?: ViewStyle;
    };
    stopIconStyle?: {
      icon?: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
      containerStyle?: ViewStyle;
    };
    sendIconStyle?: {
      icon?: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
      containerStyle?: ViewStyle;
    };
  };
  threadedMessageStyles?: {
    containerStyle: ViewStyle;
    indicatorTextStyle: TextStyle;
    iconStyle: ImageStyle;
    icon: ImageSourcePropType | JSX.Element;
    unreadCountStyle: {
      containerStyle: ViewStyle;
      textStyle: TextStyle;
    };
  };
  messageBubbleReactionStyles?: {
    reactionContainerStyle: ViewStyle;
    emojiStyle: {
      containerStyle: ViewStyle;
      emojitextStyle: TextStyle;
      emojiCountTextStyle: TextStyle;
    };
    activeEmojiStyle: {
      containerStyle: ViewStyle;
      emojitextStyle: TextStyle;
      emojiCountTextStyle: TextStyle;
    };
    extraReactionStyle: {
      containerStyle: ViewStyle;
      countTextStyle: TextStyle;
      activeContainerStyle: ViewStyle;
      activeCountTextStyle: TextStyle;
    };
  };
  messageInformationStyles: {
    containerStyle: ViewStyle;
    titleContainerStyle: ViewStyle;
    titleStyle: TextStyle;
    messageBubbleContainerStyle: ViewStyle;
    receiptItemStyle: {
      containerStyle: ViewStyle;
      titleStyle: TextStyle;
      subtitleStyle: TextStyle;
      avatarStyle: CometChatTheme["avatarStyle"];
      emojiStyle: TextStyle;
      receiptStyles?: ReceiptStyles;
    };
    skeletonStyle: {
      linearGradientColors: [string, string];
      shimmerBackgroundColor: ColorValue;
      shimmerOpacity: number;
      speed: number;
    };
    errorStateStyle?: {
      containerStyle?: ViewStyle;
      icon?: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
      iconContainerStyle?: ViewStyle;
      titleStyle?: TextStyle;
      subtitleStyle?: TextStyle;
    };
  };
  reactionListStyles: {
    tabStyle: {
      containerStyle: ViewStyle;
      itemStyle: ViewStyle;
      selectedItemStyle: ViewStyle;
      itemEmojiStyle: TextStyle;
      selectedItemEmojiStyle: TextStyle;
      itemTextStyle: TextStyle;
      selectedItemTextStyle: TextStyle;
    };
    reactionListItemStyle: {
      containerStyle: ViewStyle;
      titleStyle: TextStyle;
      subtitleStyle: TextStyle;
      avatarStyle: CometChatTheme["avatarStyle"];
      emojiStyle: TextStyle;
      titleContainerStyle: TextStyle;
    };
    skeletonStyle: {
      linearGradientColors: [string, string];
      shimmerBackgroundColor: ColorValue;
      shimmerOpacity: number;
      speed: number;
    };
    errorStateStyle?: {
      containerStyle?: ViewStyle;
      icon?: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
      iconContainerStyle?: ViewStyle;
      titleStyle?: TextStyle;
      subtitleStyle?: TextStyle;
    };
  };
  dateStyles: DateStyle;
  dateSeparatorStyles: DateSeparatorStyle;
  mentionsStyle?: {
    textStyle: TextStyle;
    selfTextStyle: TextStyle;
  };
  imageBubbleStyles?: {
    containerStyle: ViewStyle;
    threadedMessageStyle: CometChatTheme["threadedMessageStyles"];
    avatarStyle: CometChatTheme["avatarStyle"];
    receiptStyles: CometChatTheme["receiptStyles"];
    reactionStyles: CometChatTheme["messageBubbleReactionStyles"];
    dateStyles: CometChatTheme["dateStyles"];
    senderNameTextStyles: TextStyle;
    imageStyle: ImageStyle;
    innerContainerStyle: ViewStyle;
    dateReceiptContainerStyle: ViewStyle;
    moderationStyle?: {
      containerStyle?: ViewStyle;
      textStyle?: TextStyle;
      iconTintColor?: ColorValue;
    };
  };
  threadHeaderStyles: {
    containerStyle: ViewStyle;
    messageBubbleContainerStyle: ViewStyle;
    replyCountBarStyle: ViewStyle;
    replyCountTextStyle: TextStyle;
    incomingMessageBubbleStyles: DeepPartial<BubbleStyles>;
    outgoingMessageBubbleStyles: DeepPartial<BubbleStyles>;
  };
  videoBubbleStyles?: {
    containerStyle?: ViewStyle;
    threadedMessageStyle?: CometChatTheme["threadedMessageStyles"];
    avatarStyle?: CometChatTheme["avatarStyle"];
    receiptStyles?: CometChatTheme["receiptStyles"];
    reactionStyles?: CometChatTheme["messageBubbleReactionStyles"];
    dateStyles?: CometChatTheme["dateStyles"];
    senderNameTextStyles?: TextStyle;
    imageStyle?: ImageStyle;
    dateReceiptContainerStyle?: ViewStyle;
    playIcon?: JSX.Element | ImageSourcePropType;
    playIconStyle?: ImageStyle;
    playIconContainerStyle?: ViewStyle;
    placeholderImage?: ImageSourcePropType;
    moderationStyle?: {
      containerStyle?: ViewStyle;
      textStyle?: TextStyle;
      iconTintColor?: ColorValue;
    };
  };
  audioBubbleStyles?: {
    threadedMessageStyle: CometChatTheme["threadedMessageStyles"];
    avatarStyle: CometChatTheme["avatarStyle"];
    receiptStyles: CometChatTheme["receiptStyles"];
    reactionStyles: CometChatTheme["messageBubbleReactionStyles"];
    dateStyles: CometChatTheme["dateStyles"];
    senderNameTextStyles: TextStyle;
    playIconStyle: ImageStyle;
    playIconContainerStyle: ViewStyle;
    waveStyle: ViewStyle;
    waveContainerStyle: ViewStyle;
    playProgressTextStyle: TextStyle;
    containerStyle: ViewStyle;
    playViewContainerStyle: ViewStyle;
    dateReceiptContainerStyle: ViewStyle;
  };
  fileBubbleStyles?: {
    containerStyle: ViewStyle;
    threadedMessageStyle: CometChatTheme["threadedMessageStyles"];
    avatarStyle: CometChatTheme["avatarStyle"];
    receiptStyles: CometChatTheme["receiptStyles"];
    reactionStyles: CometChatTheme["messageBubbleReactionStyles"];
    dateStyles: CometChatTheme["dateStyles"];
    senderNameTextStyles: TextStyle;
    titleStyle: TextStyle;
    subtitleStyle: TextStyle;
    downloadIcon: ImageSourcePropType | JSX.Element;
    downloadIconStyle: ImageStyle;
    dateReceiptContainerStyle: ViewStyle;
  };
  // ── Multiple-attachment (§7 fan-out) bubbles — theme override surfaces, same pattern as
  //    avatarStyle/badgeStyle: a developer sets these on the theme and each bubble applies them
  //    over its tokenized defaults via deepMerge(theme.x, compTheme.x, style). All optional. ──
  audiosBubbleStyles?: {
    containerStyle?: ViewStyle;
    cardStyle?: ViewStyle;
    playButtonStyle?: ViewStyle;
    playIconStyle?: ImageStyle;
    fileNameStyle?: TextStyle;
    seekTrackStyle?: ViewStyle;
    seekProgressStyle?: ViewStyle;
    seekThumbStyle?: ViewStyle;
    timeTextStyle?: TextStyle;
    downloadIconStyle?: ImageStyle;
    captionStyle?: TextStyle;
    expandButtonTextStyle?: TextStyle; // "Show N more" / "Show less" toggle label — parity with fileBubbleStyles
  };
  mediaGridBubbleStyles?: {
    containerStyle?: ViewStyle;
    cellStyle?: ViewStyle;
    playButtonStyle?: ViewStyle;
    playIconStyle?: ImageStyle;
    durationChipStyle?: ViewStyle;
    durationTextStyle?: TextStyle;
    overflowOverlayStyle?: ViewStyle;
    overflowTextStyle?: TextStyle;
  };
  filesBubbleStyles?: {
    containerStyle?: ViewStyle;
    cardStyle?: ViewStyle;
    fileNameStyle?: TextStyle;
    fileSizeTextStyle?: TextStyle;
    downloadIconStyle?: ImageStyle;
    expandButtonTextStyle?: TextStyle;
    captionStyle?: TextStyle;
  };
  voiceNoteBubbleStyles?: {
    containerStyle?: ViewStyle;
    captionStyle?: TextStyle;
    playViewContainerStyle?: ViewStyle;
    playIconStyle?: ImageStyle;
    playIconContainerStyle?: ViewStyle;
    waveStyle?: ViewStyle;
    waveContainerStyle?: ViewStyle;
    playProgressTextStyle?: TextStyle;
  };
  // ── Composer attachment tray/tiles (pre-send preview) — theme override surfaces, same pattern. ──
  composerErrorBannerStyles?: {
    containerStyle?: ViewStyle;
    textStyle?: TextStyle;
    closeIconStyle?: ImageStyle;
  };
  attachmentTrayStyles?: {
    containerStyle?: ViewStyle;
    progressTrackStyle?: ViewStyle;
    progressFillStyle?: ViewStyle;
  };
  attachmentTileStyles?: {
    containerStyle?: ViewStyle;
    fileCardStyle?: ViewStyle;
    mediaTileStyle?: ViewStyle;
    audioCardStyle?: ViewStyle;
    fileNameStyle?: TextStyle;
    removeButtonStyle?: ViewStyle;
    durationChipStyle?: ViewStyle;
  };
  attachmentPreviewStyles?: {
    containerStyle?: ViewStyle;
  };
  attachmentPreviewItemStyles?: {
    containerStyle?: ViewStyle;
    removeButtonStyle?: ViewStyle;
  };
  collaborativeBubbleStyles?: {
    containerStyle?: ViewStyle;
    threadedMessageStyle?: CometChatTheme["threadedMessageStyles"];
    avatarStyle?: CometChatTheme["avatarStyle"];
    receiptStyles?: CometChatTheme["receiptStyles"];
    reactionStyles?: CometChatTheme["messageBubbleReactionStyles"];
    dateStyles?: CometChatTheme["dateStyles"];
    senderNameTextStyles?: TextStyle;
    titleStyle?: TextStyle;
    subtitleStyle?: TextStyle;
    buttonViewStyle?: ViewStyle;
    buttonTextStyle?: TextStyle;
    dateReceiptContainerStyle?: ViewStyle;
    imageCollaborativeDocument?: JSX.Element | ImageSourcePropType;
    imageCollaborativeWhiteboard?: JSX.Element | ImageSourcePropType;
    imageStyle?: ImageStyle;
    imageContainerStyle?: ViewStyle;
    iconCollaborativeDocument?: JSX.Element | ImageSourcePropType;
    iconCollaborativeWhiteboard?: JSX.Element | ImageSourcePropType;
    iconStyle?: ImageStyle;
    iconContainerStyle?: ViewStyle;
    dividerStyle?: ViewStyle;
  };
  meetCallBubbleStyles?: GroupCallBubbleStyles;
  textBubbleStyles?: {
    containerStyle: ViewStyle;
    threadedMessageStyle: CometChatTheme["threadedMessageStyles"];
    avatarStyle: CometChatTheme["avatarStyle"];
    receiptStyles: CometChatTheme["receiptStyles"];
    reactionStyles: CometChatTheme["messageBubbleReactionStyles"];
    dateStyles: CometChatTheme["dateStyles"];
    senderNameTextStyles: TextStyle;
    textStyle: TextStyle;
    textContainerStyle?: ViewStyle;
    mentionsStyle: CometChatTheme["mentionsStyle"];
    dateReceiptContainerStyle: ViewStyle;
    translatedTextStyle: TextStyle;
    translatedTextContainerStyle: ViewStyle;
    translatedTextDividerStyle: ViewStyle;
  };
  assistantBubbleStyles?: {
    containerStyle: ViewStyle;
    avatarStyle: CometChatTheme["avatarStyle"];
    textStyle: TextStyle;
    textContainerStyle?: ViewStyle;
    placeholderTextStyle: TextStyle;
    copyButtonStyle: ViewStyle;
    errorContainerStyle: ViewStyle;
    errorTextStyle: TextStyle;
  };
  stickerBubbleStyles?: {
    containerStyle?: ViewStyle;
    threadedMessageStyle?: CometChatTheme["threadedMessageStyles"];
    avatarStyle?: CometChatTheme["avatarStyle"];
    receiptStyles?: CometChatTheme["receiptStyles"];
    reactionStyles?: CometChatTheme["messageBubbleReactionStyles"];
    dateStyles?: CometChatTheme["dateStyles"];
    senderNameTextStyles?: TextStyle;
    dateReceiptContainerStyle?: ViewStyle;
    imageStyle?: ImageStyle;
  };
  pollBubbleStyles?: {
    containerStyle?: ViewStyle;
    threadedMessageStyle?: CometChatTheme["threadedMessageStyles"];
    avatarStyle?: CometChatTheme["avatarStyle"];
    receiptStyles?: CometChatTheme["receiptStyles"];
    reactionStyles?: CometChatTheme["messageBubbleReactionStyles"];
    dateStyles?: CometChatTheme["dateStyles"];
    senderNameTextStyles?: TextStyle;
    dateReceiptContainerStyle?: ViewStyle;
    titleStyle?: TextStyle;
    optionTextStyle?: TextStyle;
    voteCountTextStyle?: TextStyle;
    selectedIcon?: JSX.Element | ImageSourcePropType;
    selectedIconStyle?: ImageStyle;
    radioButtonStyle: ViewStyle;
    progressBarStyle: ViewStyle;
    activeProgressBarTint: ColorValue;
    voteravatarStyle: CometChatTheme["avatarStyle"];
  };
  groupActionBubbleStyles?: {
    containerStyle: ViewStyle;
    textStyle: TextStyle;
    textContainerStyle?: ViewStyle;
  };
  linkPreviewBubbleStyles?: {
    containerStyle: ViewStyle;
    threadedMessageStyle?: CometChatTheme["threadedMessageStyles"];
    avatarStyle?: CometChatTheme["avatarStyle"];
    receiptStyles?: CometChatTheme["receiptStyles"];
    reactionStyles?: CometChatTheme["messageBubbleReactionStyles"];
    dateStyles?: CometChatTheme["dateStyles"];
    senderNameTextStyles?: TextStyle;
    bodyStyle: {
      containerStyle: ViewStyle;
      titleStyle: TextStyle;
      titleContainerStyle: ViewStyle;
      subtitleTitle: TextStyle;
      subtitleContainerStyle: TextStyle;
      faviconStyle: ImageStyle;
      faviconContainerStyle: ViewStyle;
    };
    headerImageStyle: ImageStyle;
    headerImageContainerStyle: ViewStyle;
  };
  messageListStyles: {
    containerStyle: ViewStyle;
    scrollToBottomButtonStyle: {
      containerStyle?: ViewStyle;
      unreadCountBadgeStyle?: BadgeStyle;
      icon?: JSX.Element | ImageSourcePropType;
      iconContainerStyle?: ViewStyle;
      iconStyle: ImageStyle;
    };
    emptyStateStyle?: {
      containerStyle?: ViewStyle;
      textStyle?: TextStyle;
    };
    errorStateStyle?: {
      containerStyle?: ViewStyle;
      icon?: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
      iconContainerStyle?: ViewStyle;
      titleStyle?: TextStyle;
      subtitleStyle?: TextStyle;
    };
    dateSeparatorStyle?: DateSeparatorStyle;
    incomingMessageBubbleStyles: DeepPartial<BubbleStyles>;
    outgoingMessageBubbleStyles: DeepPartial<OutgoingBubbleStyles>;
    groupActionBubbleStyles: DeepPartial<CometChatTheme["groupActionBubbleStyles"]>;
    callActionBubbleStyles: DeepPartial<CallActionBubbleStyles>;
    messageInformationStyles: DeepPartial<CometChatTheme["messageInformationStyles"]>;
    messageOptionsStyles: DeepPartial<ActionSheetStyle>;
  };
  avatarStyle: Partial<AvatarStyle>;
  statusIndicatorStyle: StatusIndicatorStyles;
  badgeStyle: BadgeStyle;
  callLogsStyles: CallLogsStyle;
  conversationStyles: ConversationStyle;
  notificationFeedStyles: NotificationFeedStyle;
  confirmDialogStyles: ConfirmDialogStyle;
  reportDialogStyles: ReportDialogStyle;
  quickReactionStyle: {
    containerStyle: ViewStyle;
    emojiContainerStyle: ViewStyle;
  };
}
