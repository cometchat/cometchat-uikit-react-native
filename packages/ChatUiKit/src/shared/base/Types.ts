import { ImageSourcePropType, ImageStyle, ImageURISource } from "react-native";
import { CometChatTextFormatter } from "../formatters";
import { CometChatTheme } from "../../theme/type";
import { DeepPartial } from "../helper/types";
import { JSX } from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";

export type SelectionMode = "none" | "single" | "multiple";

export type ConversationType = "both" | "users" | "groups";

export type MessageListAlignmentType = "standard" | "leftAligned";

export type MessageBubbleAlignmentType = "left" | "right" | "center";

export type MessageTimeAlignmentType = "top" | "bottom";

export type AdditionalParams = {
  textFormatters?: CometChatTextFormatter[];
  disableMentions?: boolean;
  hideReplyOption?: boolean,
  hideReplyInThreadOption?: boolean,
  hideShareMessageOption?: boolean,
  hideEditMessageOption?: boolean,
  hideTranslateMessageOption?: boolean,
  hideDeleteMessageOption?: boolean,
  hideReactionOption?: boolean,
  hideMessagePrivatelyOption?: boolean,
  hideCopyMessageOption?: boolean,
  hideMessageInfoOption?: boolean,
  hideReportMessageOption?: boolean,
  hideMarkAsUnreadOption?: boolean,
  hideGroupActionMessages?: boolean,
  onReplyClick?: (messageId: string) => void;
};

export type AdditionalAttachmentOptionsParams = {
  hideCameraOption?: boolean;
  hideImageAttachmentOption?: boolean;
  hideVideoAttachmentOption?: boolean;
  hideAudioAttachmentOption?: boolean;
  hideFileAttachmentOption?: boolean;
  hidePollsAttachmentOption?: boolean;
  hideCollaborativeDocumentOption?: boolean;
  hideCollaborativeWhiteboardOption?: boolean;
  replyToMessage?: CometChat.BaseMessage;
  closeReplyPreview?: () => void;
};

export type AdditionalAuxiliaryOptionsParams = {
  stickerIconStyle?: {
    active: ImageStyle,
    inactive: ImageStyle;
  };
  stickerIcon?: JSX.Element | ImageSourcePropType;
  hideStickersButton?: boolean;
  replyToMessage?: CometChat.BaseMessage;
  closeReplyPreview?: () => void;
};

export type AdditionalAuxiliaryHeaderOptionsParams = {
  callButtonStyle?: DeepPartial<CometChatTheme['callButtonStyles']>;
  hideVoiceCallButton?: boolean;
  hideVideoCallButton?: boolean;
};

//AdditionalParams