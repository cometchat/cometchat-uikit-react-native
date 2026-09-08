import React, { JSX } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatMessageOption } from "../../shared/modals/CometChatMessageOption";
import { MessageOptionConstants } from "../../shared/constants/UIKitConstants";
import { CometChatTheme } from "../../theme/type";
import { useCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew";

/**
 * The three actions promoted out of the options list into a row of tiles at the top of the sheet
 * (§6.2). Order is fixed and deliberate — Reply, then the pin/save pair — so the row does not
 * reshuffle under the user's thumb as a message's state changes.
 *
 * Each entry is a PAIR because pin and save flip on state: whichever of the two the DataSource
 * built for this message is the one that gets a tile.
 */
/** The pin/save pairs, in row order. Pairs, because each flips to its opposite on state. */
const PIN_SAVE_ORDER: string[][] = [
  [MessageOptionConstants.pinMessage, MessageOptionConstants.unpinMessage],
  [MessageOptionConstants.saveMessage, MessageOptionConstants.unsaveMessage],
];

/**
 * Splits the options into the tile row and the list beneath it.
 *
 * The row is **conditional on Pin/Save existing at all**. Reply is promoted only to accompany
 * them — it never earns a tile on its own. So:
 *
 *   - both features on   → 3 tiles (Reply · Pin · Save)
 *   - one of them on     → 2 tiles (Reply · the survivor)
 *   - neither            → NO row, and Reply stays in the list. The sheet is exactly what it
 *                          was before this feature existed.
 *
 * Nothing is fabricated: an action becomes a tile only if the DataSource already offered it, so
 * every rule that governs availability — the dashboard flags an integrator feeds into
 * PinSaveConfig, the group role gate, an ineligible message that is still sending or deleted —
 * lands here without this component knowing any of them.
 *
 * Returning both halves from ONE function is deliberate: computing them separately let the row
 * and the list disagree about whether Reply had been promoted.
 */
export const partitionQuickActions = (
  options: CometChatMessageOption[]
): { tiles: CometChatMessageOption[]; list: CometChatMessageOption[] } => {
  const pinSave = PIN_SAVE_ORDER.map((ids) =>
    options.find((option) => ids.includes(option.id))
  ).filter(Boolean) as CometChatMessageOption[];

  if (!pinSave.length) return { tiles: [], list: options };

  const reply = options.find(
    (option) => option.id === MessageOptionConstants.replyMessage
  );
  const tiles = reply ? [reply, ...pinSave] : pinSave;
  const promoted = new Set(tiles.map((option) => option.id));

  return { tiles, list: options.filter((option) => !promoted.has(option.id)) };
};

/**
 * Tiles use the SHORT label, not the option's own title.
 *
 * The list needs "Unsave message" to read as a sentence among its neighbours; a tile is a fixed
 * third of the row and "Unsave message" simply does not fit — it wraps or ellipsises, and the
 * row stops looking like a row. Same reason Slack's tiles say Reply / Forward / Save.
 *
 * These keys already exist (they are the confirm-dialog button copy), so this adds no new strings
 * to translate. Anything unmapped falls back to the option's title rather than rendering blank.
 */
const SHORT_LABEL_KEY: Record<string, string> = {
  [MessageOptionConstants.replyMessage]: "REPLY",
  [MessageOptionConstants.pinMessage]: "PIN",
  [MessageOptionConstants.unpinMessage]: "UNPIN",
  [MessageOptionConstants.saveMessage]: "SAVE",
  [MessageOptionConstants.unsaveMessage]: "UNSAVE",
};

export interface MessageQuickActionsProps {
  /** Already filtered through `partitionQuickActions`. */
  actions: CometChatMessageOption[];
  /** Null while no message is selected — the sheet holds it as a nullable ref. */
  message?: CometChat.BaseMessage | null;
  theme: CometChatTheme;
}

/**
 * Slack-style row of prominent actions above the options list. Renders nothing when there is
 * nothing to promote, so the sheet keeps its original shape rather than showing an empty band.
 */
export const MessageQuickActions = ({
  actions,
  message,
  theme,
}: MessageQuickActionsProps): JSX.Element | null => {
  const { t } = useCometChatTranslation();

  if (!actions.length) return null;

  const labelFor = (action: CometChatMessageOption): string => {
    const key = SHORT_LABEL_KEY[action.id];
    const short = key ? t(key) : undefined;
    // t() echoes the key back when a translation is missing — treat that as no translation
    // rather than printing "UNSAVE" at the user.
    return short && short !== key ? short : action.title;
  };

  return (
    <View style={styles.row} testID='MessageOptions.quickActions'>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          testID={`QuickAction.${action.id}`}
          accessibilityRole='button'
          // The FULL title for screen readers — "Unsave message" is unambiguous read aloud,
          // where the visible tile has to stay short to fit.
          accessibilityLabel={action.title}
          style={[
            styles.tile,
            {
              backgroundColor: theme.color.background3,
              borderRadius: theme.spacing.radius.r2,
            },
          ]}
          onPress={() => message && action.onPress?.(message)}
        >
          <View style={styles.icon}>{action.icon as JSX.Element}</View>
          <Text
            numberOfLines={1}
            // Shrink before truncating: a long word in a translated locale loses a point or two
            // of size rather than becoming "Unsav…".
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={[
              theme.typography.button.medium,
              styles.label,
              { color: theme.color.textPrimary },
            ]}
          >
            {labelFor(action)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  // flex:1 rather than a fixed width: with Pin unavailable the two survivors stretch to fill the
  // row instead of leaving a gap where the third tile was.
  tile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 6,
  },
  icon: { alignItems: "center", justifyContent: "center" },
  // Keeps the label off the tile's rounded edges when a locale gives a longer word.
  label: { textAlign: "center" },
});
