import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatTheme } from '../../../theme/type';
import { useTheme } from '../../../theme';
import { useCompTheme } from '../../../theme/hook';
import { deepMerge } from '../../helper/helperFunctions';
import { Icon } from '../../icons/Icon';
import { getExtensionData } from '../../../extensions/ExtensionModerator';
import { CometChatUIKit } from '../../CometChatUiKit';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatMediaViewer } from '../CometChatMediaViewer';
import { CometChatCaptionText } from '../CometChatCaptionText';
import { isVideoMime } from '../CometChatMediaViewer/mediaViewerUtils';

// ---------------------------------------------------------------------------
// Design doc §8.1 — VideosBubble: renders a single-kind VIDEO message (all videos after the §7 fan-out)
// as a WhatsApp-style collage grid + a batch-spanning fullscreen viewer. Independent of the
// ImagesBubble — video cells add a dark scrim, a server thumbnail, a centered play button and a
// duration chip; the grid layout + viewer are otherwise the same.
// ---------------------------------------------------------------------------

interface BorderRadii {
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
}

function formatDurationSecs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getDuration(attachment: CometChat.Attachment): string | undefined {
  try {
    const meta = attachment.getMetadata?.() as Record<string, unknown> | undefined;
    const raw = meta?.duration ?? meta?.video_duration;
    if (typeof raw === 'number' && raw > 0) return formatDurationSecs(raw);
    if (typeof raw === 'string' && raw.length > 0) return raw;
  } catch {}
  return undefined;
}

// ---- Cell ----------------------------------------------------------------

interface VideoCellProps {
  attachment: CometChat.Attachment;
  aspectRatio?: number;
  radii: BorderRadii;
  onPress?: () => void;
  testID?: string;
  overflowCount?: number;
  thumbnailUrl?: string;
  cellStyle?: StyleProp<ViewStyle>;
  playButtonStyle?: StyleProp<ViewStyle>;
  playIconStyle?: ImageStyle;
  durationChipStyle?: StyleProp<ViewStyle>;
  durationTextStyle?: TextStyle;
  overflowOverlayStyle?: StyleProp<ViewStyle>;
  overflowTextStyle?: TextStyle;
}

const VideoCell = ({
  attachment,
  aspectRatio = 1,
  radii,
  onPress,
  testID,
  overflowCount,
  thumbnailUrl,
  cellStyle,
  playButtonStyle,
  playIconStyle,
  durationChipStyle,
  durationTextStyle,
  overflowOverlayStyle,
  overflowTextStyle,
}: VideoCellProps) => {
  const theme = useTheme();
  const duration = getDuration(attachment);
  // A VIDEO bubble previews videos only. Anything else (image / audio / file) is unsupported here →
  // a "no preview" placeholder cell (tapping it opens the "No preview available" fullscreen). Gate on a
  // KNOWN non-video kind (a proper "type/subtype" mime that isn't video/*): an empty / bare-extension
  // mime — e.g. an optimistic OUTGOING attachment mid-send — is treated as a video so the placeholder
  // doesn't flash for a frame before the thumbnail loads.
  const mime = attachment.getMimeType?.() ?? '';
  const unsupported = mime.includes('/') && !isVideoMime(mime);

  const borderStyle = {
    borderTopLeftRadius: radii.topLeft ?? 0,
    borderTopRightRadius: radii.topRight ?? 0,
    borderBottomLeftRadius: radii.bottomLeft ?? 0,
    borderBottomRightRadius: radii.bottomRight ?? 0,
  };

  if (unsupported) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.85}
        style={[{ flex: 1, aspectRatio, overflow: 'hidden' }, borderStyle, cellStyle]}
        accessibilityRole="button"
        accessibilityLabel={attachment.getName()}
      >
        <View
          testID="grid-cell-nopreview"
          style={[StyleSheet.absoluteFillObject, borderStyle, { backgroundColor: theme.color.neutral200, justifyContent: 'center', alignItems: 'center' }]}
        >
          <Icon name="unknown-file-type" size={theme.spacing.spacing.s12} />
        </View>
        {overflowCount != null && overflowCount > 0 && (
          <View
            testID="grid-overflow"
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.color.mediaOverlay, justifyContent: 'center', alignItems: 'center' }, overflowOverlayStyle]}
          >
            <Text style={[{ ...theme.typography.heading1.bold, color: theme.color.staticWhite, letterSpacing: -0.5 }, overflowTextStyle]}>{`+${overflowCount}`}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.85}
      style={[{ flex: 1, aspectRatio, overflow: 'hidden' }, borderStyle, cellStyle]}
      accessibilityRole="button"
      accessibilityLabel={attachment.getName()}
    >
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.color.mediaScrim }, borderStyle]} />
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={[StyleSheet.absoluteFillObject, borderStyle]} resizeMode="cover" />
      ) : null}

      {!overflowCount && (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <View style={styles.centerFill}>
            <View
              style={[{
                width: theme.spacing.spacing.s11,
                height: theme.spacing.spacing.s11,
                // r6 (24), not r5 (20): on the 44px (s11) box RN clamps the radius to half the box (22),
                // so r6 renders a perfect circle while r5 would give a rounded square.
                borderRadius: theme.spacing.radius.r6,
                backgroundColor: theme.color.mediaOverlay,
                justifyContent: 'center',
                alignItems: 'center',
              }, playButtonStyle]}
            >
              <Icon name="play-arrow-fill" size={theme.spacing.spacing.s6} color={theme.color.staticWhite} imageStyle={playIconStyle} />
            </View>
          </View>
        </View>
      )}

      {!overflowCount && duration && (
        <View
          pointerEvents="none"
          style={[{
            position: 'absolute',
            bottom: theme.spacing.spacing.s2,
            left: theme.spacing.spacing.s2,
            backgroundColor: theme.color.mediaDurationChip,
            borderRadius: theme.spacing.radius.r1,
            paddingHorizontal: theme.spacing.padding.p1,
            paddingVertical: theme.spacing.padding.p0_5,
          }, durationChipStyle]}
        >
          {/* fontSize 11 / fontWeight '600' kept inline: no typography token matches. */}
          <Text style={[{ color: theme.color.staticWhite, fontSize: 11, fontWeight: '600' }, durationTextStyle]}>{duration}</Text>
        </View>
      )}

      {overflowCount != null && overflowCount > 0 && (
        <View
          testID="grid-overflow"
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.color.mediaOverlay, justifyContent: 'center', alignItems: 'center' }, overflowOverlayStyle]}
        >
          <Text style={[{ ...theme.typography.heading1.bold, color: theme.color.staticWhite, letterSpacing: -0.5 }, overflowTextStyle]}>{`+${overflowCount}`}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ---- Grid layout (by count) ----------------------------------------------

const VideoGrid = ({
  attachments,
  thumbnailUrls,
  onAttachmentPress,
  containerStyle,
  cellStyle,
  playButtonStyle,
  playIconStyle,
  durationChipStyle,
  durationTextStyle,
  overflowOverlayStyle,
  overflowTextStyle,
}: {
  attachments: CometChat.Attachment[];
  thumbnailUrls?: string[];
  onAttachmentPress: (attachment: CometChat.Attachment, index: number) => void;
  containerStyle?: StyleProp<ViewStyle>;
  cellStyle?: StyleProp<ViewStyle>;
  playButtonStyle?: StyleProp<ViewStyle>;
  playIconStyle?: ImageStyle;
  durationChipStyle?: StyleProp<ViewStyle>;
  durationTextStyle?: TextStyle;
  overflowOverlayStyle?: StyleProp<ViewStyle>;
  overflowTextStyle?: TextStyle;
}) => {
  const theme = useTheme();
  const GAP = theme.spacing.spacing.s0_5; // 2 — inter-tile gutter
  const CORNER = theme.spacing.radius.r2; // tiles nest at radius_2 (8)
  const count = attachments.length;
  if (count === 0) return null;

  const cell = (i: number, radii: BorderRadii, aspectRatio?: number, overflowCount?: number) => (
    <VideoCell
      testID={`grid-cell-${i}`}
      attachment={attachments[i]}
      aspectRatio={aspectRatio}
      radii={radii}
      overflowCount={overflowCount}
      thumbnailUrl={thumbnailUrls?.[i]}
      onPress={() => onAttachmentPress(attachments[i], i)}
      cellStyle={cellStyle}
      playButtonStyle={playButtonStyle}
      playIconStyle={playIconStyle}
      durationChipStyle={durationChipStyle}
      durationTextStyle={durationTextStyle}
      overflowOverlayStyle={overflowOverlayStyle}
      overflowTextStyle={overflowTextStyle}
    />
  );

  const renderLayout = () => {
    if (count === 1) {
      return (
        <View style={{ flexDirection: 'row' }}>
          {cell(0, { topLeft: CORNER, topRight: CORNER, bottomLeft: CORNER, bottomRight: CORNER }, 4 / 3)}
        </View>
      );
    }
    if (count === 2) {
      return (
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {cell(0, { topLeft: CORNER, bottomLeft: CORNER })}
          {cell(1, { topRight: CORNER, bottomRight: CORNER })}
        </View>
      );
    }
    if (count === 3) {
      return (
        <View style={{ gap: GAP }}>
          <View style={{ flexDirection: 'row' }}>{cell(0, { topLeft: CORNER, topRight: CORNER }, 4 / 3)}</View>
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {cell(1, { bottomLeft: CORNER })}
            {cell(2, { bottomRight: CORNER })}
          </View>
        </View>
      );
    }
    if (count === 4) {
      return (
        <View style={{ gap: GAP }}>
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {cell(0, { topLeft: CORNER })}
            {cell(1, { topRight: CORNER })}
          </View>
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {cell(2, { bottomLeft: CORNER })}
            {cell(3, { bottomRight: CORNER })}
          </View>
        </View>
      );
    }
    // 5+ → 2×2 with a "+N" overlay on the 4th slot
    const overflowCount = count - 4;
    return (
      <View style={{ gap: GAP }}>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {cell(0, { topLeft: CORNER })}
          {cell(1, { topRight: CORNER })}
        </View>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {cell(2, { bottomLeft: CORNER })}
          {cell(3, { bottomRight: CORNER }, undefined, overflowCount)}
        </View>
      </View>
    );
  };

  return <View style={[styles.gridContainer, containerStyle]}>{renderLayout()}</View>;
};

// ---- Bubble --------------------------------------------------------------

export interface CometChatVideosBubbleProps {
  message: CometChat.MediaMessage;
  theme: CometChatTheme;
  /** Per-instance style overrides — shares the `mediaGridBubbleStyles` theme key with ImagesBubble. */
  style?: CometChatTheme["mediaGridBubbleStyles"];
}

/**
 * Renders a single-kind VIDEO message (all videos, after the §7 fan-out) as a grid, with a
 * batch-spanning fullscreen pager on tap. Fully independent of CometChatImagesBubble.
 */
export function CometChatVideosBubble({
  message: initialMessage,
  theme,
  style,
}: CometChatVideosBubbleProps) {
  const compTheme = useCompTheme();
  const s = deepMerge(theme.mediaGridBubbleStyles ?? {}, compTheme.mediaGridBubbleStyles ?? {}, style ?? {});
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  // §8.2 — the media set fed to the fullscreen pager (batch-spanning union when the list provides it).
  const [viewerItems, setViewerItems] = useState<CometChat.Attachment[]>([]);
  // §8.7 — local copy so onMessageEdited can refresh server-generated thumbnails / a caption edit.
  const [message, setMessage] = useState<CometChat.MediaMessage>(initialMessage);

  // A VIDEO message renders ALL its attachments; off-kind ones (image/audio/file) show a "no preview"
  // placeholder cell + a "No preview available" fullscreen. getAttachments() preserves pick order.
  const allAttachments = useMemo(
    () => (message.getAttachments?.() ?? []).filter((a) => a != null && typeof a.getUrl === 'function'),
    [message]
  );
  const caption = message.getCaption() ?? '';
  const isSentByMe = message.getSender()?.getUid() === CometChatUIKit.loggedInUser?.getUid();

  // §8.7 — server-generated video thumbnails, re-derived when the message updates.
  const thumbnailUrls: string[] = useMemo(() => {
    const thumbnailData = getExtensionData(message, 'thumbnail-generation');
    const attachmentData: any[] = thumbnailData?.attachments ?? [];
    return allAttachments.map((_, i) => {
      const entry = attachmentData[i];
      if (!entry || entry['error']) return '';
      const thumbnails = entry?.data?.thumbnails ?? {};
      return thumbnails['url_large'] ?? thumbnails['url_medium'] ?? thumbnails['url_small'] ?? '';
    });
  }, [message, allAttachments]);

  // §8.7 — refresh the local copy when the server edits the message in (async thumbnails).
  useEffect(() => {
    const listenerId = `VideosBubble_${message.getId?.() ?? message.getMuid?.() ?? Date.now()}`;
    CometChatMessageEvents.addListener(
      CometChatMessageEvents.messageEdited,
      listenerId,
      (edited: CometChat.BaseMessage) => {
        const editedId = edited.getId?.();
        const editedMuid = edited.getMuid?.();
        const myId = message.getId?.();
        const myMuid = message.getMuid?.();
        if (
          edited instanceof CometChat.MediaMessage &&
          ((myId && editedId && myId === editedId) || (myMuid && editedMuid && myMuid === editedMuid))
        ) {
          setMessage(edited);
        }
      }
    );
    return () => CometChatMessageEvents.removeListener(CometChatMessageEvents.messageEdited, listenerId);
  }, []);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  if (allAttachments.length === 0) return null;

  return (
    <View testID="bubble-video">
      <VideoGrid
        attachments={allAttachments}
        thumbnailUrls={thumbnailUrls}
        containerStyle={s.containerStyle}
        cellStyle={s.cellStyle}
        playButtonStyle={s.playButtonStyle}
        playIconStyle={s.playIconStyle}
        durationChipStyle={s.durationChipStyle}
        durationTextStyle={s.durationTextStyle}
        overflowOverlayStyle={s.overflowOverlayStyle}
        overflowTextStyle={s.overflowTextStyle}
        onAttachmentPress={(_, index) => {
          // Page THIS message's attachments (grid & viewer share the same list → index aligns).
          // The viewer renders off-kind items (non-video) as "No preview available".
          setViewerItems(allAttachments);
          setViewerInitialIndex(index);
          setViewerVisible(true);
        }}
      />
      {Boolean(caption) && (
        <CometChatCaptionText
          message={message}
          caption={caption}
          theme={theme}
          containerStyle={{
            paddingHorizontal: theme.spacing.padding.p3,
            paddingTop: theme.spacing.padding.p2,
            paddingBottom: theme.spacing.padding.p1,
          }}
          textStyle={{
            ...theme.typography.body.regular,
            color: isSentByMe ? theme.color.staticWhite : theme.color.neutral900,
          }}
        />
      )}
      <CometChatMediaViewer
        mediaItems={viewerItems.length > 0 ? viewerItems : allAttachments}
        canPreview={(att) => isVideoMime(att.getMimeType?.() ?? '')}
        startIndex={viewerInitialIndex}
        visible={viewerVisible}
        message={message}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    alignSelf: 'stretch',
    minWidth: 232,
    maxWidth: '100%',
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
