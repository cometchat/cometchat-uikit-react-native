import React from 'react';
import { FlatList, View } from 'react-native';
import { SelectedAttachment } from '../../modals/SelectedAttachment';
import { CometChatAttachmentTile } from './CometChatAttachmentTile';
import { useTheme } from '../../../theme';
import { useCompTheme } from '../../../theme/hook';
import { CometChatTheme } from '../../../theme/type';
import { deepMerge } from '../../helper/helperFunctions';

// ---------------------------------------------------------------------------
// Design doc §5.0 — the composer's pre-send staging tray. Its per-tile layout
// (media thumbnails, file cards, per-file progress + retry) mirrors the
// PER-TYPE receive bubbles the batch fans out into — Images/Videos (media grid),
// Files (card list), Audios / Voice note — NOT a single combined gallery bubble
// (that model is retired, §8.0). On send the staged tiles fan out (§7) into one
// message per kind, each rendered by its matching per-type bubble.
// ---------------------------------------------------------------------------

export interface CometChatAttachmentTrayProps {
  attachments: SelectedAttachment[];
  onRemove: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  /** Called when the user taps a media tile thumbnail to preview it. */
  onPressTile?: (fileId: string) => void;
  /** Structured style overrides (containerStyle / progressTrackStyle / progressFillStyle), deep-merged over theme + component theme. */
  style?: CometChatTheme["attachmentTrayStyles"];
}

function useAggregatePercent(attachments: SelectedAttachment[]): number {
  const totalBytes = attachments.reduce((s, a) => s + (a.file.size || 0), 0);
  if (totalBytes === 0) return 0;
  const loadedBytes = attachments.reduce(
    (s, a) => s + ((a.uploadProgress / 100) * (a.file.size || 0)),
    0
  );
  return Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
}

export const CometChatAttachmentTray = ({
  attachments,
  onRemove,
  onRetry,
  onPressTile,
  style,
}: CometChatAttachmentTrayProps) => {
  const theme = useTheme();
  const compTheme = useCompTheme();
  const s = deepMerge(
    theme.attachmentTrayStyles ?? {},
    compTheme.attachmentTrayStyles ?? {},
    style ?? {}
  );
  const aggregatePercent = useAggregatePercent(attachments);
  const allDone = attachments.every(
    a => a.uploadState === 'COMPLETED' || a.uploadState === 'FAILED' || a.uploadState === 'REJECTED'
  );

  if (attachments.length === 0) {
    return null;
  }

  return (
    <View style={s.containerStyle}>
      <FlatList
        horizontal
        data={attachments}
        keyExtractor={(item) => item.fileId}
        renderItem={({ item, index }) => (
          <CometChatAttachmentTile
            testID={`AttachmentTile-${index}`}
            attachment={item}
            onRemove={onRemove}
            onRetry={onRetry}
            onPress={onPressTile}
          />
        )}
        showsHorizontalScrollIndicator={false}
        // paddingTop gives the ✕ corner badge (which sits at top:-s2 on each tile) room inside the
        // horizontal scroll view — without it the badge overflows the FlatList's top edge and is clipped.
        contentContainerStyle={{ paddingHorizontal: theme.spacing.padding.p2, paddingTop: theme.spacing.padding.p2 }}
      />
      {/* §5.4 — byte-weighted aggregate bar; hidden once all files resolve */}
      {!allDone && (
        <View
          style={[{
            height: theme.spacing.spacing.s0_5,
            marginHorizontal: theme.spacing.margin.m2,
            marginBottom: theme.spacing.margin.m1,
            borderRadius: theme.spacing.radius.r1,
            backgroundColor: theme.color.neutral200,
            overflow: 'hidden',
          }, s.progressTrackStyle]}
        >
          <View
            style={[{
              height: theme.spacing.spacing.s0_5,
              width: `${aggregatePercent}%`,
              backgroundColor: theme.color.primary,
              borderRadius: theme.spacing.radius.r1,
            }, s.progressFillStyle]}
          />
        </View>
      )}
    </View>
  );
};

// Backward-compat alias so existing imports keep working without breakage
export const CometChatAttachmentPreview = CometChatAttachmentTray;
export type CometChatAttachmentPreviewProps = CometChatAttachmentTrayProps;
