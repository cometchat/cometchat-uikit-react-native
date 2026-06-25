import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CometChatCardView } from "@cometchat/cards-react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { useTheme } from "../../../theme";
import { CometChatUIEventHandler, CometChatUIEvents } from "../../events";
import { useCometChatTranslation } from "../../resources/CometChatLocalizeNew";

export interface CometChatCardBubbleProps {
  /** The card message to render (CometChat.CardMessage). */
  message: any;
  /** Theme override; falls back to the current UIKit theme. */
  theme?: any;
  /** Renderer theme mode. Defaults to the active UIKit theme mode. */
  themeMode?: "auto" | "light" | "dark";
  /**
   * Fired when an action inside the card is tapped. Receives the owning
   * message and the raw renderer action. The kit performs no behavior itself.
   */
  onCardAction?: (message: any, action: any) => void;
}

/**
 * CometChatCardBubble
 *
 * First-party, render-only bubble for developer cards (`category: "card"`).
 * Sits inside the SAME standard message-bubble container as TextBubble
 * (receipts, reactions, long-press, reply, thread all work unchanged).
 *
 * Feeds the raw `getCard()` payload to the prebuilt `CometChatCardView`
 * renderer and forwards any tapped action via both the `onCardAction` prop
 * and the `ccCardActionClicked` UI event. Zero transformation in the kit.
 */
const CometChatCardBubble: React.FC<CometChatCardBubbleProps> = ({
  message,
  themeMode,
  onCardAction,
}) => {
  const theme = useTheme();
  const { t } = useCometChatTranslation();

  const resolvedThemeMode: "auto" | "light" | "dark" =
    themeMode ?? (theme?.mode === "dark" ? "dark" : "light");

  // Raw card payload from the SDK. Pass untouched (stringified) to the renderer.
  const rawCard = useMemo(() => {
    try {
      return typeof message?.getCard === "function" ? message.getCard() : undefined;
    } catch {
      return undefined;
    }
  }, [message]);

  const isEmptyCard =
    rawCard == null || (typeof rawCard === "object" && Object.keys(rawCard).length === 0);

  // Empty/invalid card → fallbackText → text → "Card Message" (don't render an empty schema).
  if (isEmptyCard) {
    const fallback =
      (typeof message?.getFallbackText === "function" && message.getFallbackText()) ||
      (typeof message?.getText === "function" && message.getText()) ||
      t("CARD_MESSAGE") ||
      "Card Message";
    return (
      <View style={styles.fallbackContainer}>
        <Text
          style={{
            color: theme.color.receiveBubbleText,
            fontFamily: theme.typography.body.regular.fontFamily,
            fontSize: theme.typography.body.regular.fontSize,
          }}
        >
          {fallback}
        </Text>
      </View>
    );
  }

  const cardJson = JSON.stringify(rawCard);

  const handleAction = (actionEvent: any) => {
    // Renderer emits { action, elementId, cardJson }. Forward the raw inner action
    // (spec §2.6 — forward raw, no reshaping). Fall back to actionEvent itself for
    // older renderer versions that emit a flat shape.
    const action = actionEvent?.action ?? actionEvent;
    if (!action) return;
    // (1) prop — for apps that render the card bubble directly.
    onCardAction?.(message, action);
    // (2) event bus — the channel that also reaches nested (agent) cards.
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccCardActionClicked, {
      message,
      action,
    });
  };

  return (
    <View style={styles.cardContainer}>
      <CometChatCardView
        cardJson={cardJson}
        themeMode={resolvedThemeMode}
        onAction={handleAction}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // Fill the standard bubble container width (bubble already caps at ~80% of screen).
    alignSelf: "stretch",
    overflow: "hidden",
  },
  fallbackContainer: {
    paddingVertical: 4,
  },
});

export default CometChatCardBubble;
