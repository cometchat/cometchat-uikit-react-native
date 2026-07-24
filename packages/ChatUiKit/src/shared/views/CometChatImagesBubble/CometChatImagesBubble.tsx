import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatTheme } from '../../../theme/type';
import { useTheme } from '../../../theme';
import { useCompTheme } from '../../../theme/hook';
import { deepMerge } from '../../helper/helperFunctions';
import { CometChatUIKit } from '../../CometChatUiKit';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatMediaViewer } from '../CometChatMediaViewer';
import { CometChatCaptionText } from '../CometChatCaptionText';
import { Icon } from '../../icons/Icon';
import { isImageMime } from '../CometChatMediaViewer/mediaViewerUtils';

// ---------------------------------------------------------------------------
// Design doc §8.1 — ImagesBubble: renders a single-kind IMAGE message (all images after the §7 fan-out)
// as a WhatsApp-style collage grid + a batch-spanning fullscreen viewer. Independent of the
// VideosBubble — image cells only (no video scrim / play button / duration chip / server thumbnails).
// ---------------------------------------------------------------------------

interface BorderRadii {
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
}

// ---- Cell ----------------------------------------------------------------

interface ImageCellProps {
  attachment: CometChat.Attachment;
  aspectRatio?: number;
  radii: BorderRadii;
  onPress?: () => void;
  testID?: string;
  overflowCount?: number;
  cellStyle?: StyleProp<ViewStyle>;
  overflowOverlayStyle?: StyleProp<ViewStyle>;
  overflowTextStyle?: TextStyle;
}

const ImageCell = ({
  attachment,
  aspectRatio = 1,
  radii,
  onPress,
  testID,
  overflowCount,
  cellStyle,
  overflowOverlayStyle,
  overflowTextStyle,
}: ImageCellProps) => {
  const theme = useTheme();
  // An IMAGE bubble previews images only. A non-image attachment (video/audio/file) OR an image that
  // can't be decoded (unsupported format / dead URL → onError) shows a "no preview" placeholder cell
  // instead of a broken/blank tile.
  const [failed, setFailed] = useState(false);
  const mime = attachment.getMimeType?.() ?? '';
  // Placeholder only for a KNOWN non-image kind (a proper "type/subtype" mime that isn't image/*) or a
  // genuine decode failure (onError). An empty / bare-extension mime — e.g. an optimistic OUTGOING
  // attachment the instant you press send, before the confirmed message resolves — is treated as an
  // image so a valid image never flashes the "no preview" placeholder for a frame before it loads.
  const showPlaceholder = (mime.includes('/') && !isImageMime(mime)) || failed;
  const borderStyle = {
    borderTopLeftRadius: radii.topLeft ?? 0,
    borderTopRightRadius: radii.topRight ?? 0,
    borderBottomLeftRadius: radii.bottomLeft ?? 0,
    borderBottomRightRadius: radii.bottomRight ?? 0,
  };

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.85}
      style={[{ flex: 1, aspectRatio, overflow: 'hidden' }, borderStyle, cellStyle]}
      accessibilityRole="button"
      accessibilityLabel={attachment.getName()}
    >
      {showPlaceholder ? (
        <View
          testID="grid-cell-nopreview"
          style={[StyleSheet.absoluteFillObject, borderStyle, { backgroundColor: theme.color.neutral200, justifyContent: 'center', alignItems: 'center' }]}
        >
          <Icon name="unknown-file-type" size={theme.spacing.spacing.s12} />
        </View>
      ) : (
        <Image
          source={{ uri: attachment.getUrl() }}
          style={[StyleSheet.absoluteFillObject, borderStyle]}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}

      {overflowCount != null && overflowCount > 0 && (
        <View
          testID="grid-overflow"
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.color.mediaOverlay, justifyContent: 'center', alignItems: 'center' }, overflowOverlayStyle]}
        >
          {/* heading1.bold = { fontSize: 24, fontWeight: '700' }; letterSpacing -0.5 is a micro-adjust. */}
          <Text style={[{ ...theme.typography.heading1.bold, color: theme.color.staticWhite, letterSpacing: -0.5 }, overflowTextStyle]}>{`+${overflowCount}`}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ---- Grid layout (by count) ----------------------------------------------

const ImageGrid = ({
  attachments,
  onAttachmentPress,
  containerStyle,
  cellStyle,
  overflowOverlayStyle,
  overflowTextStyle,
}: {
  attachments: CometChat.Attachment[];
  onAttachmentPress: (attachment: CometChat.Attachment, index: number) => void;
  containerStyle?: StyleProp<ViewStyle>;
  cellStyle?: StyleProp<ViewStyle>;
  overflowOverlayStyle?: StyleProp<ViewStyle>;
  overflowTextStyle?: TextStyle;
}) => {
  const theme = useTheme();
  const GAP = theme.spacing.spacing.s0_5; // 2 — inter-tile gutter
  const CORNER = theme.spacing.radius.r2; // tiles nest at radius_2 (8)
  const count = attachments.length;
  if (count === 0) return null;

  const cell = (i: number, radii: BorderRadii, aspectRatio?: number, overflowCount?: number) => (
    <ImageCell
      testID={`grid-cell-${i}`}
      attachment={attachments[i]}
      aspectRatio={aspectRatio}
      radii={radii}
      overflowCount={overflowCount}
      onPress={() => onAttachmentPress(attachments[i], i)}
      cellStyle={cellStyle}
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

export interface CometChatImagesBubbleProps {
  message: CometChat.MediaMessage;
  theme: CometChatTheme;
  /** Per-instance style overrides — shares the `mediaGridBubbleStyles` theme key with VideosBubble. */
  style?: CometChatTheme["mediaGridBubbleStyles"];
}

/**
 * Renders a single-kind IMAGE message (all images, after the §7 fan-out) as a grid, with a
 * batch-spanning fullscreen pager on tap. Fully independent of CometChatVideosBubble.
 */
export function CometChatImagesBubble({
  message: initialMessage,
  theme,
  style,
}: CometChatImagesBubbleProps) {
  const compTheme = useCompTheme();
  const s = deepMerge(theme.mediaGridBubbleStyles ?? {}, compTheme.mediaGridBubbleStyles ?? {}, style ?? {});
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  // §8.2 — the media set fed to the fullscreen pager (batch-spanning union when the list provides it).
  const [viewerItems, setViewerItems] = useState<CometChat.Attachment[]>([]);
  // §8.7 — local copy so onMessageEdited can refresh a caption edit.
  const [message, setMessage] = useState<CometChat.MediaMessage>(initialMessage);

  // An IMAGE message renders ALL its attachments; off-kind ones (video/audio/file) show a "no preview"
  // placeholder cell + a "No preview available" fullscreen. getAttachments() preserves pick order.
  const allAttachments = useMemo(
    () => (message.getAttachments?.() ?? []).filter((a) => a != null && typeof a.getUrl === 'function'),
    [message]
  );
  const caption = message.getCaption() ?? '';
  const isSentByMe = message.getSender()?.getUid() === CometChatUIKit.loggedInUser?.getUid();

  // §8.7 — refresh the local copy when the server edits the message in.
  useEffect(() => {
    const listenerId = `ImagesBubble_${message.getId?.() ?? message.getMuid?.() ?? Date.now()}`;
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
    <View testID="bubble-image">
      <ImageGrid
        attachments={allAttachments}
        containerStyle={s.containerStyle}
        cellStyle={s.cellStyle}
        overflowOverlayStyle={s.overflowOverlayStyle}
        overflowTextStyle={s.overflowTextStyle}
        onAttachmentPress={(_, index) => {
          // Page THIS message's attachments (grid & viewer share the same list → index aligns).
          // The viewer renders off-kind items (non-image) as "No preview available".
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
        canPreview={(att) => isImageMime(att.getMimeType?.() ?? '')}
        startIndex={viewerInitialIndex}
        visible={viewerVisible}
        message={message}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Standard media footprint (240 − 4 − 4 padding) as the grid's MIN width; alignSelf:'stretch' lets it
  // grow to fill a wider sibling, maxWidth:'100%' clamps it in a narrower one.
  gridContainer: {
    alignSelf: 'stretch',
    minWidth: 232,
    maxWidth: '100%',
  },
});
