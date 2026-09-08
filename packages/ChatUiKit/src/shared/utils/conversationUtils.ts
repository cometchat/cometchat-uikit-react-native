import { CometChat } from "@cometchat/chat-sdk-react-native";
import { ColorValue } from "react-native";
import { IconName } from "../icons/Icon";
import { getMessagePreviewInternal } from "./MessageUtils";
import { MessageCategoryConstants } from "../constants/UIKitConstants";
import { CometChatUIKit } from "../CometChatUiKit";
import { CometChatTheme } from "../../theme/type";
import { JSX } from "react";
import { getCometChatTranslation } from "../resources/CometChatLocalizeNew/LocalizationManager";
import { stripMarkdown } from "./MarkdownUtils";
 
const t = getCometChatTranslation();

// "N Photos / Videos / Audios / Files" for a media message, keyed by its COARSE type (image/video/audio/
// file) — never a generic "N attachments". File is the default. One source of truth for the conversation
// list, the reply/edit preview and the composer overline, so they always read the same.
export function attachmentCountLabel(type: string, count: number): string {
  const n = String(count);
  switch (type) {
    case "image": return t("PREVIEW_PHOTOS_COUNT").replace("{count}", n);
    case "video": return t("PREVIEW_VIDEOS_COUNT").replace("{count}", n);
    case "audio": return t("PREVIEW_AUDIOS_COUNT").replace("{count}", n);
    default: return t("PREVIEW_FILES_COUNT").replace("{count}", n);
  }
}

// A single media message can carry a caption (you typed one when sending one photo/video/file). Show it
// after the kind label — "Photo · <caption>" — mirroring the multi-attachment subtitle. Empty → nothing.
// (Multi-attachment messages are summarized upstream in getLastConversationMessage.)
function captionSuffix(message: CometChat.BaseMessage): string {
  const raw = typeof (message as any).getCaption === "function" ? (message as any).getCaption() : "";
  // Strip the wire markup. A caption is serialized exactly like a text message, so it can carry
  // `<color=#rrggbb>`, `**bold**`, backticks — and every branch that calls this returns a JSX
  // element, so the conversation list's own stripMarkdown pass (string subtitles only) never runs
  // on it. Without this a single photo captioned in red reads "Photo · <color=#e11d48>hi</color>"
  // in the list. Same defect ENG-38258 reported for a multi-attachment batch; that fix landed in
  // MessageDataSource.getLastConversationMessage and did not cover the single-attachment path.
  const caption = typeof raw === "string" ? stripMarkdown(raw.trim()).trim() : "";
  return caption ? ` · ${caption}` : "";
}

export class CometChatConversationUtils {
  static getLastMessage(conversation: CometChat.Conversation): CometChat.BaseMessage | undefined {
    let msg = conversation?.getLastMessage && conversation?.getLastMessage();
    if (!msg) {
      return undefined;
    }
    switch (msg["category"]) {
      case "message":
        break;
      case "custom":
        break;
      case "action":
        break;
      case "call":
        break;
      default:
        break;
    }
    return msg;
  }

  static getMessagePreview = (
    lastMessage: CometChat.BaseMessage,
    theme?: CometChatTheme
  ): string | JSX.Element => {
    const uid = CometChatUIKit.loggedInUser?.getUid();
    if (lastMessage != undefined) {
      if (lastMessage.getDeletedAt() !== undefined) {
        return getMessagePreviewInternal("block-fill", t("DELETE_MSG_TEXT"), {theme});
      }

      if (lastMessage.getCategory() === MessageCategoryConstants.interactive) {
        return getMessagePreviewInternal(
          "block-fill",
          t("NOT_SUPPORTED") ?? "This message type is not supported",
          {theme}
        );
      }

      if (lastMessage.getCategory() === MessageCategoryConstants.card) {
        const cardText =
          (typeof (lastMessage as any).getText === "function" && (lastMessage as any).getText()) ||
          t("CARD_MESSAGE") ||
          "Card Message";
        return cardText;
      }

      // Edit D — Agent (agentic/assistant) last-message preview. The text lives in
      // getAssistantMessageData().getText() for an AIAssistantMessage; fall back to
      // getText(), then a localized label (previously fell through to empty string).
      if (lastMessage.getCategory() === MessageCategoryConstants.agentic) {
        const agentMsg = lastMessage as any;
        let agentText = "";
        if (typeof agentMsg.getAssistantMessageData === "function") {
          const assistantData = agentMsg.getAssistantMessageData();
          if (assistantData && typeof assistantData.getText === "function") {
            agentText = assistantData.getText() || "";
          }
        }
        if (!agentText && typeof agentMsg.getText === "function") {
          agentText = agentMsg.getText() || "";
        }
        return agentText || t("AI_AGENT_MESSAGE") || "AI agent message";
      }

      if (lastMessage.getCategory() == "call") {
        let color: ColorValue | undefined = theme?.color?.textSecondary;
        let text = "Video call";
        let iconName: IconName = "phone-incoming-fill";
        if (lastMessage.getType() == "audio") {
          text = "Voice call";
        }
        if (uid === lastMessage.getSender()?.getUid()) {
          iconName = "phone-outgoing-fill";
        } else if ((lastMessage as CometChat.Call).getAction() === "unanswered") {
          color = theme?.color?.error;
          text = "Missed " + text.toLowerCase();
        }

        return getMessagePreviewInternal(iconName, text, {iconColor: color, theme});
      }
      let msgText = "";
      if (lastMessage.getCategory() == "message") {
        switch (lastMessage.getType()) {
          case "text":
            msgText = (lastMessage as CometChat.TextMessage).getText();
            break;
          case "image":
            return getMessagePreviewInternal("photo-fill", t('PHOTOS') + captionSuffix(lastMessage), {theme});
          case "audio":
            return getMessagePreviewInternal("mic-fill", t('MESSAGE_AUDIO') + captionSuffix(lastMessage), {theme});
          case "video":
            return getMessagePreviewInternal("videocam-fill", t("MESSAGE_VIDEO") + captionSuffix(lastMessage), {theme});
          case "file":
            return getMessagePreviewInternal("description-fill", t("MESSAGE_FILE") + captionSuffix(lastMessage), {theme});
        }
      } else if (
        lastMessage.getCategory() == (CometChat.CATEGORY_CUSTOM as CometChat.MessageCategory)
      ) {
        msgText = t(lastMessage.getType())
      } else if (
        lastMessage.getCategory() == (CometChat.CATEGORY_ACTION as CometChat.MessageCategory)
      ) {
        if (
          (lastMessage as CometChat.Action)?.getAction() === CometChat.ACTION_TYPE.MESSSAGE_DELETED
        ) {
          return getMessagePreviewInternal("block-fill", t("DELETE_MSG_TEXT"), {theme});
        }
        msgText = (lastMessage as CometChat.Action).getMessage();
      } else if (lastMessage.getCategory() === CometChat.CATEGORY_INTERACTIVE) {
        msgText = "";
        //todo unsupported bubble
      } else {
        msgText = (lastMessage["metadata"] as any)?.pushNotification;
      }
      return msgText;
    } else {
      return "";
    }
  };
}
