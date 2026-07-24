import React from 'react';
import { ImageStyle, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme, useCompTheme } from '../../theme/hook';
import { CometChatTheme } from '../../theme/type';
import { deepMerge } from '../helper/helperFunctions';
import { Icon } from '../icons/Icon';

export interface CometChatComposerErrorBannerProps {
  /** Message to show; `null`/empty hides the banner. */
  message: string | null;
  /** Called when the ✕ is tapped. */
  onDismiss: () => void;
  /** Per-instance style overrides (applied over the tokenized defaults) — same pattern as the
   *  bubbles (e.g. CometChatFilesBubble / CometChatAudiosBubble). A developer can also override
   *  globally via `theme.composerErrorBannerStyles` or at the component level via the theme provider. */
  style?: CometChatTheme["composerErrorBannerStyles"];
}

/**
 * A red error/info bar shown just ABOVE the composer's attachment tray — e.g. "File exceeds 100 MB"
 * when an oversized file is rejected. Lives inside the composer (not a screen-bottom toast) so it
 * reads as part of the compose surface. The composer owns the message + auto-dismiss timer; the ✕
 * dismisses it immediately.
 *
 * Styling follows the standard component pattern: tokenized defaults are computed inline, then the
 * merged overrides (theme → component theme → per-instance `style`) are layered on top.
 */
export function CometChatComposerErrorBanner({ message, onDismiss, style }: CometChatComposerErrorBannerProps) {
  const theme = useTheme();
  const compTheme = useCompTheme();
  const s = deepMerge(
    theme.composerErrorBannerStyles ?? {},
    compTheme.composerErrorBannerStyles ?? {},
    style ?? {}
  );

  if (!message) return null;

  const S = theme.spacing;
  return (
    <View
      testID="composer-error-banner"
      accessibilityRole="alert"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: S.spacing.s2,
          backgroundColor: theme.color.error,
          borderRadius: S.radius.r2,
          paddingVertical: S.padding.p3,
          paddingHorizontal: S.padding.p3,
          // No outer margins — the composer's floating wrapper owns the horizontal inset (to match the
          // composer width) and the bottom gap (space above the composer's top edge).
        },
        s.containerStyle as ViewStyle,
      ]}
    >
      <Text
        numberOfLines={2}
        style={[
          { flex: 1, color: theme.color.staticWhite, ...theme.typography.body.regular },
          s.textStyle as TextStyle,
        ]}
      >
        {message}
      </Text>
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Icon
          name="close"
          size={S.spacing.s5}
          color={(s.closeIconStyle?.tintColor as string) ?? theme.color.staticWhite}
          imageStyle={s.closeIconStyle as ImageStyle}
        />
      </TouchableOpacity>
    </View>
  );
}
