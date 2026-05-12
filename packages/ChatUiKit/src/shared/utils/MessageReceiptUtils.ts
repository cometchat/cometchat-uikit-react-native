import { MessageReceipt } from "../constants/UIKitConstants";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { getModerationStatus } from "./MessageUtils";

/**
 * Utility helper for deriving a message receipt status from a BaseMessage instance.
 */
export const MessageReceiptUtils = {
  getReceiptStatus(message: CometChat.BaseMessage | undefined): MessageReceipt {
    if (!message) return MessageReceipt.WAIT;

    // Moderation status (if available)
    const moderationStatus = getModerationStatus(message);
    if (moderationStatus === "disapproved") return MessageReceipt.ERROR;

    // Explicit error markers
    const hasError = (message as any)?.error || (message as any)?.metadata?.error;
    if (hasError) return MessageReceipt.ERROR;

    // Deleted messages treated as error for receipts
    if (message.getDeletedAt?.()) return MessageReceipt.ERROR;

    // Use getter methods for receipt state (SDK objects expose these via getters)
    if (message.getReadAt?.()) return MessageReceipt.READ;
    if (message.getDeliveredAt?.()) return MessageReceipt.DELIVERED;
    if (message.getSentAt?.()) return MessageReceipt.SENT;

    return MessageReceipt.WAIT;
  },
};

export default MessageReceiptUtils;
