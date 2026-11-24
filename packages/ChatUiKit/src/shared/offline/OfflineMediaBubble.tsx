/**
 * Offline (ON path) wrappers for media bubbles (README §3.8, UIK-MEDIA-01).
 *
 * {@link MediaOutOfReachNote} is the "Available when online" line on media the device has no copy of
 * while it cannot reach the server. {@link OfflineMediaBubble} serves the bubbles that take their URL
 * as a prop (the single-attachment bubbles, the voice note): the source comes from the SDK's cached
 * copy, and a tap online asks the SDK to download one. Mounted only on the ON path, so with offline
 * off a bubble's view tree is today's.
 *
 * @internal
 */
import React, { JSX } from "react";
import { View } from "react-native";
import { useTheme } from "../../theme";
import { useCometChatTranslation } from "../resources/CometChatLocalizeNew";
import { requestMediaDownload } from "./media";
import { MediaOutOfReachLabel } from "./OfflineViews";
import { useMediaOutOfReach, useOfflineMediaUri } from "./useOfflineMediaUri";

export const MediaOutOfReachNote = ({ attachment, color }: { attachment: any; color?: any }) => {
  const outOfReach = useMediaOutOfReach(attachment);
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  if (!outOfReach) return null;
  const tokens = theme.messageListStyles?.offlineStyles?.mediaPlaceholderStyle;
  return (
    <MediaOutOfReachLabel
      t={t}
      textStyle={[{ color: color ?? theme.color.textSecondary }, tokens?.textStyle]}
      containerStyle={tokens?.containerStyle}
    />
  );
};

export interface OfflineMediaBubbleProps {
  attachment: any;
  playable?: boolean;
  children(uri: string): JSX.Element | null;
}

export const OfflineMediaBubble = ({ attachment, playable, children }: OfflineMediaBubbleProps) => {
  const uri = useOfflineMediaUri(attachment, { playable });
  return (
    <View onTouchStart={() => requestMediaDownload(attachment)}>
      {children(uri)}
      <MediaOutOfReachNote attachment={attachment} />
    </View>
  );
};
