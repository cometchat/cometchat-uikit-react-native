/**
 * Views for the offline (ON) path: the one-line notice (README §3.4/§3.7, with Copy for a removed
 * unsent text), the "Connect to load more" footer (UIK-READ-03) and the "Connect to load ..." /
 * "Connect to search" state of a list that has nothing on screen (D84). Rendered only when the
 * offline path produced something to show, so with offline off nothing here mounts.
 *
 * @internal
 */
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { OfflineHub, OfflineNotice } from "./OfflineHub";
import { noticeCopyText, OFFLINE_STRING_KEYS, offlineNoticeText, Translate } from "./notices";
import { CONTRACT_IDS } from "./stateContract";
import { useTheme } from "../../theme";
import { Icon } from "../icons/Icon";

const NOTICE_MS = 5000;

/**
 * How long the short "Sending… try again in a moment" notice stays (R162). It answers one tap, so
 * it goes by itself sooner than the others; a newer one replaces it (one at a time).
 */
export const SEND_IN_FLIGHT_NOTICE_MS = 4000;

/**
 * Subscribe to the hub's notices that belong to this screen and hold the latest one for a few
 * seconds. Disabled (`enabled = false`) it never subscribes.
 */
export function useOfflineNotice(enabled: boolean, belongsHere: (notice: OfflineNotice) => boolean) {
  const [notice, setNotice] = useState<OfflineNotice | null>(null);
  const belongsRef = useRef(belongsHere);
  belongsRef.current = belongsHere;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const hub = OfflineHub.getInstance();
    // Notices that fired before this screen existed show one after the other.
    let waiting: OfflineNotice[] = [];
    const show = (next: OfflineNotice) => {
      setNotice(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const following = waiting.shift();
        if (following) show(following);
        else setNotice(null);
      }, next.kind === "send_in_flight" ? SEND_IN_FLIGHT_NOTICE_MS : NOTICE_MS);
    };
    const subscription = hub.notice$.subscribe((next) => {
      if (next.gen !== hub.gen || !belongsRef.current(next)) return;
      hub.claimNotice(next);
      show(next);
    });
    waiting = hub.takeUndeliveredNotices(belongsRef.current);
    const first = waiting.shift();
    if (first) show(first);
    return () => {
      subscription.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [enabled]);

  return { notice, dismiss: () => setNotice(null) };
}

export interface OfflineNoticeViewProps {
  notice: OfflineNotice;
  t: Translate;
  onDismiss: () => void;
  backgroundColor?: string;
  textColor?: string;
  actionColor?: string;
  /** Theme tokens (`messageListStyles.offlineStyles.noticeStyle`). */
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  actionTextStyle?: StyleProp<TextStyle>;
}

export const OfflineNoticeView = ({ notice, t, onDismiss, backgroundColor, textColor, actionColor, containerStyle, textStyle, actionTextStyle }: OfflineNoticeViewProps) => {
  const text = offlineNoticeText(notice, t);
  const copyText = noticeCopyText(notice);
  // The kit's inverse surface and its text (as in CometChatSearch's active filter), and the
  // highlight text for the action, so the notice follows the light / dark theme.
  const { color } = useTheme();
  if (!text) return null;
  return (
    <View
      testID={CONTRACT_IDS.notice(notice.kind)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: backgroundColor || color.neutral900 }, containerStyle]}
    >
      <Text style={[styles.noticeText, { color: textColor || color.textWhite }, textStyle]} numberOfLines={2}>
        {text}
      </Text>
      {copyText ? (
        <Pressable
          testID={CONTRACT_IDS.noticeCopy}
          accessibilityRole="button"
          accessibilityLabel={t("COPY")}
          hitSlop={8}
          onPress={() => {
            try {
              Clipboard.setString(copyText);
            } catch {
              /* clipboard unavailable */
            }
            onDismiss();
          }}
        >
          <Text style={[styles.noticeAction, { color: actionColor || color.textHighlight }, actionTextStyle]}>{t("COPY")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export interface ConnectToLoadMoreProps {
  t: Translate;
  onRetry: () => void;
  textColor?: string;
  /** Theme tokens (`messageListStyles.offlineStyles.footerStyle`). */
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/** Footer for an offline read that could not go past the cache: tap to try again. */
export const ConnectToLoadMore = ({ t, onRetry, textColor, containerStyle, textStyle }: ConnectToLoadMoreProps) => {
  const { color } = useTheme();
  return (
    <Pressable
      testID={CONTRACT_IDS.footerConnectToLoadMore}
      accessibilityRole="button"
      accessibilityLabel={t(OFFLINE_STRING_KEYS.connectToLoadMore)}
      onPress={onRetry}
      style={[styles.footer, containerStyle]}
    >
      <Text style={[styles.footerText, { color: textColor || color.neutral600 }, textStyle]}>
        {t(OFFLINE_STRING_KEYS.connectToLoadMore)}
      </Text>
    </Pressable>
  );
};

export interface ConnectStateViewProps {
  /** "Connect to load users", "Connect to search", ... */
  title: string;
  /** Second line, only on "Connect to search" ("Search needs an internet connection."). */
  subtitle?: string;
  testID: string;
  /** The host list's error-state tokens, so the state sits where its error view would. */
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}

/**
 * What a list shows when it has nothing on screen and could not reach the server because the device
 * is offline (D84 rule 3 and 7): an icon and the "Connect to ..." text. No Retry button: the list
 * loads by itself once the connection is back.
 */
export const ConnectStateView = ({ title, subtitle, testID, containerStyle, titleStyle, subtitleStyle }: ConnectStateViewProps) => {
  const { color, spacing, typography } = useTheme();
  return (
    <View testID={testID} accessibilityRole='text' style={[styles.connectState, containerStyle]}>
      <Icon name='wifi' size={spacing.spacing.s15 << 1} color={color.iconSecondary} containerStyle={{ marginBottom: spacing.margin.m5 }} />
      <Text style={[{ color: color.textPrimary, ...typography.heading3.bold, marginBottom: spacing.margin.m1 }, styles.connectStateText, titleStyle]}>{title}</Text>
      {subtitle ? <Text style={[{ color: color.textSecondary, ...typography.body.regular }, styles.connectStateText, subtitleStyle]}>{subtitle}</Text> : null}
    </View>
  );
};

export interface MediaOutOfReachLabelProps {
  t: Translate;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * "Available when online", on media the device never downloaded (AC-12.3).
 *
 * `messageListStyles.offlineStyles.mediaPlaceholderStyle` is applied last, so an integrator can
 * restyle this label wherever it appears. The caller still passes the base look for its own
 * surface (a dark full-screen viewer needs light text), and the theme token overrides it.
 */
export const MediaOutOfReachLabel = ({ t, textStyle, containerStyle }: MediaOutOfReachLabelProps) => {
  const tokens = useTheme().messageListStyles?.offlineStyles?.mediaPlaceholderStyle;
  return (
    <View testID={CONTRACT_IDS.mediaOutOfReach} style={[containerStyle, tokens?.containerStyle]}>
      <Text numberOfLines={2} style={[styles.mediaLabel, textStyle, tokens?.textStyle]}>
        {t(OFFLINE_STRING_KEYS.mediaAvailableWhenOnline)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mediaLabel: { fontSize: 11, marginTop: 4 },
  notice: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeText: { flex: 1, fontSize: 14 },
  noticeAction: { marginStart: 12, fontSize: 14, fontWeight: "600" },
  connectState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: "10%", flexDirection: "column" },
  connectStateText: { textAlign: "center" },
  footer: { paddingVertical: 12, alignItems: "center" },
  footerText: { fontSize: 13 },
});
