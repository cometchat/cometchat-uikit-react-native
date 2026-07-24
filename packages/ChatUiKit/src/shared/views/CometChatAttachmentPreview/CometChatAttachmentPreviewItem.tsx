import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme';
import { useCompTheme } from '../../../theme/hook';
import { CometChatTheme } from '../../../theme/type';
import { SelectedAttachment } from '../../modals/SelectedAttachment';
import { deepMerge } from '../../helper/helperFunctions';

export interface CometChatAttachmentPreviewItemProps {
  attachment: SelectedAttachment;
  onRemove: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  /** Custom styles for the attachment preview item, overriding theme styles. */
  style?: CometChatTheme["attachmentPreviewItemStyles"];
}

// Intentional media scrims/overlays painted over attachment thumbnails (not UI-surface colors) —
// no theme-token equivalent, so kept as documented consts per the project's OVERLAY_COLOR convention.
const OVERLAY_COLOR = 'rgba(0,0,0,0.45)';
const PLAY_GLYPH_DIM = 'rgba(255,255,255,0.8)';     // dimmed white ▶ over a loading thumbnail
const REJECTED_SCRIM_COLOR = 'rgba(180,0,0,0.55)';  // red scrim over a REJECTED tile
const REMOVE_BADGE_BG = 'rgba(0,0,0,0.55)';         // ✕ remove-badge backing

export const CometChatAttachmentPreviewItem = ({
  attachment,
  onRemove,
  onRetry,
  style,
}: CometChatAttachmentPreviewItemProps) => {
  const theme = useTheme();
  const compTheme = useCompTheme();
  const s = deepMerge(
    theme.attachmentPreviewItemStyles ?? {},
    compTheme.attachmentPreviewItemStyles ?? {},
    style ?? {}
  );
  const ITEM_SIZE = theme.spacing.spacing.s18;
  const BORDER_RADIUS = theme.spacing.radius.r2;
  const { fileId, file, uploadState, uploadProgress } = attachment;

  const checkmarkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (uploadState === 'COMPLETED') {
      checkmarkOpacity.setValue(1);
      Animated.delay(1000).start(() => {
        Animated.timing(checkmarkOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [uploadState]);

  const isMedia =
    file.type.startsWith('image/') || file.type.startsWith('video/');

  return (
    <View
      style={[{
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderRadius: BORDER_RADIUS,
        margin: theme.spacing.spacing.s1,
        overflow: 'hidden',
        backgroundColor: theme.color.neutral200,
      }, s.containerStyle]}
    >
      {/* Thumbnail */}
      {isMedia ? (
        <Image
          source={{ uri: file.uri }}
          style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.spacing.s1,
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              ...theme.typography.caption2.regular,
              color: theme.color.neutral700,
              textAlign: 'center',
            }}
          >
            {file.name}
          </Text>
        </View>
      )}

      {/* Video play icon */}
      {file.type.startsWith('video/') && (
        <View
          pointerEvents="none"
          style={styles.fillCenter}
        >
          <Text style={{ fontSize: theme.typography.heading2.regular.fontSize, color: PLAY_GLYPH_DIM }}>
            {'▶'}
          </Text>
        </View>
      )}

      {/* NONE state — indeterminate spinner */}
      {uploadState === 'NONE' && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: OVERLAY_COLOR,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator color={theme.color.staticWhite} size="small" />
        </View>
      )}

      {/* UPLOADING state — progress arc + percentage */}
      {uploadState === 'UPLOADING' && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: OVERLAY_COLOR,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              ...theme.typography.caption2.medium,
              color: theme.color.staticWhite,
            }}
          >
            {`${Math.round(uploadProgress)}%`}
          </Text>
        </View>
      )}

      {/* COMPLETED state — fading checkmark */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: OVERLAY_COLOR,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: checkmarkOpacity,
        }}
      >
        <Text style={{ fontSize: theme.typography.heading2.regular.fontSize, color: theme.color.staticWhite }}>
          {'✓'}
        </Text>
      </Animated.View>

      {/* FAILED state — warning icon, tap to retry */}
      {uploadState === 'FAILED' && (
        <TouchableOpacity
          onPress={() => onRetry(fileId)}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: OVERLAY_COLOR,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Retry upload"
        >
          <Text style={{ fontSize: theme.typography.heading2.regular.fontSize, color: theme.color.error }}>
            {'⚠'}
          </Text>
        </TouchableOpacity>
      )}

      {/* REJECTED state — permanent failure, no retry (remove via × button) */}
      {uploadState === 'REJECTED' && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: REJECTED_SCRIM_COLOR,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: theme.typography.heading2.regular.fontSize, color: theme.color.staticWhite }}>
            {'⛔'}
          </Text>
        </View>
      )}

      {/* Remove (×) button — always visible */}
      <TouchableOpacity
        onPress={() => onRemove(fileId)}
        hitSlop={{
          top: theme.spacing.spacing.s2,
          right: theme.spacing.spacing.s2,
          bottom: theme.spacing.spacing.s2,
          left: theme.spacing.spacing.s2,
        }}
        style={[{
          position: 'absolute',
          top: theme.spacing.spacing.s1,
          right: theme.spacing.spacing.s1,
          width: theme.spacing.spacing.s4,
          height: theme.spacing.spacing.s4,
          borderRadius: theme.spacing.radius.r2,
          backgroundColor: REMOVE_BADGE_BG,
          justifyContent: 'center',
          alignItems: 'center',
        }, s.removeButtonStyle]}
        accessibilityRole="button"
        accessibilityLabel="Remove attachment"
      >
        <Text
          style={{
            color: theme.color.staticWhite,
            fontSize: theme.typography.caption2.regular.fontSize,
            lineHeight: 12,
          }}
        >
          {'✕'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fillCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
